import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Router, type RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { AppDatabase } from "./database.js";
import { validate } from "./middlewares.js";
import { credentialsSchema } from "./schemas.js";

const deriveKey = promisify(scrypt);
const jwtScope = { issuer: "gestao-academica", audience: "gestao-academica-app" };

export function createAuth(db: AppDatabase, secret: string) {
  const router = Router();

  router.get("/setup", (_request, response) => {
    response.json({ needsAccount: !db.prepare("SELECT id FROM users LIMIT 1").get() });
  });

  router.post("/setup", validate(credentialsSchema, "body"), async (request, response) => {
    const { email, password } = request.body;
    const salt = randomBytes(16).toString("hex");
    const hash = (await deriveKey(password, salt, 64)) as Buffer;
    const user = db.prepare(`
      INSERT INTO users (email, password_hash)
      SELECT ?, ? WHERE NOT EXISTS (SELECT id FROM users)
      RETURNING id
    `).get(email, `${salt}:${hash.toString("hex")}`);

    if (!user) {
      response.status(409).json({ message: "A conta de acesso já foi configurada" });
      return;
    }
    response.status(201).json({ email });
  });

  router.post("/login", validate(credentialsSchema, "body"), async (request, response) => {
    const { email, password } = request.body;
    const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as
      | { id: number; password_hash: string }
      | undefined;
    const [salt = "", hash = ""] = user?.password_hash.split(":") ?? [];
    const candidate = (await deriveKey(password, salt || "invalid-account", 64)) as Buffer;

    if (!user || !timingSafeEqual(candidate, Buffer.from(hash, "hex"))) {
      response.status(401).json({ message: "E-mail ou senha incorretos" });
      return;
    }

    const token = jwt.sign({}, secret, {
      ...jwtScope,
      subject: String(user.id),
      algorithm: "HS256",
      expiresIn: "2h",
    });
    response.json({ token, email });
  });

  const requireToken: RequestHandler = (request, response, next) => {
    const token = request.get("Authorization")?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) {
      response.status(401).json({ message: "Faça login para continuar" });
      return;
    }

    try {
      jwt.verify(token, secret, { ...jwtScope, algorithms: ["HS256"] });
    } catch {
      response.status(401).json({ message: "Sessão inválida ou expirada. Entre novamente." });
      return;
    }
    next();
  };

  return { router, requireToken };
}
