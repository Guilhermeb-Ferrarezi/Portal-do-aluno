import React from "react";
import { useNavigate } from "react-router-dom";
import { getName, getRole, getToken } from "../../../../auth/auth";
import DashboardLayout from "../../DashboardLayout";
import "./CreateUser.css";

type Role = "admin" | "professor" | "aluno";

type Msg = {
  text: string;
  type: "ok" | "error";
};

function roleLabel(role: Role | null) {
  if (role === "admin") return "Administrador";
  if (role === "professor") return "Professor";
  return "Aluno";
}

export default function CreateUser() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [role, setRole] = React.useState<Role>("aluno");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<Msg | null>(null);

  const viewerName = getName() ?? "Usuário";
  const viewerRole = getRole();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ usuario, nome, senha, role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg({ text: data?.message ?? "Erro ao criar usuário", type: "error" });
        return;
      }

      setMsg({ text: "Usuário criado com sucesso!", type: "ok" });
      setUsuario("");
      setNome("");
      setSenha("");
      setRole("aluno");
    } catch {
      setMsg({ text: "Falha de rede ao criar usuário", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout
      title="Criar usuário"
      subtitle="Cadastre novos perfis dentro do dashboard"
    >
      <section className="cuGrid">
        <div className="card cuCard">
          <div className="cuHead">
            <div className="cuKicker">Acesso restrito</div>
            <h2>Novo usuário</h2>
            <p>Disponível para admin e professor.</p>
          </div>

          <form onSubmit={handleSubmit} className="cuForm">
            <label>
              Usuário
              <input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ex: joao.silva"
                required
              />
            </label>

            <label>
              Nome
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="ex: João Silva"
                required
              />
            </label>

            <label>
              Senha
              <input
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="min. 6 caracteres"
                type="password"
                required
                minLength={6}
              />
            </label>

            <label>
              Cargo
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            {msg ? (
              <div className={`cuMsg ${msg.type}`}>{msg.text}</div>
            ) : null}

            <div className="cuActions">
              <button
                type="button"
                className="cuBtn ghost"
                onClick={() => navigate("/dashboard")}
              >
                Voltar
              </button>
              <button type="submit" className="cuBtn" disabled={loading}>
                {loading ? "Criando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>

        <div className="card cuSide">
          <div className="cuUser">
            <div className="cuAvatar">
              {viewerName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="cuUserName">{viewerName}</div>
              <div className="cuUserRole">{roleLabel(viewerRole)}</div>
            </div>
          </div>

          <div className="cuInfo">
            <div className="cuInfoTitle">Seu acesso</div>
            <p>
              Você pode cadastrar novos perfis para organizar a turma, manter o
              controle de acessos e delegar funções.
            </p>

            <div className="cuPills">
              <span>Aluno</span>
              <span>Professor</span>
              <span>Administrador</span>
            </div>

            <div className="cuTip">
              Dica: use senhas fortes e mantenha o cargo adequado para cada
              pessoa.
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
