
"use client"

import * as React from "react"
import { PortfolioItem, useAppStore } from "@/lib/store"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, Wand2, MessageSquareText } from "lucide-react"
import axios from "axios"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface PortfolioRowProps {
    item: PortfolioItem
    horizon: 'short' | 'medium' | 'long'
}


export function PortfolioRow({ item, horizon }: PortfolioRowProps) {
    const { removeFromPortfolio, investmentStrategy, setPortfolioItemAnalysis } = useAppStore()
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
            alert("Please set your Investment Strategy in settings.")
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

        const closest = history.reduce((prev, curr) => {
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

    const SentimentBadge = ({ text, label }: { text?: string, label: string }) => {
        if (!text) return <span className="text-muted-foreground">--</span>
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-xs text-primary underline">
                        Read full analysis
                    </Button>

                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" side="top">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-primary">{label} Outlook</h4>
                        <p className="text-sm text-foreground leading-relaxed">{text}</p>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    if (loading) {
        return (
            <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">{item.symbol}</TableCell>
                <TableCell colSpan={8} className="text-center">
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
                        <span className="text-[10px] text-muted-foreground">
                            {new Date(item.lastAnalysis.timestamp).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell className="font-medium">
                {quote ? `${quote.currency} ${quote.price.toFixed(2)}` : "--"}
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
                    <div className="flex flex-col gap-1">
                        <div className="line-clamp-3 text-sm text-muted-foreground">
                            {item.lastAnalysis?.horizon?.[horizon] || "--"}
                        </div>
                        {item.lastAnalysis?.horizon?.[horizon] && (
                            <SentimentBadge text={item.lastAnalysis?.horizon?.[horizon]} label={`${horizon.charAt(0).toUpperCase() + horizon.slice(1)} Term`} />
                        )}
                    </div>
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
