import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import {
  listarTurmas,
  criarTurma,
  atualizarTurma,
  deletarTurma,
  getRole,
  listarProfessores,
  type Turma,
  type User,
} from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import "./Turmas.css";

export default function TurmasPage() {
  const navigate = useNavigate();
  const role = getRole();
  const canCreate = role === "admin" || role === "professor";

  const [turmas, setTurmas] = React.useState<Turma[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  // Form
  const [nome, setNome] = React.useState("");
  const [tipo, setTipo] = React.useState<"turma" | "particular">("turma");
  const [categoria, setCategoria] = React.useState<"programacao" | "informatica">("programacao");
  const [descricao, setDescricao] = React.useState("");
  const [professorId, setProfessorId] = React.useState("");
  const [professores, setProfessores] = React.useState<User[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [editandoId, setEditandoId] = React.useState<string | null>(null);

  // Modal
  const [modalDeletar, setModalDeletar] = React.useState<{
    isOpen: boolean;
    turmaId: string | null;
    turmaNome: string | null;
  }>({ isOpen: false, turmaId: null, turmaNome: null });

  async function load() {
    try {
      setLoading(true);
      setErro(null);
      const data = await listarTurmas();
      setTurmas(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar turmas");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!canCreate) {
      navigate("/dashboard");
      return;
    }
    load();

    // Se for admin, carregar lista de professores
    if (role === "admin") {
      listarProfessores()
        .then(setProfessores)
        .catch((e) => console.error("Erro ao carregar professores:", e));
    }
  }, [canCreate, navigate, role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Nome da turma é obrigatório");
      return;
    }

    try {
      setSaving(true);
      setErro(null);
      setOkMsg(null);

      if (editandoId) {
        await atualizarTurma(editandoId, { nome, tipo, categoria, descricao: descricao || null });
        setOkMsg("Turma atualizada!");
        setEditandoId(null);
      } else {
        const criarDados: any = { nome, tipo, categoria, descricao: descricao || null };

        // Se for admin e selecionou um professor, adicionar ao dados
        if (role === "admin" && professorId) {
          criarDados.professor_id = professorId;
        }

        await criarTurma(criarDados);
        setOkMsg("Turma criada!");
      }

      setNome("");
      setTipo("turma");
      setCategoria("programacao");
      setDescricao("");
      setProfessorId("");
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar turma");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(turma: Turma) {
    setNome(turma.nome);
    setTipo(turma.tipo);
    setCategoria(turma.categoria);
    setDescricao(turma.descricao || "");
    setEditandoId(turma.id);
    setOkMsg(null);

    setTimeout(() => {
      const formElement = document.querySelector(".turmaFormCard");
      formElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleCancel() {
    setNome("");
    setTipo("turma");
    setCategoria("programacao");
    setDescricao("");
    setProfessorId("");
    setEditandoId(null);
    setOkMsg(null);
  }

  function abrirModalDeletar(id: string, nome: string) {
    setModalDeletar({ isOpen: true, turmaId: id, turmaNome: nome });
  }

  function fecharModalDeletar() {
    setModalDeletar({ isOpen: false, turmaId: null, turmaNome: null });
  }

  async function confirmarDeletar() {
    if (!modalDeletar.turmaId) return;

    try {
      setSaving(true);
      await deletarTurma(modalDeletar.turmaId);
      setOkMsg("Turma deletada com sucesso!");
      fecharModalDeletar();
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao deletar turma");
    } finally {
      setSaving(false);
    }
  }

  const disabled =
    saving || !nome.trim();

  return (
    <DashboardLayout
      title="Minhas Turmas"
      subtitle="Gerencie suas turmas e alunos"
    >
      <div className="turmasContainer">
        {/* HEADER */}
        <div className="turmasHeader">
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

        {/* FORMULÁRIO */}
        <div className="turmaFormCard">
          <h2 className="turmaFormTitle">
            {editandoId ? "Editar Turma" : "Criar Nova Turma"}
          </h2>

          <form onSubmit={handleSubmit} className="turmaForm">
            <div className="turmaInputGroup">
              <label className="turmaLabel">Nome da Turma *</label>
              <input
                className="turmaInput"
                placeholder="ex: Turma A 2024"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="turmaInputGroup">
              <label className="turmaLabel">Tipo *</label>
              <select
                className="turmaSelect"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "turma" | "particular")}
              >
                <option value="turma">Turma (Grupo)</option>
                <option value="particular">Particular</option>
              </select>
            </div>

            <div className="turmaInputGroup">
              <label className="turmaLabel">Categoria *</label>
              <select
                className="turmaSelect"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as "programacao" | "informatica")}
              >
                <option value="programacao">Programação</option>
                <option value="informatica">Informática</option>
              </select>
            </div>

            {role === "admin" && (
              <div className="turmaInputGroup">
                <label className="turmaLabel">Professor Responsável</label>
                <select
                  className="turmaSelect"
                  value={professorId}
                  onChange={(e) => setProfessorId(e.target.value)}
                >
                  <option value="">Sem professor definido</option>
                  {professores.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.nome}
                    </option>
                  ))}
                </select>
                <small style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  Deixe em branco para nenhum professor responsável
                </small>
              </div>
            )}

            <div className="turmaInputGroup">
              <label className="turmaLabel">Descrição</label>
              <textarea
                className="turmaTextarea"
                placeholder="Descrição opcional da turma..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="turmaActions">
              <button
                type="submit"
                className="turmaSubmitBtn"
                disabled={disabled}
              >
                {saving
                  ? "⏳ Salvando..."
                  : editandoId
                  ? "💾 Atualizar Turma"
                  : "➕ Criar Turma"}
              </button>
              {editandoId && (
                <button
                  type="button"
                  className="turmaCancelBtn"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LISTA DE TURMAS */}
        <div>
          {loading && turmas.length === 0 ? (
            <div className="loadingState">
              <div className="spinner" />
              Carregando turmas...
            </div>
          ) : !loading && turmas.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">📚</div>
              <div className="emptyTitle">Nenhuma turma registrada</div>
              <p style={{ margin: "8px 0 0 0", color: "var(--muted)" }}>
                Crie sua primeira turma preenchendo o formulário acima.
              </p>
            </div>
          ) : (
            <div className="turmasList">
              {turmas.map((turma) => (
                <div key={turma.id} className="turmaCard">
                  <div className="turmaCardHeader">
                    <div className="turmaCardInfo">
                      <h3 className="turmaCardTitle">{turma.nome}</h3>
                      <span className={`turmaBadge tipo-${turma.tipo}`}>
                        {turma.tipo === "turma" ? "👥 Grupo" : "👤 Particular"}
                      </span>
                    </div>
                    <div className="turmaCardActions">
                      <button
                        className="turmaEditBtn"
                        onClick={() => handleEdit(turma)}
                        title="Editar turma"
                      >
                        ✏️
                      </button>
                      <button
                        className="turmaDeleteBtn"
                        onClick={() => abrirModalDeletar(turma.id, turma.nome)}
                        title="Deletar turma"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {turma.descricao && (
                    <p className="turmaCardDescription">{turma.descricao}</p>
                  )}

                  <div className="turmaCardStats">
                    <div className="statItem">
                      <span className="statIcon">👥</span>
                      <span className="statText">Alunos</span>
                    </div>
                    <div className="statItem">
                      <span className="statIcon">📅</span>
                      <span className="statText">
                        {new Date(turma.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="turmaCardFooter">
                    <button
                      className="turmaViewBtn"
                      onClick={() => navigate(`/dashboard/turmas/${turma.id}`)}
                    >
                      Ver Detalhes →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL DE CONFIRMAÇÃO */}
        <ConfirmModal
          isOpen={modalDeletar.isOpen}
          title="Deletar Turma"
          message={`Tem certeza que deseja deletar "${modalDeletar.turmaNome}"? Todos os alunos serão removidos desta turma.`}
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
