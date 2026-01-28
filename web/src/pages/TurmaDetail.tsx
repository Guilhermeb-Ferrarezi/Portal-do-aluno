import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import {
  obterTurma,
  adicionarAlunosNaTurma,
  removerAlunoDaTurma,
  getRole,
  type Turma,
} from "../services/api";
import "./TurmaDetail.css";

type User = {
  id: string;
  usuario: string;
  nome: string;
  role: "admin" | "professor" | "aluno";
};

type TurmaComAlunos = Turma & {
  alunos: User[];
  exercicios: Array<{ id: string; titulo: string; modulo: string }>;
};

export default function TurmaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = getRole();

  const [turma, setTurma] = React.useState<TurmaComAlunos | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

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
      navigate("/dashboard/turmas");
      return;
    }
    load();
  }, [id, navigate]);

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
              onClick={() => navigate("/dashboard/turmas")}
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* SEÇÃO DE ALUNOS */}
        <div className="turmaSection">
          <h2 className="turmaSectionTitle">
            👥 Alunos ({turma.alunos.length})
          </h2>

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
      </div>
    </DashboardLayout>
  );
}
