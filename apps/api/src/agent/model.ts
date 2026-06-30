import { z } from "zod";
import { env } from "../env.js";
import { HttpError } from "../errors.js";
import { actionJsonInstructions, loadAgentPolicy } from "./policy.js";

export const chatActionSchema = z.object({
  action: z.enum([
    "list_tickets",
    "get_ticket",
    "create_ticket",
    "add_comment",
    "update_status",
    "update_priority",
    "assign_ticket",
    "unsupported"
  ]),
  params: z.record(z.unknown()).default({}),
  reason: z.string().optional()
});

export type ChatAction = z.infer<typeof chatActionSchema>;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function extractJson(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  return objectMatch ? objectMatch[0] : trimmed;
}

export async function planChatAction({
  userContext,
  messages
}: {
  userContext: string;
  messages: ChatMessage[];
}): Promise<ChatAction> {
  if (!env.OPENAI_API_KEY) {
    throw new HttpError(503, "Chatbot is not configured");
  }

  const baseUrl = env.OPENAI_BASE_URL.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.DEFAULT_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `${loadAgentPolicy()}\n\n${actionJsonInstructions}\n\nCurrent user:\n${userContext}`
        },
        ...messages.slice(-8)
      ]
    })
  });

  const payload = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new HttpError(
      502,
      payload?.error?.message ? `Chat model error: ${payload.error.message}` : "Chat model error"
    );
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new HttpError(502, "Chat model returned an empty response");
  }

  try {
    return chatActionSchema.parse(JSON.parse(extractJson(content)));
  } catch {
    return {
      action: "unsupported",
      params: {},
      reason: "I could not safely map that request to an allowed ticket action."
    };
  }
}
