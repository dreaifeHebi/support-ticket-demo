import cors from "cors";
import express from "express";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import ticketRoutes from "./routes/tickets.js";
import { configuredCorsOrigins, env } from "./env.js";
import { errorHandler } from "./errors.js";

const app = express();

function isPrivateDevOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredCorsOrigins.includes(origin) || isPrivateDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true
  })
);
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
