
import { dataProvider } from "@/lib/api/yahoo"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")
    const range = searchParams.get("range") || "1mo"

    if (!symbol) {
        return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
    }

    try {
        const history = await dataProvider.getHistory(symbol, range)
        return NextResponse.json(history)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }
}
