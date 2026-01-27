import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getName, getRole, hasRole, logout } from "../../auth/auth";
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

  const isDashboard = location.pathname === "/dashboard";
  const isExercicios = location.pathname === "/dashboard/exercicios";
  const isCreateUser = location.pathname === "/dashboard/criar-usuario";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
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
          <a className="sbItem" href="#">
            <span className="sbIcon" aria-hidden="true">
              👥
            </span>
            Minha Turma
          </a>
          <a className="sbItem" href="#">
            <span className="sbIcon" aria-hidden="true">
              👤
            </span>
            Perfil
          </a>
          {canCreateUser ? (
            <Link
              className={`sbItem ${isCreateUser ? "active" : ""}`}
              to="/dashboard/criar-usuario"
            >
              <span className="sbIcon" aria-hidden="true">
                ➕
              </span>
              Criar usuário
            </Link>
          ) : null}
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
