import { Router } from "express";
import type { AppDatabase } from "../database.js";
import { validate } from "../middlewares.js";
import { enrollmentSchema, idParamsSchema } from "../schemas.js";
import type { EnrollmentDetailsRow } from "../types.js";

const selectEnrollment = `
  SELECT e.*, s.name AS student_name, c.title AS course_title
  FROM enrollments e
  JOIN students s ON s.id = e.student_id
  JOIN courses c ON c.id = e.course_id
`;

const mapEnrollment = (row: EnrollmentDetailsRow) => ({
  id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  courseId: row.course_id,
  courseTitle: row.course_title,
  status: row.status,
  createdAt: row.created_at,
});

export function createEnrollmentsRouter(db: AppDatabase) {
  const router = Router();

  const findById = (id: number) =>
    db.prepare(`${selectEnrollment} WHERE e.id = ?`).get(id) as EnrollmentDetailsRow | undefined;

  router.get("/", (_request, response) => {
    const rows = db.prepare(`${selectEnrollment} ORDER BY e.id`).all() as EnrollmentDetailsRow[];
    response.json(rows.map(mapEnrollment));
  });

  router.get("/:id", validate(idParamsSchema, "params"), (request, response) => {
    const row = findById(Number(request.params.id));

    if (!row) {
      response.status(404).json({ message: "Matrícula não encontrada" });
      return;
    }

    response.json(mapEnrollment(row));
  });

  router.post("/", validate(enrollmentSchema, "body"), (request, response) => {
    const { studentId, courseId, status } = request.body;
    const result = db
      .prepare("INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, ?)")
      .run(studentId, courseId, status);
    const row = findById(Number(result.lastInsertRowid));
    response.status(201).json(mapEnrollment(row!));
  });

  router.put(
    "/:id",
    validate(idParamsSchema, "params"),
    validate(enrollmentSchema, "body"),
    (request, response) => {
      const id = Number(request.params.id);
      const { studentId, courseId, status } = request.body;
      const result = db
        .prepare(
          "UPDATE enrollments SET student_id = ?, course_id = ?, status = ? WHERE id = ?",
        )
        .run(studentId, courseId, status, id);

      if (result.changes === 0) {
        response.status(404).json({ message: "Matrícula não encontrada" });
        return;
      }

      response.json(mapEnrollment(findById(id)!));
    },
  );

  router.delete("/:id", validate(idParamsSchema, "params"), (request, response) => {
    const id = Number(request.params.id);
    const result = db.prepare("DELETE FROM enrollments WHERE id = ?").run(id);

    if (result.changes === 0) {
      response.status(404).json({ message: "Matrícula não encontrada" });
      return;
    }

    response.status(204).send();
  });

  return router;
}
