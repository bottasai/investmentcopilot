
"use client"

import * as React from "react"
import { PortfolioItem } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"

interface PortfolioSummaryProps {
    portfolio: PortfolioItem[]
    horizon: 'short' | 'medium' | 'long'
    analysisType: 'fundamental' | 'technical'
}

export function PortfolioSummary({ portfolio, horizon, analysisType }: PortfolioSummaryProps) {
    const analyzed = portfolio.filter(item => item.lastAnalysis)

    if (analyzed.length === 0) return null

    const bullish = analyzed.filter(item => (item.lastAnalysis?.rating ?? 0) >= 4)
    const bearish = analyzed.filter(item => (item.lastAnalysis?.rating ?? 0) <= 2)
    const neutral = analyzed.filter(item => {
        const r = item.lastAnalysis?.rating ?? 0
        return r === 3
    })

    const avgRating = analyzed.reduce((sum, item) => sum + (item.lastAnalysis?.rating ?? 0), 0) / analyzed.length

    const horizonLabel = { short: 'Short Term', medium: 'Medium Term', long: 'Long Term' }[horizon]

    let sentimentLabel: string
    let sentimentColor: string
    let SentimentIcon: typeof TrendingUp

    if (avgRating >= 4) {
        sentimentLabel = 'Bullish'
        sentimentColor = 'text-emerald-400'
        SentimentIcon = TrendingUp
    } else if (avgRating >= 3) {
        sentimentLabel = 'Moderately Positive'
        sentimentColor = 'text-blue-400'
        SentimentIcon = TrendingUp
    } else if (avgRating >= 2) {
        sentimentLabel = 'Neutral'
        sentimentColor = 'text-yellow-400'
        SentimentIcon = Minus
    } else {
        sentimentLabel = 'Bearish'
        sentimentColor = 'text-rose-400'
        SentimentIcon = TrendingDown
    }

    // Collect top good/bad points across portfolio for the selected horizon and type
    const allGood: string[] = []
    const allBad: string[] = []
    analyzed.forEach(item => {
        const data = item.lastAnalysis?.[analysisType]?.[horizon]
        if (data) {
            allGood.push(...data.good)
            allBad.push(...data.bad)
        }
    })

    return (
        <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/50 backdrop-blur-sm shadow-lg">
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-muted/50">
                        <BarChart3 className={`h-6 w-6 ${sentimentColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Portfolio Outlook</h3>
                            <span className="text-xs text-muted-foreground">• {horizonLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <SentimentIcon className={`h-5 w-5 ${sentimentColor}`} />
                            <span className={`text-xl font-bold ${sentimentColor}`}>{sentimentLabel}</span>
                            <span className="text-sm text-muted-foreground ml-1">
                                (avg {avgRating.toFixed(1)}/5)
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                            {bullish.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {bullish.length} Bullish
                                </span>
                            )}
                            {neutral.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                    {neutral.length} Neutral
                                </span>
                            )}
                            {bearish.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    {bearish.length} Bearish
                                </span>
                            )}
                            <span className="text-muted-foreground">
                                {analyzed.length}/{portfolio.length} stocks analyzed
                            </span>
                        </div>

                        {(allGood.length > 0 || allBad.length > 0) && (
                            <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {allGood.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-400 mb-1">Key Strengths</p>
                                        <ul className="space-y-0.5">
                                            {allGood.slice(0, 3).map((point, i) => (
                                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                                    <span className="text-emerald-400 mt-0.5">•</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {allBad.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-rose-400 mb-1">Key Risks</p>
                                        <ul className="space-y-0.5">
                                            {allBad.slice(0, 3).map((point, i) => (
                                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                                    <span className="text-rose-400 mt-0.5">•</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
