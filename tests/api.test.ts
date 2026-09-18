import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/database.js";

const db = createDatabase(":memory:");
const app = createApp(db);

after(() => db.close());

describe("API de Gestão Acadêmica", () => {
  let studentId: number;
  let courseId: number;
  let enrollmentId: number;

  before(async () => {
    const student = await request(app)
      .post("/students")
      .send({ name: "Ana Souza", email: "ana@example.com" });
    const course = await request(app)
      .post("/courses")
      .send({ title: "Desenvolvimento Web", workloadHours: 80 });

    studentId = student.body.id;
    courseId = course.body.id;
  });

  it("cria, lista, atualiza e remove um aluno", async () => {
    const created = await request(app)
      .post("/students")
      .send({ name: "Carlos Lima", email: "carlos@example.com" })
      .expect(201);

    await request(app).get(`/students/${created.body.id}`).expect(200);
    await request(app)
      .put(`/students/${created.body.id}`)
      .send({ name: "Carlos Lima Junior", email: "carlos.junior@example.com" })
      .expect(200);
    await request(app).delete(`/students/${created.body.id}`).expect(204);
  });

  it("cria, lista, atualiza e remove um curso", async () => {
    const created = await request(app)
      .post("/courses")
      .send({ title: "Banco de Dados", workloadHours: 60 })
      .expect(201);

    await request(app).get(`/courses/${created.body.id}`).expect(200);
    await request(app)
      .put(`/courses/${created.body.id}`)
      .send({ title: "Banco de Dados II", workloadHours: 72 })
      .expect(200);
    await request(app).delete(`/courses/${created.body.id}`).expect(204);
  });

  it("cria, lista, atualiza e remove uma matrícula", async () => {
    const created = await request(app)
      .post("/enrollments")
      .send({ studentId, courseId, status: "active" })
      .expect(201);

    enrollmentId = created.body.id;
    assert.equal(created.body.studentName, "Ana Souza");

    await request(app).get(`/enrollments/${enrollmentId}`).expect(200);
    const updated = await request(app)
      .put(`/enrollments/${enrollmentId}`)
      .send({ studentId, courseId, status: "completed" })
      .expect(200);
    assert.equal(updated.body.status, "completed");

    await request(app).delete(`/enrollments/${enrollmentId}`).expect(204);
  });

  it("rejeita dados inválidos usando Zod", async () => {
    const response = await request(app)
      .post("/students")
      .send({ name: "A", email: "email-invalido" })
      .expect(400);

    assert.equal(response.body.message, "Dados inválidos");
    assert.ok(response.body.errors.length >= 2);
  });

  it("responde 404 para registros inexistentes", async () => {
    await request(app).get("/courses/99999").expect(404);
  });
});
