
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 },
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const requestBody = body as Record<string, unknown>;
    let messages: ChatMessage[];

    // Support the old single-message request as well.
    if (Array.isArray(requestBody.messages)) {
      if (
        requestBody.messages.length === 0 ||
        requestBody.messages.length > 30
      ) {
        return NextResponse.json(
          { error: "Conversation must contain between 1 and 30 messages." },
          { status: 400 },
        );
      }

      const validMessages: ChatMessage[] = [];

      for (const item of requestBody.messages) {
        if (
          typeof item !== "object" ||
          item === null ||
          !("role" in item) ||
          !("content" in item)
        ) {
          return NextResponse.json(
            { error: "Invalid message format." },
            { status: 400 },
          );
        }

        const message = item as Record<string, unknown>;

        if (
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.content !== "string" ||
          !message.content.trim() ||
          message.content.length > 10000
        ) {
          return NextResponse.json(
            { error: "One or more messages are invalid." },
            { status: 400 },
          );
        }

        validMessages.push({
          role: message.role,
          content: message.content.trim(),
        });
      }

      if (validMessages[validMessages.length - 1].role !== "user") {
        return NextResponse.json(
          { error: "The latest message must be from the user." },
          { status: 400 },
        );
      }

      const totalCharacters = validMessages.reduce(
        (total, message) => total + message.content.length,
        0,
      );

      if (totalCharacters > 30000) {
        return NextResponse.json(
          { error: "Conversation is too long. Please start a new chat." },
          { status: 400 },
        );
      }

      messages = validMessages;
    } else if (typeof requestBody.message === "string") {
      const message = requestBody.message.trim();

      if (!message || message.length > 10000) {
        return NextResponse.json(
          { error: "Please provide a valid message." },
          { status: 400 },
        );
      }

      messages = [{ role: "user", content: message }];
    } else {
      return NextResponse.json(
        { error: "Please provide a valid message or conversation history." },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
    });

    return NextResponse.json({
      reply:
        response.text ||
        "I couldn't generate a response. Please try again.",
    });
  } catch (error) {
    console.error("Gemini assistant error:", error);

    return NextResponse.json(
      { error: "Unable to get an AI response. Please try again." },
      { status: 500 },
    );
  }
}
