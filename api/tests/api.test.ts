import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/database.js";

const db = createDatabase(":memory:");
const app = createApp(db);
const credentials = { email: "admin@example.com", password: "senha-de-teste" };
const client = request.agent(app);

after(() => db.close());

describe("API de Gestão Acadêmica", () => {
  let studentId: number;
  let courseId: number;
  let enrollmentId: number;

  before(async () => {
    await request(app).get("/auth/setup").expect(200, { needsAccount: true });
    await request(app).post("/auth/setup").send(credentials).expect(201);
    const login = await request(app).post("/auth/login").send(credentials).expect(200);
    client.set("Authorization", `Bearer ${login.body.token}`);
    const student = await client
      .post("/students")
      .send({ name: "Ana Souza", email: "ana@example.com" }).expect(201);
    const course = await client
      .post("/courses")
      .send({ title: "Desenvolvimento Web", workloadHours: 80 }).expect(201);

    studentId = student.body.id;
    courseId = course.body.id;
  });

  it("protege os quatro recursos e aceita somente o JWT válido", async () => {
    await request(app).get("/auth/setup").expect(200, { needsAccount: false });
    await request(app).post("/auth/setup").send(credentials).expect(409);
    await request(app).post("/auth/login").send({ ...credentials, password: "senha-incorreta" }).expect(401);
    for (const path of ["/students", "/teachers", "/courses", "/enrollments"]) {
      await request(app).get(path).expect(401);
      await request(app).get(path).set("Authorization", "Bearer token-invalido").expect(401);
      await client.get(path).expect(200);
    }
  });

  it("cadastra, consulta, edita, vincula a um curso e exclui um professor", async () => {
    const teacher = await client.post("/teachers")
      .send({ name: "Joana Ribeiro", email: "joana@example.com" }).expect(201);
    const teacherId = teacher.body.id;
    await client.get(`/teachers/${teacherId}`).expect(200);
    await client.put(`/teachers/${teacherId}`)
      .send({ name: "Joana Silva", email: "joana@example.com" }).expect(200);

    const course = { title: "Desenvolvimento Web", workloadHours: 80 };
    await client.put(`/courses/${courseId}`).send({ ...course, teacherId: teacherId + 1 }).expect(409);
    const linked = await client.put(`/courses/${courseId}`).send({ ...course, teacherId }).expect(200);
    assert.equal(linked.body.teacherId, teacherId);
    const updated = await client.put(`/courses/${courseId}`).send(course).expect(200);
    assert.equal(updated.body.teacherId, teacherId);

    await client.delete(`/teachers/${teacherId}`).expect(204);
    const unlinked = await client.get(`/courses/${courseId}`).expect(200);
    assert.equal(unlinked.body.teacherId, null);
  });

  it("cria, lista, atualiza e remove um aluno", async () => {
    const created = await client
      .post("/students")
      .send({ name: "Carlos Lima", email: "carlos@example.com" })
      .expect(201);

    await client.get(`/students/${created.body.id}`).expect(200);
    await client
      .put(`/students/${created.body.id}`)
      .send({ name: "Carlos Lima Junior", email: "carlos.junior@example.com" })
      .expect(200);
    await client.delete(`/students/${created.body.id}`).expect(204);
  });

  it("cria, lista, atualiza e remove um curso", async () => {
    const created = await client
      .post("/courses")
      .send({ title: "Banco de Dados", workloadHours: 60 })
      .expect(201);

    await client.get(`/courses/${created.body.id}`).expect(200);
    await client
      .put(`/courses/${created.body.id}`)
      .send({ title: "Banco de Dados II", workloadHours: 72 })
      .expect(200);
    await client.delete(`/courses/${created.body.id}`).expect(204);
  });

  it("cria, lista, atualiza e remove uma matrícula", async () => {
    const created = await client
      .post("/enrollments")
      .send({ studentId, courseId, status: "active" })
      .expect(201);

    enrollmentId = created.body.id;
    assert.equal(created.body.studentName, "Ana Souza");

    await client.get(`/enrollments/${enrollmentId}`).expect(200);
    const updated = await client
      .put(`/enrollments/${enrollmentId}`)
      .send({ studentId, courseId, status: "completed" })
      .expect(200);
    assert.equal(updated.body.status, "completed");

    await client.delete(`/enrollments/${enrollmentId}`).expect(204);
  });

  it("rejeita dados inválidos usando Zod", async () => {
    const response = await client
      .post("/students")
      .send({ name: "A", email: "email-invalido" })
      .expect(400);

    assert.equal(response.body.message, "Dados inválidos");
    assert.ok(response.body.errors.length >= 2);
  });

  it("responde 404 para registros inexistentes", async () => {
    await client.get("/courses/99999").expect(404);
  });
});
