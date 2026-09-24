import React, { useState, useEffect } from 'react';
import api from '../api/api';
import LatexText from '../components/LatexText';

const ETAPAS = [
  { value: '', label: 'Todas' },
  { value: 'EI', label: 'Educação Infantil' },
  { value: 'EF', label: 'Ensino Fundamental' },
];

const REFERENCIAIS = [
  { value: '', label: 'Todos' },
  { value: 'bncc', label: 'BNCC' },
  { value: 'curriculo_piaui', label: 'Currículo do Piauí' },
  { value: 'saeb', label: 'SAEB' },
  { value: 'saepi', label: 'SAEPI' },
  { value: 'ppaic', label: 'PPAIC' },
];

const COMPONENTES = [
  { value: '', label: 'Todos' },
  { value: 'MA', label: 'Matemática' },
  { value: 'LP', label: 'Língua Portuguesa' },
  { value: 'CI', label: 'Ciências' },
  { value: 'GE', label: 'Geografia' },
  { value: 'HI', label: 'História' },
  { value: 'AR', label: 'Arte' },
  { value: 'EF', label: 'Educação Física' },
  { value: 'ER', label: 'Ensino Religioso' },
  { value: 'LI', label: 'Língua Inglesa' },
];


const AdminQuestionBank = () => {
  // -------- Aba ativa: pendentes ou aprovadas --------
  const [aba, setAba] = useState('pendentes');

  // -------- Filtros --------
  const [etapa, setEtapa] = useState('');
  const [componente, setComponente] = useState('');
  const [referencial, setReferencial] = useState('');
  const [busca, setBusca] = useState('');

  // -------- Dados --------
  const [stats, setStats] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [page, setPage] = useState(1);

  // -------- Estados --------
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [selecionadas, setSelecionadas] = useState([]);
  const [questaoExpandida, setQuestaoExpandida] = useState(null);
  const [processando, setProcessando] = useState(false);

  // ============================================================
  // CARREGAR STATS
  // ============================================================
  const carregarStats = async () => {
    try {
      const res = await api.get('/admin/question-bank/stats');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // ============================================================
  // CARREGAR QUESTÕES
  // ============================================================
  const carregarQuestoes = async () => {
    setLoading(true);
    setErro('');
    try {
      const params = { page, per_page: 15 };
      if (etapa) params.etapa = etapa;
      if (componente) params.componente = componente;
      if (referencial) params.referencial = referencial;
      if (busca.trim()) params.busca = busca.trim();

      const endpoint = aba === 'pendentes'
        ? '/admin/question-bank/pendentes'
        : '/admin/question-bank/aprovadas';

      const res = await api.get(endpoint, { params });
      setQuestoes(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPaginas(res.data.total_pages || 1);
      setSelecionadas([]);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao carregar questões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarStats();
  }, []);

  useEffect(() => {
    carregarQuestoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, page, etapa, componente, referencial]);

  const handleBuscar = (e) => {
    e?.preventDefault();
    setPage(1);
    carregarQuestoes();
  };

  const limparFiltros = () => {
    setEtapa('');
    setComponente('');
    setReferencial('');
    setBusca('');
    setPage(1);
  };

  // ============================================================
  // SELEÇÃO
  // ============================================================
  const toggleSelecionada = (id) => {
    setSelecionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selecionarTodas = () => {
    setSelecionadas(questoes.map(q => q.id));
  };

  const limparSelecao = () => setSelecionadas([]);

  // ============================================================
  // AÇÕES
  // ============================================================
  const aprovarUma = async (id) => {
    setProcessando(true);
    setErro('');
    try {
      await api.patch(`/admin/question-bank/${id}/aprovar`);
      setSucesso('✅ Questão aprovada!');
      await carregarQuestoes();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao aprovar.');
    } finally {
      setProcessando(false);
    }
  };

  const rejeitarUma = async (id) => {
    if (!window.confirm('Rejeitar esta questão? Ela será marcada como anulada.')) return;
    setProcessando(true);
    setErro('');
    try {
      await api.patch(`/admin/question-bank/${id}/rejeitar`);
      setSucesso('🚫 Questão rejeitada.');
      await carregarQuestoes();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao rejeitar.');
    } finally {
      setProcessando(false);
    }
  };

  const excluirUma = async (id) => {
    if (!window.confirm('Excluir DEFINITIVAMENTE esta questão? Essa ação não pode ser desfeita.')) return;
    setProcessando(true);
    setErro('');
    try {
      await api.delete(`/admin/question-bank/${id}`);
      setSucesso('🗑️ Questão excluída.');
      await carregarQuestoes();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao excluir.');
    } finally {
      setProcessando(false);
    }
  };

  const aprovarLote = async () => {
    if (selecionadas.length === 0) return;
    if (!window.confirm(`Aprovar ${selecionadas.length} questão(ões)?`)) return;
    setProcessando(true);
    setErro('');
    try {
      await api.patch('/admin/question-bank/aprovar-lote', { ids: selecionadas });
      setSucesso(`✅ ${selecionadas.length} questão(ões) aprovada(s)!`);
      await carregarQuestoes();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao aprovar lote.');
    } finally {
      setProcessando(false);
    }
  };

  const rejeitarLote = async () => {
    if (selecionadas.length === 0) return;
    if (!window.confirm(`Rejeitar ${selecionadas.length} questão(ões)?`)) return;
    setProcessando(true);
    setErro('');
    try {
      await api.patch('/admin/question-bank/rejeitar-lote', { ids: selecionadas });
      setSucesso(`🚫 ${selecionadas.length} questão(ões) rejeitada(s).`);
      await carregarQuestoes();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao rejeitar lote.');
    } finally {
      setProcessando(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📚</span>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Banco de Questões</h1>
            <p className="text-slate-600 text-sm mt-0.5">
              Curadoria de questões geradas por IA (Motor 9) para o banco público (Motor 8).
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold">⏳ Pendentes</p>
            <p className="text-3xl font-bold text-amber-700 mt-1">{stats.total_pendentes}</p>
            <p className="text-xs text-slate-500 mt-1">Aguardando aprovação</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs uppercase tracking-wide text-green-600 font-semibold">✅ Aprovadas</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{stats.total_aprovadas}</p>
            <p className="text-xs text-slate-500 mt-1">Disponíveis no Motor 8</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs uppercase tracking-wide text-red-600 font-semibold">🚫 Anuladas</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{stats.total_anuladas}</p>
            <p className="text-xs text-slate-500 mt-1">Rejeitadas</p>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setAba('pendentes'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            aba === 'pendentes'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
          }`}
        >
          ⏳ Pendentes ({stats?.total_pendentes || 0})
        </button>
        <button
          onClick={() => { setAba('aprovadas'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            aba === 'aprovadas'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
          }`}
        >
          ✅ Aprovadas ({stats?.total_aprovadas || 0})
        </button>
      </div>

      {/* Filtros */}
      <form onSubmit={handleBuscar} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Etapa</label>
            <select value={etapa} onChange={(e) => setEtapa(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {ETAPAS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Componente</label>
            <select value={componente} onChange={(e) => setComponente(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {COMPONENTES.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Referencial</label>
            <select value={referencial} onChange={(e) => setReferencial(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {REFERENCIAIS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Busca</label>
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Palavra no enunciado..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded-lg text-sm">
            {loading ? 'Buscando...' : '🔍 Buscar'}
          </button>
          <button type="button" onClick={limparFiltros}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm border border-slate-300">
            Limpar
          </button>
        </div>
      </form>

      {/* Mensagens */}
      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-sm">⚠️ {erro}</div>}
      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4 text-sm">✅ {sucesso}</div>}

      {/* Barra de seleção */}
      {selecionadas.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-4 flex flex-wrap justify-between items-center gap-3">
          <span className="text-sm font-semibold text-blue-900">
            {selecionadas.length} questão(ões) selecionada(s)
          </span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={aprovarLote} disabled={processando}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-4 py-2 rounded-lg text-sm">
              ✅ Aprovar selecionadas
            </button>
            <button onClick={rejeitarLote} disabled={processando}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold px-4 py-2 rounded-lg text-sm">
              🚫 Rejeitar selecionadas
            </button>
            <button onClick={limparSelecao}
              className="bg-white hover:bg-slate-100 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm border border-slate-300">
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading && <p className="text-slate-500 text-sm">Carregando...</p>}

      {!loading && questoes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">
            {aba === 'pendentes'
              ? '🎉 Nenhuma questão pendente!'
              : 'Nenhuma questão aprovada ainda.'}
          </p>
        </div>
      )}

      {!loading && questoes.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-slate-600">
              <strong>{total}</strong> questão(ões) • Página {page} de {totalPaginas}
            </p>
            {selecionadas.length === 0 && (
              <button onClick={selecionarTodas}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Selecionar todas desta página
              </button>
            )}
          </div>

          <div className="space-y-3">
            {questoes.map((q) => {
              const expandida = questaoExpandida === q.id;
              const selecionada = selecionadas.includes(q.id);

              return (
                <div key={q.id}
                  className={`bg-white rounded-xl border-2 transition ${
                    selecionada ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}>
                  <div className="p-4">
                    {/* Cabeçalho da questão */}
                    <div className="flex items-start gap-3 mb-3">
                      <input type="checkbox" checked={selecionada}
                        onChange={() => toggleSelecionada(q.id)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 text-xs mb-2">
                          {q.etapa && (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {q.etapa === 'EF' ? `Fund. ${q.ano || ''}º ano` : q.etapa === 'EI' ? 'Ed. Infantil' : q.etapa}
                            </span>
                          )}
                          {q.componente && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                              {q.componente}
                            </span>
                          )}
                          {q.referencial && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                              {q.referencial.toUpperCase()}
                            </span>
                          )}
                          {q.habilidade_codigo && (
                            <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-mono">
                              {q.habilidade_codigo}
                            </span>
                          )}
                          {q.descritores && q.descritores.length > 0 && (
                            <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                              {q.descritores.join(', ')}
                            </span>
                          )}
                          {q.origem === 'gerada_ia' && (
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                              ✨ IA
                            </span>
                          )}
                        </div>

                        {q.submitted_by_name && (
                          <p className="text-xs text-slate-500 mb-2">
                            Enviada por <strong>{q.submitted_by_name}</strong> ({q.submitted_by_email})
                          </p>
                        )}

                        <p className="text-sm text-slate-800 font-medium whitespace-pre-line">
                          {q.enunciado}
                        </p>

                        {q.imagem_url && (
                          <img src={q.imagem_url} alt="Questão"
                            className="mt-3 max-h-40 rounded border border-slate-200" />
                        )}

                        {expandida && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            {(q.alternativas || []).length > 0 && (
                              <div className="space-y-1 mb-3">
                                {q.alternativas.map((a, i) => (
                                  <div key={i} className="text-sm text-slate-700">
                                    <strong>({a.letra})</strong> {a.texto}
                                  </div>
                                ))}
                              </div>
                            )}
                            {q.gabarito && (
                              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-900">
                                <strong>Gabarito:</strong> {q.gabarito}
                              </div>
                            )}
                          </div>
                        )}

                        <button onClick={() => setQuestaoExpandida(expandida ? null : q.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2">
                          {expandida ? '▲ Recolher' : '▼ Ver alternativas e gabarito'}
                        </button>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      {!q.approved && !q.anulada && (
                        <>
                          <button onClick={() => aprovarUma(q.id)} disabled={processando}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-semibold px-3 py-1.5 rounded">
                            ✅ Aprovar
                          </button>
                          <button onClick={() => rejeitarUma(q.id)} disabled={processando}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-semibold px-3 py-1.5 rounded">
                            🚫 Rejeitar
                          </button>
                        </>
                      )}
                      {q.approved && (
                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded font-semibold">
                          ✅ Aprovada
                        </span>
                      )}
                      {q.anulada && (
                        <span className="text-xs bg-red-100 text-red-800 px-3 py-1.5 rounded font-semibold">
                          🚫 Anulada
                        </span>
                      )}
                      <button onClick={() => excluirUma(q.id)} disabled={processando}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 ml-auto">
                        🗑️ Excluir permanentemente
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm bg-white hover:bg-slate-50 disabled:opacity-40">
                ← Anterior
              </button>
              <span className="text-sm text-slate-600">Página {page} de {totalPaginas}</span>
              <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm bg-white hover:bg-slate-50 disabled:opacity-40">
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminQuestionBank;