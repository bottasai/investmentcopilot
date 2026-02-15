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
    console.log(`Searching for spreadsheet: ${SPREADSHEET_TITLE}`)
    const res = await drive.files.list({
        q: `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
    })

    if (res.data.files && res.data.files.length > 0) {
        console.log("Found existing spreadsheet:", res.data.files[0].id)
        const spreadsheetId = res.data.files[0].id!

        // Ensure the Settings tab exists (migration for older spreadsheets)
        await ensureSettingsTab(accessToken, spreadsheetId)

        return spreadsheetId
    }

    // Create new spreadsheet
    console.log("Creating new spreadsheet...")
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
                {
                    properties: { title: "Settings", index: 2 },
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
        range: "'Analysis History'!A1:F1",
        valueInputOption: "RAW",
        requestBody: {
            values: [["Symbol", "Rating", "Fundamental (JSON)", "Technical (JSON)", "Timestamp", "Strategy"]],
        },
    })

    // Write headers to Settings tab
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Settings!A1:B1",
        valueInputOption: "RAW",
        requestBody: {
            values: [["Key", "Value"]],
        },
    })

    return spreadsheetId
}

/**
 * Ensure the Settings tab exists (for spreadsheets created before this feature).
 */
async function ensureSettingsTab(accessToken: string, spreadsheetId: string) {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    try {
        const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" })
        const titles = meta.data.sheets?.map(s => s.properties?.title) || []

        if (!titles.includes("Settings")) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: "Settings" } } }],
                },
            })
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "Settings!A1:B1",
                valueInputOption: "RAW",
                requestBody: { values: [["Key", "Value"]] },
            })
        }
    } catch (e) {
        console.error("ensureSettingsTab error:", e)
    }
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
 * Stores fundamental and technical data as JSON strings.
 */
export async function appendAnalysisToSheet(
    accessToken: string,
    spreadsheetId: string,
    analysis: {
        symbol: string
        rating: number
        fundamental?: any
        technical?: any
        timestamp: string
        strategy?: string
    }
) {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "'Analysis History'!A:F",
        valueInputOption: "RAW",
        requestBody: {
            values: [[
                analysis.symbol,
                analysis.rating,
                JSON.stringify(analysis.fundamental || {}),
                JSON.stringify(analysis.technical || {}),
                analysis.timestamp,
                analysis.strategy || "",
            ]],
        },
    })
}

/**
 * Read the latest analysis per symbol from Analysis History.
 * Handles both old (horizon strings) and new (JSON) formats.
 */
export async function readAnalysisFromSheet(
    accessToken: string,
    spreadsheetId: string
): Promise<Record<string, any>> {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'Analysis History'!A2:F1000",
    })

    const rows = res.data.values || []
    const latestBySymbol: Record<string, any> = {}

    for (const row of rows) {
        const symbol = row[0]
        if (!symbol) continue

        try {
            // Try parsing as new JSON format
            const fundamental = JSON.parse(row[2] || "{}")
            const technical = JSON.parse(row[3] || "{}")

            // Check if it's actually structured data (has good/bad arrays)
            const isStructured = fundamental?.short?.good !== undefined

            if (isStructured) {
                latestBySymbol[symbol] = {
                    rating: Number(row[1]) || 0,
                    fundamental,
                    technical,
                    timestamp: row[4] || "",
                }
            } else {
                // Legacy format — skip, will be re-analyzed
                latestBySymbol[symbol] = {
                    rating: Number(row[1]) || 0,
                    fundamental: { short: { good: [], bad: [] }, medium: { good: [], bad: [] }, long: { good: [], bad: [] } },
                    technical: { short: { good: [], bad: [] }, medium: { good: [], bad: [] }, long: { good: [], bad: [] } },
                    timestamp: row[4] || "",
                }
            }
        } catch {
            // If JSON parse fails, treat as legacy format
            latestBySymbol[symbol] = {
                rating: Number(row[1]) || 0,
                fundamental: { short: { good: [], bad: [] }, medium: { good: [], bad: [] }, long: { good: [], bad: [] } },
                technical: { short: { good: [], bad: [] }, medium: { good: [], bad: [] }, long: { good: [], bad: [] } },
                timestamp: row[4] || "",
            }
        }
    }

    return latestBySymbol
}

/**
 * Read user settings (investmentStrategy, market) from the Settings tab.
 */
export async function readSettingsFromSheet(
    accessToken: string,
    spreadsheetId: string
): Promise<{ investmentStrategy: string; market: string }> {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Settings!A2:B100",
        })

        const rows = res.data.values || []
        const settings: Record<string, string> = {}

        for (const row of rows) {
            if (row[0]) settings[row[0]] = row[1] || ""
        }

        return {
            investmentStrategy: settings["investmentStrategy"] || "",
            market: settings["market"] || "NSE",
        }
    } catch (e) {
        console.error("readSettingsFromSheet error:", e)
        return { investmentStrategy: "", market: "NSE" }
    }
}

/**
 * Write user settings to the Settings tab (overwrite).
 */
export async function writeSettingsToSheet(
    accessToken: string,
    spreadsheetId: string,
    settings: { investmentStrategy: string; market: string }
) {
    const auth = getAuth(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    // Clear existing settings (keep header)
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: "Settings!A2:B100",
    })

    const values = [
        ["investmentStrategy", settings.investmentStrategy],
        ["market", settings.market],
    ]

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Settings!A2:B3",
        valueInputOption: "RAW",
        requestBody: { values },
    })
}
