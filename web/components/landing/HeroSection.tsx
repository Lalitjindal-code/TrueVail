"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Play } from "lucide-react";
import Hero3D from "@/components/landing/Hero3D";

export default function HeroSection() {
    return (
        <section className="relative min-h-screen pt-16 md:pt-24 px-6 md:px-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,240,255,0.05),transparent_50%)] pointer-events-none"></div>

            {/* LEFT: Text Content */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="z-10 flex flex-col items-start gap-6"
            >
                {/* Badge */}
                <div className="px-4 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan text-xs font-mono tracking-widest uppercase">
                    v4.0 Live Analysis System
                </div>

                <h1 className="font-display font-bold text-7xl leading-[1.1] text-white tracking-tight">
                    CLARIFY THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-brand-cyan animate-pulse">CHAOS</span>.
                    <br />
                    DETECT DIGITAL <br />
                    DECEPTION.
                </h1>

                <p className="font-sans text-gray-400 text-xl max-w-xl leading-relaxed">
                    Advanced AI-powered analysis for fake news text, malicious links, and deepfake imagery. Verify the truth in milliseconds.
                </p>

                <div className="flex flex-row items-center gap-4 mt-4">
                    <Link href="/signup">
                        <button className="px-8 py-4 bg-brand-cyan text-brand-dark font-sans font-bold text-lg rounded shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] hover:scale-105 transition-all">
                            Analyze Now - Free Trial
                        </button>
                    </Link>

                    <button className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-sans font-medium rounded hover:bg-white/10 transition-all">
                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play size={14} fill="currentColor" />
                        </div>
                        Watch How It Works
                    </button>
                </div>
            </motion.div>

            {/* RIGHT: 3D Visual */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="relative h-[600px] w-full flex items-center justify-center"
            >
                <Hero3D />
            </motion.div>

        </section>
    );
}
