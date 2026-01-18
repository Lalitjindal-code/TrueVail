"use client";

import { useState } from "react";
import { Link2, AlertTriangle, CheckCircle, Loader2, Search } from "lucide-react";
import { auth } from "@/lib/firebase";
import { AnalysisGauge } from "@/components/dashboard/AnalysisGauge";

// Mock Data for Link Analysis
const historyData = [
    { url: "http://malicious-site.net/login", score: 95, status: "Malicious", date: "2024-01-17" },
    { url: "http://secure-bank.com", score: 10, status: "Safe", date: "2024-01-16" },
    { url: "https://phishing-attempt.xyz/verify", score: 88, status: "Malicious", date: "2024-01-15" },
    { url: "https://google.com", score: 5, status: "Safe", date: "2024-01-14" },
];

export default function LinkAnalysisPage() {
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!url.trim()) return;
        setIsAnalyzing(true);
        setResult(null);

        try {
            const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

            const token = await auth.currentUser?.getIdToken();
            const headers: any = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`${BASE_URL}/analyze`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ type: "link", text: url }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();

            // Map Response
            // Backend returns status: "Safe" | "Suspicious" | "Phishing"
            let score = 10;
            if (data.status === "Phishing" || data.status === "Malicious") score = 95;
            else if (data.status === "Suspicious" || data.status === "Unverified") score = 60;
            else score = 10; // Safe

            setResult({
                score: score,
                label: (data.status || "UNKNOWN").toUpperCase(),
                reasoning: data.reason
            });

        } catch (error) {
            console.error("Link Analysis Error:", error);
            // Fallback for demo if offline
            setResult({
                score: url.includes("malicious") ? 95 : 10,
                label: url.includes("malicious") ? "CRITICAL RISK" : "SAFE",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen text-white">
            <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Link Analysis</h1>
                <p className="text-gray-400">Analyze URLs for malicious content, phishing attempts, and redirect chains.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Input Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0F1724] border border-gray-800 rounded-xl p-8 space-y-6 shadow-lg">

                        {/* Input Field */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 ml-1">Target URL</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Link2 className="text-gray-500 group-focus-within:text-brand-cyan transition-colors" size={20} />
                                </div>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => { setUrl(e.target.value); setResult(null); }}
                                    placeholder="Enter URL to analyze (e.g., http://example.com)..."
                                    className="w-full bg-[#0A121F] border border-gray-700 text-white rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-all font-mono placeholder-gray-600 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                                />
                            </div>
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={!url || isAnalyzing}
                            className="w-full py-4 bg-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] font-bold rounded-lg hover:bg-[#00F0FF] hover:text-[#0A1320] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                        >
                            {isAnalyzing ? <><Loader2 className="animate-spin" /> Scanning URL...</> : "Analyze Link"}
                        </button>
                    </div>
                </div>

                {/* Right Column: Gauge */}
                <div className="lg:col-span-1">
                    <div className="h-full min-h-[300px] bg-[#0F1724] border border-gray-800 rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-50"><div className="w-20 h-20 bg-[#00F0FF]/20 blur-[50px] rounded-full"></div></div>
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider absolute top-6 left-6">Detection Level</h3>
                        <div className="scale-110 mt-8"><AnalysisGauge score={result ? result.score : 0} /></div>

                        {!result && !isAnalyzing && (
                            <p className="absolute bottom-6 text-xs text-[#00F0FF]/50 font-mono animate-pulse">READY FOR SCAN</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: Analysis Results */}
            <div className="bg-[#0F1724] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-gray-800 bg-[#131b2c]"><h3 className="font-bold text-white">Recent Analysis Results</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-[#0A121F] text-xs uppercase font-mono">
                            <tr><th className="px-6 py-3">URL</th><th className="px-6 py-3">Threat Score</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {historyData.map((item, index) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-mono text-white truncate max-w-xs">{item.url}</td>
                                    <td className="px-6 py-4"><span className="font-bold text-white">{item.score}</span></td>
                                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === "Malicious" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}`}>{item.status === "Malicious" ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}{item.status}</span></td>
                                    <td className="px-6 py-4 text-right"><button className="text-gray-400 hover:text-[#00F0FF] text-xs border border-gray-700 hover:border-[#00F0FF] px-3 py-1 rounded transition-colors">View Report</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
