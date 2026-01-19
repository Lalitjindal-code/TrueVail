"use client"

import { cn } from "@/lib/utils"

interface AnalysisGaugeProps {
    score?: number;
}

export function AnalysisGauge({ score = 0 }: AnalysisGaugeProps) {
    // Value: 0 to 100, clamped
    const threatLevel = Math.min(Math.max(score, 0), 100);

    // Logic: 0% = -90deg (Left), 50% = 0deg (Up), 100% = 90deg (Right)
    const rotationAngle = (threatLevel / 100) * 180 - 90;

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[160px]">
            <div className="relative w-48 h-24 overflow-hidden mb-2">
                {/* Background Arc */}
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-slate-800 border-b-0 box-border"></div>

                {/* Gradient Arc (Simulated with SVG to get the gradient) */}
                <svg viewBox="0 0 200 100" className="absolute top-0 left-0 w-full h-full">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" /> {/* Safe (Green) */}
                            <stop offset="50%" stopColor="#f97316" /> {/* Moderate (Orange) */}
                            <stop offset="100%" stopColor="#ef4444" /> {/* Critical (Red) */}
                        </linearGradient>
                    </defs>
                    <path
                        d="M 10 100 A 90 90 0 0 1 190 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Needle */}
                {/* Wrapper: Positioned at bottom center of the gauge */}
                <div
                    className="absolute bottom-0 left-1/2 w-[2px] h-[90px] origin-bottom"
                    style={{
                        // Rotate from the bottom pivot point
                        transform: `translateX(-50%) rotate(${rotationAngle}deg)`,
                        transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // Smooth bounce effect
                    }}
                >
                    {/* The Visual Needle (Design) */}
                    <div className="relative w-full h-full">

                        {/* Needle Body (Tapered Line) */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[4px] h-[85px] bg-gradient-to-t from-white via-cyan-400 to-transparent rounded-full shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>

                        {/* Needle Tip (Glowing Dot) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]"></div>

                    </div>
                </div>
            </div>

            {/* Pivot Point (Base Circle) */}
            <div className="absolute top-[88px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-2 border-slate-600 rounded-full z-10 shadow-lg"></div>

            {/* Text Labels */}
            <div className="text-center mt-2 z-20">
                <div className={`text-2xl font-bold font-display drop-shadow-lg ${threatLevel > 70 ? "text-red-500" : threatLevel > 30 ? "text-orange-500" : "text-green-500"
                    }`}>
                    {threatLevel > 70 ? "High Risk" : threatLevel > 30 ? "Moderate Risk" : "Safe"}
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Detection Level</p>
            </div>
        </div>
    )
}
