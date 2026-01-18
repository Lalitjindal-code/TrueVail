"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { Loader2, User, Mail, Shield, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }

        // Auto-generate avatar if missing and save it to profile
        if (user && !user.photoURL) {
            const seed = user.displayName || user.email || "user";
            const randomAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

            updateProfile(user, { photoURL: randomAvatar })
                .then(() => {
                    console.log("Avatar Auto-Generated and Saved");
                    router.refresh(); // Refresh to show new avatar
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

    if (loading || !user) {
        return (
            <div className="h-screen flex items-center justify-center text-[#00F0FF]">
                <Loader2 className="animate-spin w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen space-y-8">
            <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider">User Profile</h1>

            <div className="bg-[#0F1724] border border-gray-800 rounded-xl p-8 relative overflow-hidden shadow-2xl">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <User size={200} className="text-[#00F0FF]" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">

                    {/* Avatar Section */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-full border-4 border-[#00F0FF]/20 overflow-hidden bg-black flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                // Fallback while update is happening or if it fails
                                <img
                                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.displayName || user.email || "user")}`}
                                    alt="Generated Profile"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 space-y-6 w-full">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-1">
                                <label className="text-xs uppercase text-gray-500 font-mono">Display Name</label>
                                <div className="text-xl font-bold text-white flex items-center gap-2">
                                    {user.displayName || "Anonymous User"}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-xs uppercase text-gray-500 font-mono">Email Address</label>
                                <div className="text-lg text-gray-300 flex items-center gap-2 font-mono">
                                    <Mail size={16} className="text-[#00F0FF]" />
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        {/* UID & Status */}
                        <div className="p-4 bg-[#0A121F] rounded-lg border border-gray-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase text-gray-500 font-mono">User ID</label>
                                    <div className="font-mono text-sm text-[#00F0FF] truncate max-w-[200px] md:max-w-md">
                                        {user.uid}
                                    </div>
                                </div>
                                <button
                                    onClick={handleCopyUid}
                                    className="p-2 hover:bg-white/5 rounded-md transition-colors text-gray-400 hover:text-white"
                                    title="Copy UID"
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                                <label className="text-xs uppercase text-gray-500 font-mono">Account Status:</label>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.emailVerified ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}>
                                    {user.emailVerified ? (
                                        <><Shield size={12} /> Verified</>
                                    ) : (
                                        <><Shield size={12} /> Unverified</>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6">
                            <Button
                                onClick={handleLogout}
                                variant="destructive"
                                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50 w-full md:w-auto"
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
