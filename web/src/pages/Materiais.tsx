import React from "react";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import { hasRole } from "../auth/auth";
import "./Materiais.css";

type Material = {
  id: string;
  titulo: string;
  tipo: "arquivo" | "link";
  modulo: string;
  descricao: string;
  url?: string;
  arquivo?: string;
  dataAdicionado: string;
};

export default function MateriaisPage() {
  const canUpload = hasRole(["admin", "professor"]);

  // Estados
  const [materiais, setMateriais] = React.useState<Material[]>([]);
  const [filtroModulo, setFiltroModulo] = React.useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = React.useState<string>("todos");
  const [busca, setBusca] = React.useState<string>("");
  const [modalAberto, setModalAberto] = React.useState(false);

  // Materiais de exemplo
  const materiaisExemplo: Material[] = [
    {
      id: "1",
      titulo: "Introdução à Programação - Slides",
      tipo: "arquivo",
      modulo: "Introdução à Programação",
      descricao: "Slides da aula introdutória sobre conceitos fundamentais",
      arquivo: "intro-programacao.pdf",
      dataAdicionado: "2025-01-15",
    },
    {
      id: "2",
      titulo: "Documentação JavaScript MDN",
      tipo: "link",
      modulo: "JavaScript Avançado",
      descricao: "Referência completa de JavaScript da Mozilla Developer Network",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      dataAdicionado: "2025-01-14",
    },
    {
      id: "3",
      titulo: "Guia Completo de Flexbox",
      tipo: "arquivo",
      modulo: "Desenvolvimento Web",
      descricao: "E-book com exemplos práticos de CSS Flexbox",
      arquivo: "flexbox-guide.pdf",
      dataAdicionado: "2025-01-13",
    },
    {
      id: "4",
      titulo: "React Official Docs",
      tipo: "link",
      modulo: "Frameworks Frontend",
      descricao: "Documentação oficial do React com tutoriais e exemplos",
      url: "https://react.dev",
      dataAdicionado: "2025-01-12",
    },
    {
      id: "5",
      titulo: "Estruturas de Controle - Videoaula",
      tipo: "arquivo",
      modulo: "Estruturas de Controle",
      descricao: "Vídeo gravado sobre loops e condições",
      arquivo: "estruturas-controle.mp4",
      dataAdicionado: "2025-01-11",
    },
    {
      id: "6",
      titulo: "HTML5 Semântico - Artigo",
      tipo: "link",
      modulo: "Desenvolvimento Web",
      descricao: "Artigo detalhado sobre HTML5 semântico",
      url: "https://www.example.com/html5-semantico",
      dataAdicionado: "2025-01-10",
    },
    {
      id: "7",
      titulo: "Funções JavaScript - Exemplos Práticos",
      tipo: "arquivo",
      modulo: "Funções e Escopo",
      descricao: "Arquivo com exemplos de diferentes tipos de funções",
      arquivo: "funcoes-javascript.js",
      dataAdicionado: "2025-01-09",
    },
    {
      id: "8",
      titulo: "Async/Await Tutorial",
      tipo: "link",
      modulo: "JavaScript Avançado",
      descricao: "Tutorial interativo sobre Promises e Async/Await",
      url: "https://www.example.com/async-await",
      dataAdicionado: "2025-01-08",
    },
  ];

  React.useEffect(() => {
    setMateriais(materiaisExemplo);
  }, []);

  // Filtrar materiais
  const materiaisFiltrados = materiais.filter((m) => {
    const matchModulo =
      filtroModulo === "todos" || m.modulo === filtroModulo;
    const matchTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
    const matchBusca =
      busca === "" ||
      m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      m.descricao.toLowerCase().includes(busca.toLowerCase());

    return matchModulo && matchTipo && matchBusca;
  });

  // Obter lista única de módulos
  const modulos = Array.from(new Set(materiais.map((m) => m.modulo)));

  const handleDownload = (material: Material) => {
    if (material.tipo === "arquivo" && material.arquivo) {
      // Em produção, isso faria download real
      alert(`Baixando: ${material.arquivo}`);
    } else if (material.tipo === "link" && material.url) {
      window.open(material.url, "_blank");
    }
  };

  return (
    <DashboardLayout
      title="Materiais"
      subtitle="Acesse arquivos e links de estudo"
    >
      <div className="materiaisContainer">
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
              onClick={() => setModalAberto(true)}
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
            <div className="materiaisGrid">
              {materiaisFiltrados.map((material) => (
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
                          {new Date(material.dataAdicionado).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="materialDescricao">{material.descricao}</p>

                  <div className="materialFooter">
                    <button
                      className="materialBtn"
                      onClick={() => handleDownload(material)}
                    >
                      {material.tipo === "arquivo"
                        ? "⬇️ Baixar"
                        : "🌐 Abrir Link"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

              <div className="formGroup">
                <label className="formLabel">Título *</label>
                <input
                  type="text"
                  placeholder="Título do material"
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
                    <input type="radio" name="tipo" value="arquivo" />
                    <span>📄 Arquivo</span>
                  </label>
                  <label className="radioLabel">
                    <input type="radio" name="tipo" value="link" />
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
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">URL/Arquivo *</label>
                <input
                  type="text"
                  placeholder="Cole a URL ou escolha um arquivo"
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
                    alert("Material adicionado com sucesso!");
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
