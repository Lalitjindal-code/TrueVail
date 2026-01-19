"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle, TrendingUp, Filter, Loader2, ExternalLink } from "lucide-react";
import { auth } from "@/lib/firebase";

// Types for API Data
interface NewsItem {
    id: string;
    title: string;
    source: string;
    publishedAt: string;
    riskScore: number; // 0-100
    riskLevel: "High" | "Medium" | "Low";
    trendData: number[]; // Array of numbers for the sparkline graph
    url: string;
}

export default function TrendingNewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTime, setFilterTime] = useState("24h");
    const [filterTopic, setFilterTopic] = useState("All");


    useEffect(() => {
        const fetchNews = async () => {
            const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            try {
                setLoading(true);
                // Use Env Var for Backend URL

                // --- DEBUGGING: LOG REQUEST URL ---
                const requestUrl = `${BASE_URL}/api/news/trending?time=${filterTime}&topic=${filterTopic}`;
                console.log("🔍 [Frontend] Fetching Trending News:", requestUrl);

                // Task 2: No Auth Required (Public Endpoint)
                const res = await fetch(requestUrl);

                // --- DEBUGGING: LOG RESPONSE STATUS ---
                console.log("🔍 [Frontend] Response Status:", res.status);

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("❌ [Frontend] Fetch Failed:", errorText);
                    throw new Error(`Failed to fetch news: ${res.status} ${res.statusText}`);
                }

                const data = await res.json();
                console.log("✅ [Frontend] Data Received:", data);

                setNews(data);
            } catch (error) {
                console.error("API Error, using fallback data:", error);
                // FALLBACK MOCK DATA (So UI works even if API is down/configuring)
                setNews([
                    { id: "1", title: "Global News Network: AI-led deepfakes confusing voters in upcoming election", source: "Global News Net", publishedAt: "2 hours ago", riskScore: 85, riskLevel: "High", trendData: [20, 45, 30, 60, 85, 90, 100], url: "#" },
                    { id: "2", title: "TechCorp releases new privacy-focused integrity protocols", source: "TechDaily", publishedAt: "4 hours ago", riskScore: 12, riskLevel: "Low", trendData: [10, 15, 12, 20, 18, 25, 22], url: "#" },
                    { id: "3", title: "Viral misinformation regarding public health policy debunked", source: "FactCheck.org", publishedAt: "5 hours ago", riskScore: 78, riskLevel: "High", trendData: [50, 55, 70, 65, 80, 75, 85], url: "#" },
                    { id: "4", title: "Market Analysis: Crypto scams rise by 200% in Q3", source: "Finance Insider", publishedAt: "6 hours ago", riskScore: 65, riskLevel: "Medium", trendData: [30, 40, 35, 50, 45, 60, 65], url: "#" },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [filterTime, filterTopic]);

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen text-white">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Trending News Analysis</h1>
                    <p className="text-gray-400">Real-time monitoring of top news stories for potential misinformation.</p>
                </div>

                <div className="flex gap-4">
                    {/* Time Filter */}
                    <div className="relative">
                        <select
                            value={filterTime}
                            onChange={(e) => setFilterTime(e.target.value)}
                            className="appearance-none bg-[#0F1724] border border-gray-700 text-white pl-4 pr-10 py-2 rounded-lg focus:outline-none focus:border-[#00F0FF] hover:border-[#00F0FF]/50 transition-colors text-sm"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                        <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Topic Filter */}
                    <div className="relative">
                        <select
                            value={filterTopic}
                            onChange={(e) => setFilterTopic(e.target.value)}
                            className="appearance-none bg-[#0F1724] border border-gray-700 text-white pl-4 pr-10 py-2 rounded-lg focus:outline-none focus:border-[#00F0FF] hover:border-[#00F0FF]/50 transition-colors text-sm"
                        >
                            <option value="All">All Categories</option>
                            <option value="Politics">Politics</option>
                            <option value="Finance">Finance</option>
                            <option value="Tech">Technology</option>
                        </select>
                        <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="h-64 flex items-center justify-center text-[#00F0FF]">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item) => (
                        <div key={item.id} className="bg-[#0F1724] border border-gray-800 rounded-xl p-6 relative group hover:border-gray-600 transition-colors flex flex-col justify-between">

                            {/* Glowing Hover Effect */}
                            <div className="absolute inset-0 bg-[#00F0FF]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />

                            <div>
                                <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 leading-tight">{item.title}</h3>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                                    <span className="font-mono text-[#00F0FF]">{item.source}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Clock size={12} /> {item.publishedAt}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Risk Indicator */}
                                <div className={`flex items-center gap-2 text-sm font-bold ${item.riskLevel === "High" ? "text-red-500" : item.riskLevel === "Medium" ? "text-orange-500" : "text-green-500"}`}>
                                    {item.riskLevel === "High" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                    Risk Score: {item.riskScore} - {item.riskLevel}
                                </div>

                                {/* Trend Velocity Chart (SVG Sparkline) */}
                                <div className="w-full h-16 bg-[#0A121F] rounded-lg relative overflow-hidden p-2">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider absolute top-1 left-2">Trend Velocity</p>
                                    <Sparkline data={item.trendData} color={item.riskLevel === "High" ? "#ef4444" : "#22c55e"} />
                                </div>
                            </div>

                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="absolute top-4 right-4 text-gray-600 hover:text-[#00F0FF] transition-colors">
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Simple SVG Sparkline Component for the "Velocity" look
function Sparkline({ data, color }: { data: number[], color: string }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100; // SVG viewBox width
    const height = 40; // SVG viewBox height

    // Create Points
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible preserve-3d">
            {/* Fill Area */}
            <path d={`M 0,${height} ${points} L ${width},${height} Z`} fill={color} fillOpacity="0.1" />
            {/* Stroke Line */}
            <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}
