"use client";

import { useState, useEffect } from "react";
import { Filter, Calendar, FileText, Video, Link2, ShieldAlert, AlertTriangle, CheckCircle, Eye, Loader2, Download } from "lucide-react";
import { auth } from "@/lib/firebase";

// Type Definition
interface HistoryItem {
    id: string;
    date: string; // ISO String
    type: "Deepfake" | "Phishing Link" | "Fake News" | "Privacy Scan";
    source: string; // Filename or URL
    score: number;
    status: "Malicious" | "Safe" | "Misleading" | "Unknown";
}

export default function AnalysisHistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                // 1. Try fetching from Backend API (Render)
                const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

                const token = await auth.currentUser?.getIdToken();
                const headers: any = {};
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch(`${BASE_URL}/api/history`, { headers });

                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                } else {
                    throw new Error("API Failed");
                }
            } catch (error) {
                console.warn("Backend unavailable, checking LocalStorage/Mock...");

                // 2. Fallback: Check Browser LocalStorage (If you implemented client-side saving)
                const localData = localStorage.getItem("truvail_analysis_history");
                if (localData) {
                    setHistory(JSON.parse(localData));
                } else {
                    // 3. Last Resort: Mock Data for UI demonstration
                    setHistory([
                        { id: "1", date: "2024-01-25T14:30:00", type: "Fake News", source: "article_draft_v2.txt", score: 88, status: "Malicious" },
                        { id: "2", date: "2024-01-24T09:15:00", type: "Deepfake", source: "video_clip_01.mp4", score: 15, status: "Safe" },
                        { id: "3", date: "2024-01-23T18:45:00", type: "Phishing Link", source: "http://suspicious-link.com", score: 92, status: "Malicious" },
                        { id: "4", date: "2024-01-22T12:00:00", type: "Privacy Scan", source: "emails_export.csv", score: 45, status: "Misleading" },
                    ]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // Filter Logic
    const filteredHistory = history.filter(item => {
        const matchesType = filterType === "All" || item.type === filterType;
        const matchesStatus = filterStatus === "All" || item.status === filterStatus;
        return matchesType && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Malicious": return "text-red-500 bg-red-500/10 border-red-500/20";
            case "Safe": return "text-green-500 bg-green-500/10 border-green-500/20";
            case "Misleading": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
            default: return "text-gray-500 bg-gray-500/10 border-gray-500/20";
        }
    };

    const getIcon = (type: string) => {
        if (type.includes("Video") || type.includes("Deepfake")) return <Video size={16} />;
        if (type.includes("Link")) return <Link2 size={16} />;
        return <FileText size={16} />;
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen text-white">
            {/* Header & Filters */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Analysis History</h1>
                    <p className="text-gray-400">Review past scans and detailed reports across all detection modules.</p>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap gap-4 bg-[#0F1724] p-4 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mr-2">
                        <Filter size={16} /> Filters:
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-[#0A121F] border border-gray-700 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]"
                    >
                        <option value="All">All Types</option>
                        <option value="Deepfake">Deepfake</option>
                        <option value="Fake News">Fake News</option>
                        <option value="Phishing Link">Phishing Link</option>
                        <option value="Privacy Scan">Privacy Risk</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#0A121F] border border-gray-700 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Malicious">Malicious</option>
                        <option value="Safe">Safe</option>
                        <option value="Misleading">Misleading</option>
                    </select>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-[#0F1724] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-[#0A121F] text-xs uppercase font-mono border-b border-gray-800">
                            <tr>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Analysis Type</th>
                                <th className="px-6 py-4">Source/File</th>
                                <th className="px-6 py-4">Risk Score</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12 text-[#00F0FF]"><Loader2 className="animate-spin inline mr-2" /> Loading History...</td></tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-500">No history found.</td></tr>
                            ) : (
                                filteredHistory.map((item, index) => (
                                    <tr key={index} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-mono whitespace-nowrap">
                                            {new Date(item.date).toLocaleDateString()} <span className="text-gray-600">|</span> {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{item.type}</td>
                                        <td className="px-6 py-4 flex items-center gap-2 text-gray-300">
                                            <span className="text-[#00F0FF] opacity-70">{getIcon(item.type)}</span>
                                            <span className="truncate max-w-[200px]">{item.source}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${item.score > 70 ? "text-red-400" : "text-green-400"}`}>{item.score}</span>
                                            <span className="text-xs text-gray-600 ml-1">/ 100</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                                {item.status === "Malicious" && <AlertTriangle size={12} />}
                                                {item.status === "Safe" && <CheckCircle size={12} />}
                                                {item.status === "Misleading" && <ShieldAlert size={12} />}
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] rounded-lg transition-colors" title="View Report">
                                                    <Eye size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] rounded-lg transition-colors" title="Download Log">
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
