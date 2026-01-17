import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json(
            { error: "Server Configuration Error: GEMINI_API_KEY is missing." },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json(
                { error: "Missing required 'text' field in request body." },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `
        You are a highly advanced misinformation detection expert. 
        Analyze the following text for fake news, bias, and fabrication.

        Text to Analyze:
        "${text.substring(0, 10000)}"

        Return ONLY a JSON object with strictly these fields:
        {
            "score": <number 0-100, where 100 is definitely fake/malicious>,
            "label": <string, one of 'High Risk', 'Moderate', 'Safe'>,
            "reasoning": <string, a concise explanation of why this score was given, max 2 sentences>
        }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error("JSON Parse Error:", responseText);
            return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
        }

    } catch (error) {
        console.error("Analysis Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error during analysis." },
            { status: 500 }
        );
    }
}
