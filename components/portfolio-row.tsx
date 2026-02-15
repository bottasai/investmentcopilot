
"use client"

import * as React from "react"
import { PortfolioItem, useAppStore } from "@/lib/store"
import { formatPrice } from "@/lib/currency"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, Wand2, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from "lucide-react"
import axios from "axios"

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
    const [expanded, setExpanded] = React.useState(false)

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

    const getReturn = (days: number) => {
        if (!history.length || !quote) return null
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - days)

        const closest = history.reduce((prev: any, curr: any) => {
            return (Math.abs(new Date(curr.date).getTime() - targetDate.getTime()) < Math.abs(new Date(prev.date).getTime() - targetDate.getTime()) ? curr : prev);
        });

        const startPrice = closest.price
        const currentPrice = quote.price
        return ((currentPrice - startPrice) / startPrice) * 100
    }

    const ReturnCell = ({ days, bold }: { days: number; bold?: boolean }) => {
        const ret = getReturn(days)
        if (ret === null) return <span className="text-muted-foreground">--</span>

        const formatted = `${ret > 0 ? '+' : ''}${ret.toFixed(1)}%`
        return (
            <span className={`${bold ? 'font-semibold text-sm' : 'text-xs'} ${ret >= 0 ? 'perf-positive' : 'perf-negative'}`}>
                {formatted}
            </span>
        )
    }

    // Analysis indicators
    const indicators = item.lastAnalysis?.[analysisType]?.[horizon]

    const AnalysisPreview = () => {
        if (analyzing) {
            return (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs">Analyzing…</span>
                </div>
            )
        }

        if (!indicators) return <span className="text-xs text-muted-foreground">—</span>

        return (
            <div className="space-y-1">
                {indicators.good.slice(0, 1).map((point, i) => (
                    <div key={`g-${i}`} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 perf-positive" />
                        <span className="text-foreground/70 line-clamp-1">{point}</span>
                    </div>
                ))}
                {indicators.bad.slice(0, 1).map((point, i) => (
                    <div key={`b-${i}`} className="flex items-start gap-1.5 text-xs">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 perf-negative" />
                        <span className="text-foreground/70 line-clamp-1">{point}</span>
                    </div>
                ))}
                {(indicators.good.length + indicators.bad.length > 2) && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                        className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-0.5 mt-0.5 transition-colors"
                    >
                        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {expanded ? 'Collapse' : 'View details'}
                    </button>
                )}
            </div>
        )
    }

    // Expanded detail panel
    const ExpandedPanel = () => {
        if (!expanded || !indicators) return null

        const horizonLabel = horizon === 'short' ? 'Short Term' : horizon === 'medium' ? 'Medium Term' : 'Long Term'

        return (
            <TableRow className="bg-muted/10 hover:bg-muted/10">
                <TableCell colSpan={7} className="py-4 px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                        <div className="space-y-2">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                Strengths — {horizonLabel}
                            </p>
                            <ul className="space-y-1.5">
                                {indicators.good.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 perf-positive" />
                                        <span className="text-foreground/80">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                Risks — {horizonLabel}
                            </p>
                            <ul className="space-y-1.5">
                                {indicators.bad.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 perf-negative" />
                                        <span className="text-foreground/80">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        )
    }

    if (loading) {
        return (
            <TableRow>
                <TableCell className="font-medium text-sm">{item.symbol}</TableCell>
                <TableCell colSpan={6} className="text-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs">Loading…</span>
                    </div>
                </TableCell>
            </TableRow>
        )
    }

    return (
        <>
            <TableRow className="group">
                {/* Symbol — strongest weight */}
                <TableCell>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">{item.symbol}</span>
                        {item.lastAnalysis && (
                            <div className="flex items-center gap-1.5">
                                <span className={`pill-badge text-[10px] py-0 px-1.5 ${item.lastAnalysis.rating >= 4 ? 'pill-bullish' :
                                        item.lastAnalysis.rating >= 3 ? 'pill-neutral' :
                                            'pill-bearish'
                                    }`}>
                                    {item.lastAnalysis.rating}/5
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(item.lastAnalysis.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </TableCell>

                {/* Price — bold */}
                <TableCell className="text-sm font-semibold">
                    {quote ? formatPrice(quote.price, quote.currency, market) : "--"}
                </TableCell>

                {/* 5d — secondary, lighter */}
                <TableCell><ReturnCell days={5} /></TableCell>

                {/* 30d — secondary */}
                <TableCell><ReturnCell days={30} /></TableCell>

                {/* 1y — primary, bold */}
                <TableCell><ReturnCell days={365} bold /></TableCell>

                {/* Analysis preview */}
                <TableCell className="max-w-[280px]">
                    <AnalysisPreview />
                </TableCell>

                {/* Actions — ghost circle buttons */}
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={analyzeSentiment}
                            disabled={analyzing}
                            title="Run Analysis"
                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                        >
                            <Wand2 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromPortfolio(item.symbol)}
                            title="Remove"
                            className="h-8 w-8 rounded-full hover:bg-destructive/10"
                        >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            {/* Expandable detail panel */}
            <ExpandedPanel />
        </>
    )
}
