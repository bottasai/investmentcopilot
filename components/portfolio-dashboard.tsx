
"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useAppStore } from "@/lib/store"
import { PortfolioRow } from "@/components/portfolio-row"
import { PortfolioSummary } from "@/components/portfolio-summary"
import { Button } from "@/components/ui/button"
import { Wand2, Loader2, Briefcase } from "lucide-react"
import axios from "axios"
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"


export function PortfolioDashboard() {
    const { data: session } = useSession()
    const { portfolio, investmentStrategy, setPortfolioItemAnalysis, loadFromSheets, sheetsLoaded, spreadsheetId } = useAppStore()
    const [runningAll, setRunningAll] = React.useState(false)
    const [horizon, setHorizon] = React.useState<'short' | 'medium' | 'long'>('medium')
    const [analysisType, setAnalysisType] = React.useState<'fundamental' | 'technical'>('fundamental')


    // Load portfolio from Google Sheets when authenticated
    React.useEffect(() => {
        if (session?.accessToken && (!sheetsLoaded || !spreadsheetId)) {
            loadFromSheets()
        }
    }, [session, sheetsLoaded, spreadsheetId, loadFromSheets])


    const runAllAnalysis = async () => {
        if (!investmentStrategy) {
            alert("Please configure your Investment Strategy in Settings (⚙️ icon in the header) before running analysis.")
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

    // Guard: not authenticated
    if (!session) {
        return (
            <section className="space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Your Portfolio</h2>
                <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-muted/60">
                            <Briefcase className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium">Sign in to view your portfolio</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                Sign in with Google to track stocks and get AI-driven insights.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    if (!sheetsLoaded && !portfolio.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading your portfolio…</p>
                <Button variant="outline" size="sm" onClick={() => loadFromSheets()}>
                    Retry
                </Button>
            </div>
        )
    }

    if (portfolio.length === 0) {
        return (
            <section className="space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Your Portfolio</h2>
                <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-muted/60">
                            <Briefcase className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium">Your portfolio is empty</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Search for stocks above to add them.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="space-y-8">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Your Portfolio</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        {portfolio.length} stock{portfolio.length > 1 ? 's' : ''} tracked
                    </p>
                </div>
                <Button
                    onClick={runAllAnalysis}
                    disabled={runningAll}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                >
                    {runningAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                    {runningAll ? "Analyzing…" : "Run AI Analysis"}
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={horizon} onValueChange={(v: any) => setHorizon(v)}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Horizon" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="short">Short (1-3 mo)</SelectItem>
                        <SelectItem value="medium">Medium (6-12 mo)</SelectItem>
                        <SelectItem value="long">Long (1-5 yr)</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={analysisType} onValueChange={(v: any) => setAnalysisType(v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fundamental">Fundamentals</SelectItem>
                        <SelectItem value="technical">Technicals</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Card */}
            <PortfolioSummary portfolio={portfolio} horizon={horizon} analysisType={analysisType} />

            {/* Table */}
            <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <TooltipProvider delayDuration={200}>
                        <Table className="dashboard-table">
                            <TableHeader>
                                <TableRow className="border-b border-border/30 hover:bg-transparent">
                                    <TableHead className="w-[140px]">Symbol</TableHead>
                                    <TableHead>Price</TableHead>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TableHead className="cursor-help">5D</TableHead>
                                        </TooltipTrigger>
                                        <TooltipContent>5-day return</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TableHead className="cursor-help">30D</TableHead>
                                        </TooltipTrigger>
                                        <TooltipContent>30-day return</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TableHead className="cursor-help">1Y</TableHead>
                                        </TooltipTrigger>
                                        <TooltipContent>1-year return</TooltipContent>
                                    </Tooltip>
                                    <TableHead className="w-[280px]">
                                        {analysisType === 'fundamental' ? 'Fundamentals' : 'Technicals'}
                                    </TableHead>
                                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {portfolio.map((item) => (
                                    <PortfolioRow key={item.symbol} item={item} horizon={horizon} analysisType={analysisType} />
                                ))}
                            </TableBody>
                        </Table>
                    </TooltipProvider>
                </div>
            </div>
        </section>
    )
}
