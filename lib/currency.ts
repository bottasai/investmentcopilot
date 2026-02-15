/**
 * Maps currency codes to their display symbols.
 * Falls back to the code itself if not found.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    HKD: 'HK$',
}

/**
 * Maps market identifiers to their default currency codes.
 */
const MARKET_CURRENCY: Record<string, string> = {
    NSE: 'INR',
    BSE: 'INR',
    US: 'USD',
    Global: 'USD',
}

/**
 * Returns the currency symbol for a given code (e.g., 'INR' → '₹').
 * If the code isn't recognized, returns the code as-is.
 */
export function getCurrencySymbol(currencyCode: string): string {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode
}

/**
 * Returns the default currency code for a given market (e.g., 'NSE' → 'INR').
 */
export function getMarketCurrency(market: string): string {
    return MARKET_CURRENCY[market] || 'USD'
}

/**
 * Formats a price with the correct currency symbol.
 * Uses the API-provided currency if available, otherwise falls back to market default.
 */
export function formatPrice(price: number, apiCurrency?: string, market?: string): string {
    const currencyCode = apiCurrency || getMarketCurrency(market || 'US')
    const symbol = getCurrencySymbol(currencyCode)
    return `${symbol} ${price.toFixed(2)}`
}
