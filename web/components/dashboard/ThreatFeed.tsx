import { useState, useEffect } from "react"
import { TriangleAlert, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ThreatItem {
    id: string;
    title: string;
    source: string;
    publishedAt: string;
    riskLevel: string;
}

export function ThreatFeed() {
    const [threats, setThreats] = useState<ThreatItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchThreats = async () => {
            try {
                const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${BASE_URL}/api/news/trending?time=24h&topic=All`);
                if (res.ok) {
                    const data = await res.json();
                    // Take top 4 items
                    setThreats(data.slice(0, 4));
                }
            } catch (error) {
                console.error("Failed to fetch threat feed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchThreats();
    }, []);

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
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-[#FF3366]">
                            <Loader2 className="animate-spin w-6 h-6" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {threats.length > 0 ? threats.map((threat) => (
                                <div key={threat.id} className="flex gap-3 items-start p-3 rounded-lg bg-red-950/10 border border-red-500/10 hover:bg-red-950/20 transition-colors">
                                    <TriangleAlert className="w-4 h-4 text-[#FF3366] mt-1 shrink-0" />
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-slate-200 line-clamp-2">
                                            <span className="text-[#FF3366] mr-2">[{threat.source}]</span>
                                            {threat.title}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(threat.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {threat.riskLevel} Risk
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-slate-500 mt-10">No active threats detected.</p>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
