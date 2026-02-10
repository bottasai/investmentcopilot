"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
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
        // Check if already in portfolio
        if (portfolio.some(p => p.symbol === result.symbol)) {
            alert(`${result.symbol} is already in your portfolio`)
            return
        }

        addToPortfolio({
            symbol: result.symbol,
            addedAt: 0, // Ideally fetch current price here, but let's default to 0 and update in dashboard or fetch now
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
        <div className="relative w-full max-w-sm">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={`Search ${market} stocks...`}
                    className="pl-8"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            {(results.length > 0 || loading) && (
                <Card className="absolute top-full z-10 mt-1 w-full p-2">
                    {loading ? (
                        <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                    ) : (
                        <ul className="space-y-1">
                            {results.map((result: any) => (
                                <li
                                    key={result.symbol}
                                    onClick={() => handleSelect(result)}
                                    className="cursor-pointer rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground text-sm"
                                >
                                    <div className="font-medium">{result.symbol}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {result.name} ({result.exchange})
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}
        </div>
    )
}
