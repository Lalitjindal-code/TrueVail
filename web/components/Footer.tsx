"use client"

import { ShieldAlert, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

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
                            <li><a href="#" className="hover:text-[#00F0FF] transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-[#00F0FF] transition-colors">API</a></li>
                            <li><a href="#" className="hover:text-[#00F0FF] transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-[#00F0FF] transition-colors">Case Studies</a></li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-[#00F0FF] transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-[#00F0FF] transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-[#00F0FF] transition-colors">Contact</a></li>
                            <li><a href="#" className="hover:text-[#00F0FF] transition-colors">Blog</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Stay Updated</h4>
                        <p className="text-xs text-slate-400">Join our newsletter for the latest security alerts.</p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Enter email..."
                                className="w-full h-12 rounded-lg bg-[#0F1826] border border-slate-800 px-4 pr-24 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                            />
                            <Button
                                size="sm"
                                className="absolute right-1 top-1 h-10 bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black font-semibold"
                            >
                                Subscribe
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>&copy; 2024 TRUVAIL. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
