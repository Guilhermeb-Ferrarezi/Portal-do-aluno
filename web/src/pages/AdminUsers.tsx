import React from "react";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import Pagination from "../components/Pagination";
import { listarAlunos, listarProfessores, type User } from "../services/api";
import "./AdminUsers.css";

export default function AdminUsersPage() {
  const [usuarios, setUsuarios] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = React.useState<"todos" | "aluno" | "professor" | "admin">("todos");
  const [busca, setBusca] = React.useState("");

  // Estados do modal de edição
  const [editandoUsuario, setEditandoUsuario] = React.useState<User | null>(null);
  const [editNome, setEditNome] = React.useState("");
  const [editUsuario, setEditUsuario] = React.useState("");
  const [editarAberto, setEditarAberto] = React.useState(false);

  // Estados para deletar
  const [usuarioDeletar, setUsuarioDeletar] = React.useState<User | null>(null);
  const [deletando, setDeletando] = React.useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Carregar usuários ao montar
  React.useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setErro(null);

      const [alunos, professores] = await Promise.all([
        listarAlunos(),
        listarProfessores(),
      ]);

      // Adicionar role aos usuarios
      const alunosComRole: User[] = alunos.map(a => ({ ...a, role: "aluno" }));
      const professoresComRole: User[] = professores.map(p => ({ ...p, role: "professor" }));

      setUsuarios([...alunosComRole, ...professoresComRole]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchTipo = filtroTipo === "todos" || u.role === filtroTipo;
    const matchBusca =
      busca === "" ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.usuario.toLowerCase().includes(busca.toLowerCase());

    return matchTipo && matchBusca;
  });

  const totalItems = usuariosFiltrados.length;

  // Paginação
  const startIdx = (currentPage - 1) * itemsPerPage;
  const usuariosPaginados = usuariosFiltrados.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  const abrirEditar = (usuario: User) => {
    setEditandoUsuario(usuario);
    setEditNome(usuario.nome);
    setEditUsuario(usuario.usuario);
    setEditarAberto(true);
  };

  const fecharEditar = () => {
    setEditarAberto(false);
    setEditandoUsuario(null);
    setEditNome("");
    setEditUsuario("");
  };

  const salvarEdicao = async () => {
    if (!editandoUsuario) return;

    if (!editNome.trim() || !editUsuario.trim()) {
      alert("Nome e usuário são obrigatórios");
      return;
    }

    try {
      // TODO: Implementar endpoint de atualização no backend
      console.log("Atualizando usuário:", {
        id: editandoUsuario.id,
        nome: editNome,
        usuario: editUsuario,
      });

      // Atualizar na lista local
      setUsuarios(
        usuarios.map((u) =>
          u.id === editandoUsuario.id
            ? { ...u, nome: editNome, usuario: editUsuario }
            : u
        )
      );

      fecharEditar();
      alert("Usuário atualizado com sucesso!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar usuário");
    }
  };

  const confirmarDeletar = async () => {
    if (!usuarioDeletar) return;

    try {
      setDeletando(true);

      // TODO: Implementar endpoint de deleção no backend
      console.log("Deletando usuário:", usuarioDeletar.id);

      // Remover da lista local
      setUsuarios(usuarios.filter((u) => u.id !== usuarioDeletar.id));
      setUsuarioDeletar(null);

      alert("Usuário deletado com sucesso!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao deletar usuário");
    } finally {
      setDeletando(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Gerenciar Usuários"
        subtitle="Gerencie alunos, professores e admins"
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Carregando usuários...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (erro) {
    return (
      <DashboardLayout
        title="Gerenciar Usuários"
        subtitle="Gerencie alunos, professores e admins"
      >
        <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
          <p>Erro: {erro}</p>
          <button onClick={carregarUsuarios}>Tentar novamente</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Gerenciar Usuários"
      subtitle="Gerencie alunos, professores e admins"
    >
      <div className="adminUsersContainer">
        {/* HEADER COM FILTROS */}
        <div className="adminHeader">
          <div className="filterRow">
            {/* Busca */}
            <div className="searchBox">
              <input
                type="text"
                placeholder="🔍 Buscar por nome ou usuário..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setCurrentPage(1);
                }}
                className="searchInput"
              />
            </div>

            {/* Filtro de Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value as any);
                setCurrentPage(1);
              }}
              className="filterSelect"
            >
              <option value="todos">👥 Todos os tipos</option>
              <option value="aluno">🎓 Alunos</option>
              <option value="professor">👨‍🏫 Professores</option>
              <option value="admin">🔑 Admins</option>
            </select>
          </div>
        </div>

        {/* TABELA DE USUÁRIOS */}
        {usuariosFiltrados.length === 0 ? (
          <div className="emptyState">
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <>
            <div className="usersTableContainer">
              <table className="usersTable">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Usuário</th>
                    <th>Tipo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosPaginados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nome}</td>
                      <td className="usuarioCell">{usuario.usuario}</td>
                      <td>
                        <span className={`roleTag role-${usuario.role}`}>
                          {usuario.role === "aluno"
                            ? "🎓 Aluno"
                            : usuario.role === "professor"
                            ? "👨‍🏫 Professor"
                            : "🔑 Admin"}
                        </span>
                      </td>
                      <td className="actionCell">
                        <button
                          className="btnEdit"
                          onClick={() => abrirEditar(usuario)}
                          title="Editar usuário"
                        >
                          ✏️
                        </button>
                        <button
                          className="btnDelete"
                          onClick={() => setUsuarioDeletar(usuario)}
                          title="Deletar usuário"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}

        {/* MODAL DE EDIÇÃO */}
        {editarAberto && editandoUsuario && (
          <div className="modalOverlay" onClick={fecharEditar}>
            <div
              className="modalContent"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Editar Usuário</h3>

              <div className="formGroup">
                <label className="formLabel">Nome</label>
                <input
                  type="text"
                  className="formInput"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Digite o nome"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Usuário</label>
                <input
                  type="text"
                  className="formInput"
                  value={editUsuario}
                  onChange={(e) => setEditUsuario(e.target.value)}
                  placeholder="Digite o usuário"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Tipo</label>
                <p style={{ margin: "8px 0", fontSize: "14px" }}>
                  {editandoUsuario.role === "aluno"
                    ? "🎓 Aluno"
                    : editandoUsuario.role === "professor"
                    ? "👨‍🏫 Professor"
                    : "🔑 Admin"}
                </p>
                <small style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Alterar o tipo de usuário requer alteração manual no banco de dados
                </small>
              </div>

              <div className="modalActions">
                <button
                  type="button"
                  className="btnCancel"
                  onClick={fecharEditar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btnConfirm"
                  onClick={salvarEdicao}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE DELEÇÃO */}
        {usuarioDeletar && (
          <div
            className="modalOverlay"
            onClick={() => setUsuarioDeletar(null)}
          >
            <div
              className="modalContent"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Deletar Usuário</h3>
              <p className="confirmText">
                Tem certeza que deseja deletar o usuário "{usuarioDeletar.nome}"?
                <br />
                <strong>Esta ação não pode ser desfeita.</strong>
              </p>

              <div className="modalActions">
                <button
                  type="button"
                  className="btnCancel"
                  onClick={() => setUsuarioDeletar(null)}
                  disabled={deletando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btnDelete"
                  onClick={confirmarDeletar}
                  disabled={deletando}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                  }}
                >
                  {deletando ? "Deletando..." : "Deletar Usuário"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
