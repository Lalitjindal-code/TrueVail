"use client";

import { motion } from "framer-motion";
import { FileText, Link2, ScanFace } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors"
        >
            {/* Scan Line Effect */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-cyan shadow-[0_0_15px_#00F0FF] opacity-0 group-hover:opacity-100 group-hover:animate-scan-down"></div>

            <div className="mb-6 w-12 h-12 rounded-lg bg-brand-cyan/20 flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform">
                <Icon size={24} />
            </div>

            <h3 className="font-display font-bold text-2xl text-white mb-3">{title}</h3>
            <p className="font-sans text-gray-400 leading-relaxed">{desc}</p>
        </motion.div>
    );
};

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 px-6 md:px-12 lg:px-20 relative bg-[#0A121F]">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
            >
                <h2 className="font-display font-bold text-4xl lg:text-5xl text-white mb-4">TRI-FOLD DEFENSE</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Comprehensive detection covering every angle of digital misinformation.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <FeatureCard
                    icon={FileText}
                    title="Linguistic Pattern Analysis"
                    desc="Detects emotional manipulation, bias, and inconsistencies in text using advanced NLP models."
                    delay={0.1}
                />
                <FeatureCard
                    icon={Link2}
                    title="Malicious Domain Detection"
                    desc="Instantly cross-references URLs against global blacklists and real-time threat intelligence."
                    delay={0.2}
                />
                <FeatureCard
                    icon={ScanFace}
                    title="GAN & Deepfake Recognition"
                    desc="Identifies pixel-level artifacts and frequency anomalies in AI-generated imagery."
                    delay={0.3}
                />
            </div>

        </section>
    );
}
