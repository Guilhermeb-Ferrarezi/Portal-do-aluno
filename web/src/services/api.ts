// src/services/api.ts
type Role = "admin" | "professor" | "aluno";

const DEFAULT_PROD = "https://portaldoaluno.santos-tech.com/api";
const DEFAULT_DEV = "http://localhost:3000/api";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.DEV ? DEFAULT_DEV : DEFAULT_PROD);

async function parseError(res: Response) {
  const data = await res.json().catch(() => null);
  return data?.message ?? `Erro ${res.status}`;
}

export async function login(dados: { usuario: string; senha: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    message: string;
    token: string;
    user: { id: string; usuario: string; nome: string; role: Role };
  }>;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as T;
}

export type Exercicio = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  tema: string | null;
  prazo: string | null;
  createdAt: string;
};

export async function listarExercicios() {
  return apiFetch<Exercicio[]>("/exercicios");
}

export async function criarExercicio(dados: {
  titulo: string;
  descricao: string;
  modulo: string;
  tema?: string | null;
  prazo?: string | null; // ISO string ou null
  publicado?: boolean;
}) {
  return apiFetch<{ message: string; exercicio: unknown }>("/exercicios", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function getRole(): Role | null {
  const r = localStorage.getItem("role");
  return r === "admin" || r === "professor" || r === "aluno" ? r : null;
}
