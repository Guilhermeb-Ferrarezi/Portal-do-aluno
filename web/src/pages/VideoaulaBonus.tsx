import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import { getName, getRole, hasRole } from "../auth/auth";
import "./VideoaulaBonus.css";

type Videoaula = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  duracao: string;
  tipo: "youtube" | "arquivo";
  url?: string;
  arquivo?: string;
  thumbnail?: string;
  dataAdicionada: string;
};

export default function VideoaulaBonusPage() {
  const navigate = useNavigate();
  const name = getName() ?? "Aluno";
  const role = getRole();
  const canUpload = hasRole(["admin", "professor"]);

  // Estados
  const [videoaulas, setVideoaulas] = React.useState<Videoaula[]>([]);
  const [filtroModulo, setFiltroModulo] = React.useState<string>("todos");
  const [busca, setBusca] = React.useState<string>("");
  const [modalAberto, setModalAberto] = React.useState(false);
  const [videoSelecionado, setVideoSelecionado] = React.useState<Videoaula | null>(null);

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
    {
      id: "4",
      titulo: "CSS Grid - Tutorial Completo",
      descricao: "Aprenda a usar CSS Grid para layouts modernos",
      modulo: "Desenvolvimento Web",
      duracao: "45:20",
      tipo: "youtube",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://via.placeholder.com/320x180?text=CSS+Grid",
      dataAdicionada: "2025-01-12",
    },
    {
      id: "5",
      titulo: "Flexbox na Prática",
      descricao: "Exemplos práticos de CSS Flexbox para layouts responsivos",
      modulo: "Desenvolvimento Web",
      duracao: "38:10",
      tipo: "arquivo",
      arquivo: "flexbox-pratica.mp4",
      thumbnail: "https://via.placeholder.com/320x180?text=Flexbox",
      dataAdicionada: "2025-01-11",
    },
    {
      id: "6",
      titulo: "Promises e Async/Await",
      descricao: "Programação assíncrona em JavaScript",
      modulo: "JavaScript Avançado",
      duracao: "42:30",
      tipo: "youtube",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://via.placeholder.com/320x180?text=Async+Await",
      dataAdicionada: "2025-01-10",
    },
    {
      id: "7",
      titulo: "React Hooks - useState e useEffect",
      descricao: "Os hooks mais usados no React para gerenciar estado",
      modulo: "Frameworks Frontend",
      duracao: "51:15",
      tipo: "youtube",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://via.placeholder.com/320x180?text=React+Hooks",
      dataAdicionada: "2025-01-09",
    },
    {
      id: "8",
      titulo: "State Management com Context API",
      descricao: "Gerenciamento global de estado com React Context",
      modulo: "Frameworks Frontend",
      duracao: "39:45",
      tipo: "arquivo",
      arquivo: "context-api.mp4",
      thumbnail: "https://via.placeholder.com/320x180?text=Context+API",
      dataAdicionada: "2025-01-08",
    },
  ];

  React.useEffect(() => {
    setVideoaulas(videoaulasExemplo);
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
            <div className="videoaulasGrid">
              {videoaulasFiltradas.map((videoaula) => (
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
                      <button
                        className="assistirBtn"
                        onClick={() => handleAssistir(videoaula)}
                      >
                        {videoaula.tipo === "youtube" ? "▶️ Assistir" : "⬇️ Baixar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                      src={`/videos/${videoSelecionado.arquivo}`}
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

        {/* MODAL DE UPLOAD (apenas para admin/professor) */}
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
                  className="formInput"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Módulo *</label>
                <select className="formInput">
                  <option value="">Selecione um módulo</option>
                  {modulos.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label className="formLabel">Tipo *</label>
                <div className="radioGroup">
                  <label className="radioLabel">
                    <input type="radio" name="tipo" value="youtube" />
                    <span>🎥 YouTube</span>
                  </label>
                  <label className="radioLabel">
                    <input type="radio" name="tipo" value="arquivo" />
                    <span>📁 Arquivo Local</span>
                  </label>
                </div>
              </div>

              <div className="formGroup">
                <label className="formLabel">Descrição</label>
                <textarea
                  placeholder="Descrição da videoaula"
                  className="formInput"
                  rows={3}
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">URL/Arquivo *</label>
                <input
                  type="text"
                  placeholder="Cole a URL do YouTube ou selecione um arquivo"
                  className="formInput"
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Duração (mm:ss)</label>
                <input
                  type="text"
                  placeholder="Ex: 25:30"
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
                  onClick={() => {
                    setModalAberto(false);
                    alert("Videoaula adicionada com sucesso!");
                  }}
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
