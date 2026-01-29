import React from "react";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import { getRole } from "../auth/auth";
import { obterUsuarioAtual, type UserMe } from "../services/api";
import "./Perfil.css";

type UserStats = {
  exerciciosFitos: number;
  notaMedia: number;
  turmasInscritas: number;
  diasSequencia: number;
};

export default function PerfilPage() {
  const roleLocal = getRole();

  // Estados
  const [editMode, setEditMode] = React.useState(false);
  const [modalSenha, setModalSenha] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<UserMe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    nome: "",
    usuario: "",
  });

  const role = userInfo?.role ?? roleLocal;
  const name = userInfo?.nome ?? "Aluno";

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErro(null);
        const data = await obterUsuarioAtual();
        setUserInfo(data);
        setFormData({
          nome: data.nome,
          usuario: data.usuario,
        });
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar usuario");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Estatísticas
  const stats: UserStats = {
    exerciciosFitos: 41,
    notaMedia: 8.5,
    turmasInscritas: 2,
    diasSequencia: 12,
  };

  // Turmas (exemplo)
  const turmas = [
    {
      id: "1",
      nome: "Turma A 2024",
      categoria: "programacao",
      tipo: "turma",
    },
    {
      id: "2",
      nome: "João Silva - Particular",
      categoria: "informatica",
      tipo: "particular",
    },
  ];

  const handleEditChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSaveEdit = () => {
    alert("Dados atualizados com sucesso!");
    setEditMode(false);
  };

  const handleChangeSenha = () => {
    alert("Senha alterada com sucesso!");
    setModalSenha(false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Perfil" subtitle="Carregando...">
        <div style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
          Carregando dados...
        </div>
      </DashboardLayout>
    );
  }

  if (erro) {
    return (
      <DashboardLayout title="Perfil" subtitle="Erro">
        <div style={{ textAlign: "center", padding: "24px", color: "var(--red)" }}>
          Erro ao carregar usuario: {erro}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Perfil"
      subtitle="Gerencie suas informações pessoais"
    >
      <div className="perfilContainer">
        {/* SECTION 1: INFORMAÇÕES BÁSICAS */}
        <section className="perfilCard">
          <div className="cardHeader">
            <h2>Minhas Informações</h2>
            {!editMode && (
              <button
                className="editBtn"
                onClick={() => setEditMode(true)}
              >
                ✏️ Editar
              </button>
            )}
          </div>

          {editMode ? (
            <div className="editForm">
              <div className="formGroup">
                <label className="formLabel">Nome Completo</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleEditChange("nome", e.target.value)}
                  className="formInput"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Usuário</label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => handleEditChange("usuario", e.target.value)}
                  className="formInput"
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>

              <div className="formGroup">

              <div className="formActions">
                <button
                  className="btnCancel"
                  onClick={() => setEditMode(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btnSalvar"
                  onClick={handleSaveEdit}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          ) : (
            <div className="infoGrid">
              <div className="infoItem">
                <div className="infoLabel">Nome</div>
                <div className="infoValue">{formData.nome}</div>
              </div>
              <div className="infoItem">
                <div className="infoLabel">Usuário</div>
                <div className="infoValue">@{formData.usuario}</div>
              </div>
              <div className="infoItem">
              <div className="infoItem">
                <div className="infoLabel">Função</div>
                <div className="infoValue">
                  {role === "admin"
                    ? "Administrador"
                    : role === "professor"
                    ? "Professor"
                    : "Aluno"}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: SEGURANÇA */}
        <section className="perfilCard">
          <div className="cardHeader">
            <h2>Segurança</h2>
          </div>

          <div className="securityContent">
            <div className="securityItem">
              <div className="securityInfo">
                <h3>Alterar Senha</h3>
                <p>Mantenha sua conta segura com uma senha forte</p>
              </div>
              <button
                className="altBtn"
                onClick={() => setModalSenha(true)}
              >
                Alterar
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: ESTATÍSTICAS */}
        <section className="perfilCard">
          <div className="cardHeader">
            <h2>Seu Desempenho</h2>
          </div>

          <div className="statsGrid">
            <div className="statCard">
              <div className="statIcon">✍️</div>
              <div className="statInfo">
                <div className="statValue">{stats.exerciciosFitos}</div>
                <div className="statLabel">Exercícios Feitos</div>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon">⭐</div>
              <div className="statInfo">
                <div className="statValue">{stats.notaMedia.toFixed(1)}/10</div>
                <div className="statLabel">Nota Média</div>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon">👥</div>
              <div className="statInfo">
                <div className="statValue">{stats.turmasInscritas}</div>
                <div className="statLabel">Turmas Inscritas</div>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon">🔥</div>
              <div className="statInfo">
                <div className="statValue">{stats.diasSequencia}</div>
                <div className="statLabel">Dias de Sequência</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: TURMAS */}
        <section className="perfilCard">
          <div className="cardHeader">
            <h2>Turmas Inscritas</h2>
          </div>

          {turmas.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">📚</div>
              <p>Você não está inscrito em nenhuma turma</p>
            </div>
          ) : (
            <div className="turmasList">
              {turmas.map((turma) => (
                <div key={turma.id} className="turmaItem">
                  <div className="turmaIcon">
                    {turma.tipo === "turma" ? "👥" : "👤"}
                  </div>
                  <div className="turmaInfo">
                    <h3 className="turmaNome">{turma.nome}</h3>
                    <div className="turmaMeta">
                      <span className="badge badgeCategoria">
                        {turma.categoria === "programacao"
                          ? "💻 Programação"
                          : "🖥️ Informática"}
                      </span>
                      <span className="badge badgeTipo">
                        {turma.tipo === "turma" ? "Grupo" : "Particular"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MODAL DE ALTERAR SENHA */}
        {modalSenha && (
          <div className="modalOverlay" onClick={() => setModalSenha(false)}>
            <div
              className="modalContent"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Alterar Senha</h3>

              <div className="formGroup">
                <label className="formLabel">Senha Atual</label>
                <input
                  type="password"
                  placeholder="Digite sua senha atual"
                  className="formInput"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Nova Senha</label>
                <input
                  type="password"
                  placeholder="Digite sua nova senha"
                  className="formInput"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Confirmar Nova Senha</label>
                <input
                  type="password"
                  placeholder="Confirme sua nova senha"
                  className="formInput"
                />
              </div>

              <div className="modalActions">
                <button
                  className="btnCancel"
                  onClick={() => setModalSenha(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btnConfirm"
                  onClick={handleChangeSenha}
                >
                  Alterar Senha
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
