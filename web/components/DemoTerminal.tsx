"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Link as LinkIcon, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function DemoTerminal() {
    const [activeTab, setActiveTab] = useState("text");
    const [inputValue, setInputValue] = useState(""); // Store text or URL
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null); // Store API response
    const [error, setError] = useState<string | null>(null);

    // Handle Tab Switching
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setInputValue(""); // Clear input when switching
        setResult(null);
        setError(null);
    };

    // --- BACKEND CONNECTION LOGIC ---
    const handleRunAnalysis = async () => {
        if (!inputValue.trim()) return;

        setIsAnalyzing(true);
        setResult(null);
        setError(null);

        try {
            // Replace with your actual Backend API URL
            const API_URL = "http://localhost:8000/api/analyze";

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: activeTab, // 'text' or 'url'
                    content: inputValue
                }),
            });

            if (!response.ok) {
                throw new Error("Analysis failed. Server error.");
            }

            const data = await response.json();
            setResult(data);

        } catch (err) {
            console.error(err);
            // Fallback for demo purposes if no backend is running yet
            // Remove this block once your backend is live
            setError("Could not connect to server. Please ensure backend is running.");

            // SIMULATED RESPONSE (DELETE THIS IN PRODUCTION)
            /*
            setTimeout(() => {
                setResult({
                    label: "MISINFORMATION",
                    score: 88,
                    details: [
                        "High emotional manipulation detected",
                        "Sensationalist rhetoric used",
                        "Domain trust score: Low"
                    ]
                });
                setError(null);
                setIsAnalyzing(false);
            }, 2000);
            return; 
            */

        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <section id="demo" className="py-24 px-6 md:px-12 lg:px-20 bg-black/20">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan font-mono text-sm mb-4">
                        <Terminal size={14} />
                        <span>INTERACTIVE DEMO</span>
                    </div>
                    <h2 className="font-display font-bold text-4xl text-white">Experience the Engine</h2>
                </div>

                {/* TERMINAL CONTAINER */}
                <div className="w-full rounded-xl overflow-hidden border border-gray-800 bg-[#0F1724] shadow-2xl">

                    {/* Terminal Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#1A2332] border-b border-gray-800 text-xs font-mono text-gray-400">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div>truvail-cli — v4.1.2 — /demo</div>
                        <div></div>
                    </div>

                    {/* Tabs (Removed Image Tab) */}
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
                    <div className="p-8 min-h-[400px] flex flex-col md:flex-row gap-8">

                        {/* Input Area */}
                        <div className="flex-1 flex flex-col">
                            {activeTab === "text" && (
                                <textarea
                                    className="w-full flex-1 bg-[#0A121F] border border-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 focus:border-brand-cyan focus:outline-none resize-none placeholder-gray-700"
                                    placeholder="// Paste suspicious article text here for analysis..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                            )}

                            {/* Updated URL Input Field */}
                            {activeTab === "url" && (
                                <div className="flex-1 flex flex-col justify-center bg-[#0A121F] rounded-lg border border-gray-800 p-8">
                                    <div className="text-center text-gray-500 mb-4">
                                        <LinkIcon className="mx-auto mb-2 opacity-50" size={32} />
                                        <p className="text-sm">Enter URL to scan domain reputation</p>
                                    </div>
                                    <input
                                        type="url"
                                        className="w-full bg-[#0F1724] border border-gray-700 rounded p-3 text-gray-300 focus:border-brand-cyan focus:outline-none font-mono text-sm"
                                        placeholder="https://example.com/suspicious-news"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="mt-6 flex justify-between items-center">
                                {error && <span className="text-red-500 text-xs font-mono">{error}</span>}
                                <button
                                    onClick={handleRunAnalysis}
                                    disabled={isAnalyzing || !inputValue}
                                    className="ml-auto px-6 py-3 bg-brand-cyan text-brand-dark font-bold font-mono text-sm rounded hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : null}
                                    {isAnalyzing ? "ANALYZING..." : "RUN ANALYSIS_"}
                                </button>
                            </div>
                        </div>

                        {/* Result Output Area */}
                        <div className="w-full md:w-[320px] bg-black/40 rounded-lg border border-gray-800 p-6 font-mono relative overflow-hidden">

                            {/* State 1: Idle */}
                            {!isAnalyzing && !result && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                                    <Terminal size={32} className="opacity-20" />
                                    <p className="text-xs">Waiting for input stream...</p>
                                </div>
                            )}

                            {/* State 2: Loading Animation */}
                            {isAnalyzing && (
                                <div className="h-full flex flex-col items-start justify-center text-brand-cyan text-xs space-y-2">
                                    <p>{">"} Establishing connection...</p>
                                    <p>{">"} Sending payload to API...</p>
                                    <p className="animate-pulse">{">"} Processing neural weights...</p>
                                </div>
                            )}

                            {/* State 3: Result Display */}
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        {/* Dynamic Label */}
                                        <div className={`flex items-center gap-2 mb-2 ${result.score > 70 ? "text-red-500" : "text-green-500"}`}>
                                            {result.score > 70 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                            <span className="font-bold text-lg">{result.label || "ANALYSIS COMPLETE"}</span>
                                        </div>

                                        {/* Dynamic Score */}
                                        <div>
                                            <span className="text-xs text-gray-500 block">CONFIDENCE SCORE</span>
                                            <span className="text-5xl font-bold text-white">
                                                {result.score}<span className="text-2xl text-gray-600">%</span>
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${result.score}%` }}
                                                    transition={{ duration: 1, delay: 0.2 }}
                                                    className={`h-full ${result.score > 70 ? "bg-red-500" : "bg-green-500"}`}
                                                ></motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Details List */}
                                    <div className="pt-4 border-t border-gray-800">
                                        <p className="text-xs text-gray-400 mb-2">DETAILS:</p>
                                        <ul className={`text-xs space-y-1 ${result.score > 70 ? "text-red-400" : "text-green-400"}`}>
                                            {result.details && result.details.map((detail: string, i: number) => (
                                                <li key={i}>• {detail}</li>
                                            ))}
                                            {!result.details && <li>• Analysis completed successfully.</li>}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}