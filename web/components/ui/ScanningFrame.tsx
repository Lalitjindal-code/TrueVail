"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ScanningFrameProps {
    imageUrl: string;
    isScanning: boolean;
    className?: string;
}

export function ScanningFrame({ imageUrl, isScanning, className = "" }: ScanningFrameProps) {
    const [randomCodes, setRandomCodes] = useState<string[]>([]);

    // Generate random hex codes for the "Matrix" data stream effect
    useEffect(() => {
        if (isScanning) {
            const interval = setInterval(() => {
                const codes = Array.from({ length: 8 }, () =>
                    Math.random().toString(16).substring(2, 10).toUpperCase()
                );
                setRandomCodes(codes);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [isScanning]);

    return (
        <div className={`relative rounded-xl overflow-hidden border border-[#00F0FF]/30 bg-black group ${className}`}>

            {/* The Image Itself */}
            <img
                src={imageUrl}
                alt="Scan Target"
                className={`w-full h-full object-cover transition-all duration-300 ${isScanning ? "opacity-60 scale-105 saturate-0" : "opacity-100"}`}
            />

            {/* Scanning Overlay Layers - Only visible when scanning */}
            {isScanning && (
                <>
                    {/* 1. Holographic Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none mix-blend-screen" />

                    {/* 2. Laser Scan Line Animation */}
                    <motion.div
                        className="absolute left-0 right-0 h-1 bg-[#00F0FF] shadow-[0_0_20px_#00F0FF,0_0_10px_#00F0FF] z-10"
                        initial={{ top: "0%" }}
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />

                    {/* 3. Vignette & Glitch tint */}
                    <div className="absolute inset-0 bg-[#00F0FF]/10 mix-blend-overlay pointer-events-none" />

                    {/* 4. Data Processing Stream (Side Column) */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1 font-mono text-[10px] text-[#00F0FF]/80 pointer-events-none z-20">
                        {randomCodes.map((code, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                            >
                                0x{code}
                            </motion.span>
                        ))}
                    </div>

                    {/* 5. Status Text */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 border border-[#00F0FF]/30 rounded text-[#00F0FF] font-mono text-xs animate-pulse">
                        SCANNING_TARGET...
                    </div>
                </>
            )}

            {/* Static Corners for "Tech" look */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00F0FF] rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00F0FF] rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00F0FF] rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00F0FF] rounded-br-lg" />
        </div>
    );
}
