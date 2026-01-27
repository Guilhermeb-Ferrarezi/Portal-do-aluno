import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import { criarExercicio, listarExercicios, getRole, type Exercicio } from "../services/api";
import "./Exercises.css";

export default function ExerciciosPage() {
  const navigate = useNavigate();
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
      <div className="exercisesContainer">
        {/* HEADER COM BOTÃO */}
        <div className="exercisesHeader">
          <div />
          <button className="refreshBtn" onClick={load} disabled={loading}>
            {loading ? "⏳ Carregando..." : "🔄 Atualizar"}
          </button>
        </div>

        {/* MENSAGENS */}
        {erro && (
          <div className="exMessage error">
            <span>❌</span>
            <span>{erro}</span>
          </div>
        )}

        {okMsg && (
          <div className="exMessage success">
            <span>✅</span>
            <span>{okMsg}</span>
          </div>
        )}

        {!canCreate && (
          <div className="exMessage warning">
            <span>🔒</span>
            <div>
              <div style={{ fontWeight: 700 }}>Você não tem permissão para criar exercícios</div>
              <div style={{ fontSize: 13, marginTop: 2, opacity: 0.9 }}>
                Apenas professores e administradores podem criar exercícios.
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO DE CRIAR */}
        {canCreate && (
          <div className="createExerciseCard">
            <h2 className="exFormTitle">Criar novo exercício</h2>

            <div className="exFormGrid">
              <div className="exInputGroup">
                <label className="exLabel">Título *</label>
                <input
                  className="exInput"
                  placeholder="ex: Exercício 15.3: Layout Responsivo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="exInputGroup">
                <label className="exLabel">Descrição *</label>
                <textarea
                  className="exTextarea"
                  placeholder="Descreva o exercício em detalhes..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="exInputRow">
                <div className="exInputGroup">
                  <label className="exLabel">Módulo *</label>
                  <input
                    className="exInput"
                    placeholder="ex: MÓDULO 4"
                    value={modulo}
                    onChange={(e) => setModulo(e.target.value)}
                  />
                </div>

                <div className="exInputGroup">
                  <label className="exLabel">Tema</label>
                  <input
                    className="exInput"
                    placeholder="ex: HTML5 e CSS3 Avançado"
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                  />
                </div>

                <div className="exInputGroup">
                  <label className="exLabel">Prazo</label>
                  <input
                    className="exInput"
                    type="datetime-local"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                  />
                </div>
              </div>

              <button className="exSubmitBtn" onClick={handleCreate} disabled={disabled}>
                {saving ? "⏳ Salvando..." : "✨ Publicar Exercício"}
              </button>

              <div className="exFormNote">
                💡 Exercícios criados ficam visíveis para todos os alunos automaticamente.
              </div>
            </div>
          </div>
        )}

        {/* LISTA DE EXERCÍCIOS */}
        <div>
          {loading && items.length === 0 ? (
            <div className="loadingState">
              <div className="spinner" />
              Carregando exercícios...
            </div>
          ) : !loading && items.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">📚</div>
              <div className="emptyTitle">Nenhum exercício disponível</div>
              <p style={{ margin: "8px 0 0 0", color: "var(--muted)" }}>
                Volte mais tarde para novos exercícios!
              </p>
            </div>
          ) : (
            <div className="exercisesList">
              {items.map((ex) => (
                <div
                  key={ex.id}
                  className="exerciseCard"
                  onClick={() => navigate(`/dashboard/exercicios/${ex.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/dashboard/exercicios/${ex.id}`);
                    }
                  }}
                >
                  <div className="exerciseHeader">
                    <div className="exerciseInfo">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 className="exerciseTitle">{ex.titulo}</h3>
                        {ex.tipoExercicio && (
                          <span className="exerciseBadge" title={ex.tipoExercicio === "codigo" ? "Exercício de código" : "Exercício de digitação"}>
                            {ex.tipoExercicio === "codigo" ? "💻" : "✍️"}
                          </span>
                        )}
                      </div>
                      <div className="exerciseModule">
                        {ex.modulo}
                        {ex.tema && (
                          <span className="exerciseTopic">{ex.tema}</span>
                        )}
                      </div>
                    </div>
                    <div className="exerciseMeta">
                      <div className={`exerciseDeadline ${
                        ex.prazo && new Date(ex.prazo) < new Date() ? "overdue" : ""
                      }`}>
                        {ex.prazo
                          ? new Date(ex.prazo).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "Sem prazo"
                        }
                      </div>
                    </div>
                  </div>

                  <div className="exerciseDescription">{ex.descricao}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
