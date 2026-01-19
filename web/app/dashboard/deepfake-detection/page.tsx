"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, FileImage, AlertTriangle, CheckCircle, Loader2, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { ThreatGauge } from "@/components/dashboard/ThreatGauge";
import { ScanningFrame } from "@/components/ui/ScanningFrame";

const historyData = [
    { name: "video_clip_01.mp4", score: 92, status: "Malicious", date: "2024-01-15" },
    { name: "video_clip_02.mp4", score: 91, status: "Malicious", date: "2024-01-14" },
    { name: "profile_pic.jpg", score: 15, status: "Safe", date: "2024-01-13" },
    { name: "interview_clip.mp4", score: 12, status: "Safe", date: "2024-01-12" },
];

export default function DeepfakePage() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        setResult(null);

        try {
            // 1. Convert File to Base64
            const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });

            const base64String = await toBase64(file);
            const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

            const token = await auth.currentUser?.getIdToken();
            const headers: any = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            // 2. Send to Backend
            const response = await fetch(`${BASE_URL}/analyze`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    type: "deepfake",
                    image_data: base64String,
                    mime_type: file.type
                })
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();

            // 3. Map Response to UI
            // Backend returns: { status, confidence, privacy_risk, ... }
            // We map this to our Gauge Score (0-100)
            let score = 10; // Default Safe
            if (data.status === "Manipulated" || data.status === "Suspicious") {
                score = data.confidence === "HIGH" ? 95 : data.confidence === "MEDIUM" ? 75 : 55;
            } else if (data.status === "Authentic") {
                score = 10;
            }

            setResult({
                score: score,
                label: data.status.toUpperCase(),
                type: file.type.includes("video") ? "Video Analysis" : "Image Analysis",
                details: data.analysis_details // Optional: pass details if needed
            });

            // Sync to Global History
            const globalItem = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                type: "Deepfake",
                source: file.name,
                score: score,
                status: score > 70 ? "Malicious" : score > 30 ? "Misleading" : "Safe"
            };
            import("@/lib/history").then(({ saveToHistory }) => saveToHistory(globalItem as any));

        } catch (error) {
            console.error("Analysis Error:", error);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen text-white">
            <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Deepfake Detection</h1>
                <p className="text-gray-400">Analyze images or videos for AI manipulation and synthetic content.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
              relative h-64 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group overflow-hidden
              ${isDragging
                                ? "border-[#00F0FF] bg-[#00F0FF]/10"
                                : "border-gray-700 bg-[#0F1724] hover:border-[#00F0FF]/50 hover:bg-[#131b2c]"
                            }
              ${file ? "border-solid border-[#00F0FF]/50" : ""}
            `}
                    >
                        <div className="absolute inset-0 bg-[#00F0FF]/5 blur-3xl opacity-20 pointer-events-none" />
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />

                        {!file ? (
                            <>
                                <div className="w-16 h-16 rounded-2xl bg-[#0A121F] border border-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                                    <Upload className="text-[#00F0FF]" size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium text-white">Drag and drop image or video file here</p>
                                    <p className="text-sm text-gray-500 mt-1">or <span className="text-[#00F0FF] underline">browse</span> to upload</p>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full relative">
                                {file.type.includes("image") ? (
                                    <ScanningFrame
                                        imageUrl={URL.createObjectURL(file)}
                                        isScanning={isAnalyzing}
                                        className="w-full h-full"
                                    />
                                ) : (
                                    // Fallback for video (ScanningFrame image logic won't work perfectly for video files yet, keeping icon for video or basic video preview)
                                    <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300 z-10 relative">
                                        <FileVideo size={48} className="text-[#00F0FF] mb-4" />
                                        <p className="text-xl font-mono text-white">{file.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                )}

                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                                    className="absolute top-2 right-2 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold hover:bg-red-500/20 flex items-center gap-1 z-50 border border-red-500/20"
                                >
                                    <X size={12} /> Remove
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!file || isAnalyzing}
                        className="w-full py-4 bg-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] font-bold rounded-lg hover:bg-[#00F0FF] hover:text-[#0A1320] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,240,255,0.1)] flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? <><Loader2 className="animate-spin" /> Analyzing Media...</> : "Analyze Media"}
                    </button>
                </div>

                <div className="lg:col-span-1">
                    <div className="h-full min-h-[300px] bg-[#0F1724] border border-gray-800 rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-50"><div className="w-20 h-20 bg-[#00F0FF]/20 blur-[50px] rounded-full"></div></div>
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider absolute top-6 left-6">Detection Level</h3>
                        <div className="scale-110 mt-8"><ThreatGauge score={result ? result.score : 0} /></div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0F1724] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-gray-800 bg-[#131b2c]"><h3 className="font-bold text-white">Recent Analysis Results</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-[#0A121F] text-xs uppercase font-mono">
                            <tr><th className="px-6 py-3">File Name</th><th className="px-6 py-3">Manipulation Score</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {historyData.map((item, index) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-mono text-white">{item.name}</td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="font-bold text-white">{item.score}</span><div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className={`h-full ${item.score > 50 ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${item.score}%` }} /></div></div></td>
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
