import express from "express";
import { createDatabase, type AppDatabase } from "./database.js";
import { errorHandler, notFound } from "./middlewares.js";
import { createCoursesRouter } from "./routes/courses.js";
import { createEnrollmentsRouter } from "./routes/enrollments.js";
import { createStudentsRouter } from "./routes/students.js";

export function createApp(db: AppDatabase = createDatabase()) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.json({
      name: "API de Gestão Acadêmica",
      status: "online",
      resources: ["/students", "/courses", "/enrollments"],
    });
  });

  app.use("/students", createStudentsRouter(db));
  app.use("/courses", createCoursesRouter(db));
  app.use("/enrollments", createEnrollmentsRouter(db));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
