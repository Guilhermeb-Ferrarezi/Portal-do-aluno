import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import ConfirmModal from "../components/ConfirmModal";
import MonacoEditor from "../components/MonacoEditor";
import MouseInteractiveBox from "../components/Exercise/MouseInteractiveBox";
import MultipleChoiceQuestion from "../components/Exercise/MultipleChoiceQuestion";
import { criarExercicio, atualizarExercicio, deletarExercicio, listarExercicios, listarTurmas, getRole, type Exercicio, type Turma } from "../services/api";
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
  const [gabarito, setGabarito] = React.useState("");
  const [gabaritoLang, setGabaritoLang] = React.useState("javascript");
  const [modulo, setModulo] = React.useState("");
  const [tema, setTema] = React.useState("");
  const [prazo, setPrazo] = React.useState(""); // datetime-local
  const [publishNow, setPublishNow] = React.useState(true); // Publicar agora ou agendar
  const [publishedAt, setPublishedAt] = React.useState(""); // datetime-local
  const [isTemplate, setIsTemplate] = React.useState(false); // Template ou Atividade Normal
  const [categoria, setCategoria] = React.useState("programacao"); // programacao ou informatica
  const [componenteInterativo, setComponenteInterativo] = React.useState(""); // mouse, multipla, ou vazio
  const [diaNumero, setDiaNumero] = React.useState(1); // Número do dia para componentes interativos
  const [turmasSelecionadas, setTurmasSelecionadas] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);
  const [editandoId, setEditandoId] = React.useState<string | null>(null);

  // Filtros
  const [moduloFiltro, setModuloFiltro] = React.useState("");
  const [tipoFiltro, setTipoFiltro] = React.useState(""); // codigo, texto, todas
  const [templateFiltro, setTemplateFiltro] = React.useState(""); // template, normal, todas
  const [buscaFiltro, setBuscaFiltro] = React.useState("");

  // Turmas
  const [turmasDisponiveis, setTurmasDisponiveis] = React.useState<Turma[]>([]);
  const [turmaFiltro, setTurmaFiltro] = React.useState("todas");

  // Modal de confirmação
  const [modalDeletar, setModalDeletar] = React.useState<{
    isOpen: boolean;
    exercicioId: string | null;
    exercicioTitulo: string | null;
  }>({ isOpen: false, exercicioId: null, exercicioTitulo: null });

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

    // Carregar turmas disponíveis se for professor/admin
    if (canCreate) {
      listarTurmas()
        .then(setTurmasDisponiveis)
        .catch((e) => console.error("Erro ao carregar turmas:", e));
    }
  }, []);

  async function handleSubmit() {
    try {
      setSaving(true);
      setErro(null);
      setOkMsg(null);

      const gabaritoLimpo = gabarito.trim();

      // Auto-gerar descrição se for componente interativo em informatica
      let descricaoFinal = descricao.trim();
      let tituloFinal = titulo.trim();

      if (categoria === "informatica" && componenteInterativo) {
        const nomeComponente = componenteInterativo === "mouse" ? "Mouse" : "Pergunta Múltipla";
        tituloFinal = `Dia ${diaNumero}: ${nomeComponente}`;
        descricaoFinal = `Dia ${diaNumero}: ${nomeComponente}`;
      }

      const dados: any = {
        titulo: tituloFinal,
        descricao: descricaoFinal,
        modulo: modulo.trim(),
        tema: tema.trim() ? tema.trim() : null,
        prazo: prazo ? new Date(prazo).toISOString() : null,
        publicado: publishNow,
        published_at: publishNow ? null : (publishedAt ? new Date(publishedAt).toISOString() : null),
        is_template: isTemplate,
        ...(gabaritoLimpo && categoria === "programacao" ? { gabarito: gabaritoLimpo } : {}),
      };

      if (turmasSelecionadas.length > 0) {
        dados.turma_ids = turmasSelecionadas;
      }

      if (editandoId) {
        // Atualizar exercício existente
        await atualizarExercicio(editandoId, dados);
        setOkMsg("Exercício atualizado!");
        setEditandoId(null);
      } else {
        // Criar novo exercício
        await criarExercicio(dados);
        setOkMsg("Exercício criado!");
      }

      setTitulo("");
      setDescricao("");
      setGabarito("");
      setModulo("");
      setTema("");
      setPrazo("");
      setPublishNow(true);
      setPublishedAt("");
      setIsTemplate(false);
      setCategoria("programacao");
      setComponenteInterativo("");
      setDiaNumero(1);
      setTurmasSelecionadas([]);

      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar exercício");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(exercicio: Exercicio) {
    setTitulo(exercicio.titulo);
    setDescricao(exercicio.descricao);
    setGabarito("");
    setModulo(exercicio.modulo);
    setTema(exercicio.tema || "");
    setIsTemplate(exercicio.is_template || false);

    // Converter data de ISO para formato datetime-local
    if (exercicio.prazo) {
      const date = new Date(exercicio.prazo);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      setPrazo(`${year}-${month}-${day}T${hours}:${minutes}`);
    }

    // Carregar turmas do exercício se existirem
    if (exercicio.turmas) {
      setTurmasSelecionadas(exercicio.turmas.map((t) => t.id));
    } else {
      setTurmasSelecionadas([]);
    }

    setEditandoId(exercicio.id);
    setOkMsg(null);
    setErro(null);

    // Scroll até o formulário
    setTimeout(() => {
      const formElement = document.querySelector(".createExerciseCard");
      formElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleCancel() {
    setTitulo("");
    setDescricao("");
    setGabarito("");
    setModulo("");
    setTema("");
    setPrazo("");
    setIsTemplate(false);
    setCategoria("programacao");
    setComponenteInterativo("");
    setDiaNumero(1);
    setTurmasSelecionadas([]);
    setEditandoId(null);
    setOkMsg(null);
  }

  function abrirModalDeletar(id: string, titulo: string) {
    setModalDeletar({ isOpen: true, exercicioId: id, exercicioTitulo: titulo });
  }

  function fecharModalDeletar() {
    setModalDeletar({ isOpen: false, exercicioId: null, exercicioTitulo: null });
  }

  async function confirmarDeletar() {
    if (!modalDeletar.exercicioId) return;

    try {
      setSaving(true);
      setErro(null);
      setOkMsg(null);

      await deletarExercicio(modalDeletar.exercicioId);
      setOkMsg("Exercício deletado com sucesso!");

      fecharModalDeletar();
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao deletar exercício");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    // Função mantida para compatibilidade, mas agora abre o modal
    const exercicio = items.find((ex) => ex.id === id);
    abrirModalDeletar(id, exercicio?.titulo || "Exercício");
  }

  // Validação especial para componentes interativos em informatica
  const isInteractiveComponent = categoria === "informatica" && componenteInterativo !== "";
  const disabled =
    saving ||
    modulo.trim().length < 1 ||
    (!isInteractiveComponent && titulo.trim().length < 2) ||
    (!isInteractiveComponent && descricao.trim().length < 2);

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
                  disabled={categoria === "informatica" && componenteInterativo !== ""}
                />
              </div>

              {/* CATEGORIA - PROGRAMAÇÃO vs INFORMATICA */}
              <div className="exInputRow">
                <div className="exInputGroup">
                  <label className="exLabel" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="categoria"
                      value="programacao"
                      checked={categoria === "programacao"}
                      onChange={(e) => {
                        setCategoria(e.target.value as any);
                        setComponenteInterativo("");
                      }}
                      style={{ marginRight: "8px", cursor: "pointer" }}
                    />
                    <span style={{ fontWeight: 600 }}>💻 Programação</span>
                  </label>
                </div>

                <div className="exInputGroup">
                  <label className="exLabel" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="categoria"
                      value="informatica"
                      checked={categoria === "informatica"}
                      onChange={(e) => {
                        setCategoria(e.target.value as any);
                        setComponenteInterativo("");
                      }}
                      style={{ marginRight: "8px", cursor: "pointer" }}
                    />
                    <span style={{ fontWeight: 600 }}>📚 Informática</span>
                  </label>
                </div>
              </div>

              {/* TEMPLATE VS ATIVIDADE */}
              <div className="exInputRow">
                <div className="exInputGroup">
                  <label className="exLabel" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="tipoAtividade"
                      value="atividade"
                      checked={!isTemplate}
                      onChange={() => setIsTemplate(false)}
                      style={{ marginRight: "8px", cursor: "pointer" }}
                    />
                    <span style={{ fontWeight: 600 }}>📝 Atividade Padrão</span>
                  </label>
                  <small style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    Atividade padrão para a turma
                  </small>
                </div>

                <div className="exInputGroup">
                  <label className="exLabel" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="tipoAtividade"
                      value="template"
                      checked={isTemplate}
                      onChange={() => setIsTemplate(true)}
                      style={{ marginRight: "8px", cursor: "pointer" }}
                    />
                    <span style={{ fontWeight: 600 }}>📦 Template (Reutilizável)</span>
                  </label>
                  <small style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    Template reutilizável
                  </small>
                </div>
              </div>

              {/* GABARITO / CÓDIGO ESPERADO - Apenas para Programação */}
              {categoria === "programacao" && (
                <div className="exInputGroup">
                  <label className="exLabel">Gabarito / Codigo esperado</label>
                  <MonacoEditor
                    value={gabarito}
                    onChange={(v) => setGabarito(v || "")}
                    language={gabaritoLang}
                    onLanguageChange={setGabaritoLang}
                    height="240px"
                    theme="light"
                  />
                  <small style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    Esse texto sera usado para comparar se a resposta do aluno esta parecida com o esperado.
                  </small>
                </div>
              )}

              {/* COMPONENTES INTERATIVOS - Apenas para Informática */}
              {categoria === "informatica" && (
                <>
                  <div className="exInputGroup">
                    <label className="exLabel">Componente Interativo</label>
                    <select
                      className="exSelect"
                      value={componenteInterativo}
                      onChange={(e) => setComponenteInterativo(e.target.value)}
                    >
                      <option value="">Nenhum (Exercício Normal)</option>
                      <option value="mouse">🖱️ Mouse</option>
                      <option value="multipla">❓ Múltipla Escolha</option>
                    </select>
                  </div>

                  {/* Campo "Dia #" quando um componente é selecionado */}
                  {componenteInterativo && (
                    <div className="exInputGroup">
                      <label className="exLabel">Dia #</label>
                      <input
                        className="exInput"
                        type="number"
                        min="1"
                        value={diaNumero}
                        onChange={(e) => setDiaNumero(parseInt(e.target.value) || 1)}
                        placeholder="Digite o número do dia"
                      />
                      <small style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Título será: "Dia {diaNumero}: {componenteInterativo === "mouse" ? "Mouse" : "Pergunta Múltipla"}"
                      </small>
                    </div>
                  )}

                  {/* PREVIEW DO COMPONENTE MOUSE */}
                  {componenteInterativo === "mouse" && (
                    <div style={{
                      background: "#f9fafb",
                      border: "2px dashed #e5e7eb",
                      borderRadius: "12px",
                      padding: "20px",
                      marginTop: "16px",
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginTop: 0, marginBottom: "12px" }}>
                        📋 PREVIEW - Como o aluno vai ver:
                      </p>
                      <MouseInteractiveBox
                        title="🖱️ Interação com Mouse"
                        instruction="Clique, duplo-clique ou clique direito para registrar suas ações"
                      />
                    </div>
                  )}

                  {/* PREVIEW DO COMPONENTE MÚLTIPLA ESCOLHA */}
                  {componenteInterativo === "multipla" && (
                    <div style={{
                      background: "#f9fafb",
                      border: "2px dashed #e5e7eb",
                      borderRadius: "12px",
                      padding: "20px",
                      marginTop: "16px",
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginTop: 0, marginBottom: "12px" }}>
                        📋 PREVIEW - Como o aluno vai ver:
                      </p>
                      <MultipleChoiceQuestion
                        question="Qual é a resposta correta?"
                        options={[
                          { letter: "A", text: "Opção A - Exemplo" },
                          { letter: "B", text: "Opção B - Exemplo" },
                          { letter: "C", text: "Opção C - Exemplo" },
                          { letter: "D", text: "Opção D - Exemplo" },
                        ]}
                        onAnswer={() => {}}
                      />
                    </div>
                  )}
                </>
              )}

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

              {/* AGENDAMENTO DE PUBLICAÇÃO */}
              <div className="exInputRow">
                <div className="exInputGroup">
                  <label className="exLabel" style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={publishNow}
                      onChange={(e) => setPublishNow(e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    Publicar agora
                  </label>
                </div>
              </div>

              {!publishNow && (
                <div className="exInputRow">
                  <div className="exInputGroup">
                    <label className="exLabel">📅 Agendar Publicação</label>
                    <input
                      className="exInput"
                      type="datetime-local"
                      value={publishedAt}
                      onChange={(e) => setPublishedAt(e.target.value)}
                      required={!publishNow}
                    />
                    <small style={{ color: "#666", marginTop: "4px" }}>
                      O exercício será visível a partir dessa data e hora
                    </small>
                  </div>
                </div>
              )}

              {canCreate && turmasDisponiveis.length > 0 && (
                <div className="exInputGroup">
                  <label className="exLabel">Turmas</label>
                  <select
                    className="exSelect"
                    multiple
                    value={turmasSelecionadas}
                    onChange={(e) =>
                      setTurmasSelecionadas(
                        Array.from(e.target.selectedOptions, (opt) => opt.value)
                      )
                    }
                    size={3}
                  >
                    {turmasDisponiveis.map((turma) => (
                      <option key={turma.id} value={turma.id}>
                        {turma.nome}
                      </option>
                    ))}
                  </select>
                  <small style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    Segure Ctrl/Cmd para selecionar múltiplas turmas
                  </small>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button className="exSubmitBtn" onClick={handleSubmit} disabled={disabled} style={{ flex: 1 }}>
                  {saving ? "⏳ Salvando..." : editandoId ? "💾 Atualizar Exercício" : "✨ Publicar Exercício"}
                </button>
                {editandoId && (
                  <button
                    className="exSubmitBtn"
                    onClick={handleCancel}
                    disabled={saving}
                    style={{
                      background: "linear-gradient(135deg, #6b7280, #4b5563)",
                      flex: 1,
                    }}
                  >
                    ❌ Cancelar
                  </button>
                )}
              </div>

              <div className="exFormNote">
                💡 Exercícios criados ficam visíveis para todos os alunos automaticamente.
              </div>
            </div>
          </div>
        )}

        {/* FILTROS DE EXERCÍCIOS */}
        <div className="filtersSection">
          <div className="filterRow">
            {/* Busca por título */}
            <div className="filterGroup">
              <input
                className="exInput"
                type="text"
                placeholder="🔍 Buscar por título..."
                value={buscaFiltro}
                onChange={(e) => setBuscaFiltro(e.target.value)}
                style={{ minWidth: 200 }}
              />
            </div>

            {/* Filtro de módulo */}
            <div className="filterGroup">
              <select
                className="exSelect"
                value={moduloFiltro}
                onChange={(e) => setModuloFiltro(e.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">📚 Todos os Módulos</option>
                {Array.from(new Set(items.map((ex) => ex.modulo)))
                  .sort()
                  .map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filtro de tipo */}
            <div className="filterGroup">
              <select
                className="exSelect"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">💻 Todos os Tipos</option>
                <option value="codigo">💻 Código</option>
                <option value="texto">✍️ Texto</option>
              </select>
            </div>

            {/* Filtro de template */}
            <div className="filterGroup">
              <select
                className="exSelect"
                value={templateFiltro}
                onChange={(e) => setTemplateFiltro(e.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">📦 Todos</option>
                <option value="template">📦 Templates</option>
                <option value="normal">📝 Atividades</option>
              </select>
            </div>
          </div>

          {/* Filtro de turmas - se aplicável */}
          {turmasDisponiveis.length > 0 && (
            <div className="filterRow">
              <div className="filterGroup">
                <select
                  className="exSelect"
                  value={turmaFiltro}
                  onChange={(e) => setTurmaFiltro(e.target.value)}
                  style={{ minWidth: 200 }}
                >
                  <option value="todas">👥 Todas as turmas</option>
                  {turmasDisponiveis.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

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
              {items
                .filter((ex) => {
                  // Filtro de busca por título
                  if (
                    buscaFiltro &&
                    !ex.titulo.toLowerCase().includes(buscaFiltro.toLowerCase())
                  ) {
                    return false;
                  }

                  // Filtro de módulo
                  if (moduloFiltro && ex.modulo !== moduloFiltro) {
                    return false;
                  }

                  // Filtro de tipo
                  if (tipoFiltro && ex.tipoExercicio !== tipoFiltro) {
                    return false;
                  }

                  // Filtro de template
                  if (templateFiltro === "template" && !ex.is_template) {
                    return false;
                  }
                  if (templateFiltro === "normal" && ex.is_template) {
                    return false;
                  }

                  // Filtro de turma
                  if (turmaFiltro === "todas") return true;
                  return ex.turmas?.some((t) => t.id === turmaFiltro);
                })
                .map((ex) => (
                <div
                  key={ex.id}
                  className={`exerciseCard ${canCreate ? "canEdit" : ""}`}
                  onClick={() => navigate(`/dashboard/exercicios/${ex.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/dashboard/exercicios/${ex.id}`);
                    }
                  }}
                >
                  {canCreate && (
                    <div className="exerciseActions">
                      <button
                        className="exerciseEditBtn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(ex);
                        }}
                        title="Editar exercício"
                      >
                        ✏️
                      </button>
                      <button
                        className="exerciseDeleteBtn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ex.id);
                        }}
                        title="Deletar exercício"
                      >
                        🗑️
                      </button>
                    </div>
                  )}

                  <div className="exerciseHeader">
                    <div className="exerciseInfo">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 className="exerciseTitle">{ex.titulo}</h3>
                        {ex.is_template && (
                          <span className="exerciseBadge" style={{ background: "#8b5cf6", color: "white" }} title="Este é um template reutilizável">
                            📦 Template
                          </span>
                        )}
                        {ex.publishedAt && new Date(ex.publishedAt) > new Date() && (
                          <span className="exerciseBadge" style={{ background: "#3b82f6", color: "white" }} title="Exercício programado para publicação">
                            📅 Programado
                          </span>
                        )}
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

                  {ex.turmas && ex.turmas.length > 0 && (
                    <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {ex.turmas.map((turma) => (
                        <span key={turma.id} className={`turmaBadge ${turma.tipo}`}>
                          {turma.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL DE CONFIRMAÇÃO PARA DELETAR */}
        <ConfirmModal
          isOpen={modalDeletar.isOpen}
          title="Deletar Exercício"
          message={`Tem certeza que deseja deletar "${modalDeletar.exercicioTitulo}"? Esta ação não pode ser desfeita e todas as submissões serão perdidas.`}
          confirmText="Deletar"
          cancelText="Cancelar"
          onConfirm={confirmarDeletar}
          onCancel={fecharModalDeletar}
          danger={true}
          isLoading={saving}
        />
      </div>
    </DashboardLayout>
  );
}
