import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ZodType } from "zod";

export function validate(schema: ZodType, target: "body" | "params"): RequestHandler {
  return (request, response, next) => {
    const result = schema.safeParse(request[target]);

    if (!result.success) {
      response.status(400).json({
        message: "Dados inválidos",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    request[target] = result.data;
    next();
  };
}

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({ message: "Rota não encontrada" });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const message = error instanceof Error ? error.message : "Erro interno";

  if (message.includes("UNIQUE constraint failed")) {
    response.status(409).json({ message: "Já existe um registro com esses dados" });
    return;
  }

  if (message.includes("FOREIGN KEY constraint failed")) {
    response.status(409).json({
      message: "Operação não permitida: verifique os registros relacionados",
    });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Ocorreu um erro interno no servidor" });
};
