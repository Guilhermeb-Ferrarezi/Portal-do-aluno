import { NavLink } from "react-router-dom";
import { getRole } from "../../../auth/auth";

type Role = "admin" | "professor" | "aluno";

export default function Sidebar() {
  const role = (getRole() as Role | null) ?? "aluno";
  const canCreateUser = role === "admin" || role === "professor";

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

      {canCreateUser && (
        <>
          <NavLink
            to="/dashboard/turmas"
            className={({ isActive }) => `sideItem ${isActive ? "active" : ""}`}
          >
            <span className="sideIcon" aria-hidden="true">👥</span>
            <span>Minhas Turmas</span>
          </NavLink>

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
