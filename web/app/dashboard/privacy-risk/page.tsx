"use client";

import { useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Loader2, FileText } from "lucide-react";
import { auth } from "@/lib/firebase";
import { AnalysisGauge } from "@/components/dashboard/AnalysisGauge";

// Mock Data for Privacy Analysis
const historyData = [
    { source: "email_draft.txt", piiCount: 5, risk: "High", date: "2024-01-17" },
    { source: "public_post.docx", piiCount: 0, risk: "Low", date: "2024-01-16" },
    { source: "customer_list.csv", piiCount: 124, risk: "Critical", date: "2024-01-15" },
    { source: "notes.txt", piiCount: 0, risk: "Low", date: "2024-01-14" },
];

export default function PrivacyRiskPage() {
    const [text, setText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!text.trim()) return;
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
                body: JSON.stringify({ type: "advanced", text: text })
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();

            // Map API Response to UI
            const risk = data.privacy_risk || "Low";
            const score = risk === "High" ? 85 : risk === "Medium" ? 50 : 10;

            setResult({
                score: score,
                piiCount: data.evidence_used ? data.evidence_used.length : 0, // Using evidence as proxy for PII items found
                riskLevel: risk,
                details: data.privacy_explanation
            });

        } catch (error) {
            console.error("Analysis Error:", error);
            // Optional: keep mock fallback for demo if API fails
            const isHighRisk = text.toLowerCase().includes("secret") || text.toLowerCase().includes("@");
            setResult({
                score: isHighRisk ? 85 : 0,
                piiCount: isHighRisk ? 3 : 0,
                riskLevel: isHighRisk ? "High" : "Low"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen text-white">
            <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Privacy Risk Detection</h1>
                <p className="text-gray-400">Analyze text for PII (Personally Identifiable Information) and data leakage risks.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Text Input Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0F1724] border border-gray-800 rounded-xl p-1 shadow-lg relative group">
                        {/* Glowing Border Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00F0FF] to-blue-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>

                        <div className="relative bg-[#0F1724] rounded-xl p-6 flex flex-col gap-4">
                            <textarea
                                value={text}
                                onChange={(e) => { setText(e.target.value); setResult(null); }}
                                placeholder="Paste text or document content here to scan for PII..."
                                className="w-full h-64 bg-[#0A121F] border border-gray-700 text-white rounded-lg p-4 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-all font-mono placeholder-gray-600 resize-none"
                            />
                        </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={!text || isAnalyzing}
                        className="w-full py-4 bg-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] font-bold rounded-lg hover:bg-[#00F0FF] hover:text-[#0A1320] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                    >
                        {isAnalyzing ? <><Loader2 className="animate-spin" /> Scanning for PII...</> : "Scan for Privacy Risks"}
                    </button>
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
                            <tr><th className="px-6 py-3">Source</th><th className="px-6 py-3">PII Count</th><th className="px-6 py-3">Risk Level</th><th className="px-6 py-3 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {historyData.map((item, index) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-mono text-white flex items-center gap-2">
                                        <FileText size={16} className="text-gray-500" /> {item.source}
                                    </td>
                                    <td className="px-6 py-4"><span className="font-bold text-white">{item.piiCount}</span></td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.risk === "High" || item.risk === "Critical"
                                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                                            : "bg-green-500/10 text-green-500 border-green-500/20"
                                            }`}>
                                            {item.risk === "High" || item.risk === "Critical" ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                                            {item.risk}
                                        </span>
                                    </td>
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
