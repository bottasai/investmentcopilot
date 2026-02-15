import { getCurrencySymbol, getMarketCurrency, formatPrice } from '../lib/currency'

describe('getCurrencySymbol', () => {
    it('should return ₹ for INR', () => {
        expect(getCurrencySymbol('INR')).toBe('₹')
    })

    it('should return $ for USD', () => {
        expect(getCurrencySymbol('USD')).toBe('$')
    })

    it('should return € for EUR', () => {
        expect(getCurrencySymbol('EUR')).toBe('€')
    })

    it('should return £ for GBP', () => {
        expect(getCurrencySymbol('GBP')).toBe('£')
    })

    it('should return the code itself for unknown currencies', () => {
        expect(getCurrencySymbol('XYZ')).toBe('XYZ')
    })
})

describe('getMarketCurrency', () => {
    it('should return INR for NSE', () => {
        expect(getMarketCurrency('NSE')).toBe('INR')
    })

    it('should return INR for BSE', () => {
        expect(getMarketCurrency('BSE')).toBe('INR')
    })

    it('should return USD for US market', () => {
        expect(getMarketCurrency('US')).toBe('USD')
    })

    it('should default to USD for unknown markets', () => {
        expect(getMarketCurrency('UNKNOWN')).toBe('USD')
    })
})

describe('formatPrice', () => {
    it('should format NSE stock with ₹ when API returns INR', () => {
        expect(formatPrice(1234.5, 'INR')).toBe('₹ 1234.50')
    })

    it('should format US stock with $ when API returns USD', () => {
        expect(formatPrice(150.75, 'USD')).toBe('$ 150.75')
    })

    it('should fall back to market currency when API currency is undefined', () => {
        expect(formatPrice(500, undefined, 'NSE')).toBe('₹ 500.00')
        expect(formatPrice(500, undefined, 'BSE')).toBe('₹ 500.00')
        expect(formatPrice(500, undefined, 'US')).toBe('$ 500.00')
    })

    it('should prefer API currency over market default', () => {
        // Even if market is NSE, if API says USD, use $
        expect(formatPrice(100, 'USD', 'NSE')).toBe('$ 100.00')
    })

    it('should default to $ when both API currency and market are unknown', () => {
        expect(formatPrice(99.99)).toBe('$ 99.99')
    })
})
