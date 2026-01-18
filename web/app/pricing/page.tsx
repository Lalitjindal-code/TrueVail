"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Zap, Shield, Globe, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PricingCard = ({ title, price, features, recommended = false, delay }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className={`relative p-8 rounded-2xl border ${recommended ? "border-[#00F0FF] bg-[#00F0FF]/5 shadow-[0_0_30px_rgba(0,240,255,0.15)]" : "border-white/10 bg-[#0F1724]"
                } flex flex-col hover:scale-105 transition-transform duration-300`}
        >
            {recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00F0FF] text-[#0A121F] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
                    Recommended
                </div>
            )}

            <h3 className="text-xl font-display font-bold text-white mb-2">{title}</h3>
            <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">{price}</span>
                <span className="text-gray-400 text-sm">/month</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <Check className="w-5 h-5 text-[#00F0FF] flex-shrink-0" />
                        {feature}
                    </li>
                ))}
            </ul>

            <Link href="/signup" className="block w-full">
                <button
                    className={`w-full py-3 rounded-lg font-bold transition-all ${recommended
                        ? "bg-[#00F0FF] text-[#0A121F] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                        }`}
                >
                    Get Started
                </button>
            </Link>
        </motion.div>
    );
};

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#0A121F] overflow-x-hidden relative">
            <Navbar />

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.05),transparent_70%)] pointer-events-none"></div>

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">

                {/* Header */}
                <div className="text-center mb-20 space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-display font-bold text-white"
                    >
                        Flexible <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-blue-500">Plans</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        Choose the defense level that suits your digital ecosystem.
                    </motion.p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <PricingCard
                        title="Starter"
                        price="$0"
                        delay={0.3}
                        features={[
                            "Basic Text Analysis",
                            "Community Support",
                            "50 Queries / Day",
                            "Standard API Speed"
                        ]}
                    />
                    <PricingCard
                        title="Pro Defender"
                        price="$29"
                        recommended={true}
                        delay={0.4}
                        features={[
                            "Advanced Deepfake Detection",
                            "Real-Time Link Scanning",
                            "Unlimited Queries",
                            "Priority API Access",
                            "Email Support",
                            "Detailed Privacy Reports"
                        ]}
                    />
                    <PricingCard
                        title="Enterprise"
                        price="Custom"
                        delay={0.5}
                        features={[
                            "Dedicated Infrastructure",
                            "Custom Model Fine-Tuning",
                            "SLA Guarantees",
                            "24/7 Dedicated Support",
                            "On-Premise Deployment",
                            "Audit Logs & Compliance"
                        ]}
                    />
                </div>



            </main>

            <Footer />
        </div>
    );
}
