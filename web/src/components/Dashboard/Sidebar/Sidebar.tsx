import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getRole } from "../../../auth/auth";
import { listarTurmas, type Turma } from "../../../services/api";

type Role = "admin" | "professor" | "aluno";

export default function Sidebar() {
  const role = (getRole() as Role | null) ?? "aluno";
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const canManageTurmas = role === "admin" || role === "professor";
  const canCreateUser = role === "admin" || role === "professor";
  const turmasSectionTitle = role === "aluno" ? "Minha Turma" : "Minhas Turmas";
  const [turmas, setTurmas] = React.useState<Turma[]>([]);
  const [expandirTurmas, setExpandirTurmas] = React.useState(false);

  React.useEffect(() => {
    listarTurmas()
      .then(setTurmas)
      .catch((e) => console.error("Erro ao carregar turmas:", e));
  }, [role]);

  return (
    <aside className="sidebar">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `sideItem ${isActive ? "active" : ""}`}
      >
        <span className="sideIcon" aria-hidden="true">🏠</span>
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/dashboard/exercicios"
        className={({ isActive }) => `sideItem ${isActive ? "active" : ""}`}
      >
        <span className="sideIcon" aria-hidden="true">📘</span>
        <span>Exercícios</span>
      </NavLink>

                <div className="sideSection">
            <button
              className="sideSectionHeader"
              onClick={() => setExpandirTurmas(!expandirTurmas)}
            >
              <span className="sideIcon" aria-hidden="true">👥</span>
              <span>{turmasSectionTitle}</span>
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
                  <div className="sideSectionEmpty">Nenhuma turma registrada</div>
                )}

                {canManageTurmas && (
                  <button
                    className="sideCreateTurmaBtn"
                    onClick={() => navigate("/dashboard/turmas")}
                  >
                    <span aria-hidden="true">➕</span> Criar turma
                  </button>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <NavLink
              to="/dashboard/turmas"
              className={({ isActive }) => `sideItem ${isActive ? "active" : ""}`}
            >
              <span className="sideIcon" aria-hidden="true">📋</span>
              <span>Turmas</span>
            </NavLink>
          )}

          {canCreateUser && (
            <NavLink
              to="/dashboard/criar-usuario"
              className={({ isActive }) => `sideItem ${isActive ? "active" : ""}`}
            >
              <span className="sideIcon" aria-hidden="true">👤</span>
              <span>Criar usuário</span>
            </NavLink>
          )}
    </aside>
  );
}
