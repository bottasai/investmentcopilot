
"use client"

import * as React from "react"
import { PortfolioItem, useAppStore } from "@/lib/store"
import { formatPrice } from "@/lib/currency"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, Wand2 } from "lucide-react"
import axios from "axios"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface PortfolioRowProps {
    item: PortfolioItem
    horizon: 'short' | 'medium' | 'long'
    analysisType: 'fundamental' | 'technical'
}


export function PortfolioRow({ item, horizon, analysisType }: PortfolioRowProps) {
    const { removeFromPortfolio, investmentStrategy, setPortfolioItemAnalysis, market } = useAppStore()
    const [quote, setQuote] = React.useState<any>(null)
    const [history, setHistory] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [analyzing, setAnalyzing] = React.useState(false)

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [quoteRes, historyRes] = await Promise.all([
                    axios.get(`/api/stocks/quote?symbol=${item.symbol}`),
                    axios.get(`/api/stocks/history?symbol=${item.symbol}&range=1y`)
                ])
                setQuote(quoteRes.data)
                setHistory(historyRes.data)
            } catch (e) {
                console.error(`Failed to load data for ${item.symbol}`, e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [item.symbol])

    const analyzeSentiment = async () => {
        if (!investmentStrategy) {
            alert("Please set your Investment Strategy in Settings (⚙️ icon in the header).")
            return
        }

        setAnalyzing(true)
        try {
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
            console.error("Sentiment analysis failed", e)
            alert("Analysis failed. Check console.")
        } finally {
            setAnalyzing(false)
        }
    }

    const getReturnForPeriod = (days: number) => {
        if (!history.length || !quote) return "--"
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - days)

        const closest = history.reduce((prev: any, curr: any) => {
            return (Math.abs(new Date(curr.date).getTime() - targetDate.getTime()) < Math.abs(new Date(prev.date).getTime() - targetDate.getTime()) ? curr : prev);
        });

        const startPrice = closest.price
        const currentPrice = quote.price
        const ret = ((currentPrice - startPrice) / startPrice) * 100
        const formatted = `${ret > 0 ? '+' : ''}${ret.toFixed(2)}%`

        return (
            <div className={`font-medium ${ret >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatted}
            </div>
        )
    }

    // Get the indicators for the current horizon and analysis type
    const indicators = item.lastAnalysis?.[analysisType]?.[horizon]

    const IndicatorDisplay = () => {
        if (!indicators) return <span className="text-muted-foreground text-sm">--</span>

        const maxPreview = analysisType === 'fundamental' ? 2 : 2

        return (
            <div className="flex flex-col gap-1.5">
                {/* Preview: show first few good + bad */}
                <div className="space-y-0.5">
                    {indicators.good.slice(0, maxPreview).map((point, i) => (
                        <div key={`g-${i}`} className="flex items-start gap-1.5 text-xs">
                            <span className="text-emerald-400 mt-0.5 shrink-0">●</span>
                            <span className="text-muted-foreground line-clamp-1">{point}</span>
                        </div>
                    ))}
                    {indicators.bad.slice(0, maxPreview).map((point, i) => (
                        <div key={`b-${i}`} className="flex items-start gap-1.5 text-xs">
                            <span className="text-rose-400 mt-0.5 shrink-0">●</span>
                            <span className="text-muted-foreground line-clamp-1">{point}</span>
                        </div>
                    ))}
                </div>

                {/* Read More popover with full list */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-xs text-primary underline justify-start">
                            View all {analysisType === 'fundamental' ? 'fundamentals' : 'technicals'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" side="top">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-primary">
                                {analysisType === 'fundamental' ? 'Fundamental' : 'Technical'} Analysis — {horizon === 'short' ? 'Short' : horizon === 'medium' ? 'Medium' : 'Long'} Term
                            </h4>
                            {indicators.good.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-emerald-400 mb-1">Strengths</p>
                                    <ul className="space-y-1">
                                        {indicators.good.map((point, i) => (
                                            <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                                                <span className="text-emerald-400 mt-0.5">●</span>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {indicators.bad.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-rose-400 mb-1">Weaknesses</p>
                                    <ul className="space-y-1">
                                        {indicators.bad.map((point, i) => (
                                            <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                                                <span className="text-rose-400 mt-0.5">●</span>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        )
    }

    if (loading) {
        return (
            <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">{item.symbol}</TableCell>
                <TableCell colSpan={6} className="text-center">
                    <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    <span className="ml-2">Loading...</span>
                </TableCell>
            </TableRow>
        )
    }

    return (
        <TableRow className="hover:bg-muted/50 transition-colors">
            <TableCell className="font-semibold">
                <div className="flex flex-col">
                    <span className="text-primary">{item.symbol}</span>
                    {item.lastAnalysis && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(item.lastAnalysis.timestamp).toLocaleDateString()}
                            </span>
                            <span className={`text-[10px] font-medium px-1 rounded ${item.lastAnalysis.rating >= 4 ? 'bg-emerald-500/10 text-emerald-400' :
                                item.lastAnalysis.rating >= 3 ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-rose-500/10 text-rose-400'
                                }`}>
                                {item.lastAnalysis.rating}/5
                            </span>
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell className="font-medium">
                {quote ? formatPrice(quote.price, quote.currency, market) : "--"}
            </TableCell>
            <TableCell>{getReturnForPeriod(5)}</TableCell>
            <TableCell>{getReturnForPeriod(30)}</TableCell>
            <TableCell>{getReturnForPeriod(365)}</TableCell>

            <TableCell className="max-w-[300px]">
                {analyzing ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Analyzing...</span>
                    </div>
                ) : (
                    <IndicatorDisplay />
                )}
            </TableCell>

            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={analyzeSentiment} disabled={analyzing} title="Run Analysis" className="hover:bg-blue-500/20">
                        <Wand2 className="h-4 w-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeFromPortfolio(item.symbol)} title="Remove" className="hover:bg-destructive/20">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}
