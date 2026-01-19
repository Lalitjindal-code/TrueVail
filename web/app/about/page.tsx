"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Award, User, Crown, Linkedin, Github, Cpu, Code, Globe, Shield, Zap, Database, Terminal, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";

const techStack = [
    { name: "Next.js 15", icon: Globe, color: "text-white" },
    { name: "React 19", icon: Code, color: "text-[#00F0FF]" },
    { name: "Tailwind CSS", icon: Zap, color: "text-cyan-400" },
    { name: "Framer Motion", icon: Award, color: "text-purple-400" },
    { name: "Python", icon: Terminal, color: "text-yellow-400" },
    { name: "Gemini AI", icon: Cpu, color: "text-blue-400" },
    { name: "Firebase", icon: Database, color: "text-orange-400" },
];

const team = [
    {
        name: "Pratiksha Ahire",
        role: "TEAM LEAD",
        code: "TL-01",
        stats: { commits: "500+", coffee: "∞", status: "ONLINE" },
        isLeader: true,
        github: "https://github.com/ahirepia",
        linkedin: "https://www.linkedin.com/in/pratiksha-ahire-95869937b"
    },
    {
        name: "Lalit Jindal",
        role: "FULL STACK DEV",
        code: "FS-02",
        stats: { commits: "850+", coffee: "High", status: "CODING" },
        isLeader: false,
        github: "https://github.com/Lalitjindal-code",
        linkedin: "https://www.linkedin.com/in/lalitjindal519"
    },
    {
        name: "Vaibhav Gurjar",
        role: "AI/ML ENGINEER",
        code: "ML-03",
        stats: { commits: "400+", coffee: "Low", status: "TRAINING" },
        isLeader: false,
        github: "https://github.com/vaibhav1874",
        linkedin: "https://www.linkedin.com/in/vaibhavgurjar"
    },
    {
        name: "Soumya Pare",
        role: "BACKEND DEV",
        code: "BE-04",
        stats: { commits: "600+", coffee: "Med", status: "DEPLOYING" },
        isLeader: false,
        github: "https://github.com/soumyapare",
        linkedin: "https://www.linkedin.com/in/soumya-pare-6a9179383"
    },
];

const timeline = [
    { year: "2023", title: "Project Inception", desc: "The idea of Truvail was born to combat misinformation." },
    { year: "2024", title: "VibeHack 2.0 Win", desc: "Secured 3rd Rank in National Level Hackathon." },
    { year: "2025", title: "Beta Launch", desc: "Public beta release with advanced Deepfake Detection." },
    { year: "2026", title: "Global Scale", desc: "Expanding to real-time global threat monitoring." },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#050a14] overflow-x-hidden relative text-white font-sans selection:bg-[#00F0FF]/30">
            <Navbar />

            {/* Cyber Grid Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F0FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF05_1px,transparent_1px)] bg-[size:50px_50px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#050a14] via-transparent to-[#050a14]"></div>
            </div>

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10 space-y-32">

                {/* Hero Section */}
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/5 text-[#00F0FF] text-xs font-mono tracking-[0.2em] uppercase"
                    >
                        <Shield size={12} /> Mission Status: Active
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter"
                    >
                        DECODING <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#00F0FF] animate-gradient-x">
                            REALITY
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed"
                    >
                        We are <strong className="text-white">Team SyncSquad.</strong> Architects of truth in a post-reality world.
                        Building the ultimate defense against digital deception.
                    </motion.p>
                </div>

                {/* TECH ARSENAL */}
                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00F0FF]/30"></div>
                        <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                            <Cpu className="text-[#00F0FF]" /> TECH ARSENAL
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00F0FF]/30"></div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        {techStack.map((tech, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative bg-[#0A121F] border border-white/10 hover:border-[#00F0FF]/50 rounded-xl p-4 flex items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                            >
                                <tech.icon className={`w-6 h-6 ${tech.color}`} />
                                <span className="font-mono text-sm font-bold text-gray-300 group-hover:text-white">{tech.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* HALL OF FAME (Restored) */}
                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00F0FF]/30"></div>
                        <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                            <Trophy className="text-[#00F0FF]" /> HALL OF FAME
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00F0FF]/30"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "VibeHack 2.0", rank: "3rd Rank", desc: "National Level Hackathon", icon: Trophy },
                            { title: "MANIT Version Beta", rank: "Top 1.2%", desc: "15 Finalists out of 1200+ Teams", icon: Target },
                            { title: "SIH Internal", rank: "Selected", desc: "Campus Finalists", icon: Award },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative p-8 rounded-2xl bg-[#111927] border border-white/10 hover:border-[#00F0FF]/50 transition-colors overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <item.icon size={100} />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center text-[#00F0FF] mb-6 group-hover:scale-110 transition-transform">
                                        <item.icon size={24} />
                                    </div>
                                    <h3 className="text-4xl font-bold text-white mb-2">{item.rank}</h3>
                                    <div className="text-lg font-bold text-[#00F0FF] mb-1">{item.title}</div>
                                    <p className="text-gray-400 text-sm">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* AGENT DOSSIERS */}
                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00F0FF]/30"></div>
                        <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                            <User className="text-[#00F0FF]" /> SQUAD OPERATIVES
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00F0FF]/30"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {team.map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className={`relative group overflow-hidden bg-[#0A121F] border rounded-xl transition-all duration-300 ${member.isLeader
                                    ? "border-yellow-500/30 hover:border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                                    : "border-[#00F0FF]/20 hover:border-[#00F0FF]/80 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                                    }`}
                            >
                                {/* Top Bar */}
                                <div className={`h-1 w-full ${member.isLeader ? "bg-yellow-500" : "bg-[#00F0FF]"}`}></div>

                                <div className="p-6 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="outline" className={`font-mono text-[10px] ${member.isLeader ? "border-yellow-500 text-yellow-500" : "border-[#00F0FF] text-[#00F0FF]"}`}>
                                            {member.code}
                                        </Badge>
                                        {member.isLeader && <Crown size={16} className="text-yellow-500 animate-pulse" />}
                                    </div>

                                    <div className="mb-6 text-center">
                                        <div className={`w-20 h-20 mx-auto rounded-full mb-3 flex items-center justify-center border-2 ${member.isLeader ? "border-yellow-500 bg-yellow-500/10 text-yellow-500" : "border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF]"}`}>
                                            <User size={32} />
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-1 uppercase tracking-wide">{member.name}</h3>
                                        <p className="text-xs font-mono text-gray-500">{member.role}</p>
                                    </div>

                                    {/* Stats (Removed Commits as requested) */}
                                    <div className="space-y-2 border-t border-white/5 pt-4 text-center">
                                        <div className="inline-flex items-center gap-2 text-xs font-mono text-gray-400">
                                            <span>STATUS:</span>
                                            <span className={member.isLeader ? "text-yellow-400" : "text-[#00F0FF]"}>{member.stats.status}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-3 mt-6">
                                        {member.github && (
                                            <a href={member.github} target="_blank" className="text-gray-500 hover:text-white transition-colors"><Github size={18} /></a>
                                        )}
                                        {member.linkedin && (
                                            <a href={member.linkedin} target="_blank" className="text-gray-500 hover:text-white transition-colors"><Linkedin size={18} /></a>
                                        )}
                                    </div>
                                </div>

                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent)]"></div>
                            </motion.div>
                        ))}
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}

