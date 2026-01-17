"use client"

import { Eye } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const HISTORY = [
    { id: "1", date: "Jan 17, 10:42 AM", type: "Deepfake Video", result: "Malicious", status: "blocked" },
    { id: "2", date: "Jan 17, 09:15 AM", type: "Phishing Link", result: "Safe", status: "safe" },
    { id: "3", date: "Jan 16, 04:30 PM", type: "News Article", result: "Misleading", status: "warning" },
    { id: "4", date: "Jan 16, 02:12 PM", type: "Email Scan", result: "Safe", status: "safe" },
    { id: "5", date: "Jan 16, 11:50 AM", type: "Deepfake Audio", result: "Malicious", status: "blocked" },
]

export function HistoryTable() {
    return (
        <Card className="h-full border-white/10">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle>Recent Analysis History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-slate-400">Date</TableHead>
                            <TableHead className="text-slate-400">Type</TableHead>
                            <TableHead className="text-slate-400">Result</TableHead>
                            <TableHead className="text-right text-slate-400">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {HISTORY.map((item) => (
                            <TableRow key={item.id} className="border-white/5">
                                <TableCell className="font-mono text-xs text-slate-300">{item.date}</TableCell>
                                <TableCell className="text-slate-300">{item.type}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        item.status === 'blocked' ? 'destructive' :
                                            item.status === 'safe' ? 'safe' : 'secondary'
                                    }>
                                        {item.result}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" className="h-8 border-white/10 hover:border-[#00F0FF] hover:text-[#00F0FF]">
                                        <Eye className="w-3 h-3 mr-1" />
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
