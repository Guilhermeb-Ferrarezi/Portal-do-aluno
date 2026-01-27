import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { getName } from "../../auth/auth";

type Task = {
  title: string;
  due: string;
  status: "red" | "gray";
};

type Notice = {
  title: string;
  text: string;
  when: string;
};

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

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="pill">{children}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getName() ?? "Aluno";

  const goToExercicios = () => navigate("/dashboard/exercicios");

  const progress = {
    overall: 68,
    modulesDone: "3/6",
    exercisesDone: "41/60",
  };

  const currentModule = {
    tag: "ATUAL",
    module: "MÓDULO 4",
    title: "Desenvolvimento Web",
    subtitle: "Semana 15 • HTML5 e CSS3 Avançado",
    pct: 75,
  };

  const streakDays = 12;

  const nextTask = {
    tag: "CONTINUE DE ONDE PAROU",
    title: "Exercício 15.3: Layout Responsivo",
    subtitle: "Crie um layout responsivo usando Flexbox e Media Queries",
    metaLeft: "20–30 min",
    metaMid: "Intermediário",
  };

  const tasks: Task[] = [
    { title: "Exercício 15.4", due: "Entrega: 28 Jan", status: "red" },
    { title: "Exercício 15.5", due: "Entrega: 30 Jan", status: "red" },
    { title: "Avaliação Módulo 4", due: "Entrega: 05 Fev", status: "gray" },
  ];

  const notices: Notice[] = [
    {
      title: "Desafio da Semana: Landing Page Criativa",
      text: "Crie uma landing page usando os conceitos aprendidos. Prazo: sexta-feira.",
      when: "Há 2 horas",
    },
    {
      title: "Aula extra liberada: Flexbox na prática",
      text: "Vídeo bônus com exemplos reais e pegadinhas mais comuns.",
      when: "Ontem",
    },
  ];

  return (
    <DashboardLayout title="Dashboard" subtitle={`Bem-vindo de volta, ${user}`}>
      {/* ROW 1 */}
      <section className="grid3">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="kicker">PROGRESSO GERAL</div>
              <div className="big">{progress.overall}%</div>
            </div>
            <RingProgress value={progress.overall} />
          </div>

          <div className="kv">
            <div className="kvRow">
              <span>Módulos concluídos</span>
              <strong>{progress.modulesDone}</strong>
            </div>
            <div className="kvRow">
              <span>Exercícios entregues</span>
              <strong>{progress.exercisesDone}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHead2">
            <div className="tagRed">{currentModule.tag}</div>
            <div className="muted">{currentModule.module}</div>
          </div>

          <div className="cardTitle">{currentModule.title}</div>
          <div className="muted">{currentModule.subtitle}</div>

          <div className="barWrap">
            <div className="bar">
              <div
                className="barFill"
                style={{ width: `${currentModule.pct}%` }}
              />
            </div>
            <div className="mutedSmall">{currentModule.pct}% concluído</div>
          </div>
        </div>

        <div className="card">
          <div className="cardHead">
            <div>
              <div className="kicker">SEQUÊNCIA</div>
              <div className="big">
                {streakDays} <span className="bigSub">dias</span>
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
      </section>

      {/* ROW 2 */}
      <section className="grid2">
        <div className="card cardWide">
          <div className="pillRow">
            <Pill>{nextTask.tag}</Pill>
          </div>

          <div className="wideBody">
            <div className="wideLeft">
              <div className="wideTitle">{nextTask.title}</div>
              <div className="muted">{nextTask.subtitle}</div>

              <div className="wideMeta">
                <span className="metaItem">⏱ {nextTask.metaLeft}</span>
                <span className="metaItem">📶 {nextTask.metaMid}</span>
              </div>

              <button
                className="btnPrimary"
                type="button"
                onClick={goToExercicios}
                title="Ir para a aba de exercícios"
              >
                Continuar
              </button>
            </div>

            <div className="wideRight" onClick={goToExercicios} role="button" tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") goToExercicios();
              }}
              style={{ cursor: "pointer" }}
              aria-label="Abrir exercícios"
            >
              <div className="codeBox" aria-hidden="true">
                {"</>"}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="sectionHead">
            <div className="cardTitle">Próximas Tarefas</div>
            <button
              type="button"
              className="linkRed"
              onClick={goToExercicios}
              style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
            >
              Ver todos
            </button>
          </div>

          <div className="taskList">
            {tasks.map((t, idx) => (
              <div
                className="taskRow"
                key={idx}
                onClick={goToExercicios}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") goToExercicios();
                }}
                style={{ cursor: "pointer" }}
                title="Abrir exercícios"
              >
                <span className={`taskDot ${t.status}`} aria-hidden="true" />
                <div className="taskText">
                  <div className="taskTitle">{t.title}</div>
                  <div className="mutedSmall">{t.due}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROW 3 */}
      <section className="grid2">
        <div className="card">
          <div className="sectionHead">
            <div className="cardTitle">Avisos da Turma</div>
            <button
              type="button"
              className="linkRed"
              onClick={goToExercicios}
              style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
            >
              Ver todos
            </button>
          </div>

          <div className="noticeList">
            {notices.map((n, idx) => (
              <div
                className="noticeRow"
                key={idx}
                onClick={goToExercicios}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") goToExercicios();
                }}
                style={{ cursor: "pointer" }}
                title="Abrir exercícios"
              >
                <div className="noticeIcon" aria-hidden="true">
                  📣
                </div>
                <div className="noticeBody">
                  <div className="noticeTitle">{n.title}</div>
                  <div className="muted">{n.text}</div>
                </div>
                <div className="mutedSmall">{n.when}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Seu Desempenho</div>

          <div className="perf">
            <div className="perfRow">
              <span className="muted">Taxa de entrega</span>
              <strong>95%</strong>
            </div>
            <div className="bar">
              <div className="barFillGreen" style={{ width: "95%" }} />
            </div>

            <div className="perfRow" style={{ marginTop: 14 }}>
              <span className="muted">Média de notas</span>
              <strong>8.7</strong>
            </div>
            <div className="bar">
              <div className="barFillGreen" style={{ width: "87%" }} />
            </div>

            <div className="perfHint">
              Mantendo a consistência, você estoura o nível fácil.
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
