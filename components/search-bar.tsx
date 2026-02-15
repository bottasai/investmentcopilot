"use client"

import * as React from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import axios from "axios"

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState(value)

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

export function SearchBar() {
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const debouncedQuery = useDebounce(query, 500)
    const { market, addToPortfolio, portfolio } = useAppStore()

    const handleSelect = (result: any) => {
        if (portfolio.some(p => p.symbol === result.symbol)) {
            alert(`${result.symbol} is already in your portfolio`)
            return
        }

        addToPortfolio({
            symbol: result.symbol,
            addedAt: 0,
            addedDate: new Date().toISOString()
        })
        setQuery("")
        setResults([])
    }

    React.useEffect(() => {
        async function search() {
            if (!debouncedQuery) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const response = await axios.get(`/api/stocks/search`, {
                    params: { q: debouncedQuery, market },
                })
                setResults(response.data.results || [])
            } catch (error) {
                console.error("Search failed:", error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        search()
    }, [debouncedQuery, market])

    return (
        <div className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {loading && (
                    <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
                <Input
                    placeholder={`Search ${market} stocks...`}
                    className="pl-10 pr-10 h-11 text-sm rounded-xl border-border/60 bg-card/60 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            {(results.length > 0) && (
                <div className="absolute top-full z-20 mt-2 w-full rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden">
                    <ul className="py-1 max-h-64 overflow-y-auto">
                        {results.map((result: any) => (
                            <li
                                key={result.symbol}
                                onClick={() => handleSelect(result)}
                                className="cursor-pointer px-4 py-2.5 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">{result.symbol}</span>
                                    <span className="text-[11px] text-muted-foreground">{result.exchange}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {result.name}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
