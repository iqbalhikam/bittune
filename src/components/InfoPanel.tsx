"use client";

import { DSPStatus } from "../types/dsp";
import { Cpu, Wifi, Activity, Thermometer, ShieldAlert, Award } from "lucide-react";

interface InfoPanelProps {
  status: DSPStatus;
  isConnected: boolean;
}

export function InfoPanel({ status, isConnected }: InfoPanelProps) {
  return (
    <div className="bg-[#121216] border border-[#27272A] rounded-xl p-4 shadow-xl">
      <div className="text-[10px] font-mono text-[#71717A] tracking-wider mb-3 uppercase flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
        DSP Real-Time Telemetry
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Connection & Device Info */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase flex items-center gap-1">
            <Wifi className="w-3 h-3 text-[#00E5FF]" /> Signal Quality
          </span>
          <span className={`text-xs font-mono font-bold mt-1 ${isConnected ? "text-[#00E676]" : "text-[#FF1744]"}`}>
            {isConnected ? `${status.connectionQuality} (${status.rssi} dBm)` : "Offline"}
          </span>
        </div>

        {/* CPU Usage */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#FFB300]" /> CPU Load
          </span>
          <span className="text-xs font-mono font-bold text-[#E4E4E7] mt-1">
            {isConnected ? `${status.cpuUsage}%` : "0%"}
          </span>
        </div>

        {/* ESP32 Temperature */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-[#FF1744]" /> SoC Temp
          </span>
          <span className="text-xs font-mono font-bold text-[#E4E4E7] mt-1">
            {isConnected ? `${status.temp}°C` : "N/A"}
          </span>
        </div>

        {/* Sample Rate */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase">Sample Rate</span>
          <span className="text-xs font-mono font-bold text-[#00E5FF] mt-1">
            {status.sampleRate}
          </span>
        </div>

        {/* Active Preset */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase flex items-center gap-1">
            <Award className="w-3 h-3 text-[#00E5FF]" /> Active Preset
          </span>
          <span className="text-xs font-mono font-bold text-[#00E5FF] mt-1 truncate">
            {status.preset}
          </span>
        </div>

        {/* Limiter / Clipper Status */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-[#FF1744]" /> Safety Limiters
          </span>
          <span className="text-[10px] font-mono font-bold text-[#E4E4E7] mt-1 flex gap-2">
            <span className={status.limiterActive ? "text-[#00E676]" : "text-[#71717A]"}>LMT</span>
            <span className={status.clipperActive ? "text-[#00E676]" : "text-[#71717A]"}>CLP</span>
          </span>
        </div>

        {/* Latency */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase">Audio Latency</span>
          <span className="text-xs font-mono font-bold text-[#E4E4E7] mt-1">
            {isConnected ? `${status.latency} ms` : "N/A"}
          </span>
        </div>

        {/* Firmware Version */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase">Firmware</span>
          <span className="text-xs font-mono font-bold text-[#E4E4E7] mt-1">
            {status.firmwareVersion}
          </span>
        </div>

        {/* Connection Quality */}
        <div className="bg-black/30 border border-[#27272A]/50 rounded p-2.5 flex flex-col justify-between">
          <span className="text-[9px] font-mono text-[#71717A] uppercase">DSP Mode</span>
          <span className="text-xs font-mono font-bold text-[#00E5FF] mt-1">
            4-Way Active
          </span>
        </div>
      </div>
    </div>
  );
}
