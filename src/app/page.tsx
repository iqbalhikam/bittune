"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── BLE UUID Constants ───
const SERVICE_UUID = "4fa8c820-1f87-11e9-ab14-d663bd873d93";
const CHARACTERISTIC_UUID = "4a240bbd-26b7-48c7-9a3f-c151d3d45388";

// ─── Web Bluetooth Type Declarations ───
interface BluetoothRequestDeviceFilter {
  name?: string;
  namePrefix?: string;
  services?: BluetoothServiceUUID[];
}

type BluetoothServiceUUID = string | number;

interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  readValue(): Promise<DataView>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(
    characteristic: BluetoothServiceUUID
  ): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  connected: boolean;
  getPrimaryService(
    service: BluetoothServiceUUID
  ): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice {
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
}

// ─── Fader Channel Configuration ───
interface FaderConfig {
  id: string;
  label: string;
  asciiCode: number;
  defaultValue: number;
  min: number;
  max: number;
  accentColor: string;
  isMaster?: boolean;
}

const FADERS: FaderConfig[] = [
  { id: "fader-high", label: "HIGH",    asciiCode: 72, defaultValue: 100, min: 0, max: 200, accentColor: "#00e5ff" },
  { id: "fader-mid",  label: "MID",     asciiCode: 77, defaultValue: 100, min: 0, max: 200, accentColor: "#ffab00" },
  { id: "fader-low",  label: "LOW",     asciiCode: 76, defaultValue: 100, min: 0, max: 200, accentColor: "#00e676" },
  { id: "fader-fx",   label: "FX",      asciiCode: 88, defaultValue: 0,   min: 0, max: 200, accentColor: "#ff6d00" },
  { id: "fader-vol",  label: "VOL",     asciiCode: 86, defaultValue: 40,  min: 0, max: 100, accentColor: "#00e676", isMaster: true },
];

