import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

export type Market = 'US' | 'NSE' | 'BSE' | 'Global'

export interface AnalysisIndicators {
    good: string[]
    bad: string[]
}

export interface AnalysisByHorizon {
    short: AnalysisIndicators
    medium: AnalysisIndicators
    long: AnalysisIndicators
}

export interface StockAnalysis {
    rating: number
    fundamental: AnalysisByHorizon
    technical: AnalysisByHorizon
    timestamp: string
}

export interface PortfolioItem {
    symbol: string
    addedAt: number
    addedDate: string
    lastAnalysis?: StockAnalysis
}

interface AppState {
    market: Market
    setMarket: (market: Market) => void
    portfolio: PortfolioItem[]
    addToPortfolio: (item: PortfolioItem) => void
    removeFromPortfolio: (symbol: string) => void
    investmentStrategy: string
    setInvestmentStrategy: (strategy: string) => void
    setPortfolioItemAnalysis: (symbol: string, analysis: PortfolioItem['lastAnalysis']) => void
    // Sheets sync
    spreadsheetId: string | null
    setSpreadsheetId: (id: string) => void
    sheetsLoaded: boolean
    setSheetsLoaded: (loaded: boolean) => void
    loadFromSheets: () => Promise<void>
    syncPortfolioToSheets: () => Promise<void>
    syncAnalysisToSheets: (symbol: string, analysis: NonNullable<PortfolioItem['lastAnalysis']>) => Promise<void>
    syncSettingsToSheets: () => Promise<void>
    setPortfolio: (portfolio: PortfolioItem[]) => void
    clearOnLogout: () => void
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            market: 'NSE',
            setMarket: (market) => set({ market }),
            portfolio: [],
            addToPortfolio: (item) => {
                set((state) => ({
                    portfolio: [...state.portfolio, item]
                }))
                // Auto-sync to sheets after adding
                get().syncPortfolioToSheets().catch(console.error)
            },
            removeFromPortfolio: (symbol) => {
                set((state) => ({
                    portfolio: state.portfolio.filter((i) => i.symbol !== symbol)
                }))
                // Auto-sync to sheets after removing
                get().syncPortfolioToSheets().catch(console.error)
            },
            investmentStrategy: "",
            setInvestmentStrategy: (strategy) => set({ investmentStrategy: strategy }),
            setPortfolioItemAnalysis: (symbol, analysis) => {
                set((state) => ({
                    portfolio: state.portfolio.map((item) =>
                        item.symbol === symbol ? { ...item, lastAnalysis: analysis } : item
                    )
                }))
                // Sync analysis to sheets
                if (analysis) {
                    get().syncAnalysisToSheets(symbol, analysis).catch(console.error)
                }
            },
            setPortfolio: (portfolio) => set({ portfolio }),

            clearOnLogout: () => {
                set({
                    portfolio: [],
                    spreadsheetId: null,
                    sheetsLoaded: false,
                    investmentStrategy: '',
                })
                // Also clear the persisted localStorage entry
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('investment-copilot-storage')
                }
            },

            // Sheets sync state
            spreadsheetId: null,
            setSpreadsheetId: (id) => set({ spreadsheetId: id }),
            sheetsLoaded: false,
            setSheetsLoaded: (loaded) => set({ sheetsLoaded: loaded }),

            loadFromSheets: async () => {
                try {
                    const res = await axios.get("/api/sheets/read")
                    const { portfolio: cloudPortfolio, spreadsheetId, settings } = res.data

                    // Load settings from cloud
                    if (settings) {
                        const updates: any = { spreadsheetId, sheetsLoaded: true }
                        if (settings.investmentStrategy) {
                            updates.investmentStrategy = settings.investmentStrategy
                        }
                        if (settings.market) {
                            updates.market = settings.market
                        }

                        // Smart Sync: If cloud is empty but we have local data, upload it.
                        const localPortfolio = get().portfolio
                        if (cloudPortfolio.length === 0 && localPortfolio.length > 0) {
                            console.log("Cloud empty, local has data. Syncing UP.")
                            set(updates)
                            await get().syncPortfolioToSheets()
                        } else {
                            // Otherwise, trust cloud (download)
                            set({
                                ...updates,
                                portfolio: cloudPortfolio,
                            })
                        }
                    }

                } catch (error: any) {
                    if (error.response?.status === 401) {
                        // Not authenticated, skip
                        return
                    }
                    console.error("Failed to load from sheets:", error)
                }
            },

            syncPortfolioToSheets: async () => {
                try {
                    const { portfolio } = get()
                    await axios.post("/api/sheets/sync", {
                        action: "syncPortfolio",
                        portfolio: portfolio.map(({ symbol, addedAt, addedDate }) => ({
                            symbol,
                            addedAt,
                            addedDate,
                        })),
                    })
                } catch (error: any) {
                    if (error.response?.status === 401) return
                    console.error("Failed to sync portfolio to sheets:", error)
                }
            },

            syncAnalysisToSheets: async (symbol, analysis) => {
                try {
                    const { investmentStrategy } = get()
                    await axios.post("/api/sheets/sync", {
                        action: "syncAnalysis",
                        analysis: {
                            symbol,
                            rating: analysis.rating,
                            fundamental: analysis.fundamental,
                            technical: analysis.technical,
                            timestamp: analysis.timestamp,
                            strategy: investmentStrategy,
                        },
                    })
                } catch (error: any) {
                    if (error.response?.status === 401) return
                    console.error("Failed to sync analysis to sheets:", error)
                }
            },

            syncSettingsToSheets: async () => {
                try {
                    const { investmentStrategy, market } = get()
                    await axios.post("/api/sheets/sync", {
                        action: "syncSettings",
                        settings: {
                            investmentStrategy,
                            market,
                        },
                    })
                } catch (error: any) {
                    if (error.response?.status === 401) return
                    console.error("Failed to sync settings to sheets:", error)
                }
            },
        }),
        {
            name: 'investment-copilot-storage',
            partialize: (state) => ({
                market: state.market,
                portfolio: state.portfolio,
                investmentStrategy: state.investmentStrategy,
                spreadsheetId: state.spreadsheetId,
            }),
        }

    )
)
