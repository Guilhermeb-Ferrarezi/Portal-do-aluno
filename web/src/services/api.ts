const API_BASE_URL = "https://portaldoaluno.santos-tech.com/api";

export async function login(dados: { usuario: string; senha: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    var data = await res.json().catch(() => null);

    throw new Error(
      data?.message ?? `Erro ${res.status}`
    );
  }

  return res.json();
}
