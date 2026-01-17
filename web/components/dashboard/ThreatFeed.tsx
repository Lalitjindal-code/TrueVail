"use client"

import { TriangleAlert } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const THREATS = [
    { id: 1, type: "Headlines", content: "Deepfake video of political figure circulating on social media...", time: "2m ago" },
    { id: 2, type: "Privacy Risk", content: "Data breach detected in associated partner network 'TechCorp'...", time: "15m ago" },
    { id: 3, type: "Malware", content: "New phishing campaign targeting financial sector employees...", time: "42m ago" },
    { id: 4, type: "Headlines", content: "Viral misinformation regarding public health policy debunked...", time: "1h ago" },
    { id: 5, type: "System", content: "Unusual traffic spike detected from region 'East-Asia-04'...", time: "2h ago" },
]

export function ThreatFeed() {
    return (
        <Card className="h-full flex flex-col border-[#FF3366]/20 bg-slate-900/40 backdrop-blur-md">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <TriangleAlert className="w-5 h-5 text-[#FF3366] animate-pulse" />
                    <span className="text-[#FF3366]">Trending Threat Feed</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[300px]">
                <ScrollArea className="h-[300px] w-full p-4">
                    <div className="space-y-3">
                        {THREATS.map((threat) => (
                            <div key={threat.id} className="flex gap-3 items-start p-3 rounded-lg bg-red-950/10 border border-red-500/10 hover:bg-red-950/20 transition-colors">
                                <TriangleAlert className="w-4 h-4 text-[#FF3366] mt-1 shrink-0" />
                                <div className="space-y-1">
                                    <div className="text-sm font-semibold text-slate-200">
                                        <span className="text-[#FF3366] mr-2">[{threat.type}]</span>
                                        {threat.content}
                                    </div>
                                    <div className="text-xs text-slate-500">{threat.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
