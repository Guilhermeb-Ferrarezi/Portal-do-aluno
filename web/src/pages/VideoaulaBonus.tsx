import React from "react";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import Pagination from "../components/Pagination";
import { hasRole } from "../auth/auth";
import { listarExercicios } from "../services/api";
import "./VideoaulaBonus.css";

type Videoaula = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  duracao: string;
  tipo: "youtube" | "local";
  url?: string;
  arquivo?: string;
  thumbnail?: string;
  dataAdicionada: string;
};

export default function VideoaulaBonusPage() {
  const canUpload = hasRole(["admin", "professor"]);

  // Estados
  const [videoaulas, setVideoaulas] = React.useState<Videoaula[]>([]);
  const [filtroModulo, setFiltroModulo] = React.useState<string>("todos");
  const [busca, setBusca] = React.useState<string>("");
  const [modalAberto, setModalAberto] = React.useState(false);
  const [videoSelecionado, setVideoSelecionado] = React.useState<Videoaula | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Módulos de exercícios
  const [exerciseModulos, setExerciseModulos] = React.useState<string[]>([]);

  const [formData, setFormData] = React.useState({
    titulo: "",
    descricao: "",
    modulo: "",
    tipo: "youtube",
    url: "",
    arquivo: null as File | null,
    duracao: "",
  });

  // Carregar módulos de exercícios
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

  // Videoaulas de exemplo
  const videoaulasExemplo: Videoaula[] = [
    {
      id: "1",
      titulo: "Introdução à Programação - Parte 1",
      descricao: "Conceitos fundamentais de lógica e algoritmos",
      modulo: "Introdução à Programação",
      duracao: "25:30",
      tipo: "youtube",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://via.placeholder.com/320x180?text=Aula+1",
      dataAdicionada: "2025-01-15",
    },
    {
      id: "2",
      titulo: "Estruturas de Controle - Loops",
      descricao: "Como usar for, while e do-while em programação",
      modulo: "Estruturas de Controle",
      duracao: "32:15",
      tipo: "youtube",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://via.placeholder.com/320x180?text=Loops",
      dataAdicionada: "2025-01-14",
    },
    {
      id: "3",
      titulo: "Funções e Escopo em JavaScript",
      descricao: "Entenda como funcionam funções, escopo e closures",
      modulo: "Funções e Escopo",
      duracao: "28:45",
      tipo: "youtube",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://via.placeholder.com/320x180?text=Funções",
      dataAdicionada: "2025-01-13",
    },
  ];

  // Carregar videoaulas do localStorage na montagem
  React.useEffect(() => {
    const saved = localStorage.getItem("videoaulas");
    if (saved) {
      try {
        setVideoaulas(JSON.parse(saved));
      } catch (e) {
        setVideoaulas(videoaulasExemplo);
      }
    } else {
      setVideoaulas(videoaulasExemplo);
      localStorage.setItem("videoaulas", JSON.stringify(videoaulasExemplo));
    }

    // Carregar módulos de exercícios
    carregarModulosExercicios();
  }, []);

  // Filtrar videoaulas
  const videoaulasFiltradas = videoaulas.filter((v) => {
    const matchModulo =
      filtroModulo === "todos" || v.modulo === filtroModulo;
    const matchBusca =
      busca === "" ||
      v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      v.descricao.toLowerCase().includes(busca.toLowerCase());

    return matchModulo && matchBusca;
  });

  // Obter lista única de módulos
  const modulos = Array.from(new Set(videoaulas.map((v) => v.modulo)));

  const handleAssistir = (videoaula: Videoaula) => {
    setVideoSelecionado(videoaula);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        arquivo: file,
      });
    }
  };

  const handleAddVideoaula = () => {
    if (
      !formData.titulo.trim() ||
      !formData.modulo.trim() ||
      !formData.duracao.trim()
    ) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (formData.tipo === "youtube" && !formData.url.trim()) {
      alert("Por favor, cole a URL do YouTube");
      return;
    }

    if (formData.tipo === "local" && !formData.arquivo) {
      alert("Por favor, selecione um arquivo de vídeo");
      return;
    }

    // Criar nova videoaula
    const novaVideoaula: Videoaula = {
      id: Date.now().toString(),
      titulo: formData.titulo,
      descricao: formData.descricao,
      modulo: formData.modulo,
      duracao: formData.duracao,
      tipo: formData.tipo as "youtube" | "local",
      url:
        formData.tipo === "youtube"
          ? formData.url
          : formData.arquivo
          ? URL.createObjectURL(formData.arquivo)
          : undefined,
      arquivo:
        formData.tipo === "local" ? formData.arquivo?.name : undefined,
      thumbnail: "https://via.placeholder.com/320x180?text=Video",
      dataAdicionada: new Date().toISOString().split("T")[0],
    };

    // Salvar no localStorage
    const updated = [...videoaulas, novaVideoaula];
    setVideoaulas(updated);
    localStorage.setItem("videoaulas", JSON.stringify(updated));

    // Resetar formulário
    setFormData({
      titulo: "",
      descricao: "",
      modulo: "",
      tipo: "youtube",
      url: "",
      arquivo: null,
      duracao: "",
    });

    setModalAberto(false);
    alert("Videoaula adicionada com sucesso!");
  };

  const handleDeleteVideoaula = (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta videoaula?")) {
      const updated = videoaulas.filter((v) => v.id !== id);
      setVideoaulas(updated);
      localStorage.setItem("videoaulas", JSON.stringify(updated));
    }
  };

  return (
    <DashboardLayout
      title="Videoaulas Bônus"
      subtitle="Aprenda ainda mais com essas aulas extras"
    >
      <div className="videoaulasContainer">
        {/* HEADER COM FILTROS */}
        <div className="videoaulasHeader">
          <div className="filtrosRow">
            {/* Busca */}
            <div className="searchBox">
              <input
                type="text"
                placeholder="🔍 Buscar videoaulas..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="searchInput"
              />
            </div>

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
              onClick={() => setModalAberto(true)}
            >
              ➕ Adicionar Videoaula
            </button>
          )}
        </div>

        {/* SEÇÃO DE MÓDULOS DE EXERCÍCIOS */}
        {exerciseModulos.length > 0 && (
          <div style={{ marginTop: "32px", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text)" }}>
              📋 Módulos com Exercícios
            </h3>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px"
            }}>
              {exerciseModulos.map((modulo) => (
                <button
                  key={modulo}
                  onClick={() => setFiltroModulo(modulo)}
                  style={{
                    padding: "8px 16px",
                    background: filtroModulo === modulo ? "var(--primary)" : "var(--background-secondary)",
                    color: filtroModulo === modulo ? "#fff" : "var(--text)",
                    border: filtroModulo === modulo ? "1px solid var(--primary)" : "1px solid var(--border)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (filtroModulo !== modulo) {
                      (e.target as HTMLButtonElement).style.background = "var(--background-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filtroModulo !== modulo) {
                      (e.target as HTMLButtonElement).style.background = "var(--background-secondary)";
                    }
                  }}
                >
                  {modulo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GRID DE VIDEOAULAS */}
        <div>
          {videoaulasFiltradas.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">🎬</div>
              <div className="emptyTitle">
                {videoaulas.length === 0
                  ? "Nenhuma videoaula disponível"
                  : "Nenhuma videoaula encontrada"}
              </div>
              <p className="emptyText">
                {videoaulas.length === 0
                  ? "Em breve serão adicionadas videoaulas extras."
                  : "Tente ajustar seus filtros de busca."}
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedVideoaulas = videoaulasFiltradas.slice(
                  startIndex,
                  endIndex
                );

                return (
                  <>
                    <div className="videoaulasGrid">
                      {paginatedVideoaulas.map((videoaula) => (
                        <div key={videoaula.id} className="videoaulaCard">
                  <div
                    className="videoaulaThumbnail"
                    onClick={() => handleAssistir(videoaula)}
                  >
                    <img
                      src={videoaula.thumbnail || "https://via.placeholder.com/320x180"}
                      alt={videoaula.titulo}
                    />
                    <div className="playButton">▶</div>
                    <span className="duracao">{videoaula.duracao}</span>
                  </div>

                  <div className="videoaulaContent">
                    <div className="metaBadge">{videoaula.modulo}</div>
                    <h3 className="videoaulaTitulo">{videoaula.titulo}</h3>
                    <p className="videoaulaDescricao">{videoaula.descricao}</p>
                    <div className="videoaulaFooter">
                      <span className="dataBadge">
                        {new Date(videoaula.dataAdicionada).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="assistirBtn"
                          onClick={() => handleAssistir(videoaula)}
                        >
                          ▶️ Assistir
                        </button>
                        {canUpload && (
                          <button
                            className="deleteBtn"
                            onClick={() => handleDeleteVideoaula(videoaula.id)}
                            title="Deletar"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                      ))}
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={videoaulasFiltradas.length}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </>
                );
              })()}
            </>
          )}
        </div>

        {/* MODAL DE VIDEOAULA */}
        {videoSelecionado && (
          <div className="modalOverlay" onClick={() => setVideoSelecionado(null)}>
            <div
              className="modalContent videoaulaModal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="closeBtn"
                onClick={() => setVideoSelecionado(null)}
              >
                ✕
              </button>

              <div className="videoContainer">
                {videoSelecionado.tipo === "youtube" ? (
                  <iframe
                    width="100%"
                    height="400"
                    src={videoSelecionado.url}
                    title={videoSelecionado.titulo}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    width="100%"
                    height="400"
                    controls
                    style={{ backgroundColor: "#000" }}
                  >
                    <source
                      src={videoSelecionado.url}
                      type="video/mp4"
                    />
                    Seu navegador não suporta a tag de vídeo.
                  </video>
                )}
              </div>

              <div className="videoInfo">
                <h2>{videoSelecionado.titulo}</h2>
                <div className="infoRow">
                  <span className="modulo">{videoSelecionado.modulo}</span>
                  <span className="duracao">⏱️ {videoSelecionado.duracao}</span>
                </div>
                <p className="descricao">{videoSelecionado.descricao}</p>
                <div className="infoFooter">
                  <span className="data">
                    Adicionada em{" "}
                    {new Date(videoSelecionado.dataAdicionada).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE UPLOAD */}
        {modalAberto && canUpload && (
          <div className="modalOverlay" onClick={() => setModalAberto(false)}>
            <div
              className="modalContent"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Adicionar Nova Videoaula</h3>

              <div className="formGroup">
                <label className="formLabel">Título *</label>
                <input
                  type="text"
                  placeholder="Título da videoaula"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  className="formInput"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Módulo *</label>
                <select
                  value={formData.modulo}
                  onChange={(e) =>
                    setFormData({ ...formData, modulo: e.target.value })
                  }
                  className="formInput"
                >
                  <option value="">Selecione um módulo</option>
                  {modulos.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                  <option value="novo">+ Novo Módulo</option>
                </select>
              </div>

              <div className="formGroup">
                <label className="formLabel">Tipo *</label>
                <div className="radioGroup">
                  <label className="radioLabel">
                    <input
                      type="radio"
                      name="tipo"
                      value="youtube"
                      checked={formData.tipo === "youtube"}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo: e.target.value })
                      }
                    />
                    <span>🎥 YouTube</span>
                  </label>
                  <label className="radioLabel">
                    <input
                      type="radio"
                      name="tipo"
                      value="local"
                      checked={formData.tipo === "local"}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo: e.target.value })
                      }
                    />
                    <span>📁 Upload Local</span>
                  </label>
                </div>
              </div>

              <div className="formGroup">
                <label className="formLabel">Descrição</label>
                <textarea
                  placeholder="Descrição da videoaula"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="formInput"
                  rows={3}
                />
              </div>

              {formData.tipo === "youtube" ? (
                <div className="formGroup">
                  <label className="formLabel">URL do YouTube *</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/embed/..."
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="formInput"
                  />
                </div>
              ) : (
                <div className="formGroup">
                  <label className="formLabel">Arquivo de Vídeo *</label>
                  <label className="fileInputWrapper">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="fileInput"
                    />
                    <span className="fileInputLabel">
                      {formData.arquivo
                        ? `✓ ${formData.arquivo.name}`
                        : "Selecione um arquivo de vídeo (MP4, WebM, etc)"}
                    </span>
                  </label>
                </div>
              )}

              <div className="formGroup">
                <label className="formLabel">Duração (mm:ss) *</label>
                <input
                  type="text"
                  placeholder="Ex: 25:30"
                  value={formData.duracao}
                  onChange={(e) =>
                    setFormData({ ...formData, duracao: e.target.value })
                  }
                  className="formInput"
                />
              </div>

              <div className="modalActions">
                <button
                  className="btnCancel"
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btnConfirm"
                  onClick={handleAddVideoaula}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
