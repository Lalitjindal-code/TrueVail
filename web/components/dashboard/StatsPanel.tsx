"use client"

import { BarChart, Search, ShieldOff } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ThreatGauge } from "./ThreatGauge"

const STATS = [
    { label: "Quick Stats", value: "1,422", icon: BarChart, color: "text-[#00F0FF]" },
    { label: "Scans Today", value: "1,420", icon: Search, color: "text-white" },
    { label: "Threats Blocked", value: "89", icon: ShieldOff, color: "text-[#FF3366]" },
]

export function StatsPanel() {
    return (
        <Card className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 items-center">
            {/* Gauge Section */}
            <div className="lg:col-span-1 h-full min-h-[180px] flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6">
                <ThreatGauge />
            </div>

            {/* Stats Section */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
                {STATS.map((stat, index) => (
                    <div key={stat.label} className="relative flex flex-col items-center justify-center p-4">
                        {/* Divider for elements except the last one, visible on md+ screens */}
                        {index < STATS.length - 1 && (
                            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-1/2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                        )}

                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/50 mb-3 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div className={`text-3xl font-bold tracking-tight ${stat.color} drop-shadow-md`}>
                            {stat.value}
                        </div>
                        <div className="text-sm text-slate-400 mt-1 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
