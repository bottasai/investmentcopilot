import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
    getOrCreateSpreadsheet,
    syncPortfolioToSheet,
    appendAnalysisToSheet,
} from "@/lib/api/sheets"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.accessToken) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const { action, portfolio, analysis } = await request.json()
        const accessToken = session.accessToken

        // Get or create the spreadsheet
        const spreadsheetId = await getOrCreateSpreadsheet(accessToken)

        if (action === "syncPortfolio") {
            await syncPortfolioToSheet(accessToken, spreadsheetId, portfolio)
            return NextResponse.json({ success: true, spreadsheetId })
        }

        if (action === "syncAnalysis") {
            await appendAnalysisToSheet(accessToken, spreadsheetId, analysis)
            return NextResponse.json({ success: true, spreadsheetId })
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    } catch (error: any) {
        console.error("Sheets sync error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to sync with Google Sheets" },
            { status: 500 }
        )
    }
}
