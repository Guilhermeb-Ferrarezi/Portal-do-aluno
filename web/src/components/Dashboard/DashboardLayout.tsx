import type { ReactNode } from "react";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getName, getRole, hasRole, logout } from "../../auth/auth";
import { listarTurmas, type Turma } from "../../services/api";
import "./Dashboard.css";

type DashboardLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

function roleLabel(role: string | null) {
  if (role === "admin") return "Administrador";
  if (role === "professor") return "Professor";
  return "Aluno";
}

export default function DashboardLayout({
  title,
  subtitle,
  children,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const canCreateUser = hasRole(["admin", "professor"]);
  const name = getName() ?? "Aluno";
  const role = getRole();
  const [turmas, setTurmas] = React.useState<Turma[]>([]);
  const [expandirTurmas, setExpandirTurmas] = React.useState(false);

  React.useEffect(() => {
    if (canCreateUser) {
      listarTurmas()
        .then(setTurmas)
        .catch((e) => console.error("Erro ao carregar turmas:", e));
    }
  }, [canCreateUser]);

  const isDashboard = location.pathname === "/dashboard";
  const isExercicios = location.pathname === "/dashboard/exercicios";
  const isCreateUser = location.pathname === "/dashboard/criar-usuario";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleMinhasTurmas() {
    if (role === "aluno") {
      window.location.href = "https://classroom.google.com";
    } else {
      navigate("/dashboard/turmas");
    }
  }

  return (
    <div className="appShell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sbTop">
          <div className="sbBrand">
            <div className="sbLogo" aria-hidden="true">
              🎓
            </div>
            <div className="sbBrandText">
              <div className="sbBrandName">Santos Tech</div>
              <div className="sbBrandSub">Portal do Aluno</div>
            </div>
          </div>
        </div>

        <nav className="sbNav">
          <Link className={`sbItem ${isDashboard ? "active" : ""}`} to="/dashboard">
            <span className="sbIcon" aria-hidden="true">
              🏠
            </span>
            Dashboard
          </Link>
          <a className="sbItem" href="#">
            <span className="sbIcon" aria-hidden="true">
              🧭
            </span>
            Trilha do Curso
          </a>
          <Link className={`sbItem ${isExercicios ? "active" : ""}`} to="/dashboard/exercicios">
            <span className="sbIcon" aria-hidden="true">
              ✍️
            </span>
            Exercícios
          </Link>
          <a className="sbItem" href="#">
            <span className="sbIcon" aria-hidden="true">
              📄
            </span>
            Materiais
          </a>
          <a className="sbItem" href="#">
            <span className="sbIcon" aria-hidden="true">
              ▶️
            </span>
            Videoaulas Bônus
          </a>
          {/* Minha Turma - Aluno vai para Google, Admin/Professor expandem a lista */}
          <button
            className="sbItem"
            onClick={handleMinhasTurmas}
            style={{ textAlign: "left" }}
          >
            <span className="sbIcon" aria-hidden="true">👥</span>
            <span>Minha Turma</span>
          </button>
          <a className="sbItem" href="#">
            <span className="sbIcon" aria-hidden="true">
              👤
            </span>
            Perfil
          </a>

          {canCreateUser && (
            <>
              <div className="sideSection">
                <button
                  className="sideSectionHeader"
                  onClick={() => setExpandirTurmas(!expandirTurmas)}
                >
                  <span className="sbIcon" aria-hidden="true">📋</span>
                  <span>Minhas Turmas</span>
                  <span className="sideExpand" aria-hidden="true">
                    {expandirTurmas ? "▼" : "▶"}
                  </span>
                </button>

                {expandirTurmas && (
                  <div className="sideSectionContent">
                    {turmas.length > 0 ? (
                      <div className="turmasListSide">
                        {turmas.map((turma) => (
                          <button
                            key={turma.id}
                            className="sideTurmaItem"
                            onClick={() => navigate(`/dashboard/turmas/${turma.id}`)}
                          >
                            <span className="sideTurmaName">{turma.nome}</span>
                            <span className="sideTurmaBadge">
                              {turma.tipo === "turma" ? "👥" : "👤"}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="sideSectionEmpty">Nenhuma turma</div>
                    )}

                    <button
                      className="sideCreateTurmaBtn"
                      onClick={() => navigate("/dashboard/turmas")}
                    >
                      <span aria-hidden="true">➕</span> Criar turma
                    </button>
                  </div>
                )}
              </div>

              <Link
                className={`sbItem ${isCreateUser ? "active" : ""}`}
                to="/dashboard/criar-usuario"
              >
                <span className="sbIcon" aria-hidden="true">
                  ➕
                </span>
                Criar usuário
              </Link>
            </>
          )}
        </nav>

        <div className="sbBottom">
          <div className="sbUser">
            <div className="sbAvatar">{name.slice(0, 1).toUpperCase()}</div>
            <div className="sbUserText">
              <div className="sbUserName">{name}</div>
              <div className="sbUserSub">{roleLabel(role)}</div>
            </div>

            <button
              className="sbDots"
              type="button"
              onClick={handleLogout}
              title="Sair"
              aria-label="Sair"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="pageTitle">{title}</h1>
            <p className="pageSub">{subtitle ?? `Bem-vindo de volta, ${name}`}</p>
          </div>

          <div className="topActions">
            <button className="iconBtn" aria-label="Notificações" type="button">
              🔔 <span className="dot" />
            </button>
            <button className="iconBtn" aria-label="Configurações" type="button">
              ⚙️
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
