"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
    return (
        <motion.nav
            // OPTIMIZATION: Removed 'backdrop-blur-md' and opacity '/80'
            // Used Solid BG '#0A121F' to fix scroll lag over 3D elements
            className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-white/10 bg-[#0A121F]"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            <div className="flex items-center gap-2">
                {/* Logo - Simple Text with Glow */}
                <Link href="/" className="font-display font-bold text-2xl text-white tracking-widest relative">
                    TRUVAIL
                    <span className="absolute -inset-1 bg-brand-cyan/20 blur-lg rounded-full"></span>
                </Link>
            </div>

            <div className="flex items-center gap-8 font-sans text-sm text-gray-400">
                <Link href="#features" className="hover:text-brand-cyan transition-colors">Features</Link>
                {/* Demo link can be removed if you removed the section, otherwise keep it */}
                {/* <Link href="#demo" className="hover:text-brand-cyan transition-colors">Demo</Link> */}
                <Link href="https://ai.google.dev/gemini-api/docs/quickstart" target="_blank" className="hover:text-brand-cyan transition-colors">API</Link>
                <Link href="/about" className="hover:text-brand-cyan transition-colors">About Us</Link>
            </div>

            <div className="flex items-center gap-4">
                <Link href="/login" className="block text-sm font-sans text-white hover:text-brand-cyan transition-colors">
                    Login
                </Link>
                <Link
                    href="/signup"
                    className="px-6 py-2 bg-brand-cyan text-brand-dark font-sans font-bold text-sm rounded shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] hover:scale-105 transition-all"
                >
                    Analyze Now
                </Link>
            </div>
        </motion.nav>
    );
}