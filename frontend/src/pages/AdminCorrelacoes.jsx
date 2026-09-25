import React, { useState, useEffect } from 'react';
import api from '../api/api';

const COMPONENTES = [
  { value: '', label: 'Todos' },
  { value: 'MA', label: 'Matemática' },
  { value: 'LP', label: 'Língua Portuguesa' },
];

const ANOS = [
  { value: '', label: 'Todos' },
  { value: 5, label: '5º ano' },
  { value: 9, label: '9º ano' },
];

const CONFIANCAS = [
  { value: '', label: 'Todas' },
  { value: 'alta', label: '🟢 Alta' },
  { value: 'media', label: '🟡 Média' },
  { value: 'baixa', label: '🔴 Baixa' },
];

const COR_CONFIANCA = {
  alta: 'bg-green-100 text-green-800 border-green-300',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  baixa: 'bg-red-100 text-red-800 border-red-300',
};

const LABEL_CONFIANCA = {
  alta: '🟢 Alta',
  media: '🟡 Média',
  baixa: '🔴 Baixa',
};


const AdminCorrelacoes = () => {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [page, setPage] = useState(1);

  // Filtros
  const [fonte, setFonte] = useState('');
  const [componente, setComponente] = useState('');
  const [ano, setAno] = useState('');
  const [confianca, setConfianca] = useState('');
  const [revisado, setRevisado] = useState('');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [processando, setProcessando] = useState(false);

  const carregarStats = async () => {
    try {
      const res = await api.get('/admin/correlacoes/stats');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const carregarItens = async () => {
    setLoading(true);
    setErro('');
    try {
      const params = { page, per_page: 10 };
      if (fonte) params.fonte = fonte;
      if (componente) params.componente = componente;
      if (ano) params.ano = Number(ano);
      if (confianca) params.confianca = confianca;
      if (revisado !== '') params.revisado = revisado === 'true';

      const res = await api.get('/admin/correlacoes/por-descritor', { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPaginas(res.data.total_pages || 1);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao carregar correlações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarStats(); }, []);

  useEffect(() => {
    carregarItens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, fonte, componente, ano, confianca, revisado]);

  const limparFiltros = () => {
    setFonte(''); setComponente(''); setAno(''); setConfianca(''); setRevisado('');
    setPage(1);
  };

  const aprovar = async (id) => {
    setProcessando(true); setErro(''); setSucesso('');
    try {
      await api.patch(`/admin/correlacoes/${id}/aprovar`, { confianca: 'alta' });
      setSucesso('✅ Correlação aprovada!');
      await carregarItens(); await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao aprovar.');
    } finally { setProcessando(false); }
  };

  const excluir = async (id) => {
    if (!window.confirm('Remover esta correlação?')) return;
    setProcessando(true); setErro(''); setSucesso('');
    try {
      await api.delete(`/admin/correlacoes/${id}`);
      setSucesso('🗑️ Correlação removida.');
      await carregarItens(); await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao remover.');
    } finally { setProcessando(false); }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔗</span>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Correlações Habilidade ↔ Descritor</h1>
            <p className="text-slate-600 text-sm mt-0.5">
              Revise e aprove as correlações entre habilidades BNCC e descritores SAEB/SAEPI.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total_correlacoes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-green-600">Revisadas</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.correlacoes_revisadas}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-600">Pendentes</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{stats.correlacoes_pendentes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-600">Descritores</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.total_descritores}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Componente</label>
            <select value={componente} onChange={(e) => setComponente(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {COMPONENTES.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ano</label>
            <select value={ano} onChange={(e) => setAno(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {ANOS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confiança</label>
            <select value={confianca} onChange={(e) => setConfianca(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {CONFIANCAS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Revisado</label>
            <select value={revisado} onChange={(e) => setRevisado(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Todos</option>
              <option value="true">✅ Revisados</option>
              <option value="false">⏳ Pendentes</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={limparFiltros}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm border border-slate-300">
              Limpar
            </button>
          </div>
        </div>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-sm">⚠️ {erro}</div>}
      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4 text-sm">✅ {sucesso}</div>}

      {/* Lista */}
      {loading && <p className="text-slate-500 text-sm">Carregando...</p>}

      {!loading && items.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">Nenhum descritor encontrado com esses filtros.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <p className="text-sm text-slate-600 mb-3">
            <strong>{total}</strong> descritor(es) • Página {page} de {totalPaginas}
          </p>

          <div className="space-y-4">
            {items.map((desc) => (
              <div key={desc.descritor_id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Cabeçalho do descritor */}
                <div className="bg-slate-50 border-b border-slate-200 p-4">
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold text-xs">
                      {desc.codigo}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                      {desc.componente}
                    </span>
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                      {desc.ano}º ano
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">
                      {desc.fonte.toUpperCase()}
                    </span>
                    {desc.tema && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">
                        {desc.tema}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 font-medium">
                    {desc.texto}
                  </p>
                </div>

                {/* Correlações */}
                <div className="p-4">
                  {desc.correlacoes.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">
                      Nenhuma habilidade correlacionada com este descritor.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 mb-2">
                        {desc.correlacoes.length} habilidade(s) correlacionada(s):
                      </p>
                      {desc.correlacoes.map((corr) => (
                        <div
                          key={corr.id}
                          className={`border rounded-lg p-3 ${COR_CONFIANCA[corr.confianca] || 'bg-slate-50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap gap-2 items-center mb-1">
                                <strong className="font-mono text-xs">
                                  {corr.habilidade_codigo}
                                </strong>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white bg-opacity-60">
                                  {LABEL_CONFIANCA[corr.confianca]}
                                </span>
                                {corr.revisado && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white bg-opacity-60">
                                    ✅ Revisado
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 leading-snug">
                                {corr.habilidade_texto || '(texto não encontrado)'}
                              </p>
                              {corr.unidade_tematica && (
                                <p className="text-[10px] text-slate-600 mt-1">
                                  📖 {corr.unidade_tematica}
                                  {corr.objeto_conhecimento && ` → ${corr.objeto_conhecimento}`}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              {!corr.revisado && (
                                <button
                                  onClick={() => aprovar(corr.id)}
                                  disabled={processando}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-semibold px-2 py-1 rounded"
                                >
                                  ✅ Aprovar
                                </button>
                              )}
                              <button
                                onClick={() => excluir(corr.id)}
                                disabled={processando}
                                className="bg-white hover:bg-red-50 text-red-700 border border-red-300 text-xs font-medium px-2 py-1 rounded"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
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

export default AdminCorrelacoes;