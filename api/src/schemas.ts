import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive("O id deve ser um número inteiro positivo"),
});

export const studentSchema = z.object({
  name: z.string().trim().min(3, "O nome precisa ter pelo menos 3 caracteres").max(100),
  email: z.string().trim().email("Informe um e-mail válido").max(150),
});

export const credentialsSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido").max(150).toLowerCase(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(128),
});

export const courseSchema = z.object({
  title: z.string().trim().min(3, "O título precisa ter pelo menos 3 caracteres").max(120),
  workloadHours: z.coerce
    .number()
    .int("A carga horária deve ser um número inteiro")
    .min(1, "A carga horária deve ser maior que zero")
    .max(2000),
  teacherId: z.number().int().positive("Informe um professor válido").nullable().optional(),
});

export const enrollmentSchema = z.object({
  studentId: z.coerce.number().int().positive("Informe um aluno válido"),
  courseId: z.coerce.number().int().positive("Informe um curso válido"),
  status: z.enum(["active", "completed", "cancelled"]).default("active"),
});
