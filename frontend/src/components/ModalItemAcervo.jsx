import React from 'react';

/**
 * Modal genérico de visualização para itens do Meu Acervo que NÃO são
 * planos de aula (esses usam o ModalPlano).
 *
 * Suporta 3 tipos:
 *   - "meu_aluno"       (pedagogical_cases)
 *   - "pratica_exitosa" (successful_practices)
 *   - "terapia"         (reflections)
 *
 * É read-only. Cada tipo tem seu próprio renderizador que entende
 * o schema da IA.
 */
const ModalItemAcervo = ({ tipo, item, onFechar }) => {
  const sd = item.structured_data || item || {};

  const fmtData = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return '—'; }
  };

  const labelTipo = () => {
    if (tipo === 'meu_aluno') return '👤 Meu Aluno';
    if (tipo === 'pratica_exitosa') return '🏆 Prática Exitosa';
    if (tipo === 'terapia') return '💭 Terapia Pedagógica';
    return 'Item';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              👁️ Visualizar · {labelTipo()}
            </p>
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {item.title || sd.titulo || 'Sem título'}
            </h2>
            {item.created_at && (
              <p className="text-xs text-gray-500 mt-0.5">
                Criado em {fmtData(item.created_at)}
              </p>
            )}
          </div>
          <button
            onClick={onFechar}
            className="text-gray-500 hover:text-gray-900 text-2xl w-8 h-8 flex items-center justify-center ml-2"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {tipo === 'meu_aluno' && <RenderMeuAluno sd={sd} item={item} />}
          {tipo === 'pratica_exitosa' && <RenderPratica sd={sd} item={item} />}
          {tipo === 'terapia' && <RenderTerapia sd={sd} item={item} />}
          {!['meu_aluno', 'pratica_exitosa', 'terapia'].includes(tipo) && (
            <div className="text-center text-gray-500 py-8">
              Tipo de item não reconhecido.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 flex justify-end rounded-b-xl">
          <button
            onClick={onFechar}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-5 py-2 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MEU ALUNO
// ============================================================
const RenderMeuAluno = ({ sd, item }) => {
  const resumo = sd.resumo || item.resumo || '';
  const hipoteses = sd.hipoteses_pedagogicas || item.hipoteses_pedagogicas || [];
  const intervencoes = sd.sugestoes_intervencao || item.sugestoes_intervencao || sd.intervencoes_sugeridas || [];

  return (
    <>
      {(item.subject || item.grade) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
          {item.subject && <span className="mr-3"><strong>Componente:</strong> {item.subject}</span>}
          {item.grade && <span><strong>Ano:</strong> {item.grade}</span>}
        </div>
      )}

      {resumo && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2">🧭 Compreensão da situação</h3>
          <p className="text-sm text-blue-900 leading-relaxed">{resumo}</p>
        </div>
      )}

      {hipoteses.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-amber-900 mb-2">🔍 Hipóteses pedagógicas a investigar</h3>
          <ul className="space-y-1.5">
            {hipoteses.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {intervencoes.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-emerald-900 mb-2">✅ Intervenções sugeridas</h3>
          <ul className="space-y-1.5">
            {intervencoes.map((x, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!resumo && hipoteses.length === 0 && intervencoes.length === 0 && (
        <div className="text-center text-gray-500 py-6 text-sm">
          Sem conteúdo estruturado disponível para este item.
        </div>
      )}
    </>
  );
};

// ============================================================
// PRÁTICA EXITOSA
// ============================================================
const RenderPratica = ({ sd, item }) => {
  const cab = sd.cabecalho || {};
  const objetivos = sd.objetivos || {};
  const metodologia = sd.metodologia || {};
  const conexao = sd.conexao_avaliacoes || {};
  const avaliacao = sd.avaliacao || {};
  const culminancia = sd.culminancia || {};
  const replicabilidade = sd.replicabilidade || {};

  const Section = ({ titulo, cor, children }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: cor }}>{titulo}</h3>
      {children}
    </div>
  );

  return (
    <>
      {/* Cabeçalho resumido */}
      {(cab.escola || cab.municipio || cab.disciplina_ou_area || cab.serie_ou_etapa) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
          {cab.escola && <span className="mr-3"><strong>Escola:</strong> {cab.escola}</span>}
          {cab.municipio && <span className="mr-3"><strong>Município:</strong> {cab.municipio}</span>}
          {cab.disciplina_ou_area && <span className="mr-3"><strong>Área:</strong> {cab.disciplina_ou_area}</span>}
          {cab.serie_ou_etapa && <span><strong>Etapa:</strong> {cab.serie_ou_etapa}</span>}
        </div>
      )}

      {sd.resumo_executivo && (
        <Section titulo="📌 Resumo executivo" cor="#2C5F7C">
          <p className="text-sm text-gray-700 leading-relaxed">{sd.resumo_executivo}</p>
        </Section>
      )}

      {sd.justificativa && (
        <Section titulo="💡 Justificativa" cor="#D4A843">
          <p className="text-sm text-gray-700 leading-relaxed">{sd.justificativa}</p>
        </Section>
      )}

      {(objetivos.geral || (objetivos.especificos || []).length > 0) && (
        <Section titulo="🎯 Objetivos" cor="#5FA68D">
          {objetivos.geral && <p className="text-sm text-gray-700 mb-3"><strong>Geral:</strong> {objetivos.geral}</p>}
          {(objetivos.especificos || []).length > 0 && (
            <ul className="space-y-1.5">
              {objetivos.especificos.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-500 mt-0.5">✓</span><span>{o}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {(conexao.avaliacoes_relacionadas || []).length > 0 && (
        <Section titulo="📊 Conexão com avaliações" cor="#E07856">
          <p className="text-xs text-gray-500 mb-2">
            Tipo: <strong>{conexao.tipo_conexao || '—'}</strong>
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {conexao.avaliacoes_relacionadas.map((a, i) => (
              <span key={i} className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-semibold">
                {a}
              </span>
            ))}
          </div>
          {conexao.como_contribui && (
            <p className="text-sm text-gray-700 leading-relaxed mb-2">{conexao.como_contribui}</p>
          )}
          {conexao.meta_sugerida && (
            <p className="text-xs text-orange-700"><strong>Meta:</strong> {conexao.meta_sugerida}</p>
          )}
        </Section>
      )}

      {metodologia.descricao_geral && (
        <Section titulo="👨‍🏫 Metodologia" cor="#2C5F7C">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{metodologia.descricao_geral}</p>
          {(metodologia.etapas || []).map((et, i) => (
            <div key={i} className="border-l-4 border-blue-400 pl-3 mb-3">
              <p className="text-xs font-bold text-blue-800">
                Etapa {et.numero} — {et.titulo} {et.duracao && <span className="text-gray-500">({et.duracao})</span>}
              </p>
              {et.descricao && <p className="text-xs text-gray-700 mt-1">{et.descricao}</p>}
              {et.acao_do_educador && <p className="text-xs text-gray-600 mt-1"><strong>Educador:</strong> {et.acao_do_educador}</p>}
              {et.acao_dos_estudantes && <p className="text-xs text-gray-600 mt-1"><strong>Estudantes:</strong> {et.acao_dos_estudantes}</p>}
              {et.como_avaliar && <p className="text-xs text-gray-600 mt-1"><strong>Avaliação:</strong> {et.como_avaliar}</p>}
              {et.adequacoes_inclusivas && <p className="text-xs text-gray-600 mt-1"><strong>Inclusão:</strong> {et.adequacoes_inclusivas}</p>}
            </div>
          ))}
        </Section>
      )}

      {(sd.cronograma || []).length > 0 && (
        <Section titulo="📅 Cronograma" cor="#2C5F7C">
          <div className="space-y-2">
            {sd.cronograma.map((c, i) => (
              <div key={i} className="border border-gray-100 rounded p-2">
                <p className="text-xs font-bold text-gray-800">{c.periodo}</p>
                {c.foco && <p className="text-xs text-gray-600 mt-1">{c.foco}</p>}
                {(c.atividades_principais || []).length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {c.atividades_principais.map((a, j) => (
                      <li key={j} className="text-xs text-gray-600">• {a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(sd.adaptacoes_inclusivas || []).length > 0 && (
        <Section titulo="🧩 Adaptações inclusivas" cor="#2C5F7C">
          {sd.adaptacoes_inclusivas.map((a, i) => (
            <div key={i} className="mb-2">
              <p className="text-xs font-bold text-blue-900">{a.necessidade}</p>
              <ul className="mt-1 space-y-0.5">
                {(a.estrategias || []).map((e, j) => (
                  <li key={j} className="text-xs text-gray-700">• {e}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {(avaliacao.instrumentos || []).length > 0 && (
        <Section titulo="📈 Avaliação" cor="#5FA68D">
          {avaliacao.instrumentos && (
            <>
              <p className="text-xs font-bold text-emerald-800 mb-1">Instrumentos</p>
              <ul className="mb-3 space-y-0.5">
                {avaliacao.instrumentos.map((x, i) => (
                  <li key={i} className="text-xs text-gray-700">• {x}</li>
                ))}
              </ul>
            </>
          )}
          {(avaliacao.indicadores_de_sucesso || []).length > 0 && (
            <>
              <p className="text-xs font-bold text-emerald-800 mb-1">Indicadores de sucesso</p>
              <ul className="space-y-0.5">
                {avaliacao.indicadores_de_sucesso.map((x, i) => (
                  <li key={i} className="text-xs text-gray-700">• {x}</li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}

      {culminancia.descricao && (
        <Section titulo="🎉 Culminância" cor="#D4A843">
          <p className="text-sm text-gray-700 leading-relaxed mb-2">{culminancia.descricao}</p>
          {culminancia.publico_esperado && (
            <p className="text-xs text-gray-600"><strong>Público:</strong> {culminancia.publico_esperado}</p>
          )}
        </Section>
      )}

      {(sd.resultados_esperados || []).length > 0 && (
        <Section titulo="🎯 Resultados esperados" cor="#5FA68D">
          <ul className="space-y-1">
            {sd.resultados_esperados.map((r, i) => (
              <li key={i} className="text-sm text-gray-700">• {r}</li>
            ))}
          </ul>
        </Section>
      )}

      {replicabilidade.descricao && (
        <Section titulo="🔄 Replicabilidade" cor="#2C5F7C">
          <p className="text-sm text-gray-700 leading-relaxed">{replicabilidade.descricao}</p>
        </Section>
      )}
    </>
  );
};

// ============================================================
// TERAPIA
// ============================================================
const RenderTerapia = ({ sd, item }) => {
  const messages = sd.messages || item.messages || [];
  const theme = sd.theme || item.theme || '';

  return (
    <>
      {theme && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg p-3">
          <p className="text-xs font-bold text-indigo-900 uppercase">Tema</p>
          <p className="text-sm text-indigo-900 mt-1">{theme}</p>
        </div>
      )}

      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((m, i) => {
            const isUser = m.role === 'user' || m.role === 'professor';
            return (
              <div
                key={i}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-xs font-bold mb-1 opacity-70">
                    {isUser ? 'Professor(a)' : 'Assistente'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.content || m.text || ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8 text-sm">
          Nenhuma mensagem registrada nesta conversa.
        </div>
      )}
    </>
  );
};

export default ModalItemAcervo;