import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";

import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import CreateUser from "./components/Dashboard/Sidebar/CreateUser/CreateUser";
import ExerciciosPage from "./pages/Exercises";
import ExerciseDetail from "./pages/ExerciseDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* logado */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ✅ exercícios: qualquer logado (admin/prof/aluno) */}
          <Route path="/dashboard/exercicios" element={<ExerciciosPage />} />
          <Route path="/dashboard/exercicios/:id" element={<ExerciseDetail />} />
          <Route
            path="/exercicios"
            element={<Navigate to="/dashboard/exercicios" replace />}
          />


          <Route element={<ProtectedRoute allowedRoles={["admin", "professor"]} />}>
            <Route path="/dashboard/criar-usuario" element={<CreateUser />} />
            <Route
              path="/criar-usuario"
              element={<Navigate to="/dashboard/criar-usuario" replace />}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
