import React from "react";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import Pagination from "../components/Pagination";
import { hasRole } from "../auth/auth";
import {
  listarMateriais,
  criarMaterial,
  deletarMaterial,
  listarExercicios,
  type Material,
} from "../services/api";
import "./Materiais.css";

export default function MateriaisPage() {
  const canUpload = hasRole(["admin", "professor"]);

  // Estados principais
  const [materiais, setMateriais] = React.useState<Material[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Estados de filtros
  const [filtroModulo, setFiltroModulo] = React.useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = React.useState<string>("todos");
  const [busca, setBusca] = React.useState<string>("");
  const [modalAberto, setModalAberto] = React.useState(false);

  // Estados do formulário
  const [formTitulo, setFormTitulo] = React.useState("");
  const [formModulo, setFormModulo] = React.useState("");
  const [formTipo, setFormTipo] = React.useState<"arquivo" | "link">("arquivo");
  const [formDescricao, setFormDescricao] = React.useState("");
  const [formUrl, setFormUrl] = React.useState("");
  const [formArquivo, setFormArquivo] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    kind: "success" | "error";
    title: string;
    message?: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Material | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Módulos de exercícios
  const [exerciseModulos, setExerciseModulos] = React.useState<string[]>([]);

  // Carregar materiais ao montar
  React.useEffect(() => {
    carregarMateriais();
    carregarModulosExercicios();
  }, []);

  const carregarModulosExercicios = async () => {
    try {
      const exercicios = await listarExercicios();
      const modulos = Array.from(new Set(exercicios.map((ex) => ex.modulo)))
        .sort();
      setExerciseModulos(modulos);
    } catch (err) {
      console.error("Erro ao carregar módulos de exercícios:", err);
    }
  };

  const carregarMateriais = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listarMateriais();
      setMateriais(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar materiais"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrar materiais
  const materiaisFiltrados = materiais.filter((m) => {
    const matchModulo =
      filtroModulo === "todos" || m.modulo === filtroModulo;
    const matchTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
    const matchBusca =
      busca === "" ||
      m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (m.descricao &&
        m.descricao.toLowerCase().includes(busca.toLowerCase()));

    return matchModulo && matchTipo && matchBusca;
  });

  // Obter lista única de módulos
  const modulos = Array.from(new Set(materiais.map((m) => m.modulo)));

  const resetForm = () => {
    setFormTitulo("");
    setFormModulo("");
    setFormTipo("arquivo");
    setFormDescricao("");
    setFormUrl("");
    setFormArquivo(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitulo || !formModulo) {
      setFormError("Preencha todos os campos obrigatorios.");
      return;
    }

    if (formTipo === "arquivo" && !formArquivo) {
      setFormError("Selecione um arquivo para fazer upload.");
      return;
    }

    if (formTipo === "link" && !formUrl) {
      setFormError("Forneca uma URL para o link.");
      return;
    }

    try {
      setSubmitting(true);

      // Preparar FormData
      const formData = new FormData();
      formData.append("titulo", formTitulo);
      formData.append("tipo", formTipo);
      formData.append("modulo", formModulo);
      if (formDescricao) {
        formData.append("descricao", formDescricao);
      }

      if (formTipo === "arquivo" && formArquivo) {
        formData.append("file", formArquivo);
      } else if (formTipo === "link") {
        formData.append("url", formUrl);
      }

      await criarMaterial(formData);
      setModalAberto(false);
      resetForm();
      setFeedback({
        kind: "success",
        title: "Material adicionado",
        message: "O material foi adicionado com sucesso.",
      });
      await carregarMateriais();
    } catch (err) {
      setFeedback({
        kind: "error",
        title: "Erro ao adicionar material",
        message:
          err instanceof Error ? err.message : "Erro ao adicionar material",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    try {
      setDeleting(true);
      await deletarMaterial(target.id);
      setDeleteTarget(null);
      setFeedback({
        kind: "success",
        title: "Material deletado",
        message: `"${target.titulo}" foi removido.`,
      });
      await carregarMateriais();
    } catch (err) {
      setFeedback({
        kind: "error",
        title: "Erro ao deletar material",
        message:
          err instanceof Error ? err.message : "Erro ao deletar material",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (material: Material) => {
    window.open(material.url, "_blank");
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        title="Materiais"
        subtitle="Acesse arquivos e links de estudo"
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Carregando materiais...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout
        title="Materiais"
        subtitle="Acesse arquivos e links de estudo"
      >
        <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
          <p>Erro: {error}</p>
          <button onClick={carregarMateriais}>Tentar novamente</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Materiais"
      subtitle="Acesse arquivos e links de estudo"
    >
      <div className="materiaisContainer">
        {feedback && (
          <div
            className="feedbackOverlay"
            onClick={() => setFeedback(null)}
          >
            <div
              className={`feedbackCard ${feedback.kind}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="feedbackHeader">
                <span className="feedbackBadge">
                  {feedback.kind === "success" ? "OK" : "ERRO"}
                </span>
                <h3 className="feedbackTitle">{feedback.title}</h3>
              </div>
              {feedback.message && (
                <p className="feedbackMessage">{feedback.message}</p>
              )}
              <button
                className="btnConfirm"
                type="button"
                onClick={() => setFeedback(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* HEADER COM FILTROS */}
        <div className="materiaisHeader">
          <div className="filtrosRow">
            {/* Busca */}
            <div className="searchBox">
              <input
                type="text"
                placeholder="🔍 Buscar materiais..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="searchInput"
              />
            </div>

            {/* Filtro de Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="filterSelect"
            >
              <option value="todos">Todos os tipos</option>
              <option value="arquivo">📄 Arquivos</option>
              <option value="link">🔗 Links</option>
            </select>

            {/* Filtro de Módulo */}
            <select
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className="filterSelect"
            >
              <option value="todos">Todos os módulos</option>
              {modulos.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Upload (apenas para admin/professor) */}
          {canUpload && (
            <button
              className="uploadBtn"
              onClick={() => {
                setModalAberto(true);
                setFormError(null);
              }}
            >
              ➕ Adicionar Material
            </button>
          )}
        </div>

        
        {/* LISTA DE MATERIAIS */}
        <div>
          {materiaisFiltrados.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">📚</div>
              <div className="emptyTitle">
                {materiais.length === 0
                  ? "Nenhum material disponível"
                  : "Nenhum material encontrado"}
              </div>
              <p className="emptyText">
                {materiais.length === 0
                  ? "Em breve serão adicionados materiais para estudo."
                  : "Tente ajustar seus filtros de busca."}
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedMateriais = materiaisFiltrados.slice(
                  startIndex,
                  endIndex
                );

                return (
                  <>
                    <div className="materiaisGrid">
                      {paginatedMateriais.map((material) => (
                        <div key={material.id} className="materialCard">
                  <div className="materialHeader">
                    <div className="materialIcon">
                      {material.tipo === "arquivo" ? "📄" : "🔗"}
                    </div>
                    <div className="materialInfo">
                      <h3 className="materialTitulo">{material.titulo}</h3>
                      <div className="materialMeta">
                        <span className="metaBadge">{material.modulo}</span>
                        <span className="metaData">
                          {new Date(material.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="materialDescricao">
                    {material.descricao || "Sem descrição"}
                  </p>

                  <div className="materialFooter">
                    <button
                      className="materialBtn"
                      onClick={() => handleDownload(material)}
                    >
                      {material.tipo === "arquivo"
                        ? "⬇️ Baixar"
                        : "🌐 Abrir Link"}
                    </button>

                    {canUpload && (
                      <button
                        onClick={() => setDeleteTarget(material)}
                        className="materialDeleteBtn"
                        title="Deletar"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                      ))}
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={materiaisFiltrados.length}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </>
                );
              })()}
            </>
          )}
        </div>

        {/* MODAL DE UPLOAD (apenas para admin/professor) */}
        {modalAberto && canUpload && (
          <div className="modalOverlay" onClick={() => setModalAberto(false)}>
            <div
              className="modalContent"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Adicionar Novo Material</h3>
              {formError && <p className="formError">{formError}</p>}

              <form onSubmit={handleSubmit}>
                <div className="formGroup">
                  <label className="formLabel">Título *</label>
                  <input
                    type="text"
                    placeholder="Título do material"
                    className="formInput"
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label className="formLabel">Módulo *</label>
                  <input
                    type="text"
                    placeholder="Nome do módulo (crie um novo ou selecione existente)"
                    className="formInput"
                    value={formModulo}
                    onChange={(e) => setFormModulo(e.target.value)}
                    list="modulos-list"
                    required
                  />
                  <datalist id="modulos-list">
                    {modulos.map((mod) => (
                      <option key={mod} value={mod} />
                    ))}
                  </datalist>
                </div>

                <div className="formGroup">
                  <label className="formLabel">Tipo *</label>
                  <div className="radioGroup">
                    <label className="radioLabel">
                      <input
                        type="radio"
                        name="tipo"
                        value="arquivo"
                        checked={formTipo === "arquivo"}
                        onChange={() => setFormTipo("arquivo")}
                      />
                      <span>📄 Arquivo</span>
                    </label>
                    <label className="radioLabel">
                      <input
                        type="radio"
                        name="tipo"
                        value="link"
                        checked={formTipo === "link"}
                        onChange={() => setFormTipo("link")}
                      />
                      <span>🔗 Link</span>
                    </label>
                  </div>
                </div>

                <div className="formGroup">
                  <label className="formLabel">Descrição</label>
                  <textarea
                    placeholder="Descrição do material"
                    className="formInput"
                    rows={3}
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                  />
                </div>

                {/* Input dinâmico baseado no tipo */}
                {formTipo === "arquivo" ? (
                  <div className="formGroup">
                    <label className="formLabel">Arquivo *</label>
                    <input
                      type="file"
                      className="formInput"
                      onChange={(e) => setFormArquivo(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                ) : (
                  <div className="formGroup">
                    <label className="formLabel">URL *</label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/recurso"
                      className="formInput"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="modalActions">
                  <button
                    type="button"
                    className="btnCancel"
                    onClick={() => {
                      setModalAberto(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btnConfirm"
                    disabled={submitting}
                  >
                    {submitting ? "Adicionando..." : "Adicionar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="modalOverlay" onClick={() => setDeleteTarget(null)}>
            <div
              className="modalContent"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Deletar material</h3>
              <p className="confirmText">
                Tem certeza que deseja deletar o material "{deleteTarget.titulo}"?
              </p>
              <div className="modalActions">
                <button
                  type="button"
                  className="btnCancel"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btnDanger"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deletando..." : "Deletar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
