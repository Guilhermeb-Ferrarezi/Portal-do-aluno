import React from "react";
import { useNavigate } from "react-router-dom";
import { getRole } from "../auth/auth";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import { apiFetch } from "../services/api";
import "./ExerciseTemplates.css";

type Template = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  tema: string | null;
  tipoExercicio: string;
  createdAt: string;
};

export default function ExerciseTemplates() {
  const navigate = useNavigate();
  const role = getRole();

  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [mensagem, setMensagem] = React.useState<string | null>(null);
  const [duplicando, setDuplicando] = React.useState<string | null>(null);

  // Carregar templates
  React.useEffect(() => {
    if (role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<{ templates: Template[] }>("/exercicios/templates");
        setTemplates(data.templates);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar templates");
      } finally {
        setLoading(false);
      }
    })();
  }, [role, navigate]);

  const handleDuplicar = async (templateId: string, templateTitulo: string) => {
    const novoTitulo = prompt(
      "Digite o nome do novo exercício:",
      `${templateTitulo} (Cópia)`
    );

    if (!novoTitulo) return;

    try {
      setDuplicando(templateId);
      const response = await apiFetch<any>(
        `/exercicios/templates/${templateId}/duplicate`,
        {
          method: "POST",
          body: JSON.stringify({ nova_titulo: novoTitulo }),
        }
      );

      setMensagem("✅ Exercício duplicado com sucesso! Redirecionando...");
      setTimeout(() => {
        navigate(`/dashboard/exercicios/${response.exercicio.id}`);
      }, 1500);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao duplicar template");
    } finally {
      setDuplicando(null);
    }
  };

  if (role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout title="Templates de Exercícios" subtitle="Carregando...">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner" />
          Carregando templates...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="📦 Templates de Exercícios"
      subtitle="Gerenciar exercícios pré-prontos reutilizáveis"
    >
      <div className="templatesContainer">
        <div className="templatesHeader">
          <p className="templatesDescription">
            Templates são exercícios pré-prontos que você pode duplicar e reutilizar em múltiplas turmas.
            Economize tempo criando uma biblioteca de exercícios!
          </p>
          <button
            className="btnCreateTemplate"
            onClick={() => navigate("/dashboard/exercicios")}
          >
            ✨ Criar Novo Template
          </button>
        </div>

        {/* MENSAGENS */}
        {erro && (
          <div className="templateMessage error">
            <span>❌</span>
            <span>{erro}</span>
          </div>
        )}

        {mensagem && (
          <div className="templateMessage success">
            <span>✅</span>
            <span>{mensagem}</span>
          </div>
        )}

        {/* TEMPLATES */}
        {templates.length === 0 ? (
          <div className="templateEmpty">
            <div className="templateEmptyIcon">📋</div>
            <h3>Nenhum template criado ainda</h3>
            <p>Vá para Exercícios e marque exercícios como templates para reutilizá-los!</p>
            <button
              className="btnGoToExercises"
              onClick={() => navigate("/dashboard/exercicios")}
            >
              → Ir para Exercícios
            </button>
          </div>
        ) : (
          <div className="templatesGrid">
            {templates.map((template) => (
              <div key={template.id} className="templateCard">
                <div className="templateCardHeader">
                  <div className="templateInfo">
                    <h3 className="templateTitle">{template.titulo}</h3>
                    <p className="templateMeta">
                      <span className="templateModule">{template.modulo}</span>
                      {template.tema && <span className="templateTheme">{template.tema}</span>}
                      <span className={`templateType type-${template.tipoExercicio}`}>
                        {template.tipoExercicio === "codigo" ? "💻 Código" : "✍️ Texto"}
                      </span>
                    </p>
                  </div>
                  <button
                    className="templateIconBtn"
                    title="Duplicar template"
                    onClick={() => handleDuplicar(template.id, template.titulo)}
                    disabled={duplicando === template.id}
                  >
                    {duplicando === template.id ? "⏳" : "📋"}
                  </button>
                </div>

                <p className="templateDescription">
                  {template.descricao.substring(0, 150)}
                  {template.descricao.length > 150 ? "..." : ""}
                </p>

                <div className="templateFooter">
                  <span className="templateDate">
                    {new Date(template.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <button
                    className="templateBtnView"
                    onClick={() => navigate(`/dashboard/exercicios/${template.id}`)}
                  >
                    Ver Detalhes →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
