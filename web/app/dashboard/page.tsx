"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { StatsPanel } from "@/components/dashboard/StatsPanel"
import { ToolGrid } from "@/components/dashboard/ToolGrid"
import { ThreatFeed } from "@/components/dashboard/ThreatFeed"
import { HistoryTable } from "@/components/dashboard/HistoryTable"

export default function DashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[#0A1320] text-white overflow-x-hidden font-sans selection:bg-[#00F0FF]/30 selection:text-[#00F0FF]">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
          fixed inset-y-0 left-0 z-40 w-[260px] transform transition-transform duration-300 md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
                <DashboardSidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-[260px] min-h-screen flex flex-col">
                {/* Mobile Header */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 bg-[#0A1320]/80 border-b border-white/10 px-6 backdrop-blur-md md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="-ml-2 text-slate-400 hover:text-white">
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="font-bold tracking-wider text-xl">TRUVAIL</span>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 p-6 space-y-6 overflow-y-auto">
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
                </main>
            </div>
        </div>
    )
}
