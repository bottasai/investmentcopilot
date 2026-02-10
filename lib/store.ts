import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Market = 'US' | 'NSE' | 'BSE' | 'Global'

export interface PortfolioItem {
    symbol: string
    addedAt: number
    addedDate: string
    lastAnalysis?: {
        rating: number
        horizon: {
            short: string
            medium: string
            long: string
        }
        timestamp: string
    }
}

interface AppState {
    market: Market
    setMarket: (market: Market) => void
    portfolio: PortfolioItem[]
    addToPortfolio: (item: PortfolioItem) => void
    removeFromPortfolio: (symbol: string) => void
    investmentStrategy: string
    setInvestmentStrategy: (strategy: string) => void
    openaiKey: string
    setOpenaiKey: (key: string) => void
    openaiModel: string
    setOpenaiModel: (model: string) => void
    setPortfolioItemAnalysis: (symbol: string, analysis: PortfolioItem['lastAnalysis']) => void
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            market: 'NSE',
            setMarket: (market) => set({ market }),
            portfolio: [],
            addToPortfolio: (item) => set((state) => ({
                portfolio: [...state.portfolio, item]
            })),
            removeFromPortfolio: (symbol) => set((state) => ({
                portfolio: state.portfolio.filter((i) => i.symbol !== symbol)
            })),
            investmentStrategy: "",
            setInvestmentStrategy: (strategy) => set({ investmentStrategy: strategy }),
            openaiKey: "",
            setOpenaiKey: (key) => set({ openaiKey: key }),
            openaiModel: "gpt-4o-mini",
            setOpenaiModel: (model) => set({ openaiModel: model }),
            setPortfolioItemAnalysis: (symbol, analysis) => set((state) => ({
                portfolio: state.portfolio.map((item) =>
                    item.symbol === symbol ? { ...item, lastAnalysis: analysis } : item
                )
            })),
        }),
        {
            name: 'investment-copilot-storage',
        }
    )
)

