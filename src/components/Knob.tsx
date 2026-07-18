"use client";

import React, { useRef, useCallback } from "react";

interface KnobProps {
  label: string;
  min: number;
  max: number;
  value: number;
  defaultValue: number;
  accentColor: string;
  disabled?: boolean;
  onChange: (val: number) => void;
}

export function Knob({
  label,
  min,
  max,
  value,
  defaultValue,
  accentColor,
  disabled = false,
  onChange,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);

  // Convert value to degrees for styling (-135 to 135 deg range)
  const range = max - min;
  const percent = (value - min) / range;
  const rotationDeg = -135 + percent * 270;

  const handleDrag = useCallback(
    (clientY: number) => {
      if (disabled) return;
      const startY = clientY;
      const startVal = value;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = startY - moveEvent.clientY; // Drag up to increase
        // 150px drag represents full range
        const scale = 150;
        const valDelta = (deltaY / scale) * range;
        const newVal = Math.max(min, Math.min(max, Math.round(startVal + valDelta)));
        onChange(newVal);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [value, min, max, range, disabled, onChange]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      const startY = touch.clientY;
      const startVal = value;

      const onTouchMove = (moveEvent: TouchEvent) => {
        const touchMove = moveEvent.touches[0];
        const deltaY = startY - touchMove.clientY;
        const scale = 150;
        const valDelta = (deltaY / scale) * range;
        const newVal = Math.max(min, Math.min(max, Math.round(startVal + valDelta)));
        onChange(newVal);
      };

      const onTouchEnd = () => {
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      };

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [value, min, max, range, disabled, onChange]
  );

  const handleDoubleClick = () => {
    if (disabled) return;
    onChange(defaultValue);
  };

  return (
    <div className="flex flex-col items-center select-none group w-20">
      {/* Knob Label */}
      <span className="text-[10px] font-semibold text-[#A1A1AA] tracking-wider mb-2 uppercase text-center truncate w-full">
        {label}
      </span>

      {/* Knob Dial */}
      <div
        ref={knobRef}
        onMouseDown={(e) => {
          e.preventDefault();
          handleDrag(e.clientY);
        }}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        className={`w-14 h-14 rounded-full bg-gradient-to-b from-[#2E2E36] to-[#18181D] border border-[#3A3A44]/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center relative cursor-ns-resize transition-all ${
          disabled ? "opacity-30 cursor-not-allowed" : "hover:border-[#00E5FF]/40"
        }`}
        style={{
          // Pass the accent color custom property
          "--knob-accent": accentColor,
        } as React.CSSProperties}
        aria-label={`${label} dial`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        {/* Indicator Ring (SVG) */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          <circle
            cx="28"
            cy="28"
            r="23"
            fill="transparent"
            stroke="#1E1E24"
            strokeWidth="2.5"
          />
          <circle
            cx="28"
            cy="28"
            r="23"
            fill="transparent"
            stroke={disabled ? "#3F3F46" : accentColor}
            strokeWidth="2.5"
            strokeDasharray={2 * Math.PI * 23}
            // Dash offset matches the active range
            strokeDashoffset={2 * Math.PI * 23 * (1 - percent * 0.75)}
            className="transition-all duration-75"
            style={{
              transformOrigin: "center",
              transform: "rotate(-135deg)",
            }}
          />
        </svg>

        {/* Knob Face */}
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#121215] to-[#25252D] border border-[#2A2A32] flex items-center justify-center relative transition-transform duration-75"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
        >
          {/* Knob Line Indicator */}
          <div
            className="w-[3px] h-3 bg-white/90 rounded-full absolute top-[3px] left-1/2 -translate-x-1/2 shadow-[0_0_4px_rgba(255,255,255,0.8)]"
            style={{ backgroundColor: disabled ? "#71717A" : "#FFFFFF" }}
          />
        </div>
      </div>

      {/* Knob Value */}
      <span
        className="text-[10px] font-mono font-bold mt-2 transition-all duration-75"
        style={{ color: disabled ? "#52525B" : accentColor }}
      >
        {value}
      </span>
    </div>
  );
}
