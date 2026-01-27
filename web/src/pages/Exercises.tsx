import React from "react";
import { apiFetch } from "../services/api";

type Role = "admin" | "professor" | "aluno";

type Exercicio = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  tema: string | null;
  prazo: string | null;
  createdAt: string;
};

export default function Exercises() {
  const role = (localStorage.getItem("role") as Role) || "aluno";
  const canCreate = role === "admin" || role === "professor";

  const [items, setItems] = React.useState<Exercicio[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  // form
  const [titulo, setTitulo] = React.useState("");
  const [descricao, setDescricao] = React.useState("");
  const [modulo, setModulo] = React.useState("");
  const [tema, setTema] = React.useState("");
  const [prazo, setPrazo] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  async function load() {
    try {
      setLoading(true);
      setErro(null);
      const data = await apiFetch<Exercicio[]>("/exercicios");
      setItems(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar exercícios");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function create() {
    try {
      setSaving(true);
      setErro(null);

      await apiFetch<{ exercicio: unknown }>("/exercicios", {
        method: "POST",
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          modulo: modulo.trim(),
          tema: tema.trim() || null,
          prazo: prazo ? new Date(prazo).toISOString() : null,
          publicado: true,
        }),
      });

      setTitulo("");
      setDescricao("");
      setModulo("");
      setTema("");
      setPrazo("");

      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar exercício");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Exercícios</h1>
        <button onClick={load} disabled={loading}>
          {loading ? "Carregando..." : "Atualizar"}
        </button>
      </div>

      {erro && (
        <div style={{ marginTop: 12, color: "crimson", fontWeight: 700 }}>
          {erro}
        </div>
      )}

      {canCreate && (
        <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Criar exercício</h2>

          <div style={{ display: "grid", gap: 10 }}>
            <input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <textarea
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input style={{ flex: 1 }} placeholder="Módulo" value={modulo} onChange={(e) => setModulo(e.target.value)} />
              <input style={{ flex: 1 }} placeholder="Tema (opcional)" value={tema} onChange={(e) => setTema(e.target.value)} />
              <input
                type="datetime-local"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                title="Prazo (opcional)"
              />
            </div>

            <button
              onClick={create}
              disabled={
                saving ||
                titulo.trim().length < 2 ||
                descricao.trim().length < 2 ||
                modulo.trim().length < 1
              }
            >
              {saving ? "Salvando..." : "Publicar"}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {items.map((ex) => (
          <div key={ex.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{ex.titulo}</div>
                <div style={{ opacity: 0.8 }}>
                  {ex.modulo}
                  {ex.tema ? ` • ${ex.tema}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right", opacity: 0.8 }}>
                {ex.prazo ? `Prazo: ${new Date(ex.prazo).toLocaleString()}` : "Sem prazo"}
              </div>
            </div>

            <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{ex.descricao}</div>
          </div>
        ))}

        {!loading && items.length === 0 && <div>Nenhum exercício publicado ainda.</div>}
      </div>
    </div>
  );
}
