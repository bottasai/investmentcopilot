import { NextRequest, NextResponse } from "next/server"
import { dataProvider } from "@/lib/api/yahoo"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const market = searchParams.get("market")

    if (!query) {
        return NextResponse.json({ results: [] })
    }

    const results = await dataProvider.search(query, market || "US")
    return NextResponse.json({ results })
}
