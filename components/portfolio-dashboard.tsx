
"use client"

import * as React from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PortfolioRow } from "@/components/portfolio-row"
import { Button } from "@/components/ui/button"
import { Wand2, Loader2, Briefcase } from "lucide-react"
import axios from "axios"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function PortfolioDashboard() {
    const { portfolio, investmentStrategy, setPortfolioItemAnalysis } = useAppStore()
    const [runningAll, setRunningAll] = React.useState(false)

    const runAllAnalysis = async () => {
        if (!investmentStrategy) {
            alert("Please configure Investment Strategy in settings first.")
            return
        }

        setRunningAll(true)
        try {
            const promises = portfolio.map(async (item) => {
                try {
                    const historyRes = await axios.get(`/api/stocks/history?symbol=${item.symbol}&range=1y`)
                    const history = historyRes.data
                    const shortHistory = history.slice(-30)

                    const res = await axios.post("/api/ai/sentiment", {
                        history: shortHistory,
                        strategy: investmentStrategy
                    })

                    const analysis = {
                        ...res.data,
                        timestamp: new Date().toISOString()
                    }
                    setPortfolioItemAnalysis(item.symbol, analysis)

                } catch (e) {
                    console.error(`Analysis failed for ${item.symbol}`, e)
                }
            })

            await Promise.all(promises)
        } catch (e) {
            console.error("Run all failed", e)
        } finally {
            setRunningAll(false)
        }
    }

    if (portfolio.length === 0) {
        return (
            <Card className="border border-dashed border-border/60 bg-card/30">
                <CardContent className="pt-10 pb-10 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-muted">
                            <Briefcase className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Your portfolio is empty</h3>
                            <p className="text-muted-foreground mt-1">Search for stocks above to add them to your portfolio.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Your Portfolio</h2>
                    <p className="text-muted-foreground mt-1">
                        {portfolio.length} stock{portfolio.length > 1 ? 's' : ''} tracked. Click on AI insights to view full text.
                    </p>
                </div>
                <Button
                    onClick={runAllAnalysis}
                    disabled={runningAll}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all"
                >
                    {runningAll ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                    {runningAll ? "Analyzing..." : "Run AI Analysis"}
                </Button>
            </div>

            <Card className="border border-border/40 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/40">
                                    <TableHead className="font-semibold text-foreground">Symbol</TableHead>
                                    <TableHead className="font-semibold text-foreground">Price</TableHead>
                                    <TableHead className="font-semibold text-foreground">5d</TableHead>
                                    <TableHead className="font-semibold text-foreground">30d</TableHead>
                                    <TableHead className="font-semibold text-foreground">1y</TableHead>
                                    <TableHead className="font-semibold text-foreground">Short Term</TableHead>
                                    <TableHead className="font-semibold text-foreground">Medium Term</TableHead>
                                    <TableHead className="font-semibold text-foreground">Long Term</TableHead>
                                    <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {portfolio.map((item) => (
                                    <PortfolioRow key={item.symbol} item={item} />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
