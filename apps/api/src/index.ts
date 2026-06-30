import cors from "cors";
import express from "express";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import ticketRoutes from "./routes/tickets.js";
import { corsOrigins, env } from "./env.js";
import { errorHandler } from "./errors.js";

const app = express();

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "support-ticket-api" });
});

app.use("/api", authRoutes);
app.use("/api", ticketRoutes);
app.use("/api", adminRoutes);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
