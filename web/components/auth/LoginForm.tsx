"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Chrome } from "lucide-react"; // Chrome as Google placeholder
import { motion } from "framer-motion";

import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const { loginWithGoogle, loginWithEmail, user } = useAuth(); // destructure user if needed to redirect

    const handleGuestLogin = () => {
        router.push("/dashboard");
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle(true);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Google Login Failed: " + err.message);
        }
    };

    const handleEmailLogin = async () => {
        try {
            await loginWithEmail(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Login Failed: " + err.message);
        }
    };

    return (
        <div className="flex flex-col justify-center min-h-screen p-8 lg:p-16 z-10 relative">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="font-display font-bold text-3xl text-brand-cyan mb-2 tracking-wide uppercase">
                    Truvail
                </h1>
                <h2 className="font-display font-semibold text-4xl text-white mb-4">
                    Login
                </h2>
                <p className="font-sans text-gray-400 text-lg mb-8">
                    Access real-time detection tools.
                </p>
            </motion.div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {/* Form */}
            <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="space-y-4 max-w-md"
                onSubmit={(e) => { e.preventDefault(); handleEmailLogin(); }}
            >
                {/* Inputs */}
                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-brand-dark/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/50 outline-none transition-all font-sans"
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-brand-dark/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/50 outline-none transition-all pr-12 font-sans"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-cyan"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="pt-2 flex flex-col gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-brand-cyan text-brand-dark font-display font-bold text-lg py-3 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-2"
                    >
                        Login <ArrowRight size={20} />
                    </motion.button>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-gray-900 font-sans font-medium text-lg py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Login with Google
                    </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex flex-col items-center gap-4 mt-6 pt-4 border-t border-gray-800">
                    <p className="text-gray-500 text-sm font-sans">
                        New here? <Link href="/signup" className="text-brand-cyan hover:underline">Create New Account</Link>
                    </p>
                </div>
            </motion.form>
        </div>
    );
}
