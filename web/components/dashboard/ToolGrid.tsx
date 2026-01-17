"use client"

import { FileText, ScanFace, Link, ShieldAlert, ArrowRight } from "lucide-react"
import { Card, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const TOOLS = [
    {
        title: "Text Integrity Scanner",
        icon: FileText,
        action: "Launch",
        desc: "Analyze articles for bias and AI usage."
    },
    {
        title: "Deepfake Visual Forensics",
        icon: ScanFace,
        action: "Launch",
        desc: "Detect manipulated faces in videos/images."
    },
    {
        title: "Malicious Link Scanner",
        icon: Link,
        action: "Check",
        desc: "scan URLs for phishing and malware."
    },
    {
        title: "Privacy Risk Detector",
        icon: ShieldAlert,
        action: "Check",
        desc: "Identify sensitive data exposure risks."
    },
]

export function ToolGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOOLS.map((tool) => (
                <Card
                    key={tool.title}
                    className="group relative overflow-hidden transition-all duration-300 hover:border-[#00F0FF]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] flex flex-col"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F0FF]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="p-6 flex flex-col items-center text-center flex-1">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                            <tool.icon className="w-8 h-8 text-[#00F0FF]/80 group-hover:text-[#00F0FF] group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] transition-all" />
                        </div>

                        <CardTitle className="mb-2 group-hover:text-[#00F0FF] transition-colors">{tool.title}</CardTitle>
                        <p className="text-xs text-slate-400 mb-6 line-clamp-2">{tool.desc}</p>

                        <div className="mt-auto w-full">
                            <Button className="w-full bg-slate-800 hover:bg-[#00F0FF] hover:text-[#0A1320] text-white border border-white/10 hover:border-[#00F0FF] transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                                {tool.action}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
