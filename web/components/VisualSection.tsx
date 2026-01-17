"use client";
import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// --- COMPONENT: DATA PARTICLES (Client-Side Only Fix) ---
const DataParticles = () => {
    // Fix: Hydration Issue solve karne ke liye 'mounted' check
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Jab tak browser pe load na ho, particles render mat karo (Avoids Top-Left Clumping)
    if (!mounted) return null;

    // 50 Particles generate karenge puri screen ke liye
    const particles = Array.from({ length: 50 });
    const squares = Array.from({ length: 15 });

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-cyan-400/60 rounded-full shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                    // Initial position pure screen (100vw, 100vh) par random hogi
                    initial={{
                        opacity: 0,
                        x: Math.random() * 100 + "vw",
                        y: Math.random() * 100 + "vh"
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2, 0.5],
                        // Random floating movement
                        x: [
                            Math.random() * 100 + "vw",
                            (Math.random() * 100 - 10) + "vw",
                            (Math.random() * 100 + 10) + "vw"
                        ],
                        y: [
                            Math.random() * 100 + "vh",
                            (Math.random() * 100 - 20) + "vh"
                        ],
                    }}
                    transition={{
                        duration: Math.random() * 15 + 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 5 // Thoda delay taaki sab ek saath start na ho
                    }}
                />
            ))}

            {/* Floating Binary Bits (Squares) */}
            {squares.map((_, i) => (
                <motion.div
                    key={`sq-${i}`}
                    className="absolute w-2 h-2 border border-cyan-400/30 bg-cyan-400/10"
                    initial={{
                        x: Math.random() * 100 + "vw",
                        y: Math.random() * 100 + "vh",
                        opacity: 0
                    }}
                    animate={{
                        y: [null, Math.random() * -100], // Upward float
                        rotate: 360,
                        opacity: [0, 0.6, 0]
                    }}
                    transition={{ duration: Math.random() * 20 + 10, repeat: Infinity, ease: "linear" }}
                />
            ))}
        </div>
    );
};

// --- COMPONENT: GLITCH TEXT EFFECT ---
const GlitchFake = () => {
    return (
        <div className="relative inline-block group">
            {/* Main Glitch Layer */}
            <motion.span
                className="relative z-10 text-6xl font-black text-red-600 border-[6px] border-red-600 px-4 py-2 rounded tracking-wider bg-black/10 backdrop-blur-sm block"
                animate={{
                    opacity: [1, 0.8, 0.2, 1, 0, 1],
                    x: [0, -2, 2, 0],
                    skewX: [0, 5, -5, 0]
                }}
                transition={{
                    duration: 2.5,
                    times: [0, 0.1, 0.2, 0.3, 0.35, 1],
                    repeat: Infinity,
                    repeatType: "loop"
                }}
            >
                FAKE
            </motion.span>

            {/* Color Split Layer */}
            <motion.span
                className="absolute top-0 left-0 text-6xl font-black text-cyan-500 border-[6px] border-cyan-500 px-4 py-2 rounded mix-blend-screen opacity-70"
                animate={{
                    x: [0, 4, -4, 0],
                    y: [0, 2, -2, 0],
                    opacity: [0, 1, 0]
                }}
                transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2 + 1
                }}
            >
                FAKE
            </motion.span>
        </div>
    );
};

// --- HELPER: TRAVELING BORDER ---
const MovingBorder = ({ children, borderRadius = "12px", duration = 4, className = "" }: any) => {
    return (
        <div className={`relative p-[2px] overflow-hidden ${className}`} style={{ borderRadius }}>
            <motion.div
                className="absolute inset-[-350%]"
                style={{
                    backgroundImage: 'conic-gradient(from 0deg, transparent 0%, #00F0FF 25%, transparent 50%, #FF3366 75%, transparent 100%)',
                    opacity: 0.8
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative h-full w-full bg-brand-dark/90 backdrop-blur-xl transition-all" style={{ borderRadius }}>
                {children}
            </div>
        </div>
    );
};

export default function VisualSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const lensX = useSpring(mouseX, springConfig);
    const lensY = useSpring(mouseY, springConfig);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left - 140);
        mouseY.set(clientY - top - 140);
    }

    function handleMouseLeave() {
        mouseX.set(110);
        mouseY.set(160);
    }

    useEffect(() => {
        mouseX.set(110);
        mouseY.set(160);
    }, []);

    return (
        // 'w-full h-full' aur 'relative' ensure karta hai ki particles iske andar hi rahein
        <div className="hidden lg:flex relative w-full h-full items-center justify-center bg-[#0A121F] overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_70%)] pointer-events-none"></div>

            {/* 1. DATA PARTICLES LAYER (Corrected for random distribution) */}
            <DataParticles />

            {/* Main Interactive Container */}
            <div
                ref={containerRef}
                className="relative w-[500px] h-[600px] flex items-center justify-center cursor-none z-20"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* === NEWSPAPER === */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[400px] h-[500px] relative">
                        <MovingBorder borderRadius="16px" duration={8} className="h-full w-full">
                            <div className="h-full w-full bg-white/5 p-8 flex flex-col gap-6 backdrop-blur-sm">
                                <div className="w-full h-8 bg-white/10 rounded animate-pulse"></div>
                                <div className="space-y-4 opacity-40">
                                    <div className="w-full h-4 bg-white/5 rounded"></div>
                                    <div className="w-3/4 h-4 bg-white/5 rounded"></div>
                                    <div className="w-full h-4 bg-white/5 rounded"></div>
                                    <div className="w-full h-4 bg-white/5 rounded"></div>
                                    <div className="w-5/6 h-4 bg-white/5 rounded"></div>
                                </div>
                                {/* GLITCH FAKE STAMP */}
                                <div className="mt-auto flex justify-end rotate-[-12deg] opacity-90">
                                    <GlitchFake />
                                </div>
                            </div>
                        </MovingBorder>
                    </div>
                </div>

                {/* === LENS GROUP === */}
                <motion.div
                    style={{ x: lensX, y: lensY }}
                    className="absolute z-30 top-0 left-0 pointer-events-none"
                >
                    <div className="relative w-[280px] h-[280px]">
                        {/* RIM LIGHT */}
                        <div className="absolute inset-0 rounded-full shadow-[0_0_60px_rgba(0,240,255,0.3)]">
                            <MovingBorder borderRadius="9999px" duration={2} className="h-full w-full">
                                {/* GLASS & REVEAL */}
                                <div className="h-full w-full bg-white/10 backdrop-blur-[0px] flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center bg-brand-cyan/5">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                                            className="absolute inset-0 bg-brand-cyan/10 blur-xl"
                                        />
                                        <span className="relative z-10 text-3xl font-black text-brand-cyan border-[3px] border-brand-cyan px-5 py-2 rounded shadow-[0_0_30px_rgba(0,240,255,0.6)] rotate-[-5deg]">
                                            VERIFIED
                                        </span>
                                    </div>
                                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_60%)]"></div>
                                </div>
                            </MovingBorder>
                        </div>
                        {/* HANDLE */}
                        <div
                            className="absolute w-[160px] h-[28px] bg-gradient-to-r from-gray-700 via-gray-600 to-gray-800 rounded-full border border-gray-600 shadow-2xl z-[-1]"
                            style={{
                                top: "85.3%",
                                left: "85.3%",
                                transformOrigin: "top left",
                                transform: "rotate(45deg)"
                            }}
                        ></div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}