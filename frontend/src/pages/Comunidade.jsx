import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPdfPlanejamento } from '../utils/gerarPdfPlanejamento';

// ============================================================
// RÓTULOS AMIGÁVEIS
// ============================================================
const NOMES_COMPONENTES = {
  LP: 'Língua Portuguesa',
  MA: 'Matemática',
  CI: 'Ciências',
  GE: 'Geografia',
  HI: 'História',
  AR: 'Arte',
  EF: 'Educação Física',
  ER: 'Ensino Religioso',
  LI: 'Língua Inglesa',
  CO: 'Computação',
  LGG: 'Linguagens',
  MAT: 'Matemática (EM)',
  CNT: 'Ciências da Natureza',
  CHS: 'Ciências Humanas',
  EI_EO: 'O eu, o outro e nós',
  EI_CG: 'Corpo, gestos, movimentos',
  EI_TS: 'Traços, sons, cores',
  EI_EF: 'Escuta, fala, imaginação',
  EI_ET: 'Espaços, tempos, quantidades',
};

const NOMES_ETAPAS = {
  EI: 'Ed. Infantil',
  EF1: 'Fundamental I',
  EF2: 'Fundamental II',
  EM: 'Ensino Médio',
};

const NOMES_PERIODOS = {
  aula: '1 aula',
  semana: '1 semana',
  mes: '1 mês',
  bimestre: '1 bimestre',
  semestre: '1 semestre',
};

const NOMES_TIPO_ACAO = {
  formacao: 'Formação',
  acompanhamento: 'Acompanhamento',
  intervencao: 'Intervenção',
  acao_pedagogica: 'Ação Pedagógica',
  indicadores: 'Análise de Indicadores',
  reuniao: 'Reunião',
};

const MODOS = [
  { value: 'todos', label: 'Todos', icon: '📋' },
  { value: 'aula', label: 'Aula', icon: '🎯' },
  { value: 'planejamento', label: 'Planejamento', icon: '📅' },
  { value: 'coordenacao', label: 'Coordenação', icon: '🎓' },
];

const ANOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ============================================================
// PAGE
// ============================================================
const Comunidade = () => {
  const [facetas, setFacetas] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Filtros
  const [filtroModo, setFiltroModo] = useState('todos');
  const [filtroEtapa, setFiltroEtapa] = useState(null);
  const [filtroAno, setFiltroAno] = useState(null);
  const [filtroComponente, setFiltroComponente] = useState(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState(null);
  const [filtroTipoAcao, setFiltroTipoAcao] = useState(null);
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('recentes');

  // Modal + PDF
  const [planoAberto, setPlanoAberto] = useState(null);
  const [gerandoPdf, setGerandoPdf] = useState(null);

  // ============================================================
  // Carregar facetas (contadores)
  // ============================================================
  const carregarFacetas = useCallback(async () => {
    try {
      const res = await api.get('/lesson-plans/public/facetas');
      setFacetas(res.data || { total: 0, por_modo: {}, por_etapa: {}, por_componente: {}, por_tipo_acao: {} });
    } catch {
      setFacetas({ total: 0, por_modo: {}, por_etapa: {}, por_componente: {}, por_tipo_acao: {} });
    }
  }, []);

  // ============================================================
  // Carregar planos (com filtros)
  // ============================================================
  const carregarPlanos = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = {};
      if (filtroModo !== 'todos') params.modo = filtroModo;
      if (filtroEtapa) params.etapa = filtroEtapa;
      if (filtroAno) params.ano = filtroAno;
      if (filtroComponente) params.componente = filtroComponente;
      if (filtroPeriodo) params.periodo_tipo = filtroPeriodo;
      if (filtroTipoAcao) params.tipo_acao = filtroTipoAcao;
      if (busca.trim()) params.busca = busca.trim();
      params.ordem = ordem;

      const res = await api.get('/lesson-plans/public', { params });
      setPlanos(res.data || []);
    } catch {
      setErro('Erro ao carregar a Comunidade. Tente novamente.');
      setPlanos([]);
    } finally {
      setLoading(false);
    }
  }, [filtroModo, filtroEtapa, filtroAno, filtroComponente, filtroPeriodo, filtroTipoAcao, busca, ordem]);

  useEffect(() => { carregarFacetas(); }, [carregarFacetas]);
  useEffect(() => { carregarPlanos(); }, [carregarPlanos]);

  // Reset dependentes
  useEffect(() => {
    setFiltroAno(null);
    setFiltroPeriodo(null);
    setFiltroTipoAcao(null);
  }, [filtroModo]);

  useEffect(() => { setFiltroAno(null); }, [filtroEtapa]);

  // ============================================================
  // Abrir plano (incrementa view)
  // ============================================================
  const abrirPlano = async (plano) => {
    setPlanoAberto(plano);
    try {
      const res = await api.get(`/lesson-plans/public/${plano.id}`);
      setPlanoAberto(res.data);
      setPlanos(prev => prev.map(p => p.id === plano.id ? { ...p, views: res.data.views } : p));
    } catch {
      // segue com o objeto local
    }
  };

  // ============================================================
  // Baixar PDF (respeitando privacidade já aplicada pelo backend)
  // ============================================================
  const baixarPdf = async (plano) => {
    setGerandoPdf(plano.id);
    try {
      const planoParaPdf = {
        ...plano,
        structured_data: {
          ...(plano.structured_data || {}),
          cabecalho: {
            ...((plano.structured_data || {}).cabecalho || {}),
            titulo: plano.titulo,
            nome_professor: plano.autor_nome,
            nome_escola: plano.autor_escola,
            municipio: plano.autor_municipio,
          },
        },
      };
      await gerarPdfPlanejamento(planoParaPdf);
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPdf(null);
    }
  };

  const limparFiltros = () => {
    setFiltroModo('todos');
    setFiltroEtapa(null);
    setFiltroAno(null);
    setFiltroComponente(null);
    setFiltroPeriodo(null);
    setFiltroTipoAcao(null);
    setBusca('');
    setOrdem('recentes');
  };

  const filtrosAtivos = [
    filtroModo !== 'todos',
    filtroEtapa,
    filtroAno,
    filtroComponente,
    filtroPeriodo,
    filtroTipoAcao,
    busca.trim(),
  ].filter(Boolean).length;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/planejador" className="text-blue-600 text-sm hover:underline">
        ← Voltar ao Planejador
      </Link>

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
          <span>🌐</span>
          <span>COMUNIDADE DE PLANEJAMENTOS SIMIDNAPE</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌐</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Comunidade</h1>
              <p className="text-gray-600">
                Planejamentos prontos criados por professores e coordenadores reais. Consulte, baixe em PDF e adapte à sua turma.
              </p>
            </div>
          </div>
          {facetas && (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Total</p>
              <p className="text-2xl font-bold text-purple-700">{facetas.total || 0}</p>
              <p className="text-[10px] text-gray-500">planejamentos no ar</p>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        {/* Linha 1: busca + ordenação */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="🔍 Buscar por título, componente ou ano..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <select
            value={ordem} onChange={(e) => setOrdem(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="recentes">Mais recentes</option>
            <option value="mais_vistos">Mais vistos</option>
            <option value="titulo">Título (A-Z)</option>
            <option value="antigos">Mais antigos</option>
          </select>
          {filtrosAtivos > 0 && (
            <button
              onClick={limparFiltros}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition"
            >
              ✕ Limpar filtros ({filtrosAtivos})
            </button>
          )}
        </div>

        {/* Filtro: MODO */}
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Modo</p>
          <div className="flex flex-wrap gap-1.5">
            {MODOS.map(m => {
              const ativo = filtroModo === m.value;
              const cnt = m.value === 'todos'
                ? (facetas?.total || 0)
                : (facetas?.por_modo?.[m.value] || 0);
              return (
                <button
                  key={m.value} type="button"
                  onClick={() => setFiltroModo(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    ativo
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {m.icon} {m.label}
                  <span className={`ml-1 text-[10px] ${ativo ? 'text-purple-200' : 'text-gray-500'}`}>
                    ({cnt})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtro: ETAPA */}
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Etapa</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(NOMES_ETAPAS).map(([k, v]) => {
              const ativo = filtroEtapa === k;
              const cnt = facetas?.por_etapa?.[k] || 0;
              return (
                <button
                  key={k} type="button"
                  onClick={() => setFiltroEtapa(ativo ? null : k)}
                  disabled={cnt === 0}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    ativo
                      ? 'bg-purple-600 text-white shadow-sm'
                      : cnt === 0
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {v}
                  <span className={`ml-1 text-[10px] ${ativo ? 'text-purple-200' : 'text-gray-500'}`}>
                    ({cnt})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtro: ANO (só quando etapa EF1/EF2) */}
        {(filtroEtapa === 'EF1' || filtroEtapa === 'EF2') && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Ano</p>
            <div className="flex flex-wrap gap-1.5">
              {ANOS.map(a => {
                const ativo = filtroAno === a;
                // Só mostra os anos compatíveis com a etapa
                if (filtroEtapa === 'EF1' && a > 5) return null;
                if (filtroEtapa === 'EF2' && a < 6) return null;
                return (
                  <button
                    key={a} type="button"
                    onClick={() => setFiltroAno(ativo ? null : a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      ativo
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {a}º ano
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtro: COMPONENTE */}
        {facetas && Object.keys(facetas.por_componente || {}).length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Componente</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(facetas.por_componente).map(([sigla, cnt]) => {
                const ativo = filtroComponente === sigla;
                const nome = NOMES_COMPONENTES[sigla] || sigla;
                return (
                  <button
                    key={sigla} type="button"
                    onClick={() => setFiltroComponente(ativo ? null : sigla)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      ativo
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {nome}
                    <span className={`ml-1 text-[10px] ${ativo ? 'text-purple-200' : 'text-gray-500'}`}>
                      ({cnt})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtro: PERÍODO (só modo planejamento) */}
        {(filtroModo === 'planejamento' || filtroModo === 'todos') && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Período</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(NOMES_PERIODOS).map(([k, v]) => {
                const ativo = filtroPeriodo === k;
                return (
                  <button
                    key={k} type="button"
                    onClick={() => setFiltroPeriodo(ativo ? null : k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      ativo
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtro: TIPO DE AÇÃO (só modo coordenação) */}
        {filtroModo === 'coordenacao' && facetas && Object.keys(facetas.por_tipo_acao || {}).length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Tipo de Ação</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(facetas.por_tipo_acao).map(([tipo, cnt]) => {
                const ativo = filtroTipoAcao === tipo;
                const nome = NOMES_TIPO_ACAO[tipo] || tipo;
                return (
                  <button
                    key={tipo} type="button"
                    onClick={() => setFiltroTipoAcao(ativo ? null : tipo)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      ativo
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {nome}
                    <span className={`ml-1 text-[10px] ${ativo ? 'text-purple-200' : 'text-gray-500'}`}>
                      ({cnt})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">⚠️ {erro}</div>}

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Carregando Comunidade...</div>
      ) : planos.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-gray-700 font-medium">
            {filtrosAtivos > 0
              ? 'Nenhum planejamento corresponde aos filtros.'
              : 'A Comunidade ainda está começando — nenhum planejamento publicado ainda.'}
          </p>
          {filtrosAtivos > 0 && (
            <button
              onClick={limparFiltros}
              className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition"
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planos.map(p => {
            const infoModo = MODOS.find(m => m.value === p.modo) || MODOS[0];
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition p-5 flex flex-col">
                {/* Topo: badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    {infoModo.icon} {infoModo.label}
                  </span>
                  {p.componente_sigla && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {NOMES_COMPONENTES[p.componente_sigla] || p.componente_sigla}
                    </span>
                  )}
                  {p.ano_etapa && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      {NOMES_ETAPAS[p.ano_etapa] || p.ano_etapa}
                    </span>
                  )}
                  {p.tipo_acao && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {NOMES_TIPO_ACAO[p.tipo_acao] || p.tipo_acao}
                    </span>
                  )}
                </div>

                {/* Título */}
                <h3 className="font-bold text-gray-900 leading-tight mb-2">
                  {p.titulo}
                </h3>

                {/* Sub */}
                <p className="text-xs text-gray-600 mb-3">
                  {[p.componente, p.ano, p.periodo_tipo && NOMES_PERIODOS[p.periodo_tipo]]
                    .filter(Boolean).join(' · ')}
                </p>

                {/* Autor */}
                <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                  {p.autor && <p>👤 {p.autor}</p>}
                  {p.escola && <p>🏫 {p.escola}</p>}
                  {p.municipio && <p>📍 {p.municipio}</p>}
                </div>

                {/* Rodapé */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] text-gray-400">
                    👁️ {p.views || 0} visualizações
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => abrirPlano(p)}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      👁️ Ver plano
                    </button>
                    <button
                      onClick={() => baixarPdf(p)}
                      disabled={gerandoPdf === p.id}
                      className="text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      {gerandoPdf === p.id ? '⏳...' : '📥 PDF'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL — Ver plano público */}
      {planoAberto && (
        <ModalComunidade
          plano={planoAberto}
          onFechar={() => setPlanoAberto(null)}
          onBaixarPdf={() => baixarPdf(planoAberto)}
          gerandoPdf={gerandoPdf === planoAberto.id}
        />
      )}
    </div>
  );
};

// ============================================================
// MODAL — Ver plano público
// ============================================================
const ModalComunidade = ({ plano, onFechar, onBaixarPdf, gerandoPdf }) => {
  const sd = plano.structured_data || {};
  const infoModo = MODOS.find(m => m.value === plano.modo) || MODOS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {infoModo.icon} {infoModo.label} · Comunidade
            </p>
            <h2 className="text-lg font-bold text-gray-900 truncate">{plano.titulo}</h2>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-500 hover:text-gray-900 text-2xl w-8 h-8 flex items-center justify-center ml-2"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Meta */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {plano.autor && (
            <div><p className="text-gray-500 uppercase">Autor(a)</p><p className="font-semibold text-gray-800">{plano.autor}</p></div>
          )}
          {plano.escola && (
            <div><p className="text-gray-500 uppercase">Escola</p><p className="font-semibold text-gray-800">{plano.escola}</p></div>
          )}
          {plano.municipio && (
            <div><p className="text-gray-500 uppercase">Município</p><p className="font-semibold text-gray-800">{plano.municipio}</p></div>
          )}
          <div><p className="text-gray-500 uppercase">Visualizações</p><p className="font-semibold text-gray-800">{plano.views || 0}</p></div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {sd.logica_pedagogica && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs font-bold text-purple-900 uppercase mb-1">🎼 Lógica pedagógica do período</p>
              <p className="text-sm text-purple-800 italic leading-relaxed">{sd.logica_pedagogica}</p>
            </div>
          )}

          {sd.objetivos_gerais && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🎯 Objetivos gerais</h3>
              <p className="text-sm text-gray-700 mb-2">{sd.objetivos_gerais}</p>
              {sd.objetivos_especificos?.length > 0 && (
                <ul className="space-y-1">
                  {sd.objetivos_especificos.map((o, i) => (
                    <li key={i} className="text-sm text-gray-700">✓ {o}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {sd.sequencia_didatica?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                ⏱️ Sequência didática — {sd.sequencia_didatica.length} aula(s)
              </h3>
              <div className="space-y-3">
                {sd.sequencia_didatica.map((aula, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        Aula {aula.numero_aula || i + 1} — {aula.titulo}
                      </span>
                      {aula.principio_cognitivo && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                          🧠 {aula.principio_cognitivo}
                        </span>
                      )}
                    </div>
                    {aula.objetivo_da_aula && (
                      <p className="text-xs text-gray-700 mb-1">
                        <strong>Objetivo:</strong> {aula.objetivo_da_aula}
                      </p>
                    )}
                    {aula.estrategia && (
                      <p className="text-xs text-gray-700 mb-1">
                        <strong>Estratégia:</strong> {aula.estrategia}
                      </p>
                    )}
                    {aula.pergunta_problematizadora && (
                      <p className="text-xs text-gray-700 italic">
                        <strong>Pergunta:</strong> "{aula.pergunta_problematizadora}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 flex justify-between items-center gap-2 rounded-b-xl flex-wrap">
          <p className="text-[10px] text-gray-500">
            💡 Ao baixar, você recebe o PDF completo com capa e rodapé SIMIDNAPE.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onBaixarPdf}
              disabled={gerandoPdf}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-sm px-4 py-2 rounded-lg transition"
            >
              {gerandoPdf ? '⏳ Gerando...' : '📥 Baixar PDF'}
            </button>
            <button
              onClick={onFechar}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-5 py-2 rounded-lg transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comunidade;