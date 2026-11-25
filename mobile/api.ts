import { Platform } from "react-native";

const fallback = Platform.OS === "android" ? "http://10.0.2.2:3333" : "http://localhost:3333";
export const apiUrl = (process.env.EXPO_PUBLIC_API_URL || fallback).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function api<T = void>(
  path: string,
  options: { method?: string; token?: string; body?: object } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(`Não foi possível conectar à API em ${apiUrl}. Confira se ela está rodando e se o endereço está correto.`);
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok) {
    const details = data.errors?.map((issue: { message: string }) => issue.message).join("\n");
    throw new ApiError(response.status, details || data.message || "Não foi possível concluir a operação.");
  }
  return data as T;
}
