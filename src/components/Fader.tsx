"use client";

import React, { useState, useEffect, useRef } from "react";

interface FaderConfig {
  id: string;
  label: string;
  typeChar: string;
  min: number;
  max: number;
  defaultValue: number;
  accentColor: string;
  isMaster?: boolean;
}

interface FaderProps {
  config: FaderConfig;
  value: number;
  disabled?: boolean;
  onChange: (val: number) => void;
}

const VU_LED_COUNT = 16;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function VuBar({ faderValue, max, accentColor, disabled }: { faderValue: number; max: number; accentColor: string; disabled: boolean }) {
  const [levels, setLevels] = useState<number[]>(Array(VU_LED_COUNT).fill(0));
  const prevLevels = useRef<number[]>(Array(VU_LED_COUNT).fill(0));
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (disabled) {
      return;
    }

    let active = true;
    const animate = () => {
      if (!active) return;
      const baseActive = Math.round((faderValue / max) * VU_LED_COUNT);
      const jitter = Math.random() * 2.2 - 0.8;
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
    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [faderValue, max, disabled]);

  const displayedLevels = disabled ? Array(VU_LED_COUNT).fill(0) : levels;

  return (
    <div className="w-2.5 flex flex-col-reverse gap-[1.5px] p-[2px] bg-black/40 border border-white/5 rounded-md h-full">
      {displayedLevels.map((level, i) => {
        const isActive = level > 0.3;
        let bg = accentColor;
        if (i >= VU_LED_COUNT * 0.85) bg = "#FF1744"; // Red Clip
        else if (i >= VU_LED_COUNT * 0.65) bg = "#FFB300"; // Amber Warning
        
        return (
          <div
            key={i}
            className={`w-full flex-1 rounded-[1px] transition-all duration-75`}
            style={{
              opacity: isActive ? 0.5 + level * 0.5 : 0.08,
              background: isActive ? bg : "rgba(255,255,255,0.03)",
              boxShadow: isActive ? `0 0 4px ${bg}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

export function VerticalFader({ config, value, disabled = false, onChange }: FaderProps) {
  const fillPercent = ((value - config.min) / (config.max - config.min)) * 100;

  return (
    <div
      className={`flex flex-col items-center p-3 gap-2 min-w-16 relative border-r border-white/5 last:border-r-0 select-none ${
        config.isMaster ? "border-l border-white/10 pl-4 bg-white/5 rounded-r-xl" : ""
      } ${disabled ? "opacity-30 pointer-events-none" : ""}`}
    >
      {/* Value Readout */}
      <span
        className="font-mono text-xs font-bold text-center w-full tracking-wider"
        style={{ color: disabled ? "#71717A" : config.accentColor }}
      >
        {value}
      </span>

      {/* Fader area: VU Bar + Fader Slider */}
      <div className="flex items-stretch gap-2.5 h-[260px]">
        {/* VU bar for visual feedback */}
        <VuBar faderValue={value} max={config.max} accentColor={config.accentColor} disabled={disabled} />

        {/* Vertical Track */}
        <div className="relative w-10 h-full rounded-lg bg-[#0F0F12] border border-[#27272A]/50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Reference tick marks */}
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none z-[1]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={`w-full h-[1px] bg-white/5 ${i % 2 === 0 ? "bg-white/10" : ""}`} />
            ))}
          </div>

          {/* Value Fill Glow */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none transition-all duration-75"
            style={{
              height: `${fillPercent}%`,
              background: `linear-gradient(to top, ${config.accentColor}08, ${config.accentColor}25)`,
            }}
          />

          {/* Slider input */}
          <input
            type="range"
            min={config.min}
            max={config.max}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            style={{
              WebkitAppearance: "none",
              writingMode: "vertical-lr",
              direction: "rtl",
              "--fader-accent": config.accentColor,
            } as React.CSSProperties}
            className="ch-slider"
            aria-label={config.label}
          />
        </div>
      </div>

      {/* Channel Label */}
      <span
        className="font-mono text-[9px] font-bold tracking-wider mt-1 uppercase"
        style={{ color: disabled ? "#52525B" : config.accentColor }}
      >
        {config.label}
      </span>

      {/* Visual Status Indicator LED */}
      <div
        className="w-1.5 h-1.5 rounded-full mt-1 transition-all duration-300"
        style={{
          background: disabled ? "#3F3F46" : config.accentColor,
          boxShadow: disabled ? "none" : `0 0 6px ${config.accentColor}`,
        }}
      />
    </div>
  );
}
