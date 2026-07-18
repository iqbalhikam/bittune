"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export const SERVICE_UUID = "4fa8c820-1f87-11e9-ab14-d663bd873d93";
export const CHARACTERISTIC_UUID_RX = "4a240bbd-26b7-48c7-9a3f-c151d3d45388";
export const CHARACTERISTIC_UUID_TX = "4a240bbe-26b7-48c7-9a3f-c151d3d45388";

export interface TelemetryData {
  volume: number;
  activePreset: number;
  temp: number;
  limiterFired: boolean;
  dspActive: boolean;
  signalQuality: number;
}

export function useBLE() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    volume: 40,
    activePreset: 0,
    temp: 0,
    limiterFired: false,
    dspActive: true,
    signalQuality: 0,
  });

  // Fast-changing VU values stored in refs to avoid React re-renders
  const vuLeftRef = useRef<number>(0);
  const vuRightRef = useRef<number>(0);

  const deviceRef = useRef<any>(null);
  const charRxRef = useRef<any>(null);
  const charTxRef = useRef<any>(null);

  // Queue and throttling refs to avoid blocking the BLE connection
  const queueRef = useRef<{ cmd: string; val: number }[]>([]);
  const isSendingRef = useRef(false);
  const lastWriteTimeRef = useRef(0);
  const autoReconnectCountRef = useRef(0);
  const maxAutoReconnects = 3;

  const processQueue = useCallback(async () => {
    if (isSendingRef.current || queueRef.current.length === 0) return;
    if (!charRxRef.current) {
      queueRef.current = [];
      return;
    }

    isSendingRef.current = true;

    try {
      const now = Date.now();
      const delay = 45; // Throttle BLE write
      const elapsed = now - lastWriteTimeRef.current;

      if (elapsed < delay) {
        await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
      }

      const item = queueRef.current.shift();
      if (item) {
        const { cmd, val } = item;
        const data = new Uint8Array([cmd.charCodeAt(0), val]);
        
        await charRxRef.current.writeValueWithoutResponse(data).catch(async () => {
          // Fallback to standard write
          await charRxRef.current.writeValue(data);
        });

        lastWriteTimeRef.current = Date.now();
      }
    } catch (err) {
      console.error("[BLE] Write error:", err);
    } finally {
      isSendingRef.current = false;
      if (queueRef.current.length > 0) {
        setTimeout(processQueue, 5);
      }
    }
  }, []);

  const sendDSPCommand = useCallback(
    (commandChar: string, value: number) => {
      // Map/clamp to 0-100 range
      const clampedVal = Math.max(0, Math.min(100, Math.round(value)));

      // Replace duplicate commands in queue, keep latest
      const idx = queueRef.current.findIndex((item) => item.cmd === commandChar);
      if (idx !== -1) {
        queueRef.current[idx].val = clampedVal;
      } else {
        queueRef.current.push({ cmd: commandChar, val: clampedVal });
      }

      processQueue();
    },
    [processQueue]
  );

  const handleNotifications = useCallback((event: any) => {
    const value = event.target.value;
    if (!value || value.byteLength < 8) return;

    // Read bytes
    const volume = value.getUint8(0);
    const activePreset = value.getUint8(1);
    const vuLeft = value.getUint8(2);
    const vuRight = value.getUint8(3);
    const temp = value.getUint8(4);
    const limiterFired = value.getUint8(5) === 1;
    const dspActive = value.getUint8(6) === 1;
    const signalQuality = value.getUint8(7);

    setTelemetry({
      volume,
      activePreset,
      temp,
      limiterFired,
      dspActive,
      signalQuality,
    });

    // Update refs directly without triggering React state updates
    vuLeftRef.current = vuLeft;
    vuRightRef.current = vuRight;
  }, []);

  const handleDisconnection = useCallback(async () => {
    setIsConnected(false);
    charRxRef.current = null;
    charTxRef.current = null;

    if (deviceRef.current && autoReconnectCountRef.current < maxAutoReconnects) {
      autoReconnectCountRef.current += 1;
      console.log(`[BLE] Disconnected. Reconnecting (${autoReconnectCountRef.current}/${maxAutoReconnects})...`);
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      try {
        const server = await deviceRef.current.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        
        charRxRef.current = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);
        
        try {
          const txChar = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);
          charTxRef.current = txChar;
          await txChar.startNotifications();
          txChar.addEventListener("characteristicvaluechanged", handleNotifications);
        } catch (txErr) {
          console.warn("[BLE] Notify characteristic connection failed:", txErr);
        }

        setIsConnected(true);
        autoReconnectCountRef.current = 0;
      } catch (err) {
        console.warn("[BLE] Auto-reconnect failed:", err);
      }
    } else {
      setDeviceName("");
      deviceRef.current = null;
    }
  }, [handleNotifications]);

  const connectDevice = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      if (!(navigator as any).bluetooth) {
        throw new Error("Web Bluetooth API not supported by this browser.");
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }, { namePrefix: "BitTune" }, { namePrefix: "Ampli" }],
        optionalServices: [SERVICE_UUID],
      });

      deviceRef.current = device;
      setDeviceName(device.name || "DSP Controller");

      device.addEventListener("gattserverdisconnected", handleDisconnection);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      charRxRef.current = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);
      
      try {
        const txChar = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);
        charTxRef.current = txChar;
        await txChar.startNotifications();
        txChar.addEventListener("characteristicvaluechanged", handleNotifications);
      } catch (notifyErr) {
        console.warn("[BLE] Notify characteristic setup failed:", notifyErr);
      }

      setIsConnected(true);
      autoReconnectCountRef.current = 0;
    } catch (err: any) {
      if (err.name === "NotFoundError" || err.message.includes("User cancelled")) {
        setError(null);
      } else {
        setError(err.message || "Failed to establish Bluetooth connection.");
      }
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [handleNotifications, handleDisconnection]);

  const disconnectDevice = useCallback(() => {
    const dev = deviceRef.current;
    deviceRef.current = null; // Prevent auto-reconnection
    
    if (dev && dev.gatt && dev.gatt.connected) {
      dev.gatt.disconnect();
    }

    charRxRef.current = null;
    charTxRef.current = null;
    setIsConnected(false);
    setDeviceName("");
    autoReconnectCountRef.current = 0;
    setError(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    deviceName,
    telemetry,
    vuLeftRef,
    vuRightRef,
    sendDSPCommand,
    connectDevice,
    disconnectDevice,
    setTelemetry,
  };
}
