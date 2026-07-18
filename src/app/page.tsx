"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useBLE } from "../hooks/useBLE";
import { VerticalFader } from "../components/Fader";
import { 
  Bluetooth, 
  Wifi, 
  Thermometer, 
  Volume2, 
  Activity, 
  Sparkles, 
  Sliders, 
  Gauge
} from "lucide-react";

// Presets data list
const PRESETS = [
  { name: "Flat", values: { L: 50, M: 50, H: 50, Q: 50, G: 0, E: 0, R: 50, W: 50, Y: 50, N: 0, I: 100 } },
  { name: "Rock", values: { L: 75, M: 40, H: 70, Q: 60, G: 65, E: 60, R: 45, W: 55, Y: 65, N: 15, I: 85 } },
  { name: "Pop", values: { L: 60, M: 65, H: 60, Q: 55, G: 50, E: 50, R: 60, W: 50, Y: 55, N: 10, I: 90 } },
  { name: "Jazz", values: { L: 65, M: 55, H: 45, Q: 50, G: 45, E: 40, R: 50, W: 60, Y: 45, N: 12, I: 95 } },
  { name: "Movie", values: { L: 80, M: 45, H: 65, Q: 85, G: 70, E: 60, R: 50, W: 65, Y: 55, N: 20, I: 75 } },
  { name: "Bass Boost", values: { L: 90, M: 50, H: 50, Q: 95, G: 90, E: 45, R: 50, W: 70, Y: 45, N: 15, I: 80 } },
  { name: "Gaming", values: { L: 65, M: 40, H: 75, Q: 60, G: 55, E: 70, R: 45, W: 50, Y: 70, N: 25, I: 70 } },
  { name: "Podcast", values: { L: 40, M: 75, H: 60, Q: 35, G: 30, E: 50, R: 70, W: 45, Y: 50, N: 30, I: 90 } },
  { name: "Vocal", values: { L: 45, M: 80, H: 65, Q: 40, G: 35, E: 55, R: 75, W: 40, Y: 60, N: 15, I: 95 } },
];

