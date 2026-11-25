import express from "express";
import { randomBytes } from "node:crypto";
import { createAuth } from "./auth.js";
import { createDatabase, type AppDatabase } from "./database.js";
import { errorHandler, notFound } from "./middlewares.js";
import { createCoursesRouter } from "./routes/courses.js";
import { createEnrollmentsRouter } from "./routes/enrollments.js";
import { createPeopleRouter } from "./routes/people.js";

export function createApp(
  db: AppDatabase = createDatabase(),
  jwtSecret = process.env.JWT_SECRET ?? randomBytes(32).toString("hex"),
) {
  const app = express();
  const auth = createAuth(db, jwtSecret);

  app.disable("x-powered-by");
  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:8081";
  app.use((request, response, next) => {
    response.vary("Origin");
    if (request.get("Origin") === webOrigin) {
      response.set({
        "Access-Control-Allow-Origin": webOrigin,
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      });
      if (request.method === "OPTIONS") {
        response.sendStatus(204);
        return;
      }
    }
    next();
  });
  app.use(express.json({ limit: "32kb" }));

  app.get("/", (_request, response) => {
    response.json({
      name: "API de Gestão Acadêmica",
      status: "online",
      resources: ["/students", "/teachers", "/courses", "/enrollments"],
    });
  });

  app.use("/auth", auth.router);
  app.use("/students", auth.requireToken, createPeopleRouter(db, "students"));
  app.use("/teachers", auth.requireToken, createPeopleRouter(db, "teachers"));
  app.use("/courses", auth.requireToken, createCoursesRouter(db));
  app.use("/enrollments", auth.requireToken, createEnrollmentsRouter(db));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
