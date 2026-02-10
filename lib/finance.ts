export function calculateCAGR(currentPrice: number, startPrice: number, years: number): string {
    if (!startPrice || years <= 0) return "0.00%";
    const cagr = (Math.pow(currentPrice / startPrice, 1 / years) - 1) * 100;
    return `${cagr > 0 ? '+' : ''}${cagr.toFixed(2)}%`;
}

export function calculateReturns(currentPrice: number, startPrice: number): string {
    if (!startPrice) return "0.00%";
    const returns = ((currentPrice - startPrice) / startPrice) * 100;
    return `${returns > 0 ? '+' : ''}${returns.toFixed(2)}%`;
}
