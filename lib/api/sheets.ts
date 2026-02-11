import { google } from "googleapis"

const SPREADSHEET_TITLE = "Investment CoPilot - Portfolio"

function getAuth(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return auth
}

/**
 * Find or create the Investment CoPilot spreadsheet.
 * Returns the spreadsheet ID.
 */
export async function getOrCreateSpreadsheet(accessToken: string): Promise<string> {
    const auth = getAuth(accessToken)
    const drive = google.drive({ version: "v3", auth })

    // Search for existing spreadsheet
    const res = await drive.files.list({
        q: `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
    })

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id!
    }

    // Create new spreadsheet
    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title: SPREADSHEET_TITLE },
            sheets: [
                {
                    properties: { title: "Portfolio", index: 0 },
                },
                {
                    properties: { title: "Analysis History", index: 1 },
                },
            ],
        },
    })

    const spreadsheetId = spreadsheet.data.spreadsheetId!

    // Write headers to Portfolio tab
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Portfolio!A1:C1",
        valueInputOption: "RAW",
        requestBody: {
            values: [["Symbol", "Added At", "Added Date"]],
        },
    })

    // Write headers to Analysis History tab
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'Analysis History'!A1:G1",
        valueInputOption: "RAW",
        requestBody: {
            values: [["Symbol", "Rating", "Short Term", "Medium Term", "Long Term", "Timestamp", "Strategy"]],
        },
    })

    return spreadsheetId
}

/**
 * Sync the full portfolio to the Portfolio sheet (overwrite).
 */
export async function syncPortfolioToSheet(
    accessToken: string,
    spreadsheetId: string,
    portfolio: Array<{ symbol: string; addedAt: number; addedDate: string }>
) {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    // Clear existing data (keep header)
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: "Portfolio!A2:C1000",
    })

    if (portfolio.length === 0) return

    // Write portfolio data
    const values = portfolio.map((item) => [
        item.symbol,
        item.addedAt,
        item.addedDate,
    ])

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Portfolio!A2:C${portfolio.length + 1}`,
        valueInputOption: "RAW",
        requestBody: { values },
    })
}

/**
 * Read portfolio from the Portfolio sheet.
 */
export async function readPortfolioFromSheet(
    accessToken: string,
    spreadsheetId: string
): Promise<Array<{ symbol: string; addedAt: number; addedDate: string }>> {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Portfolio!A2:C1000",
    })

    const rows = res.data.values || []
    return rows.map((row) => ({
        symbol: row[0] || "",
        addedAt: Number(row[1]) || Date.now(),
        addedDate: row[2] || new Date().toISOString(),
    }))
}

/**
 * Append analysis result to Analysis History sheet.
 */
export async function appendAnalysisToSheet(
    accessToken: string,
    spreadsheetId: string,
    analysis: {
        symbol: string
        rating: number
        horizon: { short: string; medium: string; long: string }
        timestamp: string
        strategy?: string
    }
) {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "'Analysis History'!A:G",
        valueInputOption: "RAW",
        requestBody: {
            values: [[
                analysis.symbol,
                analysis.rating,
                analysis.horizon.short,
                analysis.horizon.medium,
                analysis.horizon.long,
                analysis.timestamp,
                analysis.strategy || "",
            ]],
        },
    })
}

/**
 * Read the latest analysis per symbol from Analysis History.
 */
export async function readAnalysisFromSheet(
    accessToken: string,
    spreadsheetId: string
): Promise<Record<string, { rating: number; horizon: { short: string; medium: string; long: string }; timestamp: string }>> {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'Analysis History'!A2:G1000",
    })

    const rows = res.data.values || []
    const latestBySymbol: Record<string, any> = {}

    for (const row of rows) {
        const symbol = row[0]
        latestBySymbol[symbol] = {
            rating: Number(row[1]) || 0,
            horizon: {
                short: row[2] || "",
                medium: row[3] || "",
                long: row[4] || "",
            },
            timestamp: row[5] || "",
        }
    }

    return latestBySymbol
}
