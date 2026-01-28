import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getRole } from "../../../auth/auth";
import { listarTurmas, type Turma } from "../../../services/api";

type Role = "admin" | "professor" | "aluno";

export default function Sidebar() {
  const role = (getRole() as Role | null) ?? "aluno";
  const navigate = useNavigate();
  const canCreateUser = role === "admin" || role === "professor";
  const [turmas, setTurmas] = React.useState<Turma[]>([]);
  const [expandirTurmas, setExpandirTurmas] = React.useState(false);

  React.useEffect(() => {
    if (canCreateUser) {
      listarTurmas()
        .then(setTurmas)
        .catch((e) => console.error("Erro ao carregar turmas:", e));
    }
  }, [canCreateUser]);

  const handleMinhasTurmas = () => {
    if (role === "aluno") {
      // Redirecionar para Google Classroom ou outro link
      window.location.href = "https://classroom.google.com";
    } else {
      navigate("/dashboard/turmas");
    }
  };

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

      {/* Minha Turma - Aluno vai para Google, Admin/Professor expandem a lista */}
      <button
        className="sideItem"
        onClick={handleMinhasTurmas}
        style={{ textAlign: "left" }}
      >
        <span className="sideIcon" aria-hidden="true">👥</span>
        <span>Minha Turma</span>
      </button>

      {canCreateUser && (
        <>
          <div className="sideSection">
            <button
              className="sideSectionHeader"
              onClick={() => setExpandirTurmas(!expandirTurmas)}
            >
              <span className="sideIcon" aria-hidden="true">📋</span>
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

          <NavLink
            to="/dashboard/criar-usuario"
            className={({ isActive }) => `sideItem ${isActive ? "active" : ""}`}
          >
            <span className="sideIcon" aria-hidden="true">👤</span>
            <span>Criar usuário</span>
          </NavLink>
        </>
      )}
    </aside>
  );
}
