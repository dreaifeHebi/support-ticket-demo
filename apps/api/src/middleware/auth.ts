import type { Role, User } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { HttpError } from "../errors.js";

const tokenPayloadSchema = z.object({
  sub: z.string(),
  role: z.enum(["USER", "ADMIN"])
});

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, "id" | "name" | "email" | "role">;
    }
  }
}

export function signToken(user: Pick<User, "id" | "role">) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

    if (!token) {
      throw new HttpError(401, "Authentication required");
    }

    const payload = tokenPayloadSchema.parse(jwt.verify(token, env.JWT_SECRET));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      throw new HttpError(401, "User not found");
    }

    request.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid token"));
  }
}

export function requireRole(role: Role) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      return next(new HttpError(401, "Authentication required"));
    }

    if (request.user.role !== role) {
      return next(new HttpError(403, "Insufficient permissions"));
    }

    next();
  };
}
