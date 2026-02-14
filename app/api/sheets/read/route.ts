import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
    getOrCreateSpreadsheet,
    readPortfolioFromSheet,
    readAnalysisFromSheet,
} from "@/lib/api/sheets"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.accessToken) {
            console.error("Sheets API: Not authenticated")
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const accessToken = session.accessToken
        console.log("Sheets API: Authenticated, getting spreadsheet...")
        const spreadsheetId = await getOrCreateSpreadsheet(accessToken)
        console.log("Sheets API: Got spreadsheet ID:", spreadsheetId)


        const [portfolio, analysisMap] = await Promise.all([
            readPortfolioFromSheet(accessToken, spreadsheetId),
            readAnalysisFromSheet(accessToken, spreadsheetId),
        ])

        // Merge analysis into portfolio items
        const enrichedPortfolio = portfolio.map((item) => ({
            ...item,
            lastAnalysis: analysisMap[item.symbol] || undefined,
        }))

        return NextResponse.json({
            portfolio: enrichedPortfolio,
            spreadsheetId,
        })
    } catch (error: any) {
        console.error("Sheets read error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to read from Google Sheets" },
            { status: 500 }
        )
    }
}
