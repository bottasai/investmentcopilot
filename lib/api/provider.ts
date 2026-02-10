export interface StockQuote {
    symbol: string
    price: number
    change: number
    changePercent: number
    currency: string
    marketTime: string
}

export interface StockSearchResult {
    symbol: string
    name: string
    exchange: string
    type: string
}

export interface IDataProvider {
    search(query: string, market?: string): Promise<StockSearchResult[]>
    getQuote(symbol: string, market?: string): Promise<StockQuote>
    getHistory(symbol: string, range?: string): Promise<any>
}
