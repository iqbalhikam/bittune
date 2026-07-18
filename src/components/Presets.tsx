"use client";

import { Award } from "lucide-react";
import { Preset } from "../types/dsp";

interface PresetsProps {
  activePresetIndex: number;
  disabled?: boolean;
  onSelectPreset: (index: number) => void;
}

export const PRESET_LIST: Preset[] = [
  { name: "Flat", desc: "No equalization", values: { H: 100, M: 100, L: 100, V: 40, B: 127, W: 100, S: 100 } },
  { name: "Rock", desc: "Classic V-shape", values: { H: 135, M: 85, L: 140, V: 50, B: 127, W: 110, S: 120 } },
  { name: "Pop", desc: "Vocal focus & Bass", values: { H: 115, M: 120, L: 110, V: 50, B: 127, W: 100, S: 105 } },
  { name: "Jazz", desc: "Smooth highs & Mid", values: { H: 95, M: 110, L: 115, V: 50, B: 127, W: 105, S: 95 } },
  { name: "Movie", desc: "Immersive & Sub", values: { H: 125, M: 90, L: 145, V: 60, B: 127, W: 130, S: 140 } },
  { name: "Bass Boost", desc: "Deep low enhancement", values: { H: 100, M: 100, L: 175, V: 50, B: 127, W: 100, S: 160 } },
  { name: "Gaming", desc: "Footstep & FX Boost", values: { H: 130, M: 85, L: 120, V: 50, B: 127, W: 140, S: 110 } },
  { name: "Podcast", desc: "Warm voice focus", values: { H: 105, M: 135, L: 85, V: 45, B: 127, W: 80, S: 70 } },
  { name: "Vocal", desc: "Crisp treble/mids", values: { H: 120, M: 140, L: 90, V: 50, B: 127, W: 90, S: 80 } },
  { name: "Custom 1", desc: "User Preset 1", values: { H: 100, M: 100, L: 100, V: 40, B: 127, W: 100, S: 100 } },
  { name: "Custom 2", desc: "User Preset 2", values: { H: 100, M: 100, L: 100, V: 40, B: 127, W: 100, S: 100 } },
  { name: "Custom 3", desc: "User Preset 3", values: { H: 100, M: 100, L: 100, V: 40, B: 127, W: 100, S: 100 } },
];

export function Presets({ activePresetIndex, disabled = false, onSelectPreset }: PresetsProps) {
  return (
    <div className="bg-[#121216] border border-[#27272A] rounded-xl p-4 shadow-xl">
      <div className="text-[10px] font-mono text-[#71717A] tracking-wider mb-3 uppercase flex items-center gap-2">
        <Award className="w-3.5 h-3.5 text-[#00E5FF]" />
        DSP Preset Matrix
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {PRESET_LIST.map((preset, index) => {
          const isActive = index === activePresetIndex;
          return (
            <button
              key={preset.name}
              disabled={disabled}
              onClick={() => onSelectPreset(index)}
              className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all select-none ${
                isActive
                  ? "bg-gradient-to-b from-[#00E5FF]/20 to-[#00E5FF]/5 border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.15)]"
                  : "bg-black/20 border-[#27272A]/60 hover:border-[#3A3A44] hover:bg-black/30"
              } ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`text-xs font-semibold ${
                  isActive ? "text-[#00E5FF]" : "text-[#E4E4E7]"
                }`}
              >
                {preset.name}
              </span>
              <span className="text-[9px] font-mono text-[#71717A] mt-1 line-clamp-1">
                {preset.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
