"use client"

import { ShieldAlert, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/10 bg-[#0A1320] text-slate-300">
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF]">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold tracking-wider text-white">TRUVAIL</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Truth-seeking for the digital age. Advanced AI protection against deepfakes and misinformation.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#features" className="hover:text-[#00F0FF] transition-colors">Features</Link></li>
                            <li><Link href="https://ai.google.dev/gemini-api/docs/quickstart" target="_blank" className="hover:text-[#00F0FF] transition-colors">API</Link></li>
                            <li><Link href="/pricing" className="hover:text-[#00F0FF] transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/about" className="hover:text-[#00F0FF] transition-colors">About Us</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><span className="text-gray-500">© 2026 Truvail Inc.</span></li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 container mx-auto px-6">
                <p>&copy; 2026 TRUVAIL. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
