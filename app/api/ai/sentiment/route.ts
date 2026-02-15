
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
As an expert financial analyst, analyze the following stock and provide BOTH fundamental and technical analysis across three time horizons, aligned with the user's investment strategy: "${strategy}".

Stock Data:
- Start Price (30d ago): ${history[0]?.price}
- Current Price: ${history[history.length - 1]?.price}
- 30-Day Trend: ${history[history.length - 1]?.price > history[0]?.price ? "Upward" : "Downward"}
- Symbol context from price data available

Provide your analysis in this exact JSON structure:
{
    "rating": <number 1-5, where 5 = Strong Buy>,
    "fundamental": {
        "short": {
            "good": ["<up to 5 strong fundamental positives for 1-3 month outlook>"],
            "bad": ["<up to 5 fundamental weaknesses/risks for 1-3 month outlook>"]
        },
        "medium": {
            "good": ["<up to 5 strong fundamental positives for 6-12 month outlook>"],
            "bad": ["<up to 5 fundamental weaknesses/risks for 6-12 month outlook>"]
        },
        "long": {
            "good": ["<up to 5 strong fundamental positives for 1-5 year outlook>"],
            "bad": ["<up to 5 fundamental weaknesses/risks for 1-5 year outlook>"]
        }
    },
    "technical": {
        "short": {
            "good": ["<up to 3 bullish technical signals for 1-3 month outlook>"],
            "bad": ["<up to 3 bearish technical signals for 1-3 month outlook>"]
        },
        "medium": {
            "good": ["<up to 3 bullish technical signals for 6-12 month outlook>"],
            "bad": ["<up to 3 bearish technical signals for 6-12 month outlook>"]
        },
        "long": {
            "good": ["<up to 3 bullish technical signals for 1-5 year outlook>"],
            "bad": ["<up to 3 bearish technical signals for 1-5 year outlook>"]
        }
    }
}

Guidelines:
- Fundamental: Focus on revenue, margins, debt, cash flow, competitive position, market share, management quality, valuation ratios.
- Technical: Focus on moving averages, RSI, MACD, volume trends, support/resistance, chart patterns.
- Keep each point concise (max 10 words).
- Always provide at least 1 good and 1 bad point per category.
        `

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a financial analyst JSON API. Return only valid JSON." }, { role: "user", content: prompt }],
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
