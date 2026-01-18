"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignupForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { signupWithEmail, loginWithGoogle } = useAuth();
    const router = useRouter();

    const handleSignup = async () => {
        try {
            await signupWithEmail(email, password, name);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col justify-center min-h-screen p-8 lg:p-16 z-10 relative">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="font-display font-bold text-3xl text-brand-cyan mb-2 uppercase tracking-wide">Truvail</h1>
                <h2 className="font-display font-semibold text-4xl text-white mb-8">Create Account</h2>
            </motion.div>

            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

            <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="space-y-4 max-w-md"
                onSubmit={(e) => { e.preventDefault(); handleSignup(); }}
            >
                {/* Name Field */}
                <div className="group">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-sans mb-1 block group-focus-within:text-brand-cyan transition-colors">Full Name</label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-brand-dark/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/50 outline-none transition-all font-sans"
                    />
                </div>

                {/* Email Field */}
                <div className="group">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-sans mb-1 block group-focus-within:text-brand-cyan transition-colors">Email Address</label>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-brand-dark/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/50 outline-none transition-all font-sans"
                    />
                </div>

                {/* Password Field */}
                <div className="group relative">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-sans mb-1 block group-focus-within:text-brand-cyan transition-colors">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
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

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-brand-cyan text-brand-dark font-display font-bold text-lg py-3 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all mt-6 flex justify-center items-center gap-2"
                >
                    Create Account <ArrowRight size={20} />
                </motion.button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-700"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0A121F] px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <motion.button
                    type="button" // Prevent form submission
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                        try {
                            await loginWithGoogle();
                            router.push("/dashboard");
                        } catch (err: any) {
                            setError(err.message);
                        }
                    }}
                    className="w-full bg-white text-black font-sans font-bold text-lg py-3 rounded-lg hover:bg-gray-200 transition-all flex justify-center items-center gap-2"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Continue with Google
                </motion.button>

                <p className="text-center text-gray-500 mt-6 font-sans text-sm">
                    Already have an account? <Link href="/login" className="text-brand-cyan font-bold hover:underline">Login</Link>
                </p>
            </motion.form>
        </div>
    );
}
