import axios from "axios"
import { IDataProvider, StockQuote, StockSearchResult } from "./provider"

const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v1/finance"

export class YahooFinanceProvider implements IDataProvider {
    async search(query: string, market?: string): Promise<StockSearchResult[]> {
        try {
            // Logic to append market suffix if needed
            // NSE -> .NS, BSE -> .BO
            // This is a naive implementation; real world needs better filtering
            const response = await axios.get(`https://query1.finance.yahoo.com/v1/finance/search`, {
                params: {
                    q: query,
                    quotesCount: 10,
                    newsCount: 0,
                },
            })

            const quotes = response.data.quotes || []

            // Filter by market if provided
            // This is tricky with Yahoo's broad search, but we can filter by exchange suffix or exchange name
            let filtered = quotes
            if (market === 'NSE') {
                filtered = quotes.filter((q: any) => q.exchange === 'NSI' || q.symbol.endsWith('.NS'))
            } else if (market === 'BSE') {
                filtered = quotes.filter((q: any) => q.exchange === 'BSE' || q.symbol.endsWith('.BO'))
            } else if (market === 'US') {
                filtered = quotes.filter((q: any) => !q.symbol.includes('.') && (q.exchange === 'NMS' || q.exchange === 'NYQ'))
            }

            return filtered.map((q: any) => ({
                symbol: q.symbol,
                name: q.shortname || q.longname,
                exchange: q.exchange,
                type: q.quoteType,
            }))
        } catch (error) {
            console.error("Yahoo Search Error:", error)
            return []
        }
    }

    async getQuote(symbol: string): Promise<StockQuote> {
        try {
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)
            const meta = response.data.chart.result[0].meta
            return {
                symbol: meta.symbol,
                price: meta.regularMarketPrice,
                change: meta.regularMarketPrice - meta.chartPreviousClose, // Approx
                changePercent: 0, // Need to calc
                currency: meta.currency,
                marketTime: new Date(meta.regularMarketTime * 1000).toISOString(),
            }
        } catch (error) {
            console.error("Yahoo Quote Error:", error)
            throw error
        }
    }

    async getHistory(symbol: string, range: string = '1mo'): Promise<any[]> {
        try {
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                params: {
                    range: range,
                    interval: '1d',
                }
            })
            const result = response.data.chart.result[0]
            const timestamps = result.timestamp
            const closes = result.indicators.quote[0].close

            return timestamps.map((t: number, i: number) => ({
                date: new Date(t * 1000).toISOString(),
                price: closes[i]
            })).filter((item: any) => item.price !== null)
        } catch (error) {
            console.error("Yahoo History Error:", error)
            return []
        }
    }
}

export const dataProvider = new YahooFinanceProvider()
