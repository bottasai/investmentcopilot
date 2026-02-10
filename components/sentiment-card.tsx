"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import axios from "axios"
import { Sparkles, Loader2 } from "lucide-react"

interface SentimentCardProps {
    symbol: string
    history?: any[]
}

export function SentimentCard({ symbol, history }: SentimentCardProps) {
    const { investmentStrategy } = useAppStore()
    const [analysis, setAnalysis] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)

    const analyze = async () => {
        if (!investmentStrategy) {
            alert("Please set your Investment Strategy in settings first.")
            return
        }
        if (!history || history.length === 0) {
            alert("Insufficient history data for analysis.")
            return
        }

        setLoading(true)
        try {
            const response = await axios.post("/api/ai/sentiment", {
                history,
                strategy: investmentStrategy
            })
            setAnalysis(response.data)
        } catch (error) {
            console.error("Analysis failed", error)
        } finally {
            setLoading(false)
        }
    }

    if (!analysis) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={analyze}
                disabled={loading}
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {loading ? "Analyzing..." : "Ask AI CoPilot"}
            </Button>
        )
    }

    return (
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg space-y-2 text-sm border border-border">
            <div className="flex justify-between items-center">
                <span className="font-semibold text-primary flex items-center">
                    <Sparkles className="h-3 w-3 mr-1 text-yellow-500" /> CoPilot Rating
                </span>
                <span className="font-bold text-lg">{analysis.rating}/5</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <div>
                    <span className="font-medium block text-muted-foreground">Short</span>
                    {analysis.horizon.short}
                </div>
                <div>
                    <span className="font-medium block text-muted-foreground">Medium</span>
                    {analysis.horizon.medium}
                </div>
                <div>
                    <span className="font-medium block text-muted-foreground">Long</span>
                    {analysis.horizon.long}
                </div>
            </div>
        </div>
    )
}
