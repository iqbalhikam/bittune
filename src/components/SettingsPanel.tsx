"use client";

import React, { useRef } from "react";
import { Settings, Save, RotateCcw, Download, Upload, ShieldAlert, Cpu } from "lucide-react";

interface SettingsPanelProps {
  disabled?: boolean;
  developerMode: boolean;
  onResetEQ: () => void;
  onSavePreset: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  onFactoryReset: () => void;
  onToggleDeveloperMode: () => void;
  onToggleBypass: () => void;
  isBypassed: boolean;
}

export function SettingsPanel({
  disabled = false,
  developerMode,
  onResetEQ,
  onSavePreset,
  onExportJSON,
  onImportJSON,
  onFactoryReset,
  onToggleDeveloperMode,
  onToggleBypass,
  isBypassed,
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        onImportJSON(content);
      }
    };
    reader.readAsText(file);
    // Reset target value so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="bg-[#121216] border border-[#27272A] rounded-xl p-4 shadow-xl">
      <div className="text-[10px] font-mono text-[#71717A] tracking-wider mb-4 uppercase flex items-center gap-2">
        <Settings className="w-3.5 h-3.5 text-[#00E5FF]" />
        System Configuration & Utilities
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Memory Actions */}
        <div className="bg-black/20 border border-[#27272A]/50 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-[10px] font-mono text-[#71717A] uppercase flex items-center gap-1.5">
            <Save className="w-3 h-3 text-[#00E5FF]" /> Device Memory
          </span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              disabled={disabled}
              onClick={onSavePreset}
              className={`p-2 bg-gradient-to-b from-[#2E2E36] to-[#18181D] hover:from-[#3A3A44] hover:to-[#222228] border border-[#3A3A44]/60 rounded text-[10px] font-mono font-bold text-[#00E5FF] tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Save Preset
            </button>
            <button
              disabled={disabled}
              onClick={onResetEQ}
              className={`p-2 bg-gradient-to-b from-[#2E2E36] to-[#18181D] hover:from-[#3A3A44] hover:to-[#222228] border border-[#3A3A44]/60 rounded text-[10px] font-mono font-bold text-[#FFB300] tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <RotateCcw className="w-3 h-3" /> Reset EQ
            </button>
          </div>
        </div>

        {/* JSON Import/Export */}
        <div className="bg-black/20 border border-[#27272A]/50 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-[10px] font-mono text-[#71717A] uppercase flex items-center gap-1.5">
            <Download className="w-3 h-3 text-[#00E676]" /> JSON Presets
          </span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={onExportJSON}
              className={`p-2 bg-gradient-to-b from-[#2E2E36] to-[#18181D] hover:from-[#3A3A44] hover:to-[#222228] border border-[#3A3A44]/60 rounded text-[10px] font-mono font-bold text-[#00E676] tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer`}
            >
              Export JSON
            </button>
            <button
              disabled={disabled}
              onClick={handleImportClick}
              className={`p-2 bg-gradient-to-b from-[#2E2E36] to-[#18181D] hover:from-[#3A3A44] hover:to-[#222228] border border-[#3A3A44]/60 rounded text-[10px] font-mono font-bold text-[#00E5FF] tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <Upload className="w-3 h-3" /> Import JSON
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* DSP Modes & Safety */}
        <div className="bg-black/20 border border-[#27272A]/50 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-[10px] font-mono text-[#71717A] uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-[#FF1744]" /> DSP Mode & Safety
          </span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              disabled={disabled}
              onClick={onToggleBypass}
              className={`p-2 border rounded text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isBypassed
                  ? "bg-[#FF1744]/15 border-[#FF1744] text-[#FF1744]"
                  : "bg-gradient-to-b from-[#2E2E36] to-[#18181D] border-[#3A3A44]/60 text-[#E4E4E7]"
              }`}
            >
              {isBypassed ? "Bypassed" : "Bypass DSP"}
            </button>
            <button
              disabled={disabled}
              onClick={onFactoryReset}
              className={`p-2 bg-gradient-to-b from-[#FF1744]/10 to-[#FF1744]/5 hover:from-[#FF1744]/20 hover:to-[#FF1744]/10 border border-[#FF1744]/30 rounded text-[10px] font-mono font-bold text-[#FF1744] tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Factory Reset
            </button>
          </div>
        </div>
      </div>

      {/* Developer Options & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#27272A]/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDeveloperMode}
            className={`px-3 py-1.5 border rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              developerMode
                ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]"
                : "bg-black/20 border-[#27272A]/80 text-[#71717A]"
            }`}
          >
            <Cpu className="w-3 h-3" /> Developer Mode
          </button>
        </div>

        <span className="text-[9px] font-mono text-[#52525B]">
          BitTune DSP Processor Controller · System Version v4.1.0-Release
        </span>
      </div>
    </div>
  );
}
