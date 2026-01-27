// src/services/api.ts
type Role = "admin" | "professor" | "aluno";

// 1) Se você configurar VITE_API_URL, ele manda
// 2) Senão, escolhe conforme o ambiente do Vite
const DEFAULT_PROD = "https://portaldoaluno.santos-tech.com/api";
const DEFAULT_DEV = "http://localhost:3000";

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
  return res.json();
}

// helper genérico pra requests autenticados
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
  return res.json() as Promise<T>;
}

// exemplo: pegar exercícios públicos
export async function listarExercicios() {
  return apiFetch<
    Array<{
      id: string;
      titulo: string;
      descricao: string;
      modulo: string;
      tema: string | null;
      prazo: string | null;
      createdAt: string;
    }>
  >("/exercicios");
}

// exemplo: criar exercício (admin/professor)
export async function criarExercicio(dados: {
  titulo: string;
  descricao: string;
  modulo: string;
  tema?: string | null;
  prazo?: string | null; // ISO string
  publicado?: boolean;
}) {
  return apiFetch<{ message: string; exercicio: unknown }>("/exercicios", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function getRole(): Role | null {
  const role = localStorage.getItem("role");
  if (role === "admin" || role === "professor" || role === "aluno") return role;
  return null;
}
