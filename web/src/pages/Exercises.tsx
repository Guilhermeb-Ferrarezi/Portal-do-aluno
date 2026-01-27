import React from "react";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import { criarExercicio, listarExercicios, getRole, type Exercicio } from "../services/api";

export default function ExerciciosPage() {
  const role = getRole() ?? "aluno";
  const canCreate = role === "admin" || role === "professor";

  const [items, setItems] = React.useState<Exercicio[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  // form
  const [titulo, setTitulo] = React.useState("");
  const [descricao, setDescricao] = React.useState("");
  const [modulo, setModulo] = React.useState("");
  const [tema, setTema] = React.useState("");
  const [prazo, setPrazo] = React.useState(""); // datetime-local
  const [saving, setSaving] = React.useState(false);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErro(null);
      const data = await listarExercicios();
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

  async function handleCreate() {
    try {
      setSaving(true);
      setErro(null);
      setOkMsg(null);

      await criarExercicio({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        modulo: modulo.trim(),
        tema: tema.trim() ? tema.trim() : null,
        prazo: prazo ? new Date(prazo).toISOString() : null,
        publicado: true,
      });

      setOkMsg("Exercício criado!");
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

  const disabled =
    saving ||
    titulo.trim().length < 2 ||
    descricao.trim().length < 2 ||
    modulo.trim().length < 1;

  return (
    <DashboardLayout title="Exercícios" subtitle="Veja e pratique os exercícios disponíveis">
      <div style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0, display: "none" }}>Exercícios</h1>
          <button onClick={load} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>

      {erro && (
        <div style={{ marginTop: 12, color: "crimson", fontWeight: 700 }}>
          {erro}
        </div>
      )}

      {okMsg && (
        <div style={{ marginTop: 12, color: "green", fontWeight: 700 }}>
          {okMsg}
        </div>
      )}

      {!canCreate && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#f5f5f5", borderLeft: "4px solid var(--red)" }}>
          <div style={{ fontWeight: 600 }}>Você não tem permissão para criar exercícios</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
            Apenas professores e administradores podem criar exercícios.
          </div>
        </div>
      )}

      {canCreate && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 12,
            background: "#fff",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Criar exercício</h2>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            <textarea
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                style={{ flex: 1, minWidth: 180 }}
                placeholder="Módulo"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
              />

              <input
                style={{ flex: 1, minWidth: 180 }}
                placeholder="Tema (opcional)"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
              />

              <input
                style={{ minWidth: 220 }}
                type="datetime-local"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                title="Prazo (opcional)"
              />
            </div>

            <button onClick={handleCreate} disabled={disabled}>
              {saving ? "Salvando..." : "Publicar"}
            </button>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Obs: exercícios criados com publicado=true ficam visíveis para todos os alunos.
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {!loading && items.length === 0 && (
          <div>Nenhum exercício publicado ainda.</div>
        )}

        {items.map((ex) => (
          <div
            key={ex.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
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
      </div>
    </DashboardLayout>
  );
}
