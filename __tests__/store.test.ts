import { useAppStore } from '../lib/store'
import type { PortfolioItem, StockAnalysis } from '../lib/store'

// Mock axios to prevent real API calls
jest.mock('axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
}))

// Helper: reset store between tests
const resetStore = () => {
    useAppStore.setState({
        market: 'NSE',
        portfolio: [],
        investmentStrategy: '',
        spreadsheetId: null,
        sheetsLoaded: false,
    })
}

// Helper: create a mock portfolio item
const createItem = (symbol: string): PortfolioItem => ({
    symbol,
    addedAt: Date.now(),
    addedDate: new Date().toISOString(),
})

// Helper: create a mock structured analysis
const createAnalysis = (): StockAnalysis => ({
    rating: 4,
    fundamental: {
        short: { good: ['Strong revenue growth', 'Low debt'], bad: ['High P/E ratio'] },
        medium: { good: ['Market leader', 'Expanding margins'], bad: ['Sector headwinds'] },
        long: { good: ['Durable moat', 'Cash flow machine'], bad: ['Regulatory risk'] },
    },
    technical: {
        short: { good: ['RSI momentum building', 'Above 20 DMA'], bad: ['Volume declining'] },
        medium: { good: ['Golden cross forming'], bad: ['Resistance at 200 DMA'] },
        long: { good: ['Multi-year uptrend'], bad: ['Overextended from mean'] },
    },
    timestamp: new Date().toISOString(),
})

