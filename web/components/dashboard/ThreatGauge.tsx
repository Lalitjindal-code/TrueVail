"use client"

import { cn } from "@/lib/utils"

export function ThreatGauge() {
    // Moderate Risk: ~50%
    const threatLevel = 50;

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[160px]">
            <div className="relative w-48 h-24 overflow-hidden mb-2">
                {/* Background Arc */}
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-slate-800 border-b-0 box-border"></div>

                {/* Gradient Arc (Simulated with SVG to get the gradient) */}
                <svg viewBox="0 0 200 100" className="absolute top-0 left-0 w-full h-full">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" /> {/* Green */}
                            <stop offset="50%" stopColor="#f97316" /> {/* Orange */}
                            <stop offset="100%" stopColor="#ef4444" /> {/* Red */}
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
                <div
                    className="absolute bottom-0 left-1/2 w-0 h-0"
                    style={{
                        transform: `rotate(${threatLevel * 1.8 - 90}deg)`,
                        transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    {/* 
                        Needle Container 
                        - Rotated by parent to correct angle.
                        - We need the graphic to point UP at 0deg rotation.
                        - Our SVG points RIGHT. So we rotate inner -90deg.
                        - Pivot of SVG is at (15, 10). We align this to (0,0) of parent.
                    */}
                    <div
                        className="absolute top-0 left-0 -rotate-90 origin-[15px_10px]"
                        style={{
                            transform: 'translate(-15px, -10px) rotate(-90deg)', // Align pivot (15,10) to origin (0,0) and rotate to point Up
                        }}
                    >
                        <svg width="110" height="20" viewBox="0 0 140 20" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            <defs>
                                <linearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M 0 10 L 140 10 L 80 5 L 140 10 L 80 15 Z" fill="url(#needleGradient)" />
                            <path d="M 15 10 L 130 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="15" cy="10" r="4" fill="#0A1320" stroke="white" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="text-center mt-2">
                <div className="text-2xl font-bold text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                    Moderate Risk
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Global Threat Level</p>
            </div>
        </div>
    )
}
