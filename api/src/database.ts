import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function createDatabase(filename = process.env.DB_PATH ?? "data/database.sqlite") {
  if (filename !== ":memory:") {
    const absolutePath = resolve(filename);
    mkdirSync(dirname(absolutePath), { recursive: true });
    filename = absolutePath;
  }

  const db = new DatabaseSync(filename, { timeout: 5000 });
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      workload_hours INTEGER NOT NULL CHECK (workload_hours > 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (student_id, course_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
    );
  `);

  db.exec("BEGIN IMMEDIATE");
  try {
    if (!db.prepare("PRAGMA table_info(courses)").all().some((column) => column.name === "teacher_id")) {
      db.exec("ALTER TABLE courses ADD COLUMN teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL");
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.close();
    throw error;
  }

  return db;
}

export type AppDatabase = ReturnType<typeof createDatabase>;
