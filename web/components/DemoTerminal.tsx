"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal, Link as LinkIcon, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function DemoTerminal() {
    const [activeTab, setActiveTab] = useState("text");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // INP FIX: Use Refs instead of State for inputs (Zero typing lag)
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setResult(null);
        setError(null);
    };

    const handleRunAnalysis = async () => {
        const inputValue = activeTab === "text"
            ? textInputRef.current?.value
            : urlInputRef.current?.value;

        if (!inputValue?.trim()) return;

        setIsAnalyzing(true);
        setResult(null);
        setError(null);

        try {
            // Use Env Var for Backend URL
            const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

            const response = await fetch(`${BASE_URL}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: activeTab, content: inputValue }),
            });

            if (!response.ok) throw new Error("Analysis failed.");
            const data = await response.json();
            setResult(data);

        } catch (err) {
            console.error(err);
            // Fallback for demo
            setTimeout(() => {
                setResult({
                    label: "DEMO MODE: THREAT DETECTED",
                    score: 88,
                    details: [
                        "Simulated analysis result",
                        "Backend connection retry needed",
                    ]
                });
                setIsAnalyzing(false);
            }, 1000);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        // REMOVED: bg-black/20 (Unnecessary transparency)
        <section id="demo" className="py-24 px-6 md:px-12 lg:px-20 relative z-10">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan font-mono text-sm mb-4 border border-brand-cyan/20">
                        <Terminal size={14} />
                        <span>INTERACTIVE DEMO</span>
                    </div>
                    <h2 className="font-display font-bold text-4xl text-white">Experience the Engine</h2>
                </div>

                {/* --- LAG KILLER FIX --- */}
                {/* 1. Removed 'backdrop-blur-md' completely */}
                {/* 2. Changed bg from transparent to SOLID Hex color */}
                <div className="w-full rounded-xl overflow-hidden border border-gray-800 bg-[#0F1724] shadow-2xl">

                    {/* Terminal Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#1A2332] border-b border-gray-800 text-xs font-mono text-gray-400">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div>truvail-cli — v4.1.2 — /demo</div>
                        <div></div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-800 bg-[#0F1724]">
                        {["text", "url"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`px-8 py-3 font-mono text-sm uppercase tracking-wider transition-colors border-r border-gray-800 ${activeTab === tab ? "bg-[#0A121F] text-brand-cyan" : "text-gray-500 hover:text-white"}`}
                            >
                                {tab === "text" && "Paste Text"}
                                {tab === "url" && "Check URL"}
                            </button>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="p-8 min-h-[400px] flex flex-col md:flex-row gap-8 bg-[#0F1724]"> {/* Force Solid BG */}

                        {/* Input Area */}
                        <div className="flex-1 flex flex-col">
                            {activeTab === "text" && (
                                <textarea
                                    ref={textInputRef}
                                    className="w-full flex-1 bg-[#0A121F] border border-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 focus:border-brand-cyan focus:outline-none resize-none placeholder-gray-600"
                                    placeholder="// Paste article text here..."
                                    defaultValue=""
                                />
                            )}

                            {activeTab === "url" && (
                                <div className="flex-1 flex flex-col justify-center bg-[#0A121F] rounded-lg border border-gray-800 p-8">
                                    <div className="text-center text-gray-500 mb-4">
                                        <LinkIcon className="mx-auto mb-2 opacity-50" size={32} />
                                        <p className="text-sm">Enter URL to scan</p>
                                    </div>
                                    <input
                                        ref={urlInputRef}
                                        type="url"
                                        className="w-full bg-[#0F1724] border border-gray-700 rounded p-3 text-gray-300 focus:border-brand-cyan focus:outline-none font-mono text-sm"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            )}

                            <div className="mt-6 flex justify-between items-center">
                                {error && <span className="text-red-500 text-xs font-mono">{error}</span>}
                                <button
                                    onClick={handleRunAnalysis}
                                    disabled={isAnalyzing}
                                    className="ml-auto px-6 py-3 bg-brand-cyan text-brand-dark font-bold font-mono text-sm rounded hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : null}
                                    {isAnalyzing ? "ANALYZING..." : "RUN ANALYSIS_"}
                                </button>
                            </div>
                        </div>

                        {/* Result Output Area */}
                        <div className="w-full md:w-[320px] bg-black rounded-lg border border-gray-800 p-6 font-mono relative overflow-hidden">

                            {!isAnalyzing && !result && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                                    <Terminal size={32} className="opacity-20" />
                                    <p className="text-xs">Waiting for input stream...</p>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="h-full flex flex-col items-start justify-center text-brand-cyan text-xs space-y-2">
                                    <p>{">"} Processing...</p>
                                    <p className="animate-pulse">{">"} Calculating weights...</p>
                                </div>
                            )}

                            {result && (
                                <div className="h-full flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className={`flex items-center gap-2 mb-2 ${result.score > 70 ? "text-red-500" : "text-green-500"}`}>
                                            {result.score > 70 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                            <span className="font-bold text-lg">{result.label || "COMPLETE"}</span>
                                        </div>

                                        <div>
                                            <span className="text-xs text-gray-500 block">CONFIDENCE</span>
                                            <span className="text-4xl font-bold text-white">
                                                {result.score}<span className="text-xl text-gray-600">%</span>
                                            </span>
                                        </div>

                                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${result.score > 70 ? "bg-red-500" : "bg-green-500"}`}
                                                style={{ width: `${result.score}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-800">
                                        <p className="text-xs text-gray-400 mb-2">DETAILS:</p>
                                        <ul className={`text-xs space-y-1 ${result.score > 70 ? "text-red-400" : "text-green-400"}`}>
                                            {result.details?.map((detail: string, i: number) => (
                                                <li key={i}>• {detail}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}