"use client"

import {
    ShieldAlert,
    Search,
    Link,
    Lock,
    TrendingUp,
    History,
    LayoutDashboard
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Fake News Detection", icon: Search },
    { label: "Deepfake Detection", icon: ShieldAlert },
    { label: "Link Analysis", icon: Link },
    { label: "Privacy Risk Detection", icon: Lock },
    { label: "Trending News", icon: TrendingUp },
    { label: "Analysis History", icon: History },
]

export function DashboardSidebar() {
    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-[260px] border-r border-white/10 bg-slate-900/60 backdrop-blur-xl hidden md:flex flex-col">
            <div className="flex h-20 items-center px-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF]">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-wider text-white">TRUVAIL</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.label}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                            item.active
                                ? "bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)] border border-[#00F0FF]/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5", item.active && "animate-pulse")} />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="rounded-lg bg-slate-950/50 p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-slate-400">System Online</span>
                    </div>
                    <div className="text-xs text-slate-500">v2.4.0-beta</div>
                </div>
            </div>
        </aside>
    )
}
