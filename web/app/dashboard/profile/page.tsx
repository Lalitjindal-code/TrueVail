"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { Loader2, User, Mail, Shield, LogOut, Copy, Check, Edit2, Save, X, Cpu, Activity, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (user) {
            setNewName(user.displayName || "");
        }

        // Auto-generate avatar if missing
        if (user && !user.photoURL) {
            const seed = user.displayName || user.email || "user";
            const randomAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

            updateProfile(user, { photoURL: randomAvatar })
                .then(() => {
                    console.log("Avatar Auto-Generated and Saved");
                    router.refresh();
                })
                .catch(err => console.error("Error saving avatar:", err));
        }
    }, [user, loading, router]);

    const handleCopyUid = () => {
        if (user?.uid) {
            navigator.clipboard.writeText(user.uid);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleSaveName = async () => {
        if (!user || !newName.trim()) return;
        setIsSaving(true);
        try {
            await updateProfile(user, { displayName: newName });
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="h-screen flex items-center justify-center text-[#00F0FF]">
                <Loader2 className="animate-spin w-10 h-10" />
            </div>
        );
    }

    // Gamification Logic (Mock)
    const clearanceLevel = 2; // Hardcoded lvl 2 for now, could be based on account age
    const specializations = ["OSINT Analysis", "Neural Networks", "Source Tracking"];

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <Shield className="text-[#00F0FF]" />
                    AGENT IDENTITY CARD
                </h1>
                <div className="px-3 py-1 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono animate-pulse">
                    SECURE CONNECTION ESTABLISHED
                </div>
            </div>

            {/* Main Holographic Card */}
            <div className="relative bg-[#0F1724]/80 backdrop-blur-md border border-[#00F0FF]/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)] group">

                {/* Holographic scanning effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00F0FF]/5 to-transparent bg-[length:100%_200%] animate-[scan_4s_linear_infinite] pointer-events-none"></div>

                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#00F0FF] rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#00F0FF] rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#00F0FF] rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#00F0FF] rounded-br-xl"></div>

                <div className="relative z-10 p-8 flex flex-col lg:flex-row gap-10">

                    {/* Left Column: Avatar & Level */}
                    <div className="flex flex-col items-center gap-6 lg:border-r border-[#00F0FF]/20 lg:pr-10">
                        <div className="relative group/avatar">
                            {/* Rotating Ring */}
                            <div className="absolute -inset-2 rounded-full border border-dashed border-[#00F0FF]/50 animate-[spin_10s_linear_infinite]"></div>

                            <div className="w-40 h-40 rounded-full border-4 border-[#00F0FF] overflow-hidden bg-black shadow-[0_0_30px_rgba(0,240,255,0.3)] relative">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#00F0FF]/10 text-[#00F0FF]">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-0 right-0 bg-[#00F0FF] text-black text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-black">
                                VERIFIED
                            </div>
                        </div>

                        {/* Clearance Badge */}
                        <div className="w-full bg-[#0A121F] border border-[#00F0FF]/30 p-4 rounded-lg text-center space-y-2">
                            <div className="text-[10px] text-[#00F0FF] uppercase tracking-widest mb-1">Security Clearance</div>
                            <div className="text-2xl font-bold text-white font-display flex items-center justify-center gap-2">
                                <Lock size={18} className="text-[#FFD700]" /> LEVEL {clearanceLevel}
                            </div>
                            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#00F0FF] h-full w-[65%]" title="Progress to next level"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Stats */}
                    <div className="flex-1 space-y-8">

                        {/* Header Info */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#00F0FF]/20 pb-6">
                            <div className="space-y-1">
                                <label className="text-xs uppercase text-gray-500 font-mono flex items-center gap-2">
                                    Agent Callsign
                                    {!isEditing && (
                                        <button onClick={() => setIsEditing(true)} className="text-[#00F0FF] hover:text-white transition-colors">
                                            <Edit2 size={12} />
                                        </button>
                                    )}
                                </label>

                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={newName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                                            className="bg-[#0A121F] border-[#00F0FF]/50 text-white h-9 font-mono"
                                        />
                                        <Button size="sm" onClick={handleSaveName} disabled={isSaving} className="bg-[#00F0FF] hover:bg-[#00C0CC] text-black h-9 w-9 p-0">
                                            {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-9 w-9 p-0 text-red-400 hover:text-red-300">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-4xl font-display font-bold text-white tracking-wide">
                                        {user.displayName || "UNKNOWN AGENT"}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end">
                                <div className="text-xs uppercase text-gray-500 font-mono">Operations Status</div>
                                <div className="text-[#00F0FF] font-bold flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    ACTIVE DUTY
                                </div>
                            </div>
                        </div>

                        {/* Grid Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs uppercase text-gray-500 font-mono flex items-center gap-2"> <Mail size={12} /> Communication Link</label>
                                <div className="text-lg text-white font-mono bg-[#0A121F]/50 px-3 py-2 rounded border border-white/5 truncate">
                                    {user.email}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase text-gray-500 font-mono flex items-center gap-2"> <Cpu size={12} /> Unit Identification</label>
                                <div className="flex items-center gap-2 bg-[#0A121F]/50 px-3 py-2 rounded border border-white/5">
                                    <div className="text-sm font-mono text-[#00F0FF] truncate flex-1">
                                        {user.uid}
                                    </div>
                                    <button onClick={handleCopyUid} className="text-gray-400 hover:text-white transition-colors">
                                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Specializations & Activity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

                            {/* Specializations Box */}
                            <div className="bg-[#0A121F]/50 p-4 rounded-lg border border-white/5 space-y-3">
                                <h3 className="text-xs uppercase text-gray-400 font-bold flex items-center gap-2">
                                    <AwardCheck size={14} /> Certified Specializations
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {specializations.map((spec, i) => (
                                        <span key={i} className="px-2 py-1 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded text-[10px] text-[#00F0FF] uppercase font-bold tracking-wider">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Activity Heatmap Mock */}
                            <div className="bg-[#0A121F]/50 p-4 rounded-lg border border-white/5 space-y-3">
                                <h3 className="text-xs uppercase text-gray-400 font-bold flex items-center gap-2">
                                    <Activity size={14} /> Ops Frequency
                                </h3>
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: 28 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-full pt-[100%] rounded-sm relative overflow-hidden"
                                            style={{
                                                backgroundColor: Math.random() > 0.6 ? `rgba(0, 240, 255, ${Math.random() * 0.8 + 0.2})` : 'rgba(255,255,255,0.05)'
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Logout */}
                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleLogout}
                                variant="destructive"
                                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50 hover:text-red-400 group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2"><LogOut size={16} /> DECOMMISSION SESSION</span>
                                <div className="absolute inset-0 bg-red-500/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon wrapper to avoid repetitive imports
function AwardCheck({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
            <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
        </svg>
    )
}

