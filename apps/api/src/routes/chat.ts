import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";
import { planChatAction } from "../agent/model.js";
import { executeChatAction } from "../agent/tools.js";

const router = Router();

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000)
});

const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000).optional(),
  messages: z.array(chatMessageSchema).min(1).max(12).optional()
});

router.post(
  "/chat",
  requireAuth,
  asyncHandler(async (request, response) => {
    if (!request.user) {
      throw new HttpError(401, "Authentication required");
    }

    const input = chatRequestSchema.parse(request.body);
    const messages =
      input.messages ??
      (input.message ? [{ role: "user" as const, content: input.message }] : undefined);

    if (!messages) {
      throw new HttpError(400, "Message is required");
    }

    const action = await planChatAction({
      userContext: JSON.stringify({
        id: request.user.id,
        name: request.user.name,
        email: request.user.email,
        role: request.user.role
      }),
      messages
    });
    const result = await executeChatAction(action, request.user);

    response.json({
      ...result,
      plannedAction: action
    });
  })
);

export default router;
