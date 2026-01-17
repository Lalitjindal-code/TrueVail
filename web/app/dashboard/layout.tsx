"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-[260px] min-h-screen flex flex-col">
                {/* Mobile Header */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 bg-[#0A1320]/80 border-b border-white/10 px-6 backdrop-blur-md md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="-ml-2 text-slate-400 hover:text-white">
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="font-bold tracking-wider text-xl">TRUVAIL</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
