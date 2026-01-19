"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Award, User, Crown, Linkedin, Github, Cpu } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const achievements = [
    { title: "VibeHack 2.0", rank: "3rd Rank", desc: "National Level Hackathon", icon: Trophy },
    { title: "MANIT Version Beta", rank: "Top 1.2%", desc: "15 Finalists out of 1200+ Teams", icon: Target },
    { title: "SIH Internal", rank: "Selected", desc: "Campus Finalists", icon: Award },
];

const team = [
    {
        name: "Pratiksha Ahire",
        role: "Team Lead",
        isLeader: true,
        github: "https://github.com/ahirepia",
        linkedin: "https://www.linkedin.com/in/pratiksha-ahire-95869937b"
    },
    {
        name: "Lalit Jindal",
        role: "Full Stack Developer",
        isLeader: false,
        github: "https://github.com/Lalitjindal-code",
        linkedin: "https://www.linkedin.com/in/lalitjindal519"
    },
    {
        name: "Vaibhav Gurjar",
        role: "AI/ML Engineer",
        isLeader: false,
        github: "https://github.com/vaibhav1874",
        linkedin: "https://www.linkedin.com/in/vaibhavgurjar"
    },
    {
        name: "Soumya Pare",
        role: "Backend Developer",
        isLeader: false,
        github: "https://github.com/soumyapare",
        linkedin: "https://www.linkedin.com/in/soumya-pare-6a9179383"
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0A121F] overflow-x-hidden relative text-white">
            <Navbar />

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.05),transparent_70%)] pointer-events-none"></div>

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">

                {/* Hero Section */}
                <div className="text-center mb-24 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-block px-4 py-1.5 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/5 text-[#00F0FF] text-xs font-mono tracking-widest uppercase mb-4"
                    >
                        Meet The Minds
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight"
                    >
                        TEAM <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-blue-500">SYNCSQUAD</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        Architecting the future of truth verification with advanced AI.
                    </motion.p>
                </div>

                {/* HALL OF FAME */}
                <section className="mb-32">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-display font-bold text-white mb-12 flex items-center gap-4"
                    >
                        <Trophy className="text-[#00F0FF]" /> HALL OF FAME
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {achievements.map((item, index) => (
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

                {/* TEAM GRID */}
                <section>
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-display font-bold text-white mb-12 flex items-center gap-4"
                    >
                        <Cpu className="text-[#00F0FF]" /> CORE TEAM
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {team.map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10 }}
                                className={`relative group p-1 rounded-2xl ${member.isLeader
                                    ? "bg-gradient-to-b from-yellow-400 to-yellow-600/20 shadow-[0_0_30px_rgba(250,204,21,0.2)]"
                                    : "bg-gradient-to-b from-[#00F0FF]/50 to-blue-600/20 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                                    }`}
                            >
                                <div className="h-full bg-[#0F1724] rounded-xl p-6 relative overflow-hidden">
                                    {/* Leader Badge */}
                                    {member.isLeader && (
                                        <div className="absolute top-4 right-4 text-yellow-400 animate-pulse">
                                            <Crown size={24} fill="currentColor" />
                                        </div>
                                    )}

                                    {/* Avatar Placeholder */}
                                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-2 ${member.isLeader ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF]"
                                        }`}>
                                        <User size={40} />
                                    </div>

                                    <div className="text-center">
                                        <h3 className={`text-xl font-bold mb-1 ${member.isLeader ? "text-yellow-400" : "text-white"}`}>
                                            {member.name}
                                        </h3>
                                        <p className="text-sm text-gray-400 font-mono mb-6">{member.role}</p>

                                        {/* Socials */}
                                        <div className="flex justify-center gap-4">
                                            {member.github && (
                                                <a
                                                    href={member.github}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#00F0FF] transition-colors"
                                                >
                                                    <Github size={16} />
                                                </a>
                                            )}
                                            {member.linkedin && (
                                                <a
                                                    href={member.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#00F0FF] transition-colors"
                                                >
                                                    <Linkedin size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
