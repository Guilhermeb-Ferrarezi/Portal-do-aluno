import React from "react";
import { useNavigate } from "react-router-dom";
import { getRole } from "../auth/auth";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import { apiFetch, type Turma } from "../services/api";
import "./ExerciseTemplates.css";

type Template = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  tema: string | null;
  categoria: string;
  tipoExercicio: string;
  createdAt: string;
};

export default function ExerciseTemplates() {
  const navigate = useNavigate();
  const role = getRole();

  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [mensagem, setMensagem] = React.useState<string | null>(null);
  const [duplicando, setDuplicando] = React.useState<string | null>(null);

  // Modal para enviar tarefa
  const [modalAberto, setModalAberto] = React.useState(false);
  const [templateSelecionado, setTemplateSelecionado] = React.useState<string | null>(null);
  const [turmas, setTurmas] = React.useState<Turma[]>([]);
  const [turmasSelecionadas, setTurmasSelecionadas] = React.useState<string[]>([]);
  const [semanaSelecionada, setSemanaSelecionada] = React.useState<number>(1);
  const [enviandoTarefa, setEnviandoTarefa] = React.useState(false);
  const [carregandoTurmas, setCarregandoTurmas] = React.useState(false);

  // Carregar templates
  React.useEffect(() => {
    if (role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<{ templates: Template[] }>("/templates");
        setTemplates(data.templates);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar templates");
      } finally {
        setLoading(false);
      }
    })();
  }, [role, navigate]);

  const handleDuplicar = async (templateId: string, templateTitulo: string) => {
    const novoTitulo = prompt(
      "Digite o nome do novo exercício:",
      `${templateTitulo} (Cópia)`
    );

    if (!novoTitulo) return;

    try {
      setDuplicando(templateId);
      const response = await apiFetch<any>(
        `/templates/${templateId}/duplicate`,
        {
          method: "POST",
          body: JSON.stringify({ nova_titulo: novoTitulo }),
        }
      );

      setMensagem("✅ Exercício duplicado com sucesso! Redirecionando...");
      setTimeout(() => {
        navigate(`/dashboard/exercicios/${response.exercicio.id}`);
      }, 1500);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao duplicar template");
    } finally {
      setDuplicando(null);
    }
  };

  const abrirModalEnviarTarefa = async (templateId: string) => {
    try {
      setCarregandoTurmas(true);
      setErro(null);
      // Buscar template para pegar categoria
      const templateAtual = templates.find(t => t.id === templateId);
      const data = await apiFetch<Turma[]>("/turmas");
      // Filtrar apenas turmas com cronograma ativo e mesma categoria
      const turmasComCronograma = data.filter(t =>
        t.dataInicio && t.cronogramaAtivo && t.categoria === templateAtual?.categoria
      );
      setTurmas(turmasComCronograma);
      setTemplateSelecionado(templateId);
      setTurmasSelecionadas([]);
      setSemanaSelecionada(1);
      setModalAberto(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar turmas");
    } finally {
      setCarregandoTurmas(false);
    }
  };

  const handleEnviarTarefa = async () => {
    if (!templateSelecionado || turmasSelecionadas.length === 0) {
      setErro("Selecione pelo menos uma turma");
      return;
    }

    try {
      setEnviandoTarefa(true);
      setErro(null);

      // Enviar para cada turma selecionada
      for (const turmaId of turmasSelecionadas) {
        await apiFetch(`/turmas/${turmaId}/cronograma`, {
          method: "POST",
          body: JSON.stringify({
            semanas: [
              {
                semana: semanaSelecionada,
                exercicios: [templateSelecionado],
              },
            ],
          }),
        });
      }

      setMensagem(`✅ Tarefa enviada para ${turmasSelecionadas.length} turma(s)!`);
      setModalAberto(false);
      setTemplateSelecionado(null);
      setTurmasSelecionadas([]);

      setTimeout(() => setMensagem(null), 3000);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao enviar tarefa");
    } finally {
      setEnviandoTarefa(false);
    }
  };

  if (role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout title="Templates de Exercícios" subtitle="Carregando...">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner" />
          Carregando templates...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="📦 Templates de Exercícios"
      subtitle="Gerenciar exercícios pré-prontos reutilizáveis"
    >
      <div className="templatesContainer">
        <div className="templatesHeader">
          <p className="templatesDescription">
            Templates são exercícios pré-prontos que você pode duplicar e reutilizar em múltiplas turmas.
            Economize tempo criando uma biblioteca de exercícios!
          </p>
          <button
            className="btnCreateTemplate"
            onClick={() => navigate("/dashboard/exercicios")}
          >
            ✨ Criar Novo Template
          </button>
        </div>

        {/* MENSAGENS */}
        {erro && (
          <div className="templateMessage error">
            <span>❌</span>
            <span>{erro}</span>
          </div>
        )}

        {mensagem && (
          <div className="templateMessage success">
            <span>✅</span>
            <span>{mensagem}</span>
          </div>
        )}

        {/* TEMPLATES */}
        {templates.length === 0 ? (
          <div className="templateEmpty">
            <div className="templateEmptyIcon">📋</div>
            <h3>Nenhum template criado ainda</h3>
            <p>Vá para Exercícios e marque exercícios como templates para reutilizá-los!</p>
            <button
              className="btnGoToExercises"
              onClick={() => navigate("/dashboard/exercicios")}
            >
              → Ir para Exercícios
            </button>
          </div>
        ) : (
          <div className="templatesGrid">
            {templates.map((template) => (
              <div key={template.id} className="templateCard">
                <div className="templateCardHeader">
                  <div className="templateInfo">
                    <h3 className="templateTitle">{template.titulo}</h3>
                    <p className="templateMeta">
                      <span className="templateModule">{template.modulo}</span>
                      {template.tema && <span className="templateTheme">{template.tema}</span>}
                      <span className={`templateCategory category-${template.categoria}`}>
                        {template.categoria === "informatica" ? "💻 Informática" : "🖥️ Programação"}
                      </span>
                      <span className={`templateType type-${template.tipoExercicio}`}>
                        {template.tipoExercicio === "codigo" ? "💻 Código" : "✍️ Texto"}
                      </span>
                    </p>
                  </div>
                  <button
                    className="templateIconBtn"
                    title="Duplicar template"
                    onClick={() => handleDuplicar(template.id, template.titulo)}
                    disabled={duplicando === template.id}
                  >
                    {duplicando === template.id ? "⏳" : "📋"}
                  </button>
                </div>

                <p className="templateDescription">
                  {template.descricao.substring(0, 150)}
                  {template.descricao.length > 150 ? "..." : ""}
                </p>

                <div className="templateFooter">
                  <span className="templateDate">
                    {new Date(template.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="templateBtnView"
                      onClick={() => abrirModalEnviarTarefa(template.id)}
                      title="Enviar template para turmas"
                    >
                      📤 Enviar
                    </button>
                    <button
                      className="templateBtnView"
                      onClick={() => navigate(`/dashboard/exercicios/${template.id}`)}
                    >
                      Ver →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL ENVIAR TAREFA */}
        {modalAberto && (() => {
          const templateAtual = templates.find(t => t.id === templateSelecionado);
          const isInformatica = templateAtual?.categoria === "informatica";
          return (
            <div className="modalOverlay" onClick={() => setModalAberto(false)}>
              <div className="modalContent" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0 }}>📤 Enviar Template para Turmas</h3>
                  {templateAtual && (
                    <span style={{
                      padding: "4px 12px",
                      background: isInformatica ? "#dbeafe" : "#dcfce7",
                      color: isInformatica ? "#075985" : "#166534",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}>
                      {isInformatica ? "💻 Informática" : "🖥️ Programação"}
                    </span>
                  )}
                </div>

                {carregandoTurmas ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <div className="spinner" />
                    Carregando turmas...
                  </div>
                ) : (
                  <>
                    {erro && (
                      <div style={{ padding: "12px", background: "#fee2e2", borderRadius: "4px", marginBottom: "16px", color: "#991b1b" }}>
                        ❌ {erro}
                      </div>
                    )}

                  {turmas.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                      <p>Nenhuma turma com cronograma ativo encontrada.</p>
                      <small>
                        {isInformatica
                          ? "Configure turmas de Informática com cronograma ativo."
                          : "Configure turmas de Programação com cronograma ativo."}
                      </small>
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: "12px", background: isInformatica ? "#f0f9ff" : "#f7fee7", borderRadius: "4px", marginBottom: "16px", fontSize: "13px", color: isInformatica ? "#075985" : "#166534" }}>
                        📚 Mostrando turmas de <strong>{isInformatica ? "Informática" : "Programação"}</strong> com cronograma ativo
                      </div>

                      <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "14px" }}>
                          Semana:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={semanaSelecionada}
                          onChange={(e) => setSemanaSelecionada(Number(e.target.value))}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid var(--border)",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                        />
                        <small style={{ color: "var(--muted)" }}>Semana em que o exercício será liberado</small>
                      </div>

                      <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "14px" }}>
                          Turmas ({turmasSelecionadas.length} selecionada{turmasSelecionadas.length !== 1 ? "s" : ""}):
                        </label>
                        <div style={{ maxHeight: "250px", overflow: "auto", border: "1px solid var(--border)", borderRadius: "4px" }}>
                          {turmas.map((turma) => (
                            <label
                              key={turma.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                                borderBottom: "1px solid var(--border)",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={turmasSelecionadas.includes(turma.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTurmasSelecionadas([...turmasSelecionadas, turma.id]);
                                  } else {
                                    setTurmasSelecionadas(turmasSelecionadas.filter((id) => id !== turma.id));
                                  }
                                }}
                                style={{ marginRight: "12px", width: "18px", height: "18px", cursor: "pointer" }}
                              />
                              <div>
                                <div style={{ fontWeight: 500 }}>{turma.nome}</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                                  Início: {new Date(turma.dataInicio!).toLocaleDateString("pt-BR")}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  onClick={() => setModalAberto(false)}
                  disabled={enviandoTarefa}
                  style={{
                    padding: "10px 16px",
                    background: "var(--border)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: enviandoTarefa ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviarTarefa}
                  disabled={enviandoTarefa || turmasSelecionadas.length === 0}
                  style={{
                    padding: "10px 16px",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: enviandoTarefa || turmasSelecionadas.length === 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    opacity: (enviandoTarefa || turmasSelecionadas.length === 0) ? 0.6 : 1,
                  }}
                >
                  {enviandoTarefa ? "⏳ Enviando..." : "📤 Enviar Tarefa"}
                </button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
