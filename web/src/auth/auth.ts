export type Role = "admin" | "professor" | "aluno";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getRole(): Role | null {
  const r = localStorage.getItem("role");
  if (r === "admin" || r === "professor" || r === "aluno") return r;
  return null;
}

export function getName(): string | null {
  const n = localStorage.getItem("nome");
  return n && n.trim().length > 0 ? n : null;
}

export function isLoggedIn(): boolean {
  const token = getToken();
  return !!token && token.length > 10;
}

export function hasRole(allowed: Role[]): boolean {
  const role = getRole();
  return !!role && allowed.includes(role);
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("nome");
  localStorage.removeItem("role");
}
