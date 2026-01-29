import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import {
  obterTurma,
  atualizarTurma,
  removerAlunoDaTurma,
  adicionarAlunosNaTurma,
  listarAlunos,
  apiFetch,
  getRole,
  type Turma,
  type User,
} from "../services/api";
import "./TurmaDetail.css";

type TurmaComAlunos = Turma & {
  alunos: User[];
  exercicios: Array<{ id: string; titulo: string; modulo: string }>;
};

export default function TurmaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = getRole();
  const canManageTurmas = role === "admin" || role === "professor";
  const backPath = canManageTurmas ? "/dashboard/turmas" : "/dashboard";

  const [turma, setTurma] = React.useState<TurmaComAlunos | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  const [responsaveis, setResponsaveis] = React.useState<User[]>([]);
  const [professorSelecionado, setProfessorSelecionado] = React.useState("");
  const [salvandoResponsavel, setSalvandoResponsavel] = React.useState(false);

  const [modalAdicionarAberto, setModalAdicionarAberto] = React.useState(false);
  const [alunosDisponiveis, setAlunosDisponiveis] = React.useState<User[]>([]);
  const [alunosSelecionados, setAlunosSelecionados] = React.useState<string[]>([]);
  const [adicionando, setAdicionando] = React.useState(false);

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      setErro(null);
      const data = await obterTurma(id);
      setTurma(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar turma");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!id) {
      navigate(backPath);
      return;
    }
    load();
  }, [backPath, id, navigate]);

  React.useEffect(() => {
    if (role !== "admin") return;
    Promise.all([
      apiFetch<User[]>("/users?role=professor"),
      apiFetch<User[]>("/users?role=admin"),
    ])
      .then(([profs, admins]) => {
        const responsaveisOrdenados = [...admins, ...profs].sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );
        setResponsaveis(responsaveisOrdenados);
      })
      .catch((e) => console.error("Erro ao carregar responsÃ¡veis:", e));
  }, [role]);

  React.useEffect(() => {
    if (role !== "admin") return;
    setProfessorSelecionado(turma?.professorId ?? "");
  }, [role, turma?.professorId]);

  async function handleAtualizarResponsavel() {
    if (!id || role !== "admin") return;
    const professorId = professorSelecionado || null;

    try {
      setSalvandoResponsavel(true);
      setErro(null);
      setOkMsg(null);
      await atualizarTurma(id, { professor_id: professorId });
      setOkMsg("ResponsÃ¡vel atualizado com sucesso!");
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar responsÃ¡vel");
    } finally {
      setSalvandoResponsavel(false);
    }
  }

  async function handleRemoverAluno(alunoId: string) {
    if (!id || !turma) return;

    if (!window.confirm("Tem certeza que deseja remover este aluno da turma?")) {
      return;
    }

    try {
      setErro(null);
      setOkMsg(null);
      await removerAlunoDaTurma(id, alunoId);
      setOkMsg("Aluno removido com sucesso!");
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover aluno");
    }
  }

  async function abrirModalAdicionar() {
    try {
      const alunos = await listarAlunos();
      // Filtrar apenas alunos que não estão na turma
      const alunosNaTurma = turma?.alunos.map((a) => a.id) || [];
      const alunosDisponiveis = alunos.filter(
        (aluno) => !alunosNaTurma.includes(aluno.id)
      );
      setAlunosDisponiveis(alunosDisponiveis);
      setModalAdicionarAberto(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar alunos");
    }
  }

  async function handleAdicionarAlunos() {
    if (!id || alunosSelecionados.length === 0) return;

    try {
      setAdicionando(true);
      setErro(null);
      await adicionarAlunosNaTurma(id, alunosSelecionados);
      setOkMsg("Alunos adicionados com sucesso!");
      setModalAdicionarAberto(false);
      setAlunosSelecionados([]);
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao adicionar alunos");
    } finally {
      setAdicionando(false);
    }
  }

  if (loading && !turma) {
    return (
      <DashboardLayout title="Carregando..." subtitle="">
        <div className="loadingState">
          <div className="spinner" />
          Carregando turma...
        </div>
      </DashboardLayout>
    );
  }

  if (!turma) {
    return (
      <DashboardLayout title="Turma não encontrada" subtitle="">
        <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
          A turma solicitada não foi encontrada.
        </div>
      </DashboardLayout>
    );
  }

  const responsavelAtual = (() => {
    if (!turma.professorId) return "Nenhum responsÃ¡vel definido";
    const found = responsaveis.find((user) => user.id === turma.professorId);
    if (!found) return "ResponsÃ¡vel nÃ£o encontrado";
    return `${found.nome} (${found.role === "admin" ? "Admin" : "Professor"})`;
  })();

  return (
    <DashboardLayout
      title={turma.nome}
      subtitle={`${turma.tipo === "turma" ? "Turma" : "Turma Particular"} • ${turma.alunos.length} ${turma.alunos.length === 1 ? "aluno" : "alunos"}`}
    >
      <div className="turmaDetailContainer">
        {erro && (
          <div className="message error">
            <span>❌</span>
            <span>{erro}</span>
          </div>
        )}

        {okMsg && (
          <div className="message success">
            <span>✅</span>
            <span>{okMsg}</span>
          </div>
        )}

        {/* INFORMAÇÕES DA TURMA */}
        <div className="turmaInfoCard">
          <div className="turmaInfoHeader">
            <div>
              <h3 className="turmaInfoTitle">{turma.nome}</h3>
              <p className="turmaInfoMeta">
                {turma.tipo === "turma" ? "👥 Turma (Grupo)" : "🔒 Turma Particular"}
                {turma.descricao && <> • {turma.descricao}</>}
              </p>
            </div>

            <button
              className="btnBack"
              onClick={() => navigate(backPath)}
            >
              ← Voltar
            </button>
          </div>

          {role === "admin" && (
            <div className="responsavelSection">
              <div className="responsavelHeader">
                <div>
                  <div className="responsavelLabel">ResponsÃ¡vel pela turma</div>
                  <div className="responsavelValue">{responsavelAtual}</div>
                </div>
                <div className="responsavelControls">
                  <select
                    className="responsavelSelect"
                    value={professorSelecionado}
                    onChange={(e) => setProfessorSelecionado(e.target.value)}
                  >
                    <option value="">Sem responsável</option>
                    {responsaveis.map((responsavel) => (
                      <option key={responsavel.id} value={responsavel.id}>
                        {responsavel.nome} ({responsavel.role === "admin" ? "Admin" : "Professor"})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="responsavelBtn"
                    onClick={handleAtualizarResponsavel}
                    disabled={
                      salvandoResponsavel ||
                      (professorSelecionado || null) === turma.professorId
                    }
                  >
                    {salvandoResponsavel ? "Salvando..." : "Atualizar"}
                  </button>
                </div>
              </div>
              <span className="responsavelHint">
                Você pode selecionar um admin/professor ou deixar sem responsável.
              </span>
            </div>
          )}
        </div>

        {/* SEÇÃO DE ALUNOS */}
        <div className="turmaSection">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 className="turmaSectionTitle">
              👥 Alunos ({turma.alunos.length})
            </h2>
            {(role === "admin" || role === "professor") && (
              <button
                className="btnAdicionarAluno"
                onClick={abrirModalAdicionar}
              >
                ➕ Adicionar aluno
              </button>
            )}
          </div>

          {turma.alunos.length === 0 ? (
            <div className="emptySection">
              <p>Nenhum aluno cadastrado nesta turma ainda.</p>
            </div>
          ) : (
            <div className="alunosList">
              {turma.alunos.map((aluno) => (
                <div key={aluno.id} className="alunoCard">
                  <div className="alunoInfo">
                    <div className="alunoAvatar">
                      {aluno.nome.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="alunoDetails">
                      <div className="alunoName">{aluno.nome}</div>
                      <div className="alunoUsername">@{aluno.usuario}</div>
                    </div>
                  </div>
                  {(role === "admin" || role === "professor") && (
                    <button
                      className="btnRemover"
                      onClick={() => handleRemoverAluno(aluno.id)}
                      title="Remover aluno"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEÇÃO DE EXERCÍCIOS */}
        {turma.exercicios.length > 0 && (
          <div className="turmaSection">
            <h2 className="turmaSectionTitle">
              📚 Exercícios Atribuídos ({turma.exercicios.length})
            </h2>

            <div className="exerciciosList">
              {turma.exercicios.map((ex) => (
                <div key={ex.id} className="exercicioItem">
                  <div className="exercicioInfo">
                    <div className="exercicioTitle">{ex.titulo}</div>
                    <div className="exercicioMeta">{ex.modulo}</div>
                  </div>
                  <button
                    className="btnVisualizar"
                    onClick={() =>
                      navigate(`/dashboard/exercicios/${ex.id}`)
                    }
                  >
                    Ver →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL DE ADICIONAR ALUNOS */}
        {modalAdicionarAberto && (
          <div className="modalOverlay" onClick={() => setModalAdicionarAberto(false)}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()}>
              <h3>Adicionar alunos à turma</h3>

              {alunosDisponiveis.length === 0 ? (
                <p style={{ color: "var(--muted)", textAlign: "center" }}>
                  Nenhum aluno disponível para adicionar.
                </p>
              ) : (
                <div className="alunosSelectorList">
                  {alunosDisponiveis.map((aluno) => (
                    <label key={aluno.id} className="alunoCheckboxItem">
                      <input
                        type="checkbox"
                        checked={alunosSelecionados.includes(aluno.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAlunosSelecionados([...alunosSelecionados, aluno.id]);
                          } else {
                            setAlunosSelecionados(
                              alunosSelecionados.filter((id) => id !== aluno.id)
                            );
                          }
                        }}
                      />
                      <span className="alunoCheckboxAvatar">
                        {aluno.nome.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="alunoCheckboxInfo">
                        <div className="alunoCheckboxName">{aluno.nome}</div>
                        <div className="alunoCheckboxUser">@{aluno.usuario}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="modalActions">
                <button
                  onClick={() => setModalAdicionarAberto(false)}
                  className="modalBtnCancel"
                  disabled={adicionando}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdicionarAlunos}
                  className="modalBtnConfirm"
                  disabled={adicionando || alunosSelecionados.length === 0}
                >
                  {adicionando ? "⏳ Adicionando..." : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
