import { NextRequest, NextResponse } from "next/server"
import { dataProvider } from "@/lib/api/yahoo"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get("symbol")

    if (!symbol) {
        return NextResponse.json({ error: "Symbol required" }, { status: 400 })
    }

    try {
        const quote = await dataProvider.getQuote(symbol)
        return NextResponse.json(quote)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 })
    }
}
