import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRole } from "../auth/auth";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import MonacoEditor from "../components/MonacoEditor";
import {
  obterExercicio,
  enviarSubmissao,
  minhasSubmissoes,
  listarSubmissoesExercicio,
  type Exercicio,
  type Submissao,
} from "../services/api";
import "./ExerciseDetail.css";

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = getRole();
  const canReview = role === "admin" || role === "professor";

  // Exercício
  const [exercicio, setExercicio] = React.useState<Exercicio | null>(null);
  const [loadingEx, setLoadingEx] = React.useState(true);
  const [erroEx, setErroEx] = React.useState<string | null>(null);

  // Submissão
  const [resposta, setResposta] = React.useState("");
  const [linguagem, setLinguagem] = React.useState("javascript");
  const [enviando, setEnviando] = React.useState(false);
  const [erroSubmissao, setErroSubmissao] = React.useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = React.useState<string | null>(null);
  const [avisoMsg, setAvisoMsg] = React.useState<string | null>(null);

  // Teste de código
  const [outputTeste, setOutputTeste] = React.useState<string>("");
  const [erroTeste, setErroTeste] = React.useState<string | null>(null);

  // Minhas tentativas
  const [submissoes, setSubmissoes] = React.useState<Submissao[]>([]);

  const [submissoesRecebidas, setSubmissoesRecebidas] = React.useState<Array<Submissao & { alunoNome: string; alunoUsuario: string }>>([]);
  const [loadingRecebidas, setLoadingRecebidas] = React.useState(false);

  // Carregar exercício
  React.useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoadingEx(true);
        const data = await obterExercicio(id);
        setExercicio(data);
      } catch (error) {
        setErroEx(error instanceof Error ? error.message : "Erro ao carregar exercício");
      } finally {
        setLoadingEx(false);
      }
    })();
  }, [id]);

  // Carregar minhas tentativas
  React.useEffect(() => {
    if (!id || !exercicio) return;

    (async () => {
      try {
        const data = await minhasSubmissoes(id);
        setSubmissoes(data);
      } catch (error) {
        console.error("Erro ao carregar submissões:", error);
      }
    })();
  }, [id, exercicio]);


  // Carregar submissoes dos alunos (admin/prof)
  React.useEffect(() => {
    if (!id || !canReview) return;

    (async () => {
      try {
        setLoadingRecebidas(true);
        const data = await listarSubmissoesExercicio(id);
        setSubmissoesRecebidas(data);
      } catch (error) {
        console.error("Erro ao carregar submissoes dos alunos:", error);
      } finally {
        setLoadingRecebidas(false);
      }
    })();
  }, [id, canReview]);
  const handleTestarCodigo = () => {
    if (linguagem !== "javascript") {
      setErroTeste("Teste disponível apenas para JavaScript!");
      return;
    }

    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;

    try {
      setErroTeste(null);
      setOutputTeste("");

      // Capturar console.log
      console.log = (...args: any[]) => {
        logs.push(args.map((arg) => String(arg)).join(" "));
        originalLog(...args);
      };

      console.error = (...args: any[]) => {
        logs.push("❌ " + args.map((arg) => String(arg)).join(" "));
        originalError(...args);
      };

      // Executar código
      // eslint-disable-next-line no-eval
      eval(resposta);

      // Restaurar console
      console.log = originalLog;
      console.error = originalError;

      setOutputTeste(logs.length > 0 ? logs.join("\n") : "✅ Código executado sem erros!");
    } catch (error) {
      console.log = originalLog;
      console.error = originalError;
      setErroTeste(error instanceof Error ? error.message : "Erro ao executar código");
      setOutputTeste("");
    }
  };

  const handleEnviar = async () => {
    if (!id || !exercicio) return;
    if (resposta.trim().length === 0) {
      setErroSubmissao("A resposta não pode estar vazia");
      return;
    }

    try {
      setEnviando(true);
      setErroSubmissao(null);
      setSucessoMsg(null);
      setAvisoMsg(null);

      const tipoResposta = exercicio.tipoExercicio || "texto";

      const result = await enviarSubmissao(id, {
        resposta: resposta.trim(),
        tipo_resposta: tipoResposta,
        linguagem: tipoResposta === "codigo" ? linguagem : undefined,
      });

      const score = result.submissao?.verificacaoDescricao;
      if (score !== null && score !== undefined && score < 50) {
        setAvisoMsg("⚠️ Resposta enviada, mas parece fora do jeito esperado. Revise o enunciado.");
      } else {
        setSucessoMsg("✅ Resposta enviada com sucesso!");
      }
      setResposta("");

      // Recarregar submissões
      const data = await minhasSubmissoes(id);
      setSubmissoes(data);
    } catch (error) {
      setErroSubmissao(error instanceof Error ? error.message : "Erro ao enviar resposta");
    } finally {
      setEnviando(false);
    }
  };

  if (loadingEx) {
    return (
      <DashboardLayout title="Exercício" subtitle="Carregando...">
        <div className="exerciseDetailContainer">
          <div className="loadingState">
            <div className="spinner" />
            Carregando exercício...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (erroEx || !exercicio) {
    return (
      <DashboardLayout title="Exercício" subtitle="Erro">
        <div className="exerciseDetailContainer">
          <div className="exMessage error">
            <span>❌</span>
            <span>{erroEx || "Exercício não encontrado"}</span>
          </div>
          <button className="btnBack" onClick={() => navigate("/dashboard/exercicios")}>
            ← Voltar aos exercícios
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const prazoData = exercicio.prazo ? new Date(exercicio.prazo) : null;
  const prazoVencido = prazoData && prazoData < new Date();
  const temaTema = exercicio.tema || "Sem tema";
  const tipoExercicio = exercicio.tipoExercicio || "texto";

  return (
    <DashboardLayout
      title={exercicio.titulo}
      subtitle={`${exercicio.modulo} • ${temaTema}`}
    >
      <div className="exerciseDetailContainer">
        {/* BOTÃO VOLTAR */}
        <button className="btnBack" onClick={() => navigate("/dashboard/exercicios")}>
          ← Voltar aos exercícios
        </button>

        {/* GRID 2 COLUNAS */}
        <div className="exerciseDetailGrid">
          {/* COLUNA ESQUERDA: ENUNCIADO */}
          <div className="exerciseDetailLeft">
            <div className="edCard edEnunciado">
              <h2 className="edSubtitle">📋 Enunciado</h2>

              <div className="edMeta">
                <div className="edMetaItem">
                  <span className="edLabel">Módulo:</span>
                  <strong>{exercicio.modulo}</strong>
                </div>
                {exercicio.tema && (
                  <div className="edMetaItem">
                    <span className="edLabel">Tema:</span>
                    <strong>{exercicio.tema}</strong>
                  </div>
                )}
                <div className="edMetaItem">
                  <span className="edLabel">Tipo:</span>
                  <strong>{tipoExercicio === "codigo" ? "💻 Código" : "✍️ Digitação"}</strong>
                </div>
                {prazoData && (
                  <div className={`edMetaItem ${prazoVencido ? "overdue" : ""}`}>
                    <span className="edLabel">Prazo:</span>
                    <strong>
                      {prazoData.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </div>
                )}
              </div>

              <div className="edDescricao">
                {exercicio.descricao}
              </div>
            </div>

            {/* TENTATIVAS ANTERIORES */}
            {submissoes.length > 0 && (
              <div className="edCard edTentativas">
                <h3 className="edSubtitle">📊 Minhas Tentativas ({submissoes.length})</h3>

                <div className="tentativasList">
                  {submissoes.map((sub, idx) => (
                    <div key={sub.id} className="tentativaItem">
                      <div className="tentativaNumber">Tentativa {submissoes.length - idx}</div>

                      {sub.nota !== null && (
                        <div className={`tentativaNota ${sub.corrigida ? "corrigida" : ""}`}>
                          Nota: <strong>{sub.nota}/100</strong>
                        </div>
                      )}

                      <div className="tentativaData">
                        {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      {sub.verificacaoDescricao !== null && sub.verificacaoDescricao !== undefined && (
                        <div className="tentativaFeedback">
                          <strong>Aderencia ao esperado:</strong> {sub.verificacaoDescricao}%
                        </div>
                      )}

                      {sub.feedbackProfessor && (
                        <div className="tentativaFeedback">
                          <strong>Feedback:</strong> {sub.feedbackProfessor}
                        </div>
                      )}

                      <details className="tentativaDetalhes">
                        <summary>Ver resposta</summary>
                        <div className="tentativaResposta">
                          {sub.tipoResposta === "codigo" ? (
                            <pre>{sub.resposta}</pre>
                          ) : (
                            <p>{sub.resposta}</p>
                          )}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canReview && (
              <div className="edCard edTentativas">
                <h3 className="edSubtitle">?? Respostas dos alunos ({submissoesRecebidas.length})</h3>

                {loadingRecebidas ? (
                  <div style={{ padding: "12px", opacity: 0.6, textAlign: "center" }}>
                    Carregando respostas...
                  </div>
                ) : submissoesRecebidas.length === 0 ? (
                  <div style={{ padding: "12px", opacity: 0.6, textAlign: "center" }}>
                    Nenhuma resposta enviada ainda.
                  </div>
                ) : (
                  <div className="tentativasList">
                    {submissoesRecebidas.map((sub) => (
                      <div key={sub.id} className="tentativaItem">
                        <div className="tentativaNumber">
                          {sub.alunoNome} <span style={{ opacity: 0.7 }}>@{sub.alunoUsuario}</span>
                        </div>

                        {sub.nota !== null && (
                          <div className={`tentativaNota ${sub.corrigida ? "corrigida" : ""}`}>
                            Nota: <strong>{sub.nota}/100</strong>
                          </div>
                        )}

                        <div className="tentativaData">
                          {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        {sub.verificacaoDescricao !== null && sub.verificacaoDescricao !== undefined && (
                          <div className="tentativaFeedback">
                            <strong>Aderencia ao esperado:</strong> {sub.verificacaoDescricao}%
                          </div>
                        )}

                        {sub.feedbackProfessor && (
                          <div className="tentativaFeedback">
                            <strong>Feedback:</strong> {sub.feedbackProfessor}
                          </div>
                        )}

                        <details className="tentativaDetalhes">
                          <summary>Ver resposta</summary>
                          <div className="tentativaResposta">
                            {sub.tipoResposta === "codigo" ? (
                              <pre>{sub.resposta}</pre>
                            ) : (
                              <p>{sub.resposta}</p>
                            )}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* COLUNA DIREITA: RESPONDER */}
          <div className="exerciseDetailRight">
            <div className="edCard edResponder">
              <h2 className="edSubtitle">📝 Envie sua resposta</h2>

              {/* MENSAGENS */}
              {erroSubmissao && (
                <div className="exMessage error">
                  <span>❌</span>
                  <span>{erroSubmissao}</span>
                </div>
              )}

              {sucessoMsg && (
                <div className="exMessage success">
                  <span>✅</span>
                  <span>{sucessoMsg}</span>
                </div>
              )}

              {avisoMsg && (
                <div className="exMessage warning">
                  <span>⚠️</span>
                  <span>{avisoMsg}</span>
                </div>
              )}

              {/* RESPOSTA */}
              <div className="edInputGroup">
                {tipoExercicio === "codigo" ? (
                  <>
                    <MonacoEditor
                      value={resposta}
                      onChange={(v) => setResposta(v || "")}
                      language={linguagem}
                      onLanguageChange={setLinguagem}
                      height="800px"
                      theme="dark"
                    />

                    {/* TESTE DE CÓDIGO */}
                    <button
                      className="edTestBtn"
                      onClick={handleTestarCodigo}
                      disabled={resposta.trim().length === 0 || linguagem !== "javascript"}
                    >
                      🧪 Testar Código
                    </button>

                    {/* OUTPUT DO TESTE */}
                    {erroTeste && (
                      <div className="edTestOutput error">
                        <div className="edTestLabel">❌ Erro:</div>
                        <pre>{erroTeste}</pre>
                      </div>
                    )}

                    {outputTeste && !erroTeste && (
                      <div className="edTestOutput success">
                        <div className="edTestLabel">✅ Output:</div>
                        <pre>{outputTeste}</pre>
                      </div>
                    )}
                  </>
                ) : (
                  <textarea
                    className="edTextarea"
                    placeholder="Digite sua resposta aqui..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    rows={12}
                  />
                )}
              </div>

              {/* BOTÃO ENVIAR */}
              <button
                className="edSubmitBtn"
                onClick={handleEnviar}
                disabled={enviando || resposta.trim().length === 0}
              >
                {enviando ? "⏳ Enviando..." : "✨ Enviar Resposta"}
              </button>

              <div className="edHint">
                {tipoExercicio === "codigo"
                  ? "Escolha a linguagem no editor e escreva seu código."
                  : "Escreva sua resposta de forma clara e objetiva."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