// ─── Helpers ───
function getBluetoothAPI(): Bluetooth | null {
  if (typeof navigator !== "undefined" && "bluetooth" in navigator) {
    return (navigator as unknown as { bluetooth: Bluetooth }).bluetooth;
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── VU Meter Component (vertical LED bar per channel) ───
const VU_LED_COUNT = 16;

function VuBar({ faderValue, max, accentColor }: { faderValue: number; max: number; accentColor: string }) {
  const [levels, setLevels] = useState<number[]>(Array(VU_LED_COUNT).fill(0));
  const prevLevels = useRef<number[]>(Array(VU_LED_COUNT).fill(0));
  const animRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    const animate = () => {
      if (!active) return;
      const baseActive = Math.round((faderValue / max) * VU_LED_COUNT);
      const jitter = Math.random() * 2.5 - 0.8;
      const targetActive = clamp(Math.round(baseActive + jitter), 0, VU_LED_COUNT);

      const newLevels: number[] = [];
      for (let i = 0; i < VU_LED_COUNT; i++) {
        const target = i < targetActive ? 1 : 0;
        const prev = prevLevels.current[i];
        newLevels.push(target > prev ? Math.min(1, prev + 0.35) : Math.max(0, prev - 0.06));
      }
      prevLevels.current = newLevels;
      setLevels([...newLevels]);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { active = false; cancelAnimationFrame(animRef.current); };
  }, [faderValue, max]);

  return (
    <div className="vu-bar">
      {levels.map((level, i) => {
        const isActive = level > 0.3;
        // Color transitions: bottom green → mid yellow → top red
        let bg = accentColor;
        if (i >= VU_LED_COUNT * 0.85) bg = "#ff1744";
        else if (i >= VU_LED_COUNT * 0.65) bg = "#ffea00";
        return (
          <div
            key={i}
            className={`vu-bar-led ${isActive ? "active" : ""}`}
            style={{
              opacity: isActive ? 0.5 + level * 0.5 : 0.08,
              background: isActive ? bg : "rgba(255,255,255,0.04)",
              boxShadow: isActive ? `0 0 4px ${bg}, 0 0 8px ${bg}40` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Single Vertical Fader Channel ───
function VerticalFader({
  config,
  value,
  onChange,
}: {
  config: FaderConfig;
  value: number;
  onChange: (value: number) => void;
}) {
  const fillPercent = ((value - config.min) / (config.max - config.min)) * 100;

  return (
    <div className={`eq-channel ${config.isMaster ? "master" : ""}`}>
      {/* Value readout */}
      <div className="ch-value" style={{ color: config.accentColor }}>
        {value}
      </div>

      {/* Fader + VU stack */}
      <div className="ch-fader-area">
        {/* VU bar on the left */}
        <VuBar faderValue={value} max={config.max} accentColor={config.accentColor} />

        {/* Fader track */}
        <div className="ch-track">
          {/* Tick marks */}
          <div className="ch-ticks">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className={`ch-tick ${i % 5 === 0 ? "major" : ""}`} />
            ))}
          </div>

          {/* Center line for EQ bands (at 50% = value 100) */}
          {!config.isMaster && <div className="ch-center-line" />}

          {/* Fill glow */}
          <div
            className="ch-fill"
            style={{
              height: `${fillPercent}%`,
              background: `linear-gradient(0deg, ${config.accentColor}08, ${config.accentColor}30)`,
            }}
          />

          {/* Range input */}
          <input
            id={config.id}
            type="range"
            min={config.min}
            max={config.max}
            step={1}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="ch-slider"
            aria-label={config.label}
            style={{
              // Pass accent color to thumb via CSS custom property
              "--fader-accent": config.accentColor,
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Label */}
      <div className="ch-label" style={{ color: config.accentColor }}>
        {config.label}
      </div>

      {/* LED dot */}
      <div
        className="ch-led"
        style={{
          background: config.accentColor,
          boxShadow: `0 0 6px ${config.accentColor}, 0 0 12px ${config.accentColor}60`,
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════
export default function HomePage() {
  // BLE State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string>("");

  // Fader values (HIGH, MID, LOW, FX, VOL)
  const [faderValues, setFaderValues] = useState<number[]>(
    FADERS.map((f) => f.defaultValue)
  );

  // BLE Refs
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef =
    useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // ── Write to BLE ──
  const writeBLE = useCallback(async (data: Uint8Array) => {
    try {
      if (!characteristicRef.current) {
        console.warn("[BLE] No characteristic available for write.");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await characteristicRef.current.writeValueWithoutResponse(data as any);
    } catch (err) {
      console.error("[BLE] Write failed:", err);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await characteristicRef.current?.writeValue(data as any);
      } catch (fallbackErr) {
        console.error("[BLE] Fallback write also failed:", fallbackErr);
        setError("Failed to send command. Check connection.");
      }
    }
  }, []);

  // ── Connect ──
  const handleConnect = useCallback(async () => {
    const bt = getBluetoothAPI();
    if (!bt) {
      setError("Web Bluetooth is not supported in this browser.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const device = await bt.requestDevice({
        filters: [{ name: "Ampli-Smart-DSP" }],
        optionalServices: [SERVICE_UUID],
      });

      deviceRef.current = device;
      setDeviceName(device.name ?? "DSP Device");

      device.addEventListener("gattserverdisconnected", () => {
        setIsConnected(false);
        characteristicRef.current = null;
        setError(null);
      });

      if (!device.gatt) {
        throw new Error("GATT server not available on this device.");
      }

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(
        CHARACTERISTIC_UUID
      );

      characteristicRef.current = characteristic;
      setIsConnected(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("User cancelled")) {
          setError(null);
        } else {
          console.error("[BLE] Connection error:", err);
          setError(err.message);
        }
      } else {
        console.error("[BLE] Unknown connection error:", err);
        setError("An unknown error occurred.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Disconnect ──
  const handleDisconnect = useCallback(() => {
    try {
      deviceRef.current?.gatt?.disconnect();
    } catch (err) {
      console.error("[BLE] Disconnect error:", err);
    }
    characteristicRef.current = null;
    deviceRef.current = null;
    setIsConnected(false);
    setDeviceName("");
  }, []);

  // ── Fader Change ──
  const handleFaderChange = useCallback(
    (faderIndex: number, newValue: number) => {
      setFaderValues((prev) => {
        const updated = [...prev];
        updated[faderIndex] = newValue;
        return updated;
      });
      const data = new Uint8Array([FADERS[faderIndex].asciiCode, newValue]);
      writeBLE(data);
    },
    [writeBLE]
  );

  // ── Clear error after timeout ──
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <main className="eq-console">
      {/* ═══ Header / BLE ═══ */}
      <header className="eq-header animate-in">
        <div className="eq-brand">
          <div className="eq-brand-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 16, height: 16, color: "#00e5ff" }}
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="eq-title">
              Bit<span>Tune</span>
            </h1>
            <p className="eq-subtitle">Graphic EQ · DSP</p>
          </div>
        </div>

        {isConnected ? (
          <div className="ble-connected-row">
            <div className="ble-status-indicator">
              <div className="ble-dot-wrap">
                <span className="ble-ping" />
                <span className="ble-dot" />
              </div>
              <span className="ble-name">{deviceName}</span>
            </div>
            <button
              id="btn-disconnect"
              onClick={handleDisconnect}
              className="ble-btn-disconnect"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            id="btn-connect"
            onClick={handleConnect}
            disabled={isConnecting}
            className="ble-btn-connect"
          >
            {isConnecting ? (
              <>
                <svg
                  style={{ width: 14, height: 14 }}
                  className="animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    opacity={0.25}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    opacity={0.75}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Scanning…
              </>
            ) : (
              <>
                <svg
                  style={{ width: 14, height: 14 }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.24 12.01l2.32 2.32c.28-.72.44-1.51.44-2.33 0-.82-.16-1.59-.43-2.31l-2.33 2.32zm5.29-5.3l-1.26 1.26c.63 1.21.98 2.57.98 4.02s-.36 2.82-.98 4.02l1.2 1.2a9.936 9.936 0 001.54-5.22c-.01-1.89-.55-3.67-1.48-5.28zm-3.82 1L10 2H9v7.59L4.41 5 3 6.41 8.59 12 3 17.59 4.41 19 9 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM11 5.83l1.88 1.88L11 9.59V5.83zm1.88 10.46L11 18.17v-3.76l1.88 1.88z" />
                </svg>
                Connect BLE
              </>
            )}
          </button>
        )}
      </header>

      {/* ═══ Error Toast ═══ */}
      {error && (
        <div className="eq-error">
          <svg
            style={{ width: 14, height: 14, flexShrink: 0 }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ═══ EQ Rack ═══ */}
      <div className="eq-rack animate-in-d1">
        {/* Rack label bar */}
        <div className="rack-label-bar">
          <span className="rack-label">DSP EQUALIZER</span>
          <span className="rack-range">0 — 200 GAIN</span>
        </div>

        {/* All faders side by side */}
        <div className="eq-fader-row">
          {FADERS.map((fader, index) => (
            <VerticalFader
              key={fader.id}
              config={fader}
              value={faderValues[index]}
              onChange={(val) => handleFaderChange(index, val)}
            />
          ))}
        </div>

        {/* Bottom scale */}
        <div className="rack-bottom-bar">
          <div className="rack-screw" />
          <span className="rack-info">
            BLE · {SERVICE_UUID.slice(0, 8)}… · v3
          </span>
          <div className="rack-screw" />
        </div>
      </div>
    </main>
  );
}
