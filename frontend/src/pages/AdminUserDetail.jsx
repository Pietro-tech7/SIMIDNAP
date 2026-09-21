import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import LatexText from '../components/LatexText';

// ============================================================
// MAPA DE TIPOS DE CONTEÚDO
// ============================================================
const TIPOS = {
  pratica_exitosa: { icon: '🏆', label: 'Práticas Exitosas', color: 'teal' },
  material: { icon: '📄', label: 'Materiais', color: 'orange' },
  neuroaula: { icon: '🧠', label: 'NeuroAulas', color: 'purple' },
  aula_que_funciona: { icon: '🎯', label: 'Aulas que Funcionam', color: 'blue' },
  reflection: { icon: '💬', label: 'Reflexões', color: 'pink' },
  pedagogical_case: { icon: '📊', label: 'Situações Pedagógicas', color: 'green' },
};

const AdminUserDetail = () => {
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('all');

  // Modal de visualização
  const [detalhe, setDetalhe] = useState(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [pdfBaixado, setPdfBaixado] = useState(false);

  // ============================================================
  // CARREGAR DADOS
  // ============================================================
  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      setError('');
      try {
        const [userRes, contentRes] = await Promise.all([
          api.get(`/admin/users/${userId}`),
          api.get(`/admin/users/${userId}/content`),
        ]);
        setUser(userRes.data);
        setContent(contentRes.data);
      } catch (err) {
        setError('Erro ao carregar dados do usuário.');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [userId]);

  const abrirDetalhe = async (item) => {
    setLoadingDetalhe(true);
    setDetalhe(null);
    setPdfBaixado(false);
    try {
      const res = await api.get(`/admin/content/${item.content_type}/${item.id}`);
      setDetalhe(res.data);
    } catch (err) {
      alert('Erro ao carregar detalhes do conteúdo.');
    } finally {
      setLoadingDetalhe(false);
    }
  };

  const baixarPDF = async () => {
    const elemento = document.getElementById('admin-detalhe-conteudo');
    if (!elemento) return;
    const nome = (detalhe?.title || 'conteudo').replace(/\s+/g, '_');
    try {
      await gerarPDF(elemento, nome);
      setPdfBaixado(true);
    } catch (err) {
      alert('Erro ao gerar PDF.');
    }
  };

  // ============================================================
  // FILTROS
  // ============================================================
  const itemsFiltrados = content?.items?.filter(
    it => abaAtiva === 'all' || it.content_type === abaAtiva
  ) || [];

  const abas = [
    { id: 'all', label: 'Todos', count: content?.total || 0 },
    ...Object.entries(TIPOS).map(([key, val]) => ({
      id: key,
      label: `${val.icon} ${val.label}`,
      count: content?.counts?.[key] || 0,
    })).filter(a => a.count > 0),
  ];

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <p className="text-red-400">{error || 'Usuário não encontrado.'}</p>
        <Link to="/admin/users" className="text-blue-400 underline mt-4 inline-block">
          ← Voltar para usuários
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/admin/users" className="text-blue-400 text-sm hover:underline">
        ← Voltar para usuários
      </Link>

      {/* Cabeçalho do usuário */}
      <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl text-white font-bold">
              {user.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.full_name}</h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  user.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {user.is_active ? '● Ativo' : '● Bloqueado'}
                </span>
                {user.is_superuser && (
                  <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                    ⚡ Super Admin
                  </span>
                )}
                <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                  Cadastro: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-gray-400 text-xs">Plano</p>
            <p className="text-white font-semibold capitalize">{user.plan || 'Sem plano'}</p>
            <p className="text-gray-400 text-xs mt-2">Créditos disponíveis</p>
            <p className="text-white font-semibold">
              {user.credits_available?.toFixed(1) ?? 0} / {user.credits_total?.toFixed(1) ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Contagem total */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">
          Conteúdos gerados ({content?.total || 0})
        </h2>
        <p className="text-gray-400 text-sm">
          Tudo que {user.full_name?.split(' ')[0]} criou no sistema.
        </p>
      </div>

      {/* Abas */}
      {abas.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {abas.map(aba => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                abaAtiva === aba.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {aba.label} ({aba.count})
            </button>
          ))}
        </div>
      )}

      {/* Lista de conteúdos */}
      {itemsFiltrados.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-400">
            {content?.total === 0
              ? 'Este usuário ainda não gerou nenhum conteúdo.'
              : 'Nenhum conteúdo deste tipo.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {itemsFiltrados.map(item => {
            const tipo = TIPOS[item.content_type] || { icon: '📄', label: item.content_type };
            return (
              <button
                key={item.id}
                onClick={() => abrirDetalhe(item)}
                className="w-full text-left bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-4 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="text-2xl flex-shrink-0">{tipo.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{item.title}</p>
                    <p className="text-gray-400 text-xs truncate">
                      {tipo.label} {item.subtitle && `• ${item.subtitle}`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-500 text-xs">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-blue-400 text-xs font-medium mt-1">Ver →</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE DETALHE */}
      {/* ============================================================ */}
      {(detalhe || loadingDetalhe) && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Barra superior do modal */}
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-black/80 backdrop-blur py-3 z-10">
                <button
                  onClick={() => setDetalhe(null)}
                  className="text-gray-300 hover:text-white text-sm font-medium"
                >
                  ← Fechar
                </button>
                {detalhe && (
                  <button
                    onClick={baixarPDF}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    📥 Baixar PDF
                  </button>
                )}
              </div>

              {loadingDetalhe && (
                <div className="bg-white rounded-xl p-12 text-center">
                  <p className="text-gray-500">Carregando conteúdo...</p>
                </div>
              )}

              {detalhe && (
                <div id="admin-detalhe-conteudo" className="bg-white rounded-xl p-6 md:p-8">
                  <ConteudoDetalhe detalhe={detalhe} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// RENDERIZAÇÃO POR TIPO DE CONTEÚDO
// ============================================================
const ConteudoDetalhe = ({ detalhe }) => {
  const { content_type, title, created_at, data } = detalhe;

  const cabecalhoComum = (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <div className="text-xs text-gray-500 mb-2">
        {TIPOS[content_type]?.icon} {TIPOS[content_type]?.label} •{' '}
        {new Date(created_at).toLocaleString('pt-BR')}
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </div>
  );

  if (content_type === 'pratica_exitosa') {
    const sd = data.structured_data?.output || data.structured_data || {};
    const cab = sd.cabecalho || {};
    return (
      <>
        {cabecalhoComum}
        <div className="text-sm text-gray-600 mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.perfil && <div><strong>Perfil:</strong> {data.perfil}</div>}
          {data.flow_type && <div><strong>Fluxo:</strong> {data.flow_type}</div>}
          {data.school && <div><strong>Escola:</strong> {data.school}</div>}
          {data.grade && <div><strong>Série:</strong> {data.grade}</div>}
        </div>
        {sd.resumo_executivo && (
          <Secao title="📌 Resumo Executivo">
            <p className="text-gray-700 whitespace-pre-line"><LatexText text={sd.resumo_executivo} /></p>
          </Secao>
        )}
        {sd.justificativa && (
          <Secao title="💡 Justificativa">
            <p className="text-gray-700 whitespace-pre-line"><LatexText text={sd.justificativa} /></p>
          </Secao>
        )}
        {sd.objetivos?.geral && (
          <Secao title="🎯 Objetivo Geral">
            <p className="text-gray-700"><LatexText text={sd.objetivos.geral} /></p>
          </Secao>
        )}
        {sd.metodologia?.etapas?.length > 0 && (
          <Secao title="⚙️ Metodologia">
            {sd.metodologia.etapas.map((e, i) => (
              <div key={i} className="border-l-4 border-teal-400 pl-4 mb-4">
                <h4 className="font-semibold text-gray-800">{e.numero}. {e.titulo}</h4>
                {e.descricao && <p className="text-sm text-gray-700 mt-1"><LatexText text={e.descricao} /></p>}
                {e.acao_do_educador && <p className="text-sm text-gray-600 mt-1"><strong>Educador:</strong> <LatexText text={e.acao_do_educador} /></p>}
                {e.acao_dos_estudantes && <p className="text-sm text-gray-600 mt-1"><strong>Estudantes:</strong> <LatexText text={e.acao_dos_estudantes} /></p>}
              </div>
            ))}
          </Secao>
        )}
        {sd.resultados_esperados?.length > 0 && (
          <Secao title="🌟 Resultados Esperados">
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {sd.resultados_esperados.map((r, i) => <li key={i}><LatexText text={r} /></li>)}
            </ul>
          </Secao>
        )}
      </>
    );
  }

  if (content_type === 'material') {
    const sd = data.structured_data || {};
    const cab = sd.cabecalho || {};
    const isDiferenciado = data.diferenciado && sd.versao_principal;
    return (
      <>
        {cabecalhoComum}
        <div className="text-sm text-gray-600 mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><strong>Tipo:</strong> {data.material_type}</div>
          {data.subject && <div><strong>Disciplina:</strong> {data.subject}</div>}
          {data.grade && <div><strong>Série:</strong> {data.grade}</div>}
          {data.diferenciado && <div><strong>Diferenciado:</strong> Sim</div>}
        </div>
        {isDiferenciado && (
          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4 text-sm text-orange-800">
            Este material tem <strong>2 versões</strong>: principal e adaptada.
            Abaixo mostrando apenas a <strong>versão principal</strong>.
          </div>
        )}
        {(() => {
          const conteudo = isDiferenciado ? sd.versao_principal : sd;
          const questoes = conteudo.questoes || conteudo.atividades || [];
          return (
            <>
              {conteudo.instrucoes && (
                <p className="text-sm italic text-gray-600 bg-gray-50 p-3 rounded mb-4">
                  <LatexText text={conteudo.instrucoes} />
                </p>
              )}
              {questoes.length > 0 && (
                <Secao title="📝 Questões">
                  {questoes.map((q, i) => (
                    <div key={i} className="border-l-4 border-orange-400 pl-4 mb-4">
                      <div className="font-semibold text-gray-800 mb-1">Questão {q.numero}</div>
                      <p className="text-gray-700 mb-2"><LatexText text={q.enunciado} /></p>
                      {q.alternativas?.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {q.alternativas.map((a, j) => <li key={j}><LatexText text={a} /></li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </Secao>
              )}
              {conteudo.materiais?.length > 0 && (
                <Secao title="🧰 Materiais">
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {conteudo.materiais.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </Secao>
              )}
              {conteudo.como_jogar?.length > 0 && (
                <Secao title="🎯 Como Jogar">
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    {conteudo.como_jogar.map((p, i) => (
                      <li key={i}><LatexText text={p.descricao || p} /></li>
                    ))}
                  </ol>
                </Secao>
              )}
            </>
          );
        })()}
      </>
    );
  }

  if (content_type === 'neuroaula' || content_type === 'aula_que_funciona') {
    const sd = data.structured_data || {};
    const cab = sd.cabecalho || {};
    return (
      <>
        {cabecalhoComum}
        <div className="text-sm text-gray-600 mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.subject && <div><strong>Disciplina:</strong> {data.subject}</div>}
          {data.grade && <div><strong>Série:</strong> {data.grade}</div>}
        </div>
        {sd.resumo_executivo && (
          <Secao title="📌 Resumo"><p className="text-gray-700 whitespace-pre-line"><LatexText text={sd.resumo_executivo} /></p></Secao>
        )}
        {(sd.etapas || sd.roteiro)?.length > 0 && (
          <Secao title="⚙️ Etapas">
            {(sd.etapas || sd.roteiro).map((e, i) => (
              <div key={i} className="border-l-4 border-purple-400 pl-4 mb-3">
                <div className="font-semibold text-gray-800">{e.titulo || `Etapa ${i + 1}`}</div>
                {e.descricao && <p className="text-sm text-gray-700 mt-1"><LatexText text={e.descricao} /></p>}
                {e.professor_faca && <p className="text-sm text-gray-700 mt-1"><strong>Professor:</strong> <LatexText text={e.professor_faca} /></p>}
                {e.faca && <p className="text-sm text-gray-700 mt-1"><strong>Ação:</strong> <LatexText text={e.faca} /></p>}
                {e.diga && <p className="text-sm text-gray-700 mt-1 italic"><strong>Diga:</strong> "<LatexText text={e.diga} />"</p>}
              </div>
            ))}
          </Secao>
        )}
      </>
    );
  }

  if (content_type === 'reflection') {
    const msgs = data.messages || [];
    return (
      <>
        {cabecalhoComum}
        <div className="text-sm text-gray-600 mb-4">
          {data.theme && <div><strong>Tema:</strong> {data.theme}</div>}
          <div><strong>Total de mensagens:</strong> {msgs.length}</div>
        </div>
        <Secao title="💬 Conversa">
          <div className="space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`p-3 rounded-lg ${
                m.role === 'user' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 border-l-4 border-gray-400'
              }`}>
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {m.role === 'user' ? '👤 Professor' : '🤖 Assistente'}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  <LatexText text={m.content} />
                </p>
              </div>
            ))}
          </div>
        </Secao>
        {data.summary && (
          <Secao title="📝 Resumo">
            <p className="text-gray-700 whitespace-pre-line"><LatexText text={data.summary} /></p>
          </Secao>
        )}
      </>
    );
  }

  if (content_type === 'pedagogical_case') {
    const analysis = data.analysis || {};
    return (
      <>
        {cabecalhoComum}
        <div className="text-sm text-gray-600 mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {data.grade && <div><strong>Série:</strong> {data.grade}</div>}
          {data.subject && <div><strong>Disciplina:</strong> {data.subject}</div>}
          {data.frequencia && <div><strong>Frequência:</strong> {data.frequencia}</div>}
        </div>
        {data.description && (
          <Secao title="📋 Descrição">
            <p className="text-gray-700 whitespace-pre-line"><LatexText text={data.description} /></p>
          </Secao>
        )}
        {data.ja_tentou && (
          <Secao title="🔧 Já Tentou">
            <p className="text-gray-700 whitespace-pre-line"><LatexText text={data.ja_tentou} /></p>
          </Secao>
        )}
        {analysis.compreensao && (
          <Secao title="🧠 Compreensão">
            <p className="text-gray-700 whitespace-pre-line"><LatexText text={analysis.compreensao} /></p>
          </Secao>
        )}
        {analysis.hipoteses_pedagogicas?.length > 0 && (
          <Secao title="🎯 Hipóteses Pedagógicas">
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {analysis.hipoteses_pedagogicas.map((h, i) => <li key={i}><LatexText text={h} /></li>)}
            </ul>
          </Secao>
        )}
        {analysis.intervencoes_sugeridas?.length > 0 && (
          <Secao title="⚙️ Intervenções Sugeridas">
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {analysis.intervencoes_sugeridas.map((it, i) => <li key={i}><LatexText text={it} /></li>)}
            </ul>
          </Secao>
        )}
      </>
    );
  }

  return (
    <>
      {cabecalhoComum}
      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    </>
  );
};

const Secao = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
    {children}
  </div>
);

export default AdminUserDetail;