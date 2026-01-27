export async function login(dados: { usuario: string; senha: string }) {
  const res = await fetch("http://localhost:3000/auth/login", {
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