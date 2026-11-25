import { Router } from "express";
import type { AppDatabase } from "../database.js";
import { validate } from "../middlewares.js";
import { courseSchema, idParamsSchema } from "../schemas.js";
import type { CourseRow } from "../types.js";

const mapCourse = (row: CourseRow) => ({
  id: row.id,
  title: row.title,
  workloadHours: row.workload_hours,
  teacherId: row.teacher_id,
  createdAt: row.created_at,
});

export function createCoursesRouter(db: AppDatabase) {
  const router = Router();

  router.get("/", (_request, response) => {
    const rows = db.prepare("SELECT * FROM courses ORDER BY id").all() as CourseRow[];
    response.json(rows.map(mapCourse));
  });

  router.get("/:id", validate(idParamsSchema, "params"), (request, response) => {
    const id = Number(request.params.id);
    const row = db.prepare("SELECT * FROM courses WHERE id = ?").get(id) as
      | CourseRow
      | undefined;

    if (!row) {
      response.status(404).json({ message: "Curso não encontrado" });
      return;
    }

    response.json(mapCourse(row));
  });

  router.post("/", validate(courseSchema, "body"), (request, response) => {
    const { title, workloadHours, teacherId = null } = request.body;
    const row = db
      .prepare("INSERT INTO courses (title, workload_hours, teacher_id) VALUES (?, ?, ?) RETURNING *")
      .get(title, workloadHours, teacherId) as CourseRow;
    response.status(201).json(mapCourse(row));
  });

  router.put(
    "/:id",
    validate(idParamsSchema, "params"),
    validate(courseSchema, "body"),
    (request, response) => {
      const id = Number(request.params.id);
      const { title, workloadHours, teacherId } = request.body;
      const row = db
        .prepare(`UPDATE courses
          SET title = ?, workload_hours = ?,
              teacher_id = CASE WHEN ? THEN ? ELSE teacher_id END
          WHERE id = ? RETURNING *`)
        .get(title, workloadHours, teacherId === undefined ? 0 : 1, teacherId ?? null, id) as CourseRow | undefined;

      if (!row) {
        response.status(404).json({ message: "Curso não encontrado" });
        return;
      }

      response.json(mapCourse(row));
    },
  );

  router.delete("/:id", validate(idParamsSchema, "params"), (request, response) => {
    const id = Number(request.params.id);
    const result = db.prepare("DELETE FROM courses WHERE id = ?").run(id);

    if (result.changes === 0) {
      response.status(404).json({ message: "Curso não encontrado" });
      return;
    }

    response.status(204).send();
  });

  return router;
}