export default function HomePage() {
  const {
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
  } = useBLE();

  // Slider State (Mapped to 0-100 range)
  const [sliders, setSliders] = useState<{ [key: string]: number }>({
    V: 40,  // Master Volume
    B: 50,  // Balance (50 = Center)
    S: 50,  // Stereo Width
    
    // EQ
    L: 50,  // Bass
    M: 50,  // Mid
    H: 50,  // Treble
    
    // Pro EQ
    Q: 50,  // Sub Level
    G: 0,   // Bass Boost
    E: 0,   // Treble Boost
    R: 50,  // Presence
    W: 50,  // Warmth
    Y: 50,  // Brightness
    
    // Dynamics
    N: 0,   // Noise Gate
    I: 100, // Limiter
  });

  // Toggles State
  const [toggles, setToggles] = useState({
    mute: false,
    bypass: false,
    stereo: true,
    loudness: false,
  });

  const [activePreset, setActivePreset] = useState<number | null>(0);

  // References to VU Meter HTML elements to update them directly
  const leftMeterRef = useRef<HTMLDivElement>(null);
  const rightMeterRef = useRef<HTMLDivElement>(null);
  const leftPeakRef = useRef<HTMLDivElement>(null);
  const rightPeakRef = useRef<HTMLDivElement>(null);

  const leftMaxPeak = useRef(0);
  const rightMaxPeak = useRef(0);
  const leftDisplayed = useRef(0);
  const rightDisplayed = useRef(0);

  // High-performance requestAnimationFrame loop to read BLE VU ref data
  useEffect(() => {
    let animId: number;
    const updateVUMeters = () => {
      const lRaw = vuLeftRef.current; // 0-255
      const rRaw = vuRightRef.current; // 0-255

      // Scale raw 0-255 to 0-100% using square-root scaling for audio responsiveness
      const lTarget = Math.sqrt(lRaw / 255) * 100;
      const rTarget = Math.sqrt(rRaw / 255) * 100;

      // Physics: Instant attack (rise), quick exponential decay (fall)
      if (lTarget > leftDisplayed.current) {
        leftDisplayed.current = lTarget;
      } else {
        leftDisplayed.current = leftDisplayed.current * 0.7 + lTarget * 0.3;
      }

      if (rTarget > rightDisplayed.current) {
        rightDisplayed.current = rTarget;
      } else {
        rightDisplayed.current = rightDisplayed.current * 0.7 + rTarget * 0.3;
      }

      // Update Meter heights
      if (leftMeterRef.current) {
        leftMeterRef.current.style.height = `${leftDisplayed.current}%`;
      }
      if (rightMeterRef.current) {
        rightMeterRef.current.style.height = `${rightDisplayed.current}%`;
      }

      // Peak indicators decay logic (decay peak slower than the main signal)
      if (lTarget > leftMaxPeak.current) {
        leftMaxPeak.current = lTarget;
      } else {
        leftMaxPeak.current = Math.max(0, leftMaxPeak.current - 0.7);
      }

      if (rTarget > rightMaxPeak.current) {
        rightMaxPeak.current = rTarget;
      } else {
        rightMaxPeak.current = Math.max(0, rightMaxPeak.current - 0.7);
      }

      if (leftPeakRef.current) {
        leftPeakRef.current.style.bottom = `${leftMaxPeak.current}%`;
      }
      if (rightPeakRef.current) {
        rightPeakRef.current.style.bottom = `${rightMaxPeak.current}%`;
      }

      animId = requestAnimationFrame(updateVUMeters);
    };

    animId = requestAnimationFrame(updateVUMeters);
    return () => cancelAnimationFrame(animId);
  }, [vuLeftRef, vuRightRef]);

  // Synchronize telemetry data coming from ESP32
  useEffect(() => {
    if (isConnected) {
      queueMicrotask(() => {
        setSliders((prev) => {
          if (prev.V === telemetry.volume) return prev;
          return {
            ...prev,
            V: telemetry.volume,
          };
        });
        setToggles((prev) => {
          const nextBypass = !telemetry.dspActive;
          if (prev.bypass === nextBypass) return prev;
          return {
            ...prev,
            bypass: nextBypass,
          };
        });
        setActivePreset((prev) => {
          if (prev === telemetry.activePreset) return prev;
          return telemetry.activePreset;
        });
      });
    }
  }, [telemetry, isConnected]);

  // Command wrapper
  const handleSliderChange = useCallback((cmd: string, val: number) => {
    setSliders((prev) => ({ ...prev, [cmd]: val }));
    sendDSPCommand(cmd, val);
  }, [sendDSPCommand]);

  // Toggle handlers
  const handleToggle = useCallback((key: keyof typeof toggles, cmdChar: string) => {
    const nextVal = !toggles[key];
    setToggles((prev) => ({ ...prev, [key]: nextVal }));
    sendDSPCommand(cmdChar, nextVal ? 1 : 0);
  }, [toggles, sendDSPCommand]);

  // Preset Selector
  const handlePresetSelect = useCallback((idx: number) => {
    setActivePreset(idx);
    sendDSPCommand("P", idx);

    // Apply local preset values
    const preset = PRESETS[idx];
    setSliders((prev) => {
      const next = { ...prev };
      Object.keys(preset.values).forEach((key) => {
        const val = preset.values[key as keyof typeof preset.values];
        next[key] = val;
        sendDSPCommand(key, val);
      });
      return next;
    });
  }, [sendDSPCommand]);

  return (
    <main className="min-h-screen bg-[#09090B] text-[#E4E4E7] p-4 lg:p-6 flex flex-col gap-6 selection:bg-[#00E5FF]/20">
      
      {/* ── TOP BAR (TELEMETRY & BLE) ── */}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] rounded-2xl p-4 shadow-2xl relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E2E36] to-[#121215] border border-[#3A3A44] flex items-center justify-center relative shadow-lg">
            <Activity className="w-5.5 h-5.5 text-[#00E5FF] animate-pulse" />
            <div className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 border border-black transition-colors duration-300 ${isConnected ? "bg-[#00E676] shadow-[0_0_8px_#00E676]" : "bg-[#FF1744]"}`} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-[#F4F4F5] uppercase">
              Bit<span className="text-[#00E5FF]">Tune</span> DSP
            </h1>
            <p className="text-[9px] font-mono text-[#71717A] tracking-wider uppercase">6-Band Parametric Equalizer</p>
          </div>
        </div>

        {/* Telemetry Display */}
        <div className="flex flex-wrap items-center gap-6 bg-[#0E0E11] border border-[#27272A]/80 rounded-xl px-4 py-2 text-xs font-mono">
          {/* Signal */}
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[#00E5FF]" />
            <div className="flex flex-col">
              <span className="text-[8px] text-[#71717A] uppercase">Signal</span>
              <span className="font-bold">{isConnected ? `${telemetry.signalQuality}%` : "0%"}</span>
            </div>
          </div>

          {/* SoC Temp */}
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#FFB300]" />
            <div className="flex flex-col">
              <span className="text-[8px] text-[#71717A] uppercase">SoC Temp</span>
              <span className="font-bold">{isConnected ? `${telemetry.temp}°C` : "0°C"}</span>
            </div>
          </div>

          {/* Limiter Fired Status */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] text-[#71717A] uppercase">Limiter</span>
              <span className={`font-bold transition-colors ${telemetry.limiterFired ? "text-[#FF1744]" : "text-[#71717A]"}`}>
                {telemetry.limiterFired ? "ACTIVE" : "BYPASS"}
              </span>
            </div>
            <div className={`w-3 h-3 rounded-full border border-black/40 transition-all ${telemetry.limiterFired ? "bg-[#FF1744] shadow-[0_0_10px_#FF1744]" : "bg-[#FF1744]/20"}`} />
          </div>
        </div>

        {/* Connection Control */}
        <div>
          {isConnected ? (
            <div className="flex items-center gap-2.5 bg-[#0F0F12] border border-[#00E676]/30 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-mono text-[#00E676] truncate max-w-[130px]">{deviceName}</span>
              <button
                onClick={disconnectDevice}
                className="px-2.5 py-1 text-[10px] font-mono font-bold text-[#FF1744] bg-[#FF1744]/10 hover:bg-[#FF1744]/20 border border-[#FF1744]/20 rounded-md transition-all cursor-pointer"
              >
                DISCONNECT
              </button>
            </div>
          ) : (
            <button
              onClick={connectDevice}
              disabled={isConnecting}
              className={`px-4 py-2 border rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                isConnecting
                  ? "bg-[#FFB300]/10 border-[#FFB300] text-[#FFB300] animate-pulse"
                  : "bg-gradient-to-b from-[#00E5FF]/20 to-[#00E5FF]/5 border-[#00E5FF] text-[#00E5FF] hover:from-[#00E5FF]/30 hover:to-[#00E5FF]/10 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
              }`}
            >
              <Bluetooth className={`w-4 h-4 ${isConnecting ? "animate-spin" : ""}`} />
              {isConnecting ? "Connecting..." : "Connect DSP"}
            </button>
          )}
        </div>
      </header>

      {/* Error alert toast */}
      {error && (
        <div className="p-3 bg-[#FF1744]/10 border border-[#FF1744]/30 text-[#FF1744] rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      {/* ── MAIN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT PANEL: VU METERS & VOLUME */}
        <div className="xl:col-span-4 bg-[#18181B] border border-[#27272A] rounded-2xl p-4 shadow-xl flex flex-col gap-6">
          <h2 className="text-xs font-mono text-[#71717A] tracking-wider uppercase flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#00E5FF]" /> Master Output Bus
          </h2>

          <div className="grid grid-cols-12 gap-6 items-stretch">
            {/* L/R VU Meters */}
            <div className="col-span-8 flex justify-center gap-8 bg-[#0F0F12] border border-[#27272A]/50 rounded-xl p-4 h-[300px]">
              {/* Left Channel */}
              <div className="flex flex-col items-center gap-2 w-full h-full relative">
                <span className="text-[10px] font-mono text-[#00E5FF] tracking-wider font-bold">LEFT</span>
                <div className="w-5 flex-1 bg-black/60 border border-white/10 rounded-lg relative overflow-hidden shadow-inner">
                  <div
                    ref={leftMeterRef}
                    className="w-full absolute bottom-0 left-0"
                    style={{
                      height: "0%",
                      background: "linear-gradient(to top, #00E676 0%, #FFB300 70%, #FF1744 100%)",
                      backgroundSize: "100% 230px",
                      backgroundPosition: "bottom",
                      boxShadow: "0 0 12px rgba(0, 230, 118, 0.2)",
                    }}
                  />
                  <div
                    ref={leftPeakRef}
                    className="w-full h-0.5 bg-[#FF1744] absolute bottom-0 left-0 shadow-[0_0_8px_#FF1744]"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                      backgroundImage: "linear-gradient(to bottom, #000 2px, transparent 2px)",
                      backgroundSize: "100% 6px",
                    }}
                  />
                </div>
              </div>

              {/* Ticks scale */}
              <div className="flex flex-col justify-between text-[8px] font-mono text-[#52525B] h-full pt-6 pb-2">
                <span>100%</span>
                <span>80%</span>
                <span>60%</span>
                <span>40%</span>
                <span>20%</span>
                <span>0%</span>
              </div>

              {/* Right Channel */}
              <div className="flex flex-col items-center gap-2 w-full h-full relative">
                <span className="text-[10px] font-mono text-[#00E5FF] tracking-wider font-bold">RIGHT</span>
                <div className="w-5 flex-1 bg-black/60 border border-white/10 rounded-lg relative overflow-hidden shadow-inner">
                  <div
                    ref={rightMeterRef}
                    className="w-full absolute bottom-0 left-0"
                    style={{
                      height: "0%",
                      background: "linear-gradient(to top, #00E676 0%, #FFB300 70%, #FF1744 100%)",
                      backgroundSize: "100% 230px",
                      backgroundPosition: "bottom",
                      boxShadow: "0 0 12px rgba(0, 230, 118, 0.2)",
                    }}
                  />
                  <div
                    ref={rightPeakRef}
                    className="w-full h-0.5 bg-[#FF1744] absolute bottom-0 left-0 shadow-[0_0_8px_#FF1744]"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                      backgroundImage: "linear-gradient(to bottom, #000 2px, transparent 2px)",
                      backgroundSize: "100% 6px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Master Volume Fader */}
            <div className="col-span-4 flex justify-center">
              <VerticalFader
                config={{
                  id: "master-vol",
                  label: "VOLUME",
                  typeChar: "V",
                  min: 0,
                  max: 100,
                  defaultValue: 40,
                  accentColor: "#00E676",
                  isMaster: true,
                }}
                value={sliders.V}
                disabled={!isConnected}
                onChange={(val) => handleSliderChange("V", val)}
              />
            </div>
          </div>

          {/* Width & Balance */}
          <div className="grid grid-cols-2 gap-4 border-t border-[#27272A]/40 pt-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-[#71717A] uppercase">Balance</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliders.B}
                disabled={!isConnected}
                onChange={(e) => handleSliderChange("B", parseInt(e.target.value))}
                className="w-full accent-[#00E5FF] cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-[#52525B]">
                <span>L</span>
                <span>{sliders.B}</span>
                <span>R</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-[#71717A] uppercase">Stereo Width</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliders.S}
                disabled={!isConnected}
                onChange={(e) => handleSliderChange("S", parseInt(e.target.value))}
                className="w-full accent-[#00E5FF] cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-[#52525B]">
                <span>Mono</span>
                <span>{sliders.S}%</span>
                <span>Wide</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: PARAMETRIC EQ SLIDERS */}
        <div className="xl:col-span-5 bg-[#18181B] border border-[#27272A] rounded-2xl p-4 shadow-xl flex flex-col gap-4">
          <h2 className="text-xs font-mono text-[#71717A] tracking-wider uppercase flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FFB300]" /> 6-Band Parametric Channel Strip
          </h2>

          <div className="flex justify-around items-stretch bg-black/20 border border-[#27272A]/50 rounded-xl py-2 overflow-x-auto custom-scrollbar">
            {/* EQ Slider Configuration */}
            {[
              { id: "sub", label: "Sub", typeChar: "Q", min: 0, max: 100, defaultValue: 50, accentColor: "#FF1744" },
              { id: "bass", label: "Bass", typeChar: "L", min: 0, max: 100, defaultValue: 50, accentColor: "#00E676" },
              { id: "warmth", label: "Warmth", typeChar: "W", min: 0, max: 100, defaultValue: 50, accentColor: "#FFB300" },
              { id: "mid", label: "Mid", typeChar: "M", min: 0, max: 100, defaultValue: 50, accentColor: "#FFB300" },
              { id: "presence", label: "Pres", typeChar: "R", min: 0, max: 100, defaultValue: 50, accentColor: "#40C4FF" },
              { id: "treble", label: "Treb", typeChar: "H", min: 0, max: 100, defaultValue: 50, accentColor: "#40C4FF" },
              { id: "bright", label: "Air/Bright", typeChar: "Y", min: 0, max: 100, defaultValue: 50, accentColor: "#00E5FF" },
            ].map((eq) => (
              <VerticalFader
                key={eq.id}
                config={eq}
                value={sliders[eq.typeChar]}
                disabled={!isConnected}
                onChange={(val) => handleSliderChange(eq.typeChar, val)}
              />
            ))}
          </div>

          {/* Quick Analog Toggles */}
          <div className="grid grid-cols-4 gap-2 border-t border-[#27272A]/40 pt-4">
            <button
              onClick={() => handleToggle("mute", "T")}
              disabled={!isConnected}
              className={`py-2 text-[10px] font-mono font-bold border rounded-lg uppercase cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${toggles.mute ? "bg-[#FF1744]/15 border-[#FF1744] text-[#FF1744]" : "bg-black/30 border-[#27272A] text-[#71717A]"}`}
            >
              Mute
            </button>
            <button
              onClick={() => handleToggle("bypass", "X")}
              disabled={!isConnected}
              className={`py-2 text-[10px] font-mono font-bold border rounded-lg uppercase cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${toggles.bypass ? "bg-[#FF1744]/15 border-[#FF1744] text-[#FF1744]" : "bg-black/30 border-[#27272A] text-[#71717A]"}`}
            >
              Bypass
            </button>
            <button
              onClick={() => handleToggle("stereo", "O")}
              disabled={!isConnected}
              className={`py-2 text-[10px] font-mono font-bold border rounded-lg uppercase cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${toggles.stereo ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]" : "bg-black/30 border-[#27272A] text-[#71717A]"}`}
            >
              {toggles.stereo ? "Stereo" : "Mono"}
            </button>
            <button
              onClick={() => handleToggle("loudness", "U")}
              disabled={!isConnected}
              className={`py-2 text-[10px] font-mono font-bold border rounded-lg uppercase cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${toggles.loudness ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]" : "bg-black/30 border-[#27272A] text-[#71717A]"}`}
            >
              Loudness
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: DYNAMICS RACK & PRESETS */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          {/* Dynamics (Gate & Limiter) */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 shadow-xl flex flex-col gap-4">
            <h2 className="text-xs font-mono text-[#71717A] tracking-wider uppercase flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#FF1744]" /> Dynamics Compressor
            </h2>

            <div className="flex flex-col gap-4 bg-black/20 border border-[#27272A]/50 rounded-xl p-3">
              {/* Noise Gate */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[#A1A1AA] uppercase">Noise Gate Thresh</span>
                  <span className="text-[#FFB300] font-bold">{sliders.N}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliders.N}
                  disabled={!isConnected}
                  onChange={(e) => handleSliderChange("N", parseInt(e.target.value))}
                  className="w-full accent-[#FFB300] cursor-pointer"
                />
              </div>

              {/* Limiter threshold */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[#A1A1AA] uppercase">Limiter Threshold</span>
                  <span className="text-[#FF1744] font-bold">{sliders.I}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliders.I}
                  disabled={!isConnected}
                  onChange={(e) => handleSliderChange("I", parseInt(e.target.value))}
                  className="w-full accent-[#FF1744] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Preset Matrix */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 shadow-xl flex flex-col gap-4">
            <h2 className="text-xs font-mono text-[#71717A] tracking-wider uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00E5FF]" /> Equalizer Presets
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset, idx) => {
                const isActive = activePreset === idx;
                return (
                  <button
                    key={preset.name}
                    disabled={!isConnected}
                    onClick={() => handlePresetSelect(idx)}
                    className={`py-2 px-1 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all truncate text-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      isActive
                        ? "bg-gradient-to-b from-[#00E5FF]/20 to-[#00E5FF]/5 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                        : "bg-black/20 border-[#27272A] text-[#71717A] hover:border-[#3E3E42]"
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Footer System Version */}
      <footer className="text-center font-mono text-[9px] text-[#52525B] mt-4 pt-4 border-t border-[#27272A]/20">
        DSP Controller v5.0.0-PRO · Ampli-Smart Bluetooth Suite
      </footer>
    </main>
  );
}
