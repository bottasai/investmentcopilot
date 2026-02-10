"use client"

import { MarketSelector } from "@/components/market-selector"
import { SearchBar } from "@/components/search-bar"
import { PortfolioDashboard } from "@/components/portfolio-dashboard"

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">IC</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            Investment CoPilot
                        </h1>
                    </div>
                    <MarketSelector />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container px-4 md:px-8 py-8">
                {/* Hero Search Section */}
                <div className="mb-10 text-center max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
                        Search Global Markets
                    </h2>
                    <p className="text-muted-foreground text-lg mb-6">
                        Access stocks from US, NSE, and BSE. Get AI-driven investment insights.
                    </p>
                    <div className="max-w-xl mx-auto">
                        <SearchBar />
                    </div>
                </div>

                {/* Portfolio Dashboard - Full Width */}
                <PortfolioDashboard />
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
                <p>Investment CoPilot &copy; {new Date().getFullYear()}. AI-powered investment analysis.</p>
            </footer>
        </div>
    )
}
