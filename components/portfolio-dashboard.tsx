
"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PortfolioRow } from "@/components/portfolio-row"
import { Button } from "@/components/ui/button"
import { Wand2, Loader2, Briefcase, CloudOff, Cloud } from "lucide-react"
import axios from "axios"
import {
    Table,
    TableBody,
    TableCell,
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


export function PortfolioDashboard() {
    const { data: session } = useSession()
    const { portfolio, investmentStrategy, setPortfolioItemAnalysis, loadFromSheets, sheetsLoaded, spreadsheetId } = useAppStore()
    const [runningAll, setRunningAll] = React.useState(false)
    const [horizon, setHorizon] = React.useState<'short' | 'medium' | 'long'>('medium')


    // Load portfolio from Google Sheets when authenticated
    React.useEffect(() => {
        if (session?.accessToken && (!sheetsLoaded || !spreadsheetId)) {
            loadFromSheets()
        }
    }, [session, sheetsLoaded, spreadsheetId, loadFromSheets])


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

    // Guard: don't show portfolio if not authenticated
    if (!session) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Your Portfolio</h2>
                    </div>
                </div>
                <Card className="border border-dashed border-border/60 bg-card/30">
                    <CardContent className="pt-10 pb-10 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 rounded-full bg-muted">
                                <Briefcase className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Sign in to view your portfolio</h3>
                                <p className="text-muted-foreground mt-1">Sign in with Google to track stocks and get AI-driven insights.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!sheetsLoaded && !portfolio.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading your portfolio from Google Sheets...</p>
                <Button variant="outline" onClick={() => loadFromSheets()}>
                    Retry Connection
                </Button>
            </div>
        )
    }

    if (portfolio.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Your Portfolio</h2>
                    </div>
                </div>

                {spreadsheetId && (
                    <div className="flex items-center gap-2 p-3 bg-green-50/50 border border-green-200 rounded-lg text-sm text-green-700">
                        <Cloud className="h-4 w-4" />
                        <span>Syncing to Google Sheets</span>
                        <a
                            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline hover:text-green-800 ml-1"
                        >
                            Open Spreadsheet
                        </a>
                    </div>
                )}

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
            </div>
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

            <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">Investment Horizon:</span>
                <Select value={horizon} onValueChange={(v: any) => setHorizon(v)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select horizon" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="short">Short Term (1-3mo)</SelectItem>
                        <SelectItem value="medium">Medium Term (6-12mo)</SelectItem>
                        <SelectItem value="long">Long Term (1-5yr)</SelectItem>
                    </SelectContent>
                </Select>
            </div>


            {spreadsheetId && (
                <div className="flex items-center gap-2 p-3 bg-green-50/50 border border-green-200 rounded-lg text-sm text-green-700">
                    <Cloud className="h-4 w-4" />
                    <span>Syncing to Google Sheets</span>
                    <a
                        href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline hover:text-green-800 ml-1"
                    >
                        Open Spreadsheet
                    </a>
                </div>
            )}


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
                                    <TableHead className="font-semibold text-foreground w-[300px]">Pilot Recommendation</TableHead>
                                    <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>

                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {portfolio.map((item) => (
                                    <PortfolioRow key={item.symbol} item={item} horizon={horizon} />
                                ))}

                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
