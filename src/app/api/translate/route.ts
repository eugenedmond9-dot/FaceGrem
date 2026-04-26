import { NextRequest, NextResponse } from "next/server";

type TranslationLanguage = "en" | "sw" | "fr" | "rw";

const languageNames: Record<TranslationLanguage, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  rw: "Kinyarwanda",
};

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = (await request.json()) as {
      text?: string;
      targetLanguage?: TranslationLanguage;
    };

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    if (!targetLanguage || !(targetLanguage in languageNames)) {
      return NextResponse.json(
        { error: "A valid target language is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const targetName = languageNames[targetLanguage];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You are a translation engine. Translate the user's text into the requested target language. Preserve meaning, tone, and formatting. Return only the translated text with no explanation.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Target language: ${targetName}\n\nText:\n${text}`,
              },
            ],
          },
        ],
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message =
        payload?.error?.message || "The translation request failed.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const translation =
      payload?.output_text ||
      payload?.output?.[0]?.content?.[0]?.text ||
      "";

    if (!translation) {
      return NextResponse.json(
        { error: "No translation was returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({ translation });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while translating.",
      },
      { status: 500 }
    );
  }
}