describe('useAppStore', () => {
    beforeEach(() => {
        resetStore()
    })

    // ─────────────────────────────────
    // Positive tests
    // ─────────────────────────────────

    describe('addToPortfolio', () => {
        it('should add a new item to the portfolio', () => {
            const item = createItem('AAPL')
            useAppStore.getState().addToPortfolio(item)

            const portfolio = useAppStore.getState().portfolio
            expect(portfolio).toHaveLength(1)
            expect(portfolio[0].symbol).toBe('AAPL')
        })

        it('should add multiple items to the portfolio', () => {
            useAppStore.getState().addToPortfolio(createItem('AAPL'))
            useAppStore.getState().addToPortfolio(createItem('GOOGL'))
            useAppStore.getState().addToPortfolio(createItem('MSFT'))

            expect(useAppStore.getState().portfolio).toHaveLength(3)
        })
    })

    describe('removeFromPortfolio', () => {
        it('should remove the correct item', () => {
            useAppStore.getState().addToPortfolio(createItem('AAPL'))
            useAppStore.getState().addToPortfolio(createItem('GOOGL'))

            useAppStore.getState().removeFromPortfolio('AAPL')

            const portfolio = useAppStore.getState().portfolio
            expect(portfolio).toHaveLength(1)
            expect(portfolio[0].symbol).toBe('GOOGL')
        })
    })

    describe('setPortfolioItemAnalysis', () => {
        it('should update the analysis for the correct item with structured data', () => {
            useAppStore.getState().addToPortfolio(createItem('AAPL'))
            useAppStore.getState().addToPortfolio(createItem('GOOGL'))

            const analysis = createAnalysis()
            useAppStore.getState().setPortfolioItemAnalysis('AAPL', analysis)

            const portfolio = useAppStore.getState().portfolio
            expect(portfolio[0].lastAnalysis).toEqual(analysis)
            expect(portfolio[0].lastAnalysis?.rating).toBe(4)
            expect(portfolio[0].lastAnalysis?.fundamental.short.good).toContain('Strong revenue growth')
            expect(portfolio[0].lastAnalysis?.technical.short.bad).toContain('Volume declining')
            expect(portfolio[1].lastAnalysis).toBeUndefined()
        })

        it('should store both fundamental and technical data per horizon', () => {
            useAppStore.getState().addToPortfolio(createItem('TSLA'))
            const analysis = createAnalysis()
            useAppStore.getState().setPortfolioItemAnalysis('TSLA', analysis)

            const stored = useAppStore.getState().portfolio[0].lastAnalysis!

            // Verify all horizons exist for fundamental
            expect(stored.fundamental.short.good.length).toBeGreaterThan(0)
            expect(stored.fundamental.medium.good.length).toBeGreaterThan(0)
            expect(stored.fundamental.long.good.length).toBeGreaterThan(0)

            // Verify all horizons exist for technical
            expect(stored.technical.short.good.length).toBeGreaterThan(0)
            expect(stored.technical.medium.good.length).toBeGreaterThan(0)
            expect(stored.technical.long.good.length).toBeGreaterThan(0)
        })
    })

    describe('clearOnLogout', () => {
        it('should reset all user data to defaults', () => {
            // Populate the store
            useAppStore.getState().addToPortfolio(createItem('AAPL'))
            useAppStore.getState().addToPortfolio(createItem('GOOGL'))
            useAppStore.setState({
                spreadsheetId: 'test-sheet-id',
                sheetsLoaded: true,
                investmentStrategy: 'Growth investing',
            })

            // Verify populated
            expect(useAppStore.getState().portfolio).toHaveLength(2)
            expect(useAppStore.getState().spreadsheetId).toBe('test-sheet-id')
            expect(useAppStore.getState().sheetsLoaded).toBe(true)
            expect(useAppStore.getState().investmentStrategy).toBe('Growth investing')

            // Clear on logout
            useAppStore.getState().clearOnLogout()

            // Verify cleared
            expect(useAppStore.getState().portfolio).toEqual([])
            expect(useAppStore.getState().spreadsheetId).toBeNull()
            expect(useAppStore.getState().sheetsLoaded).toBe(false)
            expect(useAppStore.getState().investmentStrategy).toBe('')
        })
    })

    describe('setMarket', () => {
        it('should update the market', () => {
            useAppStore.getState().setMarket('US')
            expect(useAppStore.getState().market).toBe('US')
        })
    })

    describe('setInvestmentStrategy', () => {
        it('should update the investment strategy', () => {
            useAppStore.getState().setInvestmentStrategy('Value investing')
            expect(useAppStore.getState().investmentStrategy).toBe('Value investing')
        })
    })

    describe('setPortfolio', () => {
        it('should replace the entire portfolio', () => {
            useAppStore.getState().addToPortfolio(createItem('AAPL'))

            const newPortfolio = [createItem('GOOGL'), createItem('MSFT')]
            useAppStore.getState().setPortfolio(newPortfolio)

            expect(useAppStore.getState().portfolio).toHaveLength(2)
            expect(useAppStore.getState().portfolio[0].symbol).toBe('GOOGL')
            expect(useAppStore.getState().portfolio[1].symbol).toBe('MSFT')
        })
    })

    // ─────────────────────────────────
    // Negative tests
    // ─────────────────────────────────

    describe('removeFromPortfolio (negative)', () => {
        it('should not crash when removing a non-existent symbol', () => {
            useAppStore.getState().addToPortfolio(createItem('AAPL'))

            expect(() => {
                useAppStore.getState().removeFromPortfolio('DOESNOTEXIST')
            }).not.toThrow()

            expect(useAppStore.getState().portfolio).toHaveLength(1)
            expect(useAppStore.getState().portfolio[0].symbol).toBe('AAPL')
        })

        it('should not crash when portfolio is empty', () => {
            expect(() => {
                useAppStore.getState().removeFromPortfolio('AAPL')
            }).not.toThrow()

            expect(useAppStore.getState().portfolio).toHaveLength(0)
        })
    })

    describe('setPortfolioItemAnalysis (negative)', () => {
        it('should be a no-op when symbol does not exist', () => {
            useAppStore.getState().addToPortfolio(createItem('AAPL'))

            const analysis = createAnalysis()

            expect(() => {
                useAppStore.getState().setPortfolioItemAnalysis('NONEXISTENT', analysis)
            }).not.toThrow()

            expect(useAppStore.getState().portfolio[0].lastAnalysis).toBeUndefined()
        })
    })

    describe('clearOnLogout (negative)', () => {
        it('should not crash when called on an already empty store', () => {
            expect(() => {
                useAppStore.getState().clearOnLogout()
            }).not.toThrow()

            expect(useAppStore.getState().portfolio).toEqual([])
            expect(useAppStore.getState().spreadsheetId).toBeNull()
        })
    })
})
