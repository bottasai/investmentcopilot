
"use client"

import * as React from "react"
import { PortfolioItem } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, BarChart3, CheckCircle2, AlertTriangle } from "lucide-react"

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
    let pillClass: string
    let SentimentIcon: typeof TrendingUp

    if (avgRating >= 4) {
        sentimentLabel = 'Bullish'
        pillClass = 'pill-bullish'
        SentimentIcon = TrendingUp
    } else if (avgRating >= 3) {
        sentimentLabel = 'Moderately Positive'
        pillClass = 'pill-bullish'
        SentimentIcon = TrendingUp
    } else if (avgRating >= 2) {
        sentimentLabel = 'Neutral'
        pillClass = 'pill-neutral'
        SentimentIcon = Minus
    } else {
        sentimentLabel = 'Bearish'
        pillClass = 'pill-bearish'
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
        <Card className="rounded-xl border border-border/30 bg-card/60 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div className="p-3 rounded-xl bg-muted/40 shrink-0">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Title line */}
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Portfolio Outlook
                            </h3>
                            <span className="text-[11px] text-muted-foreground">• {horizonLabel}</span>
                        </div>

                        {/* Sentiment pill */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`pill-badge ${pillClass}`}>
                                <SentimentIcon className="h-3.5 w-3.5" />
                                {sentimentLabel}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                avg {avgRating.toFixed(1)}/5
                            </span>
                        </div>

                        {/* Counts */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {bullish.length > 0 && (
                                <span className="pill-badge pill-bullish">
                                    {bullish.length} Bullish
                                </span>
                            )}
                            {neutral.length > 0 && (
                                <span className="pill-badge pill-neutral">
                                    {neutral.length} Neutral
                                </span>
                            )}
                            {bearish.length > 0 && (
                                <span className="pill-badge pill-bearish">
                                    {bearish.length} Bearish
                                </span>
                            )}
                            <span className="text-muted-foreground ml-1">
                                {analyzed.length}/{portfolio.length} analyzed
                            </span>
                        </div>

                        {/* Strengths & Risks — two clean columns with icons */}
                        {(allGood.length > 0 || allBad.length > 0) && (
                            <div className="pt-4 border-t border-border/20 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {allGood.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Strengths
                                        </p>
                                        <ul className="space-y-1.5">
                                            {allGood.slice(0, 3).map((point, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                                                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 perf-positive" />
                                                    <span className="text-foreground/80">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {allBad.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Risks
                                        </p>
                                        <ul className="space-y-1.5">
                                            {allBad.slice(0, 3).map((point, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                                                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 perf-negative" />
                                                    <span className="text-foreground/80">{point}</span>
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
