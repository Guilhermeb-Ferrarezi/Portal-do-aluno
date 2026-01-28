import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { getName, hasRole } from "../../auth/auth";
import {
  listarTurmas,
  listarExercicios,
  listarAlunos,
  type Turma,
  type Exercicio,
  type User,
} from "../../services/api";

function RingProgress({ value }: { value: number }) {
  const style = {
    background: `conic-gradient(var(--red) ${value}%, var(--ring) 0)`,
  } as React.CSSProperties;

  return (
    <div className="ring" style={style} aria-label={`Progresso ${value}%`}>
      <div className="ringInner">
        <span className="ringValue">{value}%</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const name = getName() ?? "Aluno";
  const canCreateUser = hasRole(["admin", "professor"]);

  // Estados
  const [turmas, setTurmas] = React.useState<Turma[]>([]);
  const [exercicios, setExercicios] = React.useState<Exercicio[]>([]);
  const [alunos, setAlunos] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  // Carregar dados
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErro(null);

        // Carregar dados em paralelo
        const [turmasData, exerciciosData, alunosData] = await Promise.all([
          listarTurmas(),
          listarExercicios(),
          listarAlunos().catch(() => []),
        ]);

        setTurmas(turmasData);
        setExercicios(exerciciosData);
        setAlunos(alunosData);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle={`Bem-vindo de volta, ${name}`}>
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          Carregando...
        </div>
      </DashboardLayout>
    );
  }

  if (erro) {
    return (
      <DashboardLayout title="Dashboard" subtitle={`Bem-vindo de volta, ${name}`}>
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--red)",
            fontSize: "14px",
          }}
        >
          Erro ao carregar dados: {erro}
        </div>
      </DashboardLayout>
    );
  }

  // Calcular estatísticas
  const totalTurmas = turmas.length;
  const totalAlunos = alunos.length;
  const totalExercicios = exercicios.length;
  const exerciciosPendentes = exercicios.filter(
    (e) => e.prazo && new Date(e.prazo) > new Date()
  ).length;

  // Exercícios recentes (últimos 5)
  const exerciciosRecentes = exercicios.slice(0, 5);

  // Simular estatísticas (em produção, viriam da API)
  const progresso = {
    overall: 65,
    modulos: "3/6",
    exercicios: "41/60",
  };

  const streak = 12;
  const mediaNota = 8.5;
  const ranking = 5;

  return (
    <DashboardLayout title="Dashboard" subtitle={`Bem-vindo de volta, ${name}`}>
      {/* SEÇÃO 1: ESTATÍSTICAS */}
      <section className="grid3">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="kicker">MINHAS TURMAS</div>
              <div className="big">{totalTurmas}</div>
            </div>
          </div>
          <div className="kv">
            <div className="kvRow">
              <span>Total de turmas</span>
              <strong>{totalTurmas}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHead">
            <div>
              <div className="kicker">ALUNOS</div>
              <div className="big">{totalAlunos}</div>
            </div>
          </div>
          <div className="kv">
            <div className="kvRow">
              <span>Total de alunos {canCreateUser ? "cadastrados" : "na turma"}</span>
              <strong>{totalAlunos}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHead">
            <div>
              <div className="kicker">EXERCÍCIOS</div>
              <div className="big">{totalExercicios}</div>
            </div>
          </div>
          <div className="kv">
            <div className="kvRow">
              <span>Pendentes</span>
              <strong style={{ color: "var(--red)" }}>{exerciciosPendentes}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: PROGRESSO E ATIVIDADES */}
      <section className="grid2">
        <div className="card">
          <div className="cardTitle">Exercícios Recentes</div>
          <div className="taskList">
            {exerciciosRecentes.length === 0 ? (
              <div style={{ padding: "12px", opacity: 0.6, textAlign: "center" }}>
                Nenhum exercício disponível
              </div>
            ) : (
              exerciciosRecentes.map((ex) => {
                const isPassed =
                  ex.prazo && new Date(ex.prazo) < new Date();
                return (
                  <div
                    key={ex.id}
                    className="taskRow"
                    onClick={() => navigate(`/dashboard/exercicios/${ex.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        navigate(`/dashboard/exercicios/${ex.id}`);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <span
                      className={`taskDot ${isPassed ? "red" : "gray"}`}
                      aria-hidden="true"
                    />
                    <div className="taskText">
                      <div className="taskTitle">{ex.titulo}</div>
                      <div className="mutedSmall">
                        {ex.prazo
                          ? `Prazo: ${new Date(ex.prazo).toLocaleDateString("pt-BR")}`
                          : "Sem prazo"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="cardHead">
            <div>
              <div className="kicker">PROGRESSO</div>
              <div className="big">{progresso.overall}%</div>
            </div>
            <RingProgress value={progresso.overall} />
          </div>
          <div className="kv" style={{ marginTop: "12px" }}>
            <div className="kvRow">
              <span>Módulos</span>
              <strong>{progresso.modulos}</strong>
            </div>
            <div className="kvRow">
              <span>Exercícios</span>
              <strong>{progresso.exercicios}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: INFORMAÇÕES ADICIONAIS */}
      <section className="grid2">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="kicker">SEQUÊNCIA</div>
              <div className="big">
                {streak} <span className="bigSub">dias</span>
              </div>
            </div>
            <div className="streakBadge" aria-hidden="true">
              🔥
            </div>
          </div>
          <p className="muted">
            Continue assim! Você está em uma ótima sequência de estudos.
          </p>
        </div>

        <div className="card">
          <div className="cardTitle">Seu Desempenho</div>
          <div className="perf">
            <div className="perfRow">
              <span className="muted">Média de notas</span>
              <strong>{mediaNota.toFixed(1)}/10</strong>
            </div>
            <div className="bar">
              <div className="barFillGreen" style={{ width: `${mediaNota * 10}%` }} />
            </div>
            <div className="perfRow" style={{ marginTop: 14 }}>
              <span className="muted">Ranking</span>
              <strong>#{ranking}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: AÇÕES RÁPIDAS */}
      <section>
        <div className="card">
          <div className="cardTitle">Ações Rápidas</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <button
              onClick={() => navigate("/dashboard/exercicios")}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid var(--line)",
                background: "white",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--red)";
                target.style.color = "var(--red)";
                target.style.background = "rgba(225, 29, 46, 0.05)";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--line)";
                target.style.color = "var(--text)";
                target.style.background = "white";
              }}
            >
              ✍️ Exercícios
            </button>

            <button
              onClick={() => navigate("/dashboard/turmas")}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid var(--line)",
                background: "white",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--red)";
                target.style.color = "var(--red)";
                target.style.background = "rgba(225, 29, 46, 0.05)";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--line)";
                target.style.color = "var(--text)";
                target.style.background = "white";
              }}
            >
              👥 Minhas Turmas
            </button>

            {canCreateUser && (
              <>
                <button
                  onClick={() => navigate("/dashboard/criar-usuario")}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--line)",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLButtonElement;
                    target.style.borderColor = "var(--red)";
                    target.style.color = "var(--red)";
                    target.style.background = "rgba(225, 29, 46, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLButtonElement;
                    target.style.borderColor = "var(--line)";
                    target.style.color = "var(--text)";
                    target.style.background = "white";
                  }}
                >
                  ➕ Criar Usuário
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
