import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

/** The model used for all AI features. Override via OPENAI_MODEL if needed. */
export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Returns null (never throws) when no real API key is configured, so every
 * caller can check for null and show a friendly "AI isn't set up yet"
 * message instead of a crash. `.env.example`'s placeholder value is
 * explicitly excluded so a fresh checkout never silently "half-works."
 */
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-your-openai-key" || apiKey.trim() === "") return null;

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

export class AIUnavailableError extends Error {
  constructor(message = "AI features aren't set up yet — add OPENAI_API_KEY in your environment variables to enable this.") {
    super(message);
    this.name = "AIUnavailableError";
  }
}

/**
 * Calls the model with a system+user prompt and parses a JSON object from
 * the response. Throws AIUnavailableError if no key is configured, or a
 * regular Error if the model's response wasn't valid JSON (rare with
 * response_format: json_object, but defensive).
 */
export async function callAIForJSON<T>(system: string, user: string): Promise<T> {
  const client = getOpenAIClient();
  if (!client) throw new AIUnavailableError();

  const completion = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    // Deliberately no `temperature` override — newer OpenAI models
    // (including the GPT-5.6 family) reject any value other than their
    // default (1) and throw a 400 error if one is passed. Omitting the
    // parameter entirely lets every model use its own sensible default,
    // rather than needing to special-case which models support it.
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("The AI service returned an empty response. Please try again.");

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("The AI service returned an unexpected response. Please try again.");
  }
}
