"use client";

import { useEffect, useState, useRef } from "react";

interface VUMeterProps {
  leftLevel: number; // 0-255
  rightLevel: number; // 0-255
  isConnected: boolean;
  masterVolume: number; // For demo animation if disconnected
}

const SEGMENTS_COUNT = 24;

export function VUMeter({ leftLevel, rightLevel, isConnected, masterVolume }: VUMeterProps) {
  const [leftRMS, setLeftRMS] = useState(0);
  const [rightRMS, setRightRMS] = useState(0);
  const [leftPeak, setLeftPeak] = useState(0);
  const [rightPeak, setRightPeak] = useState(0);
  const [leftClip, setLeftClip] = useState(false);
  const [rightClip, setRightClip] = useState(false);

  const peakDecayTimer = useRef<any>(null);

  // Peak hold and decay
  useEffect(() => {
    let currentLeft = isConnected ? leftLevel : 0;
    let currentRight = isConnected ? rightLevel : 0;

    // Simulation for demo when not connected, triggered by masterVolume
    if (!isConnected && masterVolume > 0) {
      const scale = masterVolume / 100;
      currentLeft = Math.round((Math.random() * 0.4 + 0.6) * 220 * scale);
      currentRight = Math.round((Math.random() * 0.4 + 0.6) * 220 * scale);
    }

    const finalLeft = currentLeft;
    const finalRight = currentRight;

    queueMicrotask(() => {
      setLeftRMS((prev) => prev * 0.7 + finalLeft * 0.3);
      setRightRMS((prev) => prev * 0.7 + finalRight * 0.3);

      setLeftPeak((prev) => {
        if (finalLeft > prev) {
          if (finalLeft > 240) {
            setLeftClip(true);
            setTimeout(() => setLeftClip(false), 800);
          }
          return finalLeft;
        }
        return prev;
      });

      setRightPeak((prev) => {
        if (finalRight > prev) {
          if (finalRight > 240) {
            setRightClip(true);
            setTimeout(() => setRightClip(false), 800);
          }
          return finalRight;
        }
        return prev;
      });
    });
  }, [leftLevel, rightLevel, isConnected, masterVolume]);

  // Slowly decay peaks
  useEffect(() => {
    const interval = setInterval(() => {
      setLeftPeak((prev) => Math.max(0, prev - 3));
      setRightPeak((prev) => Math.max(0, prev - 3));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getSegmentColor = (index: number) => {
    // 0 is bottom (green), SEGMENTS_COUNT - 1 is top (red)
    const ratio = index / SEGMENTS_COUNT;
    if (ratio > 0.85) return "bg-[#FF1744]"; // Red Clip
    if (ratio > 0.65) return "bg-[#FFB300]"; // Amber Warning
    return "bg-[#00E676]"; // Green Safe
  };

  const getSegmentGlow = (index: number) => {
    const ratio = index / SEGMENTS_COUNT;
    if (ratio > 0.85) return "shadow-[0_0_8px_#FF1744]";
    if (ratio > 0.65) return "shadow-[0_0_8px_#FFB300]";
    return "shadow-[0_0_8px_#00E676]";
  };

  const renderChannelMeter = (rms: number, peak: number, clip: boolean) => {
    const activeSegments = Math.round((rms / 255) * SEGMENTS_COUNT);
    const peakSegment = Math.round((peak / 255) * SEGMENTS_COUNT);

    return (
      <div className="flex flex-col-reverse items-center gap-[3px] h-[340px] w-4 bg-[#0F0F12] border border-[#27272A]/40 rounded-sm p-[2px] relative">
        {Array.from({ length: SEGMENTS_COUNT }).map((_, i) => {
          const isActive = i < activeSegments;
          const isPeak = i === peakSegment && peakSegment > 0;
          const colorClass = getSegmentColor(i);
          const glowClass = getSegmentGlow(i);

          return (
            <div
              key={i}
              className={`w-full h-[10px] rounded-[1px] transition-all duration-75 ${
                isActive
                  ? `${colorClass} opacity-100 ${glowClass}`
                  : isPeak
                  ? `${colorClass} opacity-80 ${glowClass}`
                  : "bg-[#1E1E24] opacity-20"
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center bg-[#121216] border border-[#27272A] rounded-xl p-4 shadow-xl">
      <div className="text-[10px] font-mono text-[#71717A] tracking-wider mb-2 uppercase">
        Stereo Level Meter
      </div>

      <div className="flex items-center gap-6">
        {/* Left Channel */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] font-mono text-[#00E5FF]">CH L</div>
          {renderChannelMeter(leftRMS, leftPeak, leftClip)}
          <div
            className={`w-2.5 h-2.5 rounded-full border border-black/40 mt-1 transition-all ${
              leftClip
                ? "bg-[#FF1744] shadow-[0_0_10px_#FF1744]"
                : "bg-[#FF1744]/20"
            }`}
            title="Clip Indicator"
          />
        </div>

        {/* Level Ticks */}
        <div className="flex flex-col justify-between h-[340px] text-[9px] font-mono text-[#52525B] py-[4px]">
          <div>+6dB</div>
          <div>0dB</div>
          <div>-3dB</div>
          <div>-6dB</div>
          <div>-12dB</div>
          <div>-20dB</div>
          <div>-40dB</div>
        </div>

        {/* Right Channel */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] font-mono text-[#00E5FF]">CH R</div>
          {renderChannelMeter(rightRMS, rightPeak, rightClip)}
          <div
            className={`w-2.5 h-2.5 rounded-full border border-black/40 mt-1 transition-all ${
              rightClip
                ? "bg-[#FF1744] shadow-[0_0_10px_#FF1744]"
                : "bg-[#FF1744]/20"
            }`}
            title="Clip Indicator"
          />
        </div>
      </div>

      {/* Stereo Balance Indicator */}
      <div className="w-full mt-4 bg-[#0F0F12] border border-[#27272A]/50 rounded p-2">
        <div className="flex justify-between text-[9px] font-mono text-[#52525B] mb-1">
          <span>L</span>
          <span>C</span>
          <span>R</span>
        </div>
        <div className="h-1.5 bg-[#1E1E24] rounded-full relative overflow-hidden">
          <div
            className="h-full bg-[#00E5FF] absolute top-0 bottom-0 transition-all duration-100"
            style={{
              left: `${Math.max(0, 50 - (leftRMS - rightRMS) / 10)}%`,
              right: `${Math.max(0, 50 - (rightRMS - leftRMS) / 10)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
