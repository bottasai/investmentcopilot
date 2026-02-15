"use client"

import { MarketSelector } from "@/components/market-selector"
import { SearchBar } from "@/components/search-bar"
import { PortfolioDashboard } from "@/components/portfolio-dashboard"
import { AuthButton } from "@/components/auth-button"
import { useSession } from "next-auth/react"

export default function Home() {
    const { data: session } = useSession()

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header — minimal, persistent */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-primary/90 flex items-center justify-center">
                            <span className="text-primary-foreground font-semibold text-xs">IC</span>
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-foreground">
                            Investment CoPilot
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MarketSelector />
                        <AuthButton />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container px-4 md:px-8 py-10">
                {/* Search Section — dominant, generous spacing */}
                <section className="mb-12 max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold tracking-tight mb-2 text-foreground">
                        Search Global Markets
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Find stocks from US, NSE, and BSE exchanges
                    </p>
                    <div className="max-w-lg mx-auto">
                        <SearchBar />
                    </div>
                </section>

                {/* Portfolio Dashboard */}
                <PortfolioDashboard />

                {/* Sign-in prompt */}
                {!session && (
                    <div className="text-center mt-10 py-8 rounded-xl border border-border/40 bg-card/50">
                        <p className="text-sm text-muted-foreground">
                            Sign in with Google to persist your portfolio across devices.
                        </p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-5 text-center text-xs text-muted-foreground">
                <p>Investment CoPilot &copy; {new Date().getFullYear()} &middot; <a href="/privacy-policy" className="hover:underline">Privacy Policy</a></p>
            </footer>
        </div>
    )
}
