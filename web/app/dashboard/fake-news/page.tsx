"use client"

import { useState } from "react"
import { ShieldAlert, AlertTriangle, CheckCircle, Loader2, ArrowRight, History } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// --- TYPES ---
interface AnalysisResult {
    score: number
    label: string
    reasoning: string
}

interface HistoryItem extends AnalysisResult {
    id: string
    text: string
    date: string
}

export default function FakeNewsPage() {
    const [inputText, setInputText] = useState("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [history, setHistory] = useState<HistoryItem[]>([])

    // --- HANDLERS ---
    const handleAnalyze = async () => {
        if (!inputText.trim()) return

        setIsAnalyzing(true)
        setResult(null)

        try {
            const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const response = await fetch(`${BASE_URL}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "news", text: inputText }),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.message || "Analysis failed")
            }

            const data = await response.json()

            // Map Python Backend Response to UI Format
            let derivedScore = 50;
            // Confidence is 0.0 - 1.0. 
            // If Fake/Misleading, we want High Score (Risk).
            // If Real, we want Low Score (Safe).
            const confidence = data.confidence || 0.5;

            if (data.status === "Fake" || data.status === "Misleading") {
                derivedScore = 50 + (confidence * 50); // 50 to 100
            } else if (data.status === "Real") {
                derivedScore = 50 - (confidence * 40); // 10 to 50
            } else {
                derivedScore = 50; // Unverified
            }

            const newResult: AnalysisResult = {
                score: Math.round(derivedScore),
                label: (data.status || "Unknown").toUpperCase(),
                reasoning: data.reason || "No detailed reasoning provided."
            }

            setResult(newResult)

            // Add to history
            const newHistoryItem: HistoryItem = {
                ...newResult,
                id: Date.now().toString(),
                text: inputText,
                date: new Date().toLocaleTimeString(),
            }
            setHistory(prev => [newHistoryItem, ...prev])

        } catch (error) {
            console.error(error)
            alert("Analysis failed. Please check your connection to the analysis engine.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto min-h-screen">

            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">Fake News Detection</h1>
                <p className="text-slate-400 text-lg">Analyze text or articles for misinformation, bias, and fabrication.</p>
            </div>

            {/* Upper Section: Analysis Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">

                {/* Left: Input Area */}
                <Card className="lg:col-span-2 p-6 flex flex-col gap-4 border-white/10 bg-slate-900/40 backdrop-blur-md">
                    <textarea
                        className="flex-1 w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#00F0FF]/50 transition-colors resize-none font-mono text-sm leading-relaxed"
                        placeholder="Paste article text here or provide a URL for deep analysis..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !inputText}
                            className={cn(
                                "w-full md:w-auto px-8 py-6 text-lg font-bold tracking-wide bg-[#00F0FF] text-[#0A1320] hover:bg-[#00F0FF] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all",
                                isAnalyzing && "opacity-70"
                            )}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    ANALYZING NEURAL PATTERNS...
                                </>
                            ) : (
                                "ANALYZE TEXT"
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Right: Result Gauge */}
                <Card className="p-6 flex flex-col items-center justify-center border-white/10 bg-slate-900/40 backdrop-blur-md relative overflow-hidden">

                    {!result && !isAnalyzing && (
                        <div className="text-center text-slate-500 space-y-4">
                            <ShieldAlert className="w-16 h-16 mx-auto opacity-20" />
                            <p>Ready for Analysis</p>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative w-32 h-32">
                                <div className="absolute inset-0 border-4 border-[#00F0FF]/20 rounded-full animate-ping"></div>
                                <div className="absolute inset-2 border-4 border-t-[#00F0FF] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="text-[#00F0FF] font-mono text-sm animate-pulse">DETECTING ANOMALIES...</p>
                        </div>
                    )}

                    {result && !isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 w-full"
                        >
                            {/* Gauge Graphic */}
                            <div className="relative w-64 h-32 mx-auto overflow-hidden">
                                <div className="absolute top-0 left-0 w-64 h-64 rounded-full border-[16px] border-slate-800 border-b-0"></div>
                                {/* Status Color Ring */}
                                <motion.div
                                    initial={{ rotate: -180 }}
                                    animate={{ rotate: (result.score / 100) * 180 - 180 }}
                                    transition={{ duration: 1.5, type: "spring" }}
                                    className={cn(
                                        "absolute top-0 left-0 w-64 h-64 rounded-full border-[16px] border-b-0 origin-bottom transform",
                                        result.score > 70 ? "border-[#FF3366] shadow-[0_0_20px_rgba(255,51,102,0.3)]" : "border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                                    )}
                                    style={{ borderRightColor: 'transparent', borderLeftColor: 'transparent', borderBottomColor: 'transparent' }}
                                ></motion.div>
                                {/* Score Text */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                                    <span className={cn(
                                        "text-6xl font-bold tracking-tighter",
                                        result.score > 70 ? "text-[#FF3366]" : "text-[#00F0FF]"
                                    )}>
                                        {result.score}%
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className={cn(
                                    "text-2xl font-bold uppercase tracking-widest",
                                    result.score > 70 ? "text-[#FF3366]" : "text-[#00F0FF]"
                                )}>
                                    {result.label}
                                </h3>
                                <p className="text-slate-400 text-sm mt-2 font-mono px-4">
                                    {result.reasoning}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </Card>
            </div>

            {/* Lower Section: History */}
            <Card className="border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <History className="w-5 h-5 text-slate-400" />
                    <h2 className="text-xl font-bold text-white">Recent Analysis Results</h2>
                </div>
                <div className="p-0">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-normal">Text Preview</th>
                                <th className="p-4 font-normal text-center">Truth Score</th>
                                <th className="p-4 font-normal text-center">Status</th>
                                <th className="p-4 font-normal text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        No analysis history yet.
                                    </td>
                                </tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4 max-w-md truncate text-slate-300 font-mono text-xs">
                                            {item.text}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "font-bold",
                                                item.score > 70 ? "text-[#FF3366]" : "text-[#00F0FF]"
                                            )}>
                                                {item.score}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border",
                                                item.score > 70
                                                    ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20"
                                                    : "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20"
                                            )}>
                                                {item.label}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                                                View Report <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
