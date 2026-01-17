"use client"

import { StatsPanel } from "@/components/dashboard/StatsPanel"
import { ToolGrid } from "@/components/dashboard/ToolGrid"
import { ThreatFeed } from "@/components/dashboard/ThreatFeed"
import { HistoryTable } from "@/components/dashboard/HistoryTable"

export default function DashboardPage() {
    return (
        <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Security Dashboard</h1>
                    <p className="text-slate-400">Real-time threat monitoring and analysis overview.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 text-sm font-medium animate-pulse">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
                        </span>
                        Live Monitoring
                    </span>
                </div>
            </div>

            {/* Row A: Stats Panel */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StatsPanel />
            </section>

            {/* Row B: Tool Launch Cards */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <ToolGrid />
            </section>

            {/* Row C: Bottom Split View */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                <ThreatFeed />
                <HistoryTable />
            </section>
        </div>
    )
}
