
import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
    try {
        const { history, strategy } = await request.json()

        if (!strategy) {
            return NextResponse.json({ error: "Investment strategy required" }, { status: 400 })
        }

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API Key not configured on server" }, { status: 500 })
        }

        const openai = new OpenAI({ apiKey: apiKey })
        const targetModel = process.env.OPENAI_MODEL || "gpt-4o-mini"

        const prompt = `
        As an expert financial analyst, analyze the following stock history and provide a rating (1-5, where 5 is Strong Buy) and outlook based on the user's strategy: "${strategy}".
        
        Stock History (Last 30 days summary):
        Start Price: ${history[0]?.price}
        End Price: ${history[history.length - 1]?.price}
        Trend: ${history[history.length - 1]?.price > history[0]?.price ? "Up" : "Down"}
        
        Return a JSON object with this exact structure:
        {
            "rating": number,
            "horizon": {
                "short": "string (1 sentence)",
                "medium": "string (1 sentence)",
                "long": "string (1 sentence)"
            }
        }
        `

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a financial analyst JSON API." }, { role: "user", content: prompt }],
            model: targetModel,
            response_format: { type: "json_object" },
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error("No content from OpenAI")

        const result = JSON.parse(content)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Sentiment Error:", error)
        return NextResponse.json({ error: "Failed to analyze sentiment" }, { status: 500 })
    }
}
