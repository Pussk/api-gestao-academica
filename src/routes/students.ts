import { Router } from "express";
import type { AppDatabase } from "../database.js";
import { validate } from "../middlewares.js";
import { idParamsSchema, studentSchema } from "../schemas.js";
import type { StudentRow } from "../types.js";

const mapStudent = (row: StudentRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.created_at,
});

export function createStudentsRouter(db: AppDatabase) {
  const router = Router();

  router.get("/", (_request, response) => {
    const rows = db.prepare("SELECT * FROM students ORDER BY id").all() as StudentRow[];
    response.json(rows.map(mapStudent));
  });

  router.get("/:id", validate(idParamsSchema, "params"), (request, response) => {
    const id = Number(request.params.id);
    const row = db.prepare("SELECT * FROM students WHERE id = ?").get(id) as
      | StudentRow
      | undefined;

    if (!row) {
      response.status(404).json({ message: "Aluno não encontrado" });
      return;
    }

    response.json(mapStudent(row));
  });

  router.post("/", validate(studentSchema, "body"), (request, response) => {
    const { name, email } = request.body;
    const row = db
      .prepare("INSERT INTO students (name, email) VALUES (?, ?) RETURNING *")
      .get(name, email) as StudentRow;
    response.status(201).json(mapStudent(row));
  });

  router.put(
    "/:id",
    validate(idParamsSchema, "params"),
    validate(studentSchema, "body"),
    (request, response) => {
      const id = Number(request.params.id);
      const { name, email } = request.body;
      const row = db
        .prepare("UPDATE students SET name = ?, email = ? WHERE id = ? RETURNING *")
        .get(name, email, id) as StudentRow | undefined;

      if (!row) {
        response.status(404).json({ message: "Aluno não encontrado" });
        return;
      }

      response.json(mapStudent(row));
    },
  );

  router.delete("/:id", validate(idParamsSchema, "params"), (request, response) => {
    const id = Number(request.params.id);
    const result = db.prepare("DELETE FROM students WHERE id = ?").run(id);

    if (result.changes === 0) {
      response.status(404).json({ message: "Aluno não encontrado" });
      return;
    }

    response.status(204).send();
  });

  return router;
}
