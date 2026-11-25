export const resources = ["students", "teachers", "courses", "enrollments"] as const;
export type Resource = (typeof resources)[number];
export type FieldKey = "name" | "email" | "title" | "workloadHours" | "teacherId" | "studentId" | "courseId" | "status";
export type Entry = { id: number; createdAt: string } & Partial<Record<FieldKey, string | number | null>>;
export type Records = Record<Resource, Entry[]>;
export type Form = Partial<Record<FieldKey, string>>;

type Field = {
  key: FieldKey;
  label: string;
  type?: "email" | "number";
  choices?: Resource | "statuses";
  optional?: boolean;
};

const personFields: Field[] = [
  { key: "name", label: "Nome completo" },
  { key: "email", label: "E-mail", type: "email" },
];

export const config: Record<Resource, { plural: string; singular: string; fields: Field[] }> = {
  students: { plural: "Alunos", singular: "Aluno", fields: personFields },
  teachers: { plural: "Professores", singular: "Professor", fields: personFields },
  courses: {
    plural: "Cursos",
    singular: "Curso",
    fields: [
      { key: "title", label: "Nome do curso" },
      { key: "workloadHours", label: "Carga horária", type: "number" },
      { key: "teacherId", label: "Professor responsável", choices: "teachers", optional: true },
    ],
  },
  enrollments: {
    plural: "Matrículas",
    singular: "Matrícula",
    fields: [
      { key: "studentId", label: "Aluno", choices: "students" },
      { key: "courseId", label: "Curso", choices: "courses" },
      { key: "status", label: "Situação", choices: "statuses" },
    ],
  },
};

export const statuses = [
  { value: "active", label: "Ativa" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

export function choicesFor(field: Field, records: Records) {
  if (field.choices === "statuses") return statuses;
  if (!field.choices) return [];

  const options = records[field.choices].map((entry) => ({
    value: String(entry.id),
    label: String(entry.name ?? entry.title),
  }));
  return field.optional ? [{ value: "", label: "Sem professor" }, ...options] : options;
}

export function fieldValue(field: Field, entry: Entry, records: Records) {
  const value = entry[field.key] ?? "";
  if (field.choices) {
    return choicesFor(field, records).find((option) => option.value === String(value))?.label ?? "—";
  }
  return field.key === "workloadHours" ? `${value} h` : String(value);
}

export function entryTitle(resource: Resource, entry: Entry, records: Records) {
  if (resource === "enrollments") {
    const student = records.students.find(({ id }) => id === entry.studentId);
    return String(student?.name ?? `Matrícula #${entry.id}`);
  }
  return String(entry.name ?? entry.title);
}

export function formFor(resource: Resource, entry?: Entry): Form {
  return Object.fromEntries(config[resource].fields.map(({ key }) => [
    key,
    String(entry?.[key] ?? (key === "status" ? "active" : "")),
  ]));
}

export function payloadFor(resource: Resource, form: Form): object {
  return Object.fromEntries(config[resource].fields.map(({ key, label, choices, type, optional }) => {
    const value = form[key]?.trim() ?? "";
    if (!value && !optional) throw new Error(`Preencha o campo «${label}».`);
    if (type === "number" || (choices && choices !== "statuses")) {
      return [key, value ? Number(value) : null];
    }
    return [key, value];
  }));
}
