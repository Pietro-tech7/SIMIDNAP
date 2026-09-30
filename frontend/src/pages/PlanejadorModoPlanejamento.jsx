import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const STORAGE_KEY = 'simidnape_rascunho_planejamento_v2';

const ETAPAS = [
  { value: 'EI', label: 'Educação Infantil' },
  { value: 'EF', label: 'Ensino Fundamental' },
  { value: 'EM', label: 'Ensino Médio' },
];

const ANOS_EF = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const ANOS_EM = [1, 2, 3];

const REFERENCIAIS = [
  { value: 'bncc', label: 'BNCC' },
  { value: 'curriculo_piaui', label: 'Currículo do Piauí' },
  { value: 'saeb', label: 'SAEB' },
  { value: 'saepi', label: 'SAEPI' },
  { value: 'ppaic', label: 'PPAIC' },
];

const PERIODOS_EF_EM = [
  { value: 'aula', label: '1 aula' },
  { value: 'semana', label: '1 semana' },
  { value: 'mes', label: '1 mês' },
  { value: 'bimestre', label: '1 bimestre' },
];

const PERIODOS_EI = [
  { value: 'aula', label: '1 dia' },
  { value: 'semana', label: '1 semana' },
  { value: 'mes', label: '1 mês' },
];

const PlanejadorModoPlanejamento = () => {
  // ============================================================
  // ESTADO — Identificação
  // ============================================================
  const [titulo, setTitulo] = useState('');
  const [etapa, setEtapa] = useState('EF');
  const [ano, setAno] = useState(5);
  const [componente, setComponente] = useState('');

  // ============================================================
  // ESTADO — Referenciais
  // ============================================================
  const [referenciais, setReferenciais] = useState(['bncc']);

  // ============================================================
  // ESTADO — Cascata
  // ============================================================
  const [componentes, setComponentes] = useState([]);
  const [unidadesTematicas, setUnidadesTematicas] = useState([]);
  const [objetosPorUnidade, setObjetosPorUnidade] = useState({});
  const [habilidadesDisponiveis, setHabilidadesDisponiveis] = useState([]);

  const [habilidades, setHabilidades] = useState([
    {
      unidade_tematica: '',
      objeto_conhecimento: '',
      codigo: '',
      texto: '',
      descritores: [],
      descritoresCorrelacionados: [],
      complementosPi: [],
      carregandoDescritores: false,
      busca: '',
    },
  ]);

  // ============================================================
  // ESTADO — Período
  // ============================================================
  const [periodoTipo, setPeriodoTipo] = useState('semana');
  const [tempoAula, setTempoAula] = useState(50);
  const [aulasPorSemana, setAulasPorSemana] = useState(5);
  const [totalAulas, setTotalAulas] = useState(5);
  const [totalEditadoManualmente, setTotalEditadoManualmente] = useState(false);

  // ============================================================
  // ESTADO — Perfil da turma (absorvido do Aula que Funciona)
  // ============================================================
  const [numAlunos, setNumAlunos] = useState(25);
  const [conhecimentosPrevios, setConhecimentosPrevios] = useState('');
  const [dificuldades, setDificuldades] = useState('');
  const [diferenciado, setDiferenciado] = useState(false);

  // ============================================================
  // ESTADO — Geração
  // ============================================================
  const [gerando, setGerando] = useState(false);
  const [progressoLote, setProgressoLote] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [resultado, setResultado] = useState(null);

  // ============================================================
  // ESTADO — Rascunho
  // ============================================================
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);

  // ============================================================
  // RASCUNHO — Carregar na montagem
  // ============================================================
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const d = JSON.parse(salvo);
        const temConteudo = d.titulo?.trim() || d.habilidades?.some(h => h.codigo);
        if (temConteudo) {
          const continuar = window.confirm(
            `📋 Você tem um planejamento em andamento:\n\n"${d.titulo || 'Sem título'}"\n\nDeseja continuar de onde parou?`
          );
          if (continuar) {
            if (d.titulo !== undefined) setTitulo(d.titulo);
            if (d.etapa !== undefined) setEtapa(d.etapa);
            if (d.ano !== undefined) setAno(d.ano);
            if (d.componente !== undefined) setComponente(d.componente);
            if (d.referenciais !== undefined) setReferenciais(d.referenciais);
            if (d.habilidades !== undefined) setHabilidades(d.habilidades);
            if (d.periodoTipo !== undefined) setPeriodoTipo(d.periodoTipo);
            if (d.tempoAula !== undefined) setTempoAula(d.tempoAula);
            if (d.aulasPorSemana !== undefined) setAulasPorSemana(d.aulasPorSemana);
            if (d.totalAulas !== undefined) setTotalAulas(d.totalAulas);
            if (d.totalEditadoManualmente !== undefined) setTotalEditadoManualmente(d.totalEditadoManualmente);
            if (d.numAlunos !== undefined) setNumAlunos(d.numAlunos);
            if (d.conhecimentosPrevios !== undefined) setConhecimentosPrevios(d.conhecimentosPrevios);
            if (d.dificuldades !== undefined) setDificuldades(d.dificuldades);
            if (d.diferenciado !== undefined) setDiferenciado(d.diferenciado);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar rascunho:', e);
    }
    setRascunhoCarregado(true);
  }, []);

  // ============================================================
  // RASCUNHO — Salvar automaticamente
  // ============================================================
  useEffect(() => {
    if (!rascunhoCarregado) return;
    try {
      const dados = {
        titulo, etapa, ano, componente, referenciais, habilidades,
        periodoTipo, tempoAula, aulasPorSemana, totalAulas, totalEditadoManualmente,
        numAlunos, conhecimentosPrevios, dificuldades, diferenciado,
        _salvo_em: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
      setRascunhoSalvo(true);
      const timer = setTimeout(() => setRascunhoSalvo(false), 1200);
      return () => clearTimeout(timer);
    } catch (e) {
      console.warn('Erro ao salvar rascunho:', e);
    }
  }, [
    rascunhoCarregado, titulo, etapa, ano, componente, referenciais, habilidades,
    periodoTipo, tempoAula, aulasPorSemana, totalAulas, totalEditadoManualmente,
    numAlunos, conhecimentosPrevios, dificuldades, diferenciado,
  ]);

  // ============================================================
  // CÁLCULO AUTOMÁTICO DO TOTAL DE AULAS
  // ============================================================
  useEffect(() => {
    if (totalEditadoManualmente) return;
    let total = 0;
    if (periodoTipo === 'aula') total = 1;
    else if (periodoTipo === 'semana') total = aulasPorSemana;
    else if (periodoTipo === 'mes') total = aulasPorSemana * 4;
    else if (periodoTipo === 'bimestre') total = aulasPorSemana * 8;
    setTotalAulas(total);
  }, [periodoTipo, aulasPorSemana, totalEditadoManualmente]);

  // ============================================================
  // CARREGAR COMPONENTES (depende da etapa)
  // ============================================================
  useEffect(() => {
    api.get(`/bncc/componentes?etapa=${etapa}`)
      .then(res => setComponentes(res.data || []))
      .catch(() => setComponentes([]));
  }, [etapa]);

  // ============================================================
  // CARREGAR UNIDADES TEMÁTICAS (depende de componente, etapa, ano)
  // ============================================================
  useEffect(() => {
    if (!componente) { setUnidadesTematicas([]); return; }
    const params = { componente, etapa };
    if (etapa !== 'EI' && ano) params.ano = ano;
    api.get('/bncc-estrutura/unidades-tematicas', { params })
      .then(res => setUnidadesTematicas(res.data?.unidades || []))
      .catch(() => setUnidadesTematicas([]));
  }, [componente, ano, etapa]);

  // ============================================================
  // CARREGAR HABILIDADES DISPONÍVEIS
  // ============================================================
  useEffect(() => {
    if (!componente) { setHabilidadesDisponiveis([]); return; }
    const params = { componente, etapa };
    if (etapa !== 'EI' && ano) params.ano = ano;
    api.get('/bncc-estrutura/habilidades', { params })
      .then(res => setHabilidadesDisponiveis(res.data?.habilidades || []))
      .catch(() => setHabilidadesDisponiveis([]));
  }, [componente, ano, etapa]);

  // ============================================================
  // INVALIDAR CACHE quando componente/ano/etapa mudam
  // ============================================================
  useEffect(() => {
    setObjetosPorUnidade({});
    setUnidadesTematicas([]);
  }, [componente, ano, etapa]);

  const carregarObjetos = async (unidade) => {
    if (!unidade || objetosPorUnidade[unidade]) return;
    try {
      const params = { componente, unidade_tematica: unidade, etapa };
      if (etapa !== 'EI' && ano) params.ano = ano;
      const res = await api.get('/bncc-estrutura/objetos-conhecimento', { params });
      setObjetosPorUnidade(prev => ({ ...prev, [unidade]: res.data?.objetos || [] }));
    } catch {
      setObjetosPorUnidade(prev => ({ ...prev, [unidade]: [] }));
    }
  };

  // ============================================================
  // MANIPULAÇÃO DE HABILIDADES
  // ============================================================
  const adicionarHabilidade = () => {
    setHabilidades(prev => [...prev, {
      unidade_tematica: '', objeto_conhecimento: '', codigo: '', texto: '',
      descritores: [], descritoresCorrelacionados: [], complementosPi: [],
      carregandoDescritores: false, busca: '',
    }]);
  };

  const removerHabilidade = (index) => {
    if (habilidades.length === 1) { alert('Mantenha ao menos 1 habilidade.'); return; }
    setHabilidades(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarHabilidade = (index, campo, valor) => {
    setHabilidades(prev => prev.map((h, i) => {
      if (i !== index) return h;
      const nova = { ...h, [campo]: valor };

      if (campo === 'unidade_tematica') {
        nova.objeto_conhecimento = '';
        nova.codigo = '';
        nova.texto = '';
        nova.descritores = [];
        nova.descritoresCorrelacionados = [];
        carregarObjetos(valor);
      }
      if (campo === 'objeto_conhecimento') {
        nova.codigo = '';
        nova.texto = '';
        nova.descritores = [];
        nova.descritoresCorrelacionados = [];
      }
      if (campo === 'codigo') {
        const hab = habilidadesDisponiveis.find(x => x.codigo === valor);
        if (hab) {
          nova.texto = hab.texto || '';
          nova.complemento_pi = (hab.complementos_pi && hab.complementos_pi[0]?.texto) || null;
        }
        nova.descritores = [];
        nova.descritoresCorrelacionados = [];
      }
      return nova;
    }));
    if (campo === 'codigo') {
      carregarDescritoresDaHabilidade(index, valor);
    }
  };

  const carregarDescritoresDaHabilidade = async (index, codigoHabilidade) => {
    if (!codigoHabilidade) {
      setHabilidades(prev => prev.map((h, i) =>
        i === index ? { ...h, descritoresCorrelacionados: [], complementosPi: [], carregandoDescritores: false } : h
      ));
      return;
    }
    setHabilidades(prev => prev.map((h, i) =>
      i === index ? { ...h, carregandoDescritores: true } : h
    ));
    try {
      const res = await api.get(`/bncc-estrutura/habilidade-completa/${codigoHabilidade}`);
      const descs = res.data?.descritores || [];
      const compsPi = res.data?.complementos_pi || [];
      setHabilidades(prev => prev.map((h, i) =>
        i === index ? { ...h, descritoresCorrelacionados: descs, complementosPi: compsPi, carregandoDescritores: false } : h
      ));
    } catch {
      setHabilidades(prev => prev.map((h, i) =>
        i === index ? { ...h, descritoresCorrelacionados: [], complementosPi: [], carregandoDescritores: false } : h
      ));
    }
  };

  const toggleDescritor = (index, chaveDescritor) => {
    setHabilidades(prev => prev.map((h, i) => {
      if (i !== index) return h;
      const lista = h.descritores || [];
      return {
        ...h,
        descritores: lista.includes(chaveDescritor) ? lista.filter(d => d !== chaveDescritor) : [...lista, chaveDescritor],
      };
    }));
  };

  // ============================================================
  // GERAR PLANEJAMENTO
  // ============================================================
  const gerar = async () => {
    setErro(''); setSucesso(''); setResultado(null);

    if (!titulo.trim()) { setErro('Dê um título ao planejamento.'); return; }
    if (!componente) { setErro('Escolha o componente.'); return; }
    if (!totalAulas || totalAulas < 1) { setErro('O total de aulas precisa ser pelo menos 1.'); return; }
    for (let i = 0; i < habilidades.length; i++) {
      if (!habilidades[i].codigo) { setErro(`Habilidade ${i + 1}: selecione um código.`); return; }
    }

    const habPayload = habilidades.map(h => ({
      codigo: h.codigo,
      texto: h.texto,
      complemento_pi: h.complemento_pi || null,
      unidade_tematica: h.unidade_tematica || null,
      objeto_conhecimento: h.objeto_conhecimento || null,
      descritores: Array.from(new Set((h.descritores || []).map(x => {
        if (typeof x === 'string' && x.includes(':')) return x.split(':')[1];
        return x;
      }))),
    }));

    const componenteNome = componentes.find(c => c.codigo === componente)?.nome || componente;

    const payloadBase = {
      plan_type: 'planejamento',
      modo: 'planejamento',
      title: titulo.trim(),
      etapa,
      componente,
      subject: componenteNome,
      grade: etapa === 'EI' ? 'Educação Infantil' : (etapa === 'EM' ? `${ano}ª série` : `${ano}º ano`),
      content: habPayload.map(h => h.texto).join(' | '),
      objetivo: '',
      periodo_tipo: periodoTipo,
      tempo_aula_minutos: Number(tempoAula),
      aulas_por_semana: Number(aulasPorSemana),
      total_aulas: Number(totalAulas),
      num_alunos: Number(numAlunos),
      conhecimentos_previos: conhecimentosPrevios || null,
      dificuldades: dificuldades || null,
      diferenciado,
      habilidades: habPayload,
      referenciais,
    };

    const BATCH_SIZE = 4;
    const total = Number(totalAulas);

    setGerando(true);
    setProgressoLote({ atual: 0, total });

    const acumulado = {
      cabecalho: null,
      logica_pedagogica: '',
      eixos_predominantes: [],
      descritores_trabalhados: [],
      objetivos_gerais: '',
      objetivos_especificos: [],
      habilidades: [],
      justificativa: '',
      sequencia_didatica: [],
      avaliacao_geral: {},
      adaptacoes_inclusivas: [],
      consideracoes_finais: '',
    };

    try {
      let batchStart = 1;
      while (batchStart <= total) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, total);

        const res = await api.post('/lesson-plans/generate-batch', {
          ...payloadBase,
          batch_start: batchStart,
          batch_end: batchEnd,
        });

        const sd = res.data?.structured_data || {};

        if (!acumulado.cabecalho && sd.cabecalho) acumulado.cabecalho = sd.cabecalho;
        if (!acumulado.logica_pedagogica && sd.logica_pedagogica) acumulado.logica_pedagogica = sd.logica_pedagogica;
        if ((!acumulado.eixos_predominantes || acumulado.eixos_predominantes.length === 0)
            && sd.eixos_predominantes?.length) {
          acumulado.eixos_predominantes = sd.eixos_predominantes;
        }
        if ((!acumulado.descritores_trabalhados || acumulado.descritores_trabalhados.length === 0)
            && sd.descritores_trabalhados?.length) {
          acumulado.descritores_trabalhados = sd.descritores_trabalhados;
        }
        if (!acumulado.objetivos_gerais && sd.objetivos_gerais) acumulado.objetivos_gerais = sd.objetivos_gerais;
        if ((!acumulado.objetivos_especificos || acumulado.objetivos_especificos.length === 0)
            && sd.objetivos_especificos?.length) {
          acumulado.objetivos_especificos = sd.objetivos_especificos;
        }
        if ((!acumulado.habilidades || acumulado.habilidades.length === 0) && sd.habilidades?.length) {
          acumulado.habilidades = sd.habilidades;
        }
        if (!acumulado.justificativa && sd.justificativa) acumulado.justificativa = sd.justificativa;
        if (sd.sequencia_didatica?.length) {
          acumulado.sequencia_didatica.push(...sd.sequencia_didatica);
        }
        if ((!acumulado.avaliacao_geral || !acumulado.avaliacao_geral.instrumentos)
            && sd.avaliacao_geral) {
          acumulado.avaliacao_geral = sd.avaliacao_geral;
        }
        if ((!acumulado.adaptacoes_inclusivas || acumulado.adaptacoes_inclusivas.length === 0)
            && sd.adaptacoes_inclusivas?.length) {
          acumulado.adaptacoes_inclusivas = sd.adaptacoes_inclusivas;
        }
        if (!acumulado.consideracoes_finais && sd.consideracoes_finais) {
          acumulado.consideracoes_finais = sd.consideracoes_finais;
        }

        setProgressoLote({ atual: acumulado.sequencia_didatica.length, total });
        batchStart = batchEnd + 1;
      }

      acumulado.sequencia_didatica.sort((a, b) => (a.numero_aula || 0) - (b.numero_aula || 0));

      const resSalvar = await api.post('/lesson-plans/save-complete', {
        title: titulo.trim(),
        subject: componenteNome,
        grade: etapa === 'EI' ? 'Educação Infantil' : (etapa === 'EM' ? `${ano}ª série` : `${ano}º ano`),
        content: habPayload.map(h => h.texto).join(' | '),
        objective: '',
        structured_data: acumulado,
        extra: {
          plan_type: 'planejamento',
          modo: 'planejamento',
          periodo_tipo: periodoTipo,
          tempo_aula_minutos: Number(tempoAula),
          aulas_por_semana: Number(aulasPorSemana),
          total_aulas: total,
          referenciais,
        },
      });

      setResultado(resSalvar.data);
      setSucesso(`Planejamento gerado com ${acumulado.sequencia_didatica.length} aula(s).`);
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (err) {
      if (err?.response?.status === 402) setErro('Créditos insuficientes. Faça upgrade do seu plano.');
      else setErro(err?.response?.data?.detail || 'Erro ao gerar o planejamento. Tente novamente.');
    } finally {
      setGerando(false);
      setProgressoLote(null);
    }
  };

  const limparTudo = () => {
    if (!window.confirm('Limpar todas as escolhas e começar de novo?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setTitulo(''); setEtapa('EF'); setAno(5); setComponente('');
    setReferenciais(['bncc']);
    setHabilidades([{
      unidade_tematica: '', objeto_conhecimento: '', codigo: '', texto: '',
      descritores: [], descritoresCorrelacionados: [], complementosPi: [],
      carregandoDescritores: false, busca: '',
    }]);
    setPeriodoTipo('semana'); setTempoAula(50); setAulasPorSemana(5);
    setTotalAulas(5); setTotalEditadoManualmente(false);
    setNumAlunos(25); setConhecimentosPrevios(''); setDificuldades(''); setDiferenciado(false);
    setResultado(null); setErro(''); setSucesso('');
  };

  const periodosDisponiveis = etapa === 'EI' ? PERIODOS_EI : PERIODOS_EF_EM;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/planejador" className="text-blue-600 text-sm hover:underline">
        ← Voltar ao Planejador
      </Link>

      <div className="mt-6 mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
          <span>🧠</span>
          <span>PLANEJADOR SIMIDNAPE · MODO PLANEJAMENTO</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📅</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Planejar um período</h1>
              <p className="text-gray-600">
                De 1 aula a 1 bimestre inteiro, com sequência didática progressiva e base em neuroeducação.
              </p>
            </div>
          </div>
          <button
            onClick={limparTudo}
            className="text-xs text-amber-800 hover:text-amber-900 font-medium border border-amber-300 hover:border-amber-500 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition"
          >
            🔄 Limpar tudo
          </button>
        </div>
      </div>

      {rascunhoSalvo && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-semibold z-50">
          💾 Rascunho salvo
        </div>
      )}

      {/* PASSO 1 — IDENTIFICAÇÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Passo 1 — Identificação</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Título do planejamento *</label>
          <input
            type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Frações — Matemática 5º ano — Outubro"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa *</label>
            <select
              value={etapa}
              onChange={(e) => {
                const nova = e.target.value;
                setEtapa(nova);
                setComponente('');
                setHabilidades([{
                  unidade_tematica: '', objeto_conhecimento: '', codigo: '', texto: '',
                  descritores: [], descritoresCorrelacionados: [], complementosPi: [],
                  carregandoDescritores: false, busca: '',
                }]);
                if (nova === 'EI') setAno(null);
                else if (nova === 'EM') setAno(1);
                else setAno(5);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {ETAPAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          {etapa === 'EF' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
              <select
                value={ano || 5} onChange={(e) => setAno(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {ANOS_EF.map(a => <option key={a} value={a}>{a}º ano</option>)}
              </select>
            </div>
          )}

          {etapa === 'EM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Série *</label>
              <select
                value={ano || 1} onChange={(e) => setAno(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {ANOS_EM.map(a => <option key={a} value={a}>{a}ª série</option>)}
              </select>
            </div>
          )}

          <div className={etapa === 'EI' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {etapa === 'EI' ? 'Campo de Experiência *' : 'Componente *'}
            </label>
            <select
              value={componente} onChange={(e) => setComponente(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Selecione...</option>
              {componentes.map(c => <option key={c.codigo} value={c.codigo}>{c.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* PASSO 2 — REFERENCIAIS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📚 Passo 2 — Referenciais curriculares</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {REFERENCIAIS.map(r => {
            const ativo = referenciais.includes(r.value);
            const isBncc = r.value === 'bncc';
            return (
              <button
                key={r.value} type="button"
                onClick={() => {
                  if (isBncc) return;
                  setReferenciais(prev =>
                    prev.includes(r.value) ? prev.filter(x => x !== r.value) : [...prev, r.value]
                  );
                }}
                disabled={isBncc}
                className={`text-left px-3 py-2 rounded-lg border-2 transition text-sm ${
                  ativo
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                } ${isBncc ? 'cursor-not-allowed opacity-90' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={ativo} readOnly className="w-4 h-4 pointer-events-none" />
                  <span className="font-medium">{r.label}</span>
                </div>
                {isBncc && <p className="text-[10px] text-blue-700 mt-1">(sempre ativo)</p>}
              </button>
            );
          })}
        </div>
      </div>

      {/* PASSO 3 — HABILIDADES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🎯 Passo 3 — Habilidades e descritores</h2>
        <p className="text-sm text-gray-600 mb-4">
          Adicione uma ou várias habilidades. Cada aula da sequência didática usará estas habilidades como base.
        </p>

        <div className="space-y-4">
          {habilidades.map((h, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">Habilidade {index + 1}</span>
                {habilidades.length > 1 && (
                  <button type="button" onClick={() => removerHabilidade(index)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium">🗑️ Remover</button>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  📖 Unidade Temática ({unidadesTematicas.length} disponíveis)
                </label>
                <select
                  value={h.unidade_tematica || ''}
                  onChange={(e) => atualizarHabilidade(index, 'unidade_tematica', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Selecione a unidade temática...</option>
                  {unidadesTematicas.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {h.unidade_tematica && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    🎯 Objeto de Conhecimento ({(objetosPorUnidade[h.unidade_tematica] || []).length} disponíveis)
                  </label>
                  <select
                    value={h.objeto_conhecimento || ''}
                    onChange={(e) => atualizarHabilidade(index, 'objeto_conhecimento', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Selecione o objeto...</option>
                    {(objetosPorUnidade[h.unidade_tematica] || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}

              {h.objeto_conhecimento && (() => {
                const doObjeto = habilidadesDisponiveis.filter(hab => {
                  const mu = !h.unidade_tematica || hab.unidade_tematica === h.unidade_tematica;
                  const mo = !h.objeto_conhecimento || hab.objeto_conhecimento === h.objeto_conhecimento;
                  const ma = hab.ano === undefined || hab.ano === null || hab.ano === ano;
                  return mu && mo && ma;
                });
                const termo = (h.busca || '').toLowerCase().trim();
                const comBusca = termo
                  ? doObjeto.filter(hab =>
                      (hab.codigo || '').toLowerCase().includes(termo) ||
                      (hab.texto || '').toLowerCase().includes(termo))
                  : doObjeto;

                return (
                  <>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">🔍 Buscar habilidade (opcional)</label>
                      <input
                        type="text" value={h.busca || ''}
                        onChange={(e) => atualizarHabilidade(index, 'busca', e.target.value)}
                        placeholder="Digite o código (EF05MA03) ou palavra-chave..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                      />
                      {termo && comBusca.length > 0 && (
                        <div className="mt-1 max-h-48 overflow-y-auto border border-blue-200 rounded-lg bg-blue-50">
                          {comBusca.slice(0, 20).map(hab => (
                            <button
                              key={hab.codigo} type="button"
                              onClick={() => {
                                atualizarHabilidade(index, 'codigo', hab.codigo);
                                atualizarHabilidade(index, 'busca', '');
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-100 border-b border-blue-100 last:border-0"
                            >
                              <strong className="font-mono text-blue-700">{hab.codigo}</strong>
                              <span className="text-gray-700 ml-2">{(hab.texto || '').slice(0, 80)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        ✨ Habilidade * ({doObjeto.length} disponíveis)
                      </label>
                      <select
                        value={h.codigo}
                        onChange={(e) => atualizarHabilidade(index, 'codigo', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="">Clique para escolher...</option>
                        {doObjeto.map(hab => (
                          <option key={hab.codigo} value={hab.codigo}>
                            {hab.codigo}
                            {hab.ano ? ` (${hab.ano}º ano)` : ''}
                            {' — '}
                            {(hab.texto || '').slice(0, 60)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                );
              })()}

              {h.texto && (
                <div className="text-xs text-gray-600 bg-white rounded p-2 mb-3 border border-gray-100">
                  <strong>Texto:</strong> {h.texto}
                </div>
              )}

              {h.codigo && (referenciais.includes('saeb') || referenciais.includes('saepi')) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {h.carregandoDescritores ? (
                    <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded">⏳ Carregando descritores...</div>
                  ) : (h.descritoresCorrelacionados || []).filter(d => {
                      if (d.fonte === 'saeb' && referenciais.includes('saeb')) return true;
                      if (d.fonte === 'saepi' && referenciais.includes('saepi')) return true;
                      return false;
                    }).length === 0 ? (
                    <div className="text-xs text-amber-800 bg-amber-50 rounded p-3 border border-amber-200">
                      ℹ️ Nenhum descritor SAEB/SAEPI correlacionado para esta habilidade. Você pode gerar mesmo assim.
                    </div>
                  ) : (
                    <>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        📊 Descritores correlacionados ({h.descritores?.length || 0} selecionados)
                      </label>
                      <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                        {(h.descritoresCorrelacionados || []).filter(d => {
                          if (d.fonte === 'saeb' && referenciais.includes('saeb')) return true;
                          if (d.fonte === 'saepi' && referenciais.includes('saepi')) return true;
                          return false;
                        }).map(d => {
                          const chave = `${d.fonte}:${d.codigo}`;
                          const sel = h.descritores?.includes(chave);
                          return (
                            <button key={chave} type="button" onClick={() => toggleDescritor(index, chave)}
                              className={`w-full text-left px-3 py-2 rounded-lg border-2 transition ${
                                sel ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}>
                              <div className="flex items-start gap-2">
                                <input type="checkbox" checked={sel} readOnly className="mt-0.5 w-4 h-4 pointer-events-none" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap gap-1.5 items-center mb-1">
                                    <span className="font-mono font-bold text-xs text-blue-700">{d.codigo}</span>
                                    {d.fonte && <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold uppercase">{d.fonte}</span>}
                                  </div>
                                  <p className="text-xs text-gray-700 leading-snug">{d.texto}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button type="button" onClick={adicionarHabilidade}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm">
            ➕ Adicionar outra habilidade
          </button>
        </div>
      </div>

      {/* PASSO 4 — PERÍODO E TEMPO (sem datas) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📅 Passo 4 — Período e tempo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duração do planejamento</label>
            <select
              value={periodoTipo} onChange={(e) => { setPeriodoTipo(e.target.value); setTotalEditadoManualmente(false); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {periodosDisponiveis.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tempo por aula</label>
            <select
              value={tempoAula} onChange={(e) => setTempoAula(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value={50}>50 minutos</option>
              <option value={60}>1 hora (60 min)</option>
            </select>
          </div>
        </div>

        {periodoTipo !== 'aula' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aulas por semana *
              </label>
              <input
                type="number" min="1" max="40" value={aulasPorSemana}
                onChange={(e) => { setAulasPorSemana(Number(e.target.value) || 1); setTotalEditadoManualmente(false); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ex: professor 20h costuma ter 13 aulas/semana; 40h, 26 aulas/semana. Ajuste conforme sua lotação.
              </p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold">Total de aulas no período</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{totalAulas}</p>
              <p className="text-xs text-blue-700 mt-1">
                {periodoTipo === 'aula' && '1 aula única'}
                {periodoTipo === 'semana' && `${aulasPorSemana} aula(s) em 1 semana`}
                {periodoTipo === 'mes' && `${aulasPorSemana} × 4 semanas = ${aulasPorSemana * 4} aulas`}
                {periodoTipo === 'bimestre' && `${aulasPorSemana} × 8 semanas = ${aulasPorSemana * 8} aulas`}
              </p>
            </div>
            {periodoTipo !== 'aula' && (
              <div className="text-right">
                <label className="block text-xs font-medium text-blue-800 mb-1">
                  Ajustar manualmente (opcional)
                </label>
                <input
                  type="number" min="1" max="200" value={totalAulas}
                  onChange={(e) => { setTotalAulas(Number(e.target.value) || 1); setTotalEditadoManualmente(true); }}
                  className="w-24 border-2 border-blue-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-800"
                />
                {totalEditadoManualmente && (
                  <button
                    type="button"
                    onClick={() => setTotalEditadoManualmente(false)}
                    className="block mt-1 text-xs text-blue-700 hover:text-blue-900 font-medium ml-auto"
                  >
                    Recalcular automático
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PASSO 5 — PERFIL DA TURMA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">👥 Passo 5 — Perfil da turma</h2>
        <p className="text-sm text-gray-600 mb-4">
          Essas informações ajudam a IA a calibrar a linguagem e as estratégias para a sua turma real.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nº de alunos</label>
            <input
              type="number" min="1" max="60" value={numAlunos}
              onChange={(e) => setNumAlunos(Number(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conhecimentos prévios da turma</label>
            <input
              type="text" value={conhecimentosPrevios}
              onChange={(e) => setConhecimentosPrevios(e.target.value)}
              placeholder="Ex: já conhecem os estados físicos da água"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
          <label className="block text-sm font-semibold text-blue-900 mb-1">
            🧩 Alunos com necessidades específicas (opcional)
          </label>
          <p className="text-xs text-blue-700 mb-2">
            Informe apenas necessidades <strong>pedagógicas</strong>. Exemplos: "2 alunos autistas", "1 aluno com TDAH", "1 aluno com dislexia". O sistema <strong>não realiza diagnósticos</strong> — apenas adapta pedagogicamente.
          </p>
          <textarea
            value={dificuldades} onChange={(e) => setDificuldades(e.target.value)}
            rows={2}
            placeholder="Ex: 2 alunos autistas, 1 aluno com TDAH"
            className="w-full border border-blue-200 rounded-lg px-4 py-2 bg-white text-sm"
          />
        </div>

        <label className="flex items-start gap-3 bg-cyan-50 border border-cyan-100 rounded-lg p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={diferenciado}
            onChange={(e) => setDiferenciado(e.target.checked)}
            className="mt-0.5 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
          />
          <div>
            <div className="text-sm font-semibold text-cyan-900">📑 Versão diferenciada</div>
            <div className="text-xs text-cyan-700 mt-1">
              Gera <strong>duas versões do plano</strong>: uma principal (para a turma toda) e uma adaptada (com blocos mais curtos, instruções simples, apoio visual). Consome <strong>2 créditos</strong> em vez de 1.
            </div>
          </div>
        </label>
      </div>

      {/* BOTÃO GERAR */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-200">Gerar planejamento</p>
            <p className="text-2xl font-bold">{totalAulas} aula(s) na sequência didática</p>
            <p className="text-sm text-purple-100 mt-1">
              {tempoAula} min por aula · {componente || 'componente'} · {etapa === 'EI' ? 'EI' : `${ano}${etapa === 'EM' ? 'ª série' : 'º ano'}`}
            </p>
            <p className="text-xs text-purple-200 mt-1">
              Referenciais ativos: <strong>{referenciais.map(r => r.toUpperCase()).join(' + ')}</strong>
            </p>
          </div>
          <button
            onClick={gerar} disabled={gerando || totalAulas < 1}
            className="bg-white text-blue-700 hover:bg-blue-50 disabled:bg-blue-300 disabled:text-white font-bold px-6 py-3 rounded-xl transition"
          >
            {gerando
              ? (progressoLote
                  ? `✨ Gerando... ${progressoLote.atual}/${progressoLote.total} aulas`
                  : '✨ Iniciando geração...')
              : '✨ Gerar planejamento'}
          </button>
        </div>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">⚠️ {erro}</div>}
      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 text-sm">✅ {sucesso}</div>}

      {/* RESULTADO */}
      {resultado && <ResultadoPlanejamento resultado={resultado} tituloFallback={titulo} totalAulasFallback={totalAulas} />}
    </div>
  );
};

// ============================================================
// RESULTADO — exibição completa do novo schema
// ============================================================
const ResultadoPlanejamento = ({ resultado, tituloFallback, totalAulasFallback }) => {
  const sd = resultado.structured_data || {};
  const cab = sd.cabecalho || {};

  return (
    <div className="space-y-5">
      {/* CABEÇALHO */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
        <h2 className="text-xl font-bold">📘 {cab.titulo || tituloFallback}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
          <div>
            <p className="text-xs text-blue-200 uppercase">Componente</p>
            <p className="font-semibold">{cab.componente || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200 uppercase">Ano</p>
            <p className="font-semibold">{cab.ano || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200 uppercase">Período</p>
            <p className="font-semibold">{cab.periodo_texto || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200 uppercase">Total de aulas</p>
            <p className="font-semibold">{cab.total_aulas || totalAulasFallback}</p>
          </div>
        </div>
      </div>

      {/* LÓGICA PEDAGÓGICA */}
      {sd.logica_pedagogica && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
          <h3 className="font-semibold text-purple-900 mb-2">🎼 Lógica pedagógica do período</h3>
          <p className="text-sm text-purple-800 leading-relaxed italic">{sd.logica_pedagogica}</p>
        </div>
      )}

      {/* EIXOS + DESCRITORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sd.eixos_predominantes?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">🧭 Eixos predominantes</h3>
            <div className="space-y-2">
              {sd.eixos_predominantes.map((e, i) => (
                <div key={i} className="text-sm">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{e.periodo}</span>
                  <p className="text-gray-800 mt-1">{e.eixo}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {sd.descritores_trabalhados?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">📊 Descritores trabalhados</h3>
            <div className="flex flex-wrap gap-1.5">
              {sd.descritores_trabalhados.map((d, i) => (
                <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono font-semibold">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OBJETIVOS */}
      {sd.objetivos_gerais && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-2">🎯 Objetivos gerais</h3>
          <p className="text-sm text-gray-700 mb-3">{sd.objetivos_gerais}</p>
          {sd.objetivos_especificos?.length > 0 && (
            <ul className="space-y-1.5">
              {sd.objetivos_especificos.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 mt-0.5">✓</span><span>{o}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* JUSTIFICATIVA */}
      {sd.justificativa && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Justificativa</h3>
          <p className="text-sm text-blue-800 leading-relaxed">{sd.justificativa}</p>
        </div>
      )}

      {/* SEQUÊNCIA DIDÁTICA */}
      {sd.sequencia_didatica?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ⏱️ Sequência didática — {sd.sequencia_didatica.length} aula(s)
          </h3>
          <div className="space-y-5">
            {sd.sequencia_didatica.map((aula, i) => (
              <AulaCard key={i} aula={aula} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* AVALIAÇÃO GERAL */}
      {sd.avaliacao_geral && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Avaliação geral do período</h3>
          {sd.avaliacao_geral.instrumentos?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Instrumentos</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {sd.avaliacao_geral.instrumentos.map((x, i) => <li key={i}>• {x}</li>)}
              </ul>
            </div>
          )}
          {sd.avaliacao_geral.indicadores_de_sucesso?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Indicadores de sucesso</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {sd.avaliacao_geral.indicadores_de_sucesso.map((x, i) => <li key={i}>• {x}</li>)}
              </ul>
            </div>
          )}
          {sd.avaliacao_geral.como_acompanhar && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Como acompanhar</p>
              <p className="text-sm text-gray-700">{sd.avaliacao_geral.como_acompanhar}</p>
            </div>
          )}
        </div>
      )}

      {/* ADAPTAÇÕES INCLUSIVAS */}
      {sd.adaptacoes_inclusivas?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-3">🧩 Adaptações inclusivas</h3>
          <div className="space-y-3">
            {sd.adaptacoes_inclusivas.map((a, i) => (
              <div key={i}>
                <p className="font-semibold text-sm text-blue-900">{a.necessidade}</p>
                <ul className="mt-1 space-y-0.5">
                  {(a.estrategias || []).map((e, j) => (
                    <li key={j} className="text-sm text-blue-800">• {e}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONSIDERAÇÕES FINAIS */}
      {sd.consideracoes_finais && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-900 mb-2">📌 Considerações finais</h3>
          <p className="text-sm text-amber-900 leading-relaxed">{sd.consideracoes_finais}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// CARD DE AULA — exibe cada aula com todos os campos novos
// ============================================================
const AulaCard = ({ aula, index }) => {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full text-left bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 hover:opacity-95 transition"
      >
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide">
              {aula.semana ? `Semana ${aula.semana} · ` : ''}
              Aula {aula.numero_aula || index + 1}
            </p>
            <p className="font-semibold truncate">{aula.titulo}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {aula.principio_cognitivo && (
              <span className="text-[10px] bg-white bg-opacity-25 px-2 py-0.5 rounded font-medium">
                🧠 {aula.principio_cognitivo}
              </span>
            )}
            {aula.duracao_minutos && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded font-mono">
                {aula.duracao_minutos} min
              </span>
            )}
            <span className="text-lg">{expandido ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {/* Body */}
      {expandido && (
        <div className="p-4 space-y-3 text-sm bg-white">
          {/* Foco + Habilidade + Descritores */}
          <div className="flex flex-wrap gap-2">
            {aula.habilidade_foco && (
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                🎯 {aula.habilidade_foco}
              </span>
            )}
            {aula.foco && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                📌 {aula.foco}
              </span>
            )}
            {(aula.descritores || []).map((d, i) => (
              <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-semibold">
                {d}
              </span>
            ))}
          </div>

          {aula.objetivo_da_aula && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">🎯 Objetivo</p>
              <p className="text-gray-800">{aula.objetivo_da_aula}</p>
            </div>
          )}

          {aula.conteudo && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">📖 Conteúdo</p>
              <p className="text-gray-800">{aula.conteudo}</p>
            </div>
          )}

          {/* ESTRATÉGIA — destacada */}
          {aula.estrategia && (
            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-lg p-3">
              <p className="text-xs font-semibold text-purple-900 uppercase mb-1">🎨 Estratégia concreta</p>
              <p className="text-purple-900 leading-relaxed">{aula.estrategia}</p>
            </div>
          )}

          {aula.metodologia && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">👨‍🏫 Metodologia (passo a passo)</p>
              <p className="text-gray-800 leading-relaxed">{aula.metodologia}</p>
            </div>
          )}

          {aula.atividades?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">👥 Atividades dos alunos</p>
              <ul className="space-y-1">
                {aula.atividades.map((a, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-500 mt-0.5">•</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aula.recursos?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">📦 Recursos</p>
              <div className="flex flex-wrap gap-1.5">
                {aula.recursos.map((r, j) => (
                  <span key={j} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {aula.avaliacao_da_aula && (
            <div className="bg-emerald-50 border border-emerald-100 rounded p-2">
              <p className="text-xs font-semibold text-emerald-900 uppercase mb-0.5">✅ Avaliação</p>
              <p className="text-emerald-800 text-xs">{aula.avaliacao_da_aula}</p>
            </div>
          )}

          {/* ONDE PODE TRAVAR */}
          {aula.onde_pode_travar && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-xs font-semibold text-amber-900 uppercase mb-1">⚠️ Onde pode travar</p>
              <p className="text-amber-900 text-xs leading-relaxed">{aula.onde_pode_travar}</p>
            </div>
          )}

          {/* MOMENTO DE ENCANTAMENTO */}
          {aula.momento_de_encantamento && (
            <div className="bg-pink-50 border border-pink-200 rounded p-3">
              <p className="text-xs font-semibold text-pink-900 uppercase mb-1">✨ Momento de encantamento</p>
              <p className="text-pink-900 text-xs leading-relaxed">{aula.momento_de_encantamento}</p>
            </div>
          )}

          {/* LEITURA RELACIONAL */}
          {aula.leitura_relacional && (
            <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg p-3">
              <p className="text-xs font-semibold text-indigo-900 uppercase mb-1">💭 Leitura relacional (vínculo)</p>
              <p className="text-indigo-900 text-xs leading-relaxed italic">{aula.leitura_relacional}</p>
            </div>
          )}

          {/* RESULTADO VISÍVEL */}
          {aula.resultado_visivel && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-xs font-semibold text-green-900 uppercase mb-1">🎯 Resultado visível</p>
              <p className="text-green-900 text-xs leading-relaxed">{aula.resultado_visivel}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanejadorModoPlanejamento;