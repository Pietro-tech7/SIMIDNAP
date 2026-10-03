import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { gerarPdfPlanejamento } from '../utils/gerarPdfPlanejamento';

// ============================================================
// HELPERS — extração robusta (NUNCA retorna [object Object])
// ============================================================
function stringificar(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (Array.isArray(valor)) {
    return valor.map(v => stringificar(v)).filter(Boolean).join(' · ');
  }
  if (typeof valor === 'object') {
    if ('texto' in valor) return valor.texto || '';
    if ('nome' in valor) return valor.nome || '';
    if ('codigo' in valor) return valor.codigo || '';
    return '';
  }
  return String(valor);
}

function separarHabilidade(valor) {
  const str = stringificar(valor).trim();
  if (!str) return { codigo: '', texto: '' };
  const match = str.match(/^([A-Z]{2}\d{2}[A-Z]{2}\d{2,3}|EI\d{2}[A-Z]{2}\d{2}|EM\d{2}[A-Z]{3}\d{3})\s*[—–-]\s*(.+)$/i);
  if (match) {
    return { codigo: match[1].trim(), texto: match[2].trim() };
  }
  if (str.includes(' — ')) {
    const [codigo, ...resto] = str.split(' — ');
    return { codigo: codigo.trim(), texto: resto.join(' — ').trim() };
  }
  if (str.includes(' - ')) {
    const [codigo, ...resto] = str.split(' - ');
    return { codigo: codigo.trim(), texto: resto.join(' - ').trim() };
  }
  return { codigo: str, texto: '' };
}

function separarRecurso(valor) {
  const str = stringificar(valor).trim();
  if (!str) return { nome: '', uso: '' };
  if (str.includes(' — ')) {
    const [nome, ...resto] = str.split(' — ');
    return { nome: nome.trim(), uso: resto.join(' — ').trim() };
  }
  if (str.includes(' - ')) {
    const [nome, ...resto] = str.split(' - ');
    return { nome: nome.trim(), uso: resto.join(' - ').trim() };
  }
  return { nome: str, uso: '' };
}

function normalizarMetodologia(metodologia, duracaoTotal) {
  if (metodologia && typeof metodologia === 'object' && !Array.isArray(metodologia)) {
    return {
      introducao: metodologia.introducao || null,
      desenvolvimento: metodologia.desenvolvimento || null,
      fechamento: metodologia.fechamento || null,
    };
  }
  if (typeof metodologia === 'string' && metodologia.trim()) {
    return {
      introducao: null,
      desenvolvimento: {
        duracao_minutos: duracaoTotal || 0,
        estrategia: '',
        passos: [metodologia],
      },
      fechamento: null,
    };
  }
  return { introducao: null, desenvolvimento: null, fechamento: null };
}

// Lista de UFs do Brasil
const UFS = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
];

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

// ============================================================
// POPUP DE VALIDAÇÃO — modal centralizado
// ============================================================
const PopupValidacao = ({ mensagem, onFechar }) => {
  useEffect(() => {
    const timer = setTimeout(onFechar, 8000);
    return () => clearTimeout(timer);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onFechar}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-l-4 border-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Falta preencher
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {mensagem}
            </p>
          </div>
        </div>
        <button
          onClick={onFechar}
          className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN — PLANEJADOR MODO PLANEJAMENTO
// ============================================================
const PlanejadorModoPlanejamento = () => {
  const { user } = useAuth();

  const [nomeProfessor, setNomeProfessor] = useState(user?.full_name || '');
  const [nomeEscola, setNomeEscola] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('PI');
  const [titulo, setTitulo] = useState('');
  const [etapa, setEtapa] = useState('EF');
  const [ano, setAno] = useState(5);
  const [componente, setComponente] = useState('');

  const [mostrarNome, setMostrarNome] = useState(true);
  const [mostrarEscola, setMostrarEscola] = useState(true);
  const [mostrarMunicipio, setMostrarMunicipio] = useState(true);
  const [mostrarTitulo, setMostrarTitulo] = useState(true);

  useEffect(() => {
    if (user?.full_name && !nomeProfessor) {
      setNomeProfessor(user.full_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [referenciais, setReferenciais] = useState(['bncc']);

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

  const [periodoTipo, setPeriodoTipo] = useState('semana');
  const [tempoAula, setTempoAula] = useState(50);
  const [aulasPorSemana, setAulasPorSemana] = useState(5);
  const [totalAulas, setTotalAulas] = useState(5);
  const [totalEditadoManualmente, setTotalEditadoManualmente] = useState(false);

  const [numAlunos, setNumAlunos] = useState(25);
  const [conhecimentosPrevios, setConhecimentosPrevios] = useState('');
  const [dificuldades, setDificuldades] = useState('');
  const [diferenciado, setDiferenciado] = useState(false);

  const [gerando, setGerando] = useState(false);
  const [progressoLote, setProgressoLote] = useState(null);
  const [popupErro, setPopupErro] = useState(null);
  const [sucesso, setSucesso] = useState('');
  const [resultado, setResultado] = useState(null);

  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);

  // ============================================================
  // RASCUNHO
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
            if (d.nomeProfessor !== undefined) setNomeProfessor(d.nomeProfessor);
            if (d.nomeEscola !== undefined) setNomeEscola(d.nomeEscola);
            if (d.municipio !== undefined) setMunicipio(d.municipio);
            if (d.estado !== undefined) setEstado(d.estado);
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
            if (d.mostrarNome !== undefined) setMostrarNome(d.mostrarNome);
            if (d.mostrarEscola !== undefined) setMostrarEscola(d.mostrarEscola);
            if (d.mostrarMunicipio !== undefined) setMostrarMunicipio(d.mostrarMunicipio);
            if (d.mostrarTitulo !== undefined) setMostrarTitulo(d.mostrarTitulo);
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

  useEffect(() => {
    if (!rascunhoCarregado) return;
    try {
      const dados = {
        nomeProfessor, nomeEscola, municipio, estado,
        titulo, etapa, ano, componente, referenciais, habilidades,
        periodoTipo, tempoAula, aulasPorSemana, totalAulas, totalEditadoManualmente,
        numAlunos, conhecimentosPrevios, dificuldades, diferenciado,
        mostrarNome, mostrarEscola, mostrarMunicipio, mostrarTitulo,
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
    rascunhoCarregado,
    nomeProfessor, nomeEscola, municipio, estado,
    titulo, etapa, ano, componente, referenciais, habilidades,
    periodoTipo, tempoAula, aulasPorSemana, totalAulas, totalEditadoManualmente,
    numAlunos, conhecimentosPrevios, dificuldades, diferenciado,
    mostrarNome, mostrarEscola, mostrarMunicipio, mostrarTitulo,
  ]);

  // CÁLCULO AUTOMÁTICO
  useEffect(() => {
    if (totalEditadoManualmente) return;
    let total = 0;
    if (periodoTipo === 'aula') total = 1;
    else if (periodoTipo === 'semana') total = aulasPorSemana;
    else if (periodoTipo === 'mes') total = aulasPorSemana * 4;
    else if (periodoTipo === 'bimestre') total = aulasPorSemana * 8;
    setTotalAulas(total);
  }, [periodoTipo, aulasPorSemana, totalEditadoManualmente]);

  // CARREGAR COMPONENTES
  useEffect(() => {
    api.get(`/bncc/componentes?etapa=${etapa}`)
      .then(res => setComponentes(res.data || []))
      .catch(() => setComponentes([]));
  }, [etapa]);

  // CARREGAR UNIDADES
  useEffect(() => {
    if (!componente) { setUnidadesTematicas([]); return; }
    const params = { componente, etapa };
    if (etapa !== 'EI' && ano) params.ano = ano;
    api.get('/bncc-estrutura/unidades-tematicas', { params })
      .then(res => setUnidadesTematicas(res.data?.unidades || []))
      .catch(() => setUnidadesTematicas([]));
  }, [componente, ano, etapa]);

  // CARREGAR HABILIDADES
  useEffect(() => {
    if (!componente) { setHabilidadesDisponiveis([]); return; }
    const params = { componente, etapa };
    if (etapa !== 'EI' && ano) params.ano = ano;
    api.get('/bncc-estrutura/habilidades', { params })
      .then(res => setHabilidadesDisponiveis(res.data?.habilidades || []))
      .catch(() => setHabilidadesDisponiveis([]));
  }, [componente, ano, etapa]);

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

  const adicionarHabilidade = () => {
    setHabilidades(prev => [...prev, {
      unidade_tematica: '', objeto_conhecimento: '', codigo: '', texto: '',
      descritores: [], descritoresCorrelacionados: [], complementosPi: [],
      carregandoDescritores: false, busca: '',
    }]);
  };

  const removerHabilidade = (index) => {
    if (habilidades.length === 1) { setPopupErro('Mantenha ao menos 1 habilidade.'); return; }
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
  // GERAR PLANEJAMENTO (validação com POPUP)
  // ============================================================
  const gerar = async () => {
    setPopupErro(null); setSucesso(''); setResultado(null);

    if (!titulo.trim()) { setPopupErro('Dê um título ao planejamento.'); return; }
    if (!componente) { setPopupErro('Escolha o componente curricular.'); return; }
    if (!totalAulas || totalAulas < 1) { setPopupErro('O total de aulas precisa ser pelo menos 1.'); return; }
    for (let i = 0; i < habilidades.length; i++) {
      if (!habilidades[i].codigo) { setPopupErro(`Habilidade ${i + 1}: selecione um código.`); return; }
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

    const descritoresDetalhados = [];
    const vistos = new Set();
    habilidades.forEach(h => {
      (h.descritoresCorrelacionados || []).forEach(d => {
        const chave = `${d.fonte}:${d.codigo}`;
        if (h.descritores?.includes(chave) && !vistos.has(chave)) {
          vistos.add(chave);
          descritoresDetalhados.push({
            codigo: d.codigo,
            texto: d.texto || '',
            tema: d.tema || '',
            fonte: d.fonte || '',
          });
        }
      });
    });

    const componenteNome = componentes.find(c => c.codigo === componente)?.nome || componente;

    const payloadBase = {
      plan_type: 'planejamento',
      modo: 'planejamento',
      title: titulo.trim(),
      etapa,
      componente,
      subject: componenteNome,
      extra: {
        nome_professor: nomeProfessor.trim() || null,
        nome_escola: nomeEscola.trim() || null,
        municipio: municipio.trim() || null,
        estado: estado || null,
        descritores_detalhados: descritoresDetalhados,
        mostrar_nome: mostrarNome,
        mostrar_escola: mostrarEscola,
        mostrar_municipio: mostrarMunicipio,
        mostrar_titulo: mostrarTitulo,
      },
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
      descritores_detalhados: descritoresDetalhados,
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
            && sd.eixos_predominantes?.length) acumulado.eixos_predominantes = sd.eixos_predominantes;
        if ((!acumulado.descritores_trabalhados || acumulado.descritores_trabalhados.length === 0)
            && sd.descritores_trabalhados?.length) acumulado.descritores_trabalhados = sd.descritores_trabalhados;
        if (!acumulado.objetivos_gerais && sd.objetivos_gerais) acumulado.objetivos_gerais = sd.objetivos_gerais;
        if ((!acumulado.objetivos_especificos || acumulado.objetivos_especificos.length === 0)
            && sd.objetivos_especificos?.length) acumulado.objetivos_especificos = sd.objetivos_especificos;
        if ((!acumulado.habilidades || acumulado.habilidades.length === 0) && sd.habilidades?.length) {
          acumulado.habilidades = sd.habilidades;
        }
        if (!acumulado.justificativa && sd.justificativa) acumulado.justificativa = sd.justificativa;
        if (sd.sequencia_didatica?.length) acumulado.sequencia_didatica.push(...sd.sequencia_didatica);
        if ((!acumulado.avaliacao_geral || !acumulado.avaliacao_geral.instrumentos) && sd.avaliacao_geral) {
          acumulado.avaliacao_geral = sd.avaliacao_geral;
        }
        if ((!acumulado.adaptacoes_inclusivas || acumulado.adaptacoes_inclusivas.length === 0)
            && sd.adaptacoes_inclusivas?.length) acumulado.adaptacoes_inclusivas = sd.adaptacoes_inclusivas;
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
          nome_professor: nomeProfessor.trim() || null,
          nome_escola: nomeEscola.trim() || null,
          municipio: municipio.trim() || null,
          estado: estado || null,
          periodo_tipo: periodoTipo,
          tempo_aula_minutos: Number(tempoAula),
          aulas_por_semana: Number(aulasPorSemana),
          total_aulas: total,
          referenciais,
          mostrar_nome: mostrarNome,
          mostrar_escola: mostrarEscola,
          mostrar_municipio: mostrarMunicipio,
          mostrar_titulo: mostrarTitulo,
        },
      });

      setResultado(resSalvar.data);
      setSucesso(`Planejamento gerado com ${acumulado.sequencia_didatica.length} aula(s).`);
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (err) {
      if (err?.response?.status === 402) setPopupErro('Créditos insuficientes. Faça upgrade do seu plano.');
      else setPopupErro(err?.response?.data?.detail || 'Erro ao gerar o planejamento. Tente novamente.');
    } finally {
      setGerando(false);
      setProgressoLote(null);
    }
  };

  const limparTudo = () => {
    if (!window.confirm('Limpar todas as escolhas e começar de novo?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setNomeProfessor(user?.full_name || '');
    setNomeEscola(''); setMunicipio(''); setEstado('PI');
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
    setMostrarNome(true); setMostrarEscola(true); setMostrarMunicipio(true); setMostrarTitulo(true);
    setResultado(null); setPopupErro(null); setSucesso('');
  };

  const periodosDisponiveis = etapa === 'EI' ? PERIODOS_EI : PERIODOS_EF_EM;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {popupErro && <PopupValidacao mensagem={popupErro} onFechar={() => setPopupErro(null)} />}

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

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
          <p className="text-xs font-semibold text-blue-900 mb-3">
            🎓 Quem está planejando — esses dados aparecem no cabeçalho do plano
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome *</label>
              <input
                type="text" value={nomeProfessor} onChange={(e) => setNomeProfessor(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da escola *</label>
              <input
                type="text" value={nomeEscola} onChange={(e) => setNomeEscola(e.target.value)}
                placeholder="Ex: EMEF João Paulo II"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
              <p className="text-[10px] text-blue-700 mt-1">
                Se você dá aula em várias escolas, preencha aqui a que corresponde a este plano.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Município *</label>
              <input
                type="text" value={municipio} onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Ex: Teresina"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
              <select
                value={estado} onChange={(e) => setEstado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {UFS.map(([uf, nome]) => (
                  <option key={uf} value={uf}>{uf} — {nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Título do planejamento *</label>
          <input
            type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Frações — Matemática 5º ano — Outubro"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-lg">🌐</span>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Publicação na Comunidade
              </p>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Todo plano gerado vai direto para a <strong>Comunidade de Planejamentos SIMIDNAPE</strong> — onde outros professores autorizados podem consultar e baixar. Escolha o que mostrar publicamente:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-emerald-200 cursor-pointer hover:border-emerald-400 transition">
              <input
                type="checkbox"
                checked={mostrarNome}
                onChange={(e) => setMostrarNome(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <p className="text-xs font-semibold text-gray-800">Mostrar meu nome</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Se desmarcar, vira "Professor(a) SIMIDNAPE".</p>
              </div>
            </label>

            <label className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-emerald-200 cursor-pointer hover:border-emerald-400 transition">
              <input
                type="checkbox"
                checked={mostrarEscola}
                onChange={(e) => setMostrarEscola(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <p className="text-xs font-semibold text-gray-800">Mostrar minha escola</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Se desmarcar, vira "Escola SIMIDNAPE".</p>
              </div>
            </label>

            <label className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-emerald-200 cursor-pointer hover:border-emerald-400 transition">
              <input
                type="checkbox"
                checked={mostrarMunicipio}
                onChange={(e) => setMostrarMunicipio(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <p className="text-xs font-semibold text-gray-800">Mostrar meu município</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Se desmarcar, o município/UF é ocultado.</p>
              </div>
            </label>

            <label className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-emerald-200 cursor-pointer hover:border-emerald-400 transition">
              <input
                type="checkbox"
                checked={mostrarTitulo}
                onChange={(e) => setMostrarTitulo(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <p className="text-xs font-semibold text-gray-800">Mostrar meu título</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Se desmarcar, vira "Plano de [Componente] — [Ano]".</p>
              </div>
            </label>
          </div>
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

      {/* PASSO 2 — PERÍODO E TEMPO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📅 Passo 2 — Período e tempo</h2>

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

      {/* PASSO 3 — REFERENCIAIS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📚 Passo 3 — Referenciais curriculares</h2>
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

      {/* PASSO 4 — HABILIDADES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🎯 Passo 4 — Habilidades e descritores</h2>
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

      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 text-sm">✅ {sucesso}</div>}

      {/* RESULTADO */}
      {resultado && <ResultadoPlanejamento resultado={resultado} tituloFallback={titulo} totalAulasFallback={totalAulas} />}
    </div>
  );
};

// ============================================================
// RESULTADO
// ============================================================
const ResultadoPlanejamento = ({ resultado, tituloFallback, totalAulasFallback }) => {
  const sd = resultado.structured_data || {};
  const cab = sd.cabecalho || {};
  const [gerandoPdf, setGerandoPdf] = React.useState(false);

  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      await gerarPdfPlanejamento(resultado);
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={baixarPdf}
          disabled={gerandoPdf}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition shadow-sm"
        >
          {gerandoPdf ? '⏳ Gerando PDF...' : '📥 Baixar PDF'}
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2 border-b border-blue-400/40 pb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-200 font-bold">
              PLANEJADOR SIMIDNAPE
            </p>
            <p className="text-[10px] text-blue-100">O Professor Inesquecível</p>
          </div>
          <p className="text-[10px] text-blue-200 font-mono">simidnape.com.br</p>
        </div>

        <h2 className="text-xl font-bold">📘 {cab.titulo || tituloFallback}</h2>

        {(cab.nome_professor || cab.nome_escola || cab.municipio) && (
          <div className="mt-2 mb-3 text-xs text-blue-100">
            {cab.nome_professor && <span><strong className="text-white">Professor(a):</strong> {cab.nome_professor}</span>}
            {cab.nome_escola && <span> · <strong className="text-white">Escola:</strong> {cab.nome_escola}</span>}
            {cab.municipio && <span> · <strong className="text-white">Município:</strong> {cab.municipio}</span>}
            {cab.estado && <span> - {cab.estado}</span>}
          </div>
        )}

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

      {sd.logica_pedagogica && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
          <h3 className="font-semibold text-purple-900 mb-2">🎼 Lógica pedagógica do período</h3>
          <p className="text-sm text-purple-800 leading-relaxed italic">{sd.logica_pedagogica}</p>
        </div>
      )}

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
        {(sd.descritores_detalhados?.length > 0 || sd.descritores_trabalhados?.length > 0) && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-3">📊 Descritores trabalhados no período</h3>
            <div className="space-y-2">
              {(sd.descritores_detalhados || []).length > 0 ? (
                sd.descritores_detalhados.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono font-semibold flex-shrink-0">
                      {d.codigo}
                    </span>
                    {d.fonte && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold uppercase flex-shrink-0 mt-0.5">
                        {d.fonte}
                      </span>
                    )}
                    <span className="text-gray-700 leading-snug">{d.texto}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {sd.descritores_trabalhados.map((d, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono font-semibold">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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

      {sd.justificativa && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Justificativa</h3>
          <p className="text-sm text-blue-800 leading-relaxed">{sd.justificativa}</p>
        </div>
      )}

      {sd.sequencia_didatica?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ⏱️ Sequência didática — {sd.sequencia_didatica.length} aula(s)
          </h3>
          <div className="space-y-5">
            {sd.sequencia_didatica.map((aula, i) => (
              <AulaCard key={i} aula={aula} index={i} sd={sd} />
            ))}
          </div>
        </div>
      )}

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
// CARD DE AULA — 8 SEÇÕES (com extração robusta)
// ============================================================
const AulaCard = ({ aula, index, sd }) => {
  const [expandido, setExpandido] = useState(false);

  // Extrações seguras
  const habilidadeSeparada = separarHabilidade(aula.habilidade_foco);
  const foco = stringificar(aula.foco);
  const recursos = (aula.recursos || []).map(separarRecurso).filter(r => r.nome);
  const metodo = normalizarMetodologia(aula.metodologia, aula.duracao_minutos);

  const descritoresDaAula = (aula.descritores || []).map(codigoOriginal => {
    let chave = String(codigoOriginal || '').trim();
    if (chave.includes(':')) chave = chave.split(':').pop();
    chave = chave.toUpperCase().trim();
    const detalhe = (sd.descritores_detalhados || []).find(d =>
      String(d.codigo || '').trim().toUpperCase() === chave
    );
    return detalhe || { codigo: chave, texto: '', fonte: '' };
  });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* HEADER */}
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
            <p className="font-semibold truncate">{stringificar(aula.titulo)}</p>
            {aula.tema && (
              <p className="text-[11px] text-blue-200 italic truncate mt-0.5">
                Tema: {stringificar(aula.tema)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {aula.principio_cognitivo && (
              <span className="text-[10px] bg-white/30 text-white px-2 py-0.5 rounded font-semibold border border-white/40">
                🧠 {stringificar(aula.principio_cognitivo)}
              </span>
            )}
            {aula.duracao_minutos && (
              <span className="text-xs bg-white/30 text-white px-2 py-0.5 rounded font-mono font-semibold border border-white/40">
                {aula.duracao_minutos} min
              </span>
            )}
            <span className="text-lg">{expandido ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {/* BODY — 8 seções */}
      {expandido && (
        <div className="p-4 space-y-4 text-sm bg-white">

          {/* SEÇÃO 2 — HABILIDADES E DESCRITORES */}
          {(habilidadeSeparada.codigo || descritoresDaAula.length > 0) && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-3">
              <p className="text-xs font-bold text-blue-900 uppercase mb-2">
                🎯 Habilidades e descritores desta aula
              </p>
              {habilidadeSeparada.codigo && (
                <div className="flex flex-wrap gap-2 items-start mb-2">
                  <span className="text-xs bg-white text-blue-800 px-2 py-1 rounded font-mono font-bold border border-blue-300">
                    {habilidadeSeparada.codigo}
                  </span>
                  {foco && (
                    <span className="text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-200">
                      {foco}
                    </span>
                  )}
                </div>
              )}
              {habilidadeSeparada.texto && (
                <p className="text-gray-800 leading-relaxed mb-2 text-xs">
                  {habilidadeSeparada.texto}
                </p>
              )}
              {descritoresDaAula.length > 0 && (
                <div className="border-t border-blue-200 pt-2 mt-2 space-y-1.5">
                  <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Descritores</p>
                  {descritoresDaAula.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-mono font-bold flex-shrink-0">
                        {d.codigo}
                      </span>
                      {d.fonte && (
                        <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold uppercase text-[9px] flex-shrink-0">
                          {d.fonte}
                        </span>
                      )}
                      <span className="text-gray-700 leading-snug">{d.texto || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO 3 — OBJETIVO E EVIDÊNCIA */}
          {(aula.objetivo_da_aula || aula.conteudo || aula.evidencia_de_aprendizagem) && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-3">
              <p className="text-xs font-bold text-emerald-900 uppercase mb-2">
                🎯 Objetivo e evidência
              </p>
              {aula.objetivo_da_aula && (
                <p className="text-gray-800 mb-1">
                  <strong className="text-emerald-700">Objetivo:</strong> {stringificar(aula.objetivo_da_aula)}
                </p>
              )}
              {aula.conteudo && (
                <p className="text-gray-800 mb-1">
                  <strong className="text-blue-700">Conteúdo:</strong> {stringificar(aula.conteudo)}
                </p>
              )}
              {aula.evidencia_de_aprendizagem && (
                <div className="bg-white rounded p-2 mt-2 border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">O que observar</p>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {stringificar(aula.evidencia_de_aprendizagem)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO 4 — METODOLOGIA */}
          {(metodo.introducao || metodo.desenvolvimento || metodo.fechamento) && (
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">
                👨🏫 Metodologia
              </p>

              {metodo.introducao && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-3 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-yellow-800 uppercase">
                      1 · Introdução / Problematização
                    </p>
                    {metodo.introducao.duracao_minutos && (
                      <span className="text-[10px] bg-white text-yellow-800 px-2 py-0.5 rounded font-mono font-bold">
                        {metodo.introducao.duracao_minutos} min
                      </span>
                    )}
                  </div>
                  {metodo.introducao.gancho_de_curiosidade && (
                    <div className="bg-white rounded p-2 mb-2">
                      <p className="text-[9px] font-bold text-orange-600 uppercase mb-1">Gancho de curiosidade</p>
                      <p className="text-xs text-gray-800 italic leading-relaxed">
                        {stringificar(metodo.introducao.gancho_de_curiosidade)}
                      </p>
                    </div>
                  )}
                  {(metodo.introducao.passos || []).map((p, i) => (
                    <p key={i} className="text-xs text-gray-800 leading-relaxed pl-4 relative mb-0.5">
                      <span className="absolute left-0 text-yellow-700 font-bold">{i + 1}.</span>
                      {stringificar(p)}
                    </p>
                  ))}
                </div>
              )}

              {metodo.desenvolvimento && (
                <div className="bg-white border border-gray-200 border-l-4 border-blue-500 rounded-r-lg p-3 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-blue-800 uppercase">
                      2 · Desenvolvimento
                    </p>
                    {metodo.desenvolvimento.duracao_minutos && (
                      <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                        {metodo.desenvolvimento.duracao_minutos} min
                      </span>
                    )}
                  </div>
                  {metodo.desenvolvimento.estrategia && (
                    <div className="bg-orange-50 rounded p-2 mb-2">
                      <p className="text-[9px] font-bold text-orange-700 uppercase mb-1">Estratégia concreta</p>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        {stringificar(metodo.desenvolvimento.estrategia)}
                      </p>
                    </div>
                  )}
                  {(metodo.desenvolvimento.passos || []).map((p, i) => (
                    <p key={i} className="text-xs text-gray-800 leading-relaxed pl-4 relative mb-0.5">
                      <span className="absolute left-0 text-blue-700 font-bold">{i + 1}.</span>
                      {stringificar(p)}
                    </p>
                  ))}
                </div>
              )}

              {metodo.fechamento && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">
                      3 · Fechamento / Síntese
                    </p>
                    {metodo.fechamento.duracao_minutos && (
                      <span className="text-[10px] bg-white text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                        {metodo.fechamento.duracao_minutos} min
                      </span>
                    )}
                  </div>
                  {metodo.fechamento.sistematizacao && (
                    <p className="text-xs text-gray-800 leading-relaxed mb-2">
                      <strong className="text-emerald-700">Sistematização:</strong> {stringificar(metodo.fechamento.sistematizacao)}
                    </p>
                  )}
                  {metodo.fechamento.aplicacao_no_cotidiano && (
                    <div className="bg-white rounded p-2 mb-2 border border-emerald-200">
                      <p className="text-[9px] font-bold text-emerald-700 uppercase mb-1">Aplicação no cotidiano</p>
                      <p className="text-xs text-gray-800 italic leading-relaxed">
                        {stringificar(metodo.fechamento.aplicacao_no_cotidiano)}
                      </p>
                    </div>
                  )}
                  {(metodo.fechamento.passos || []).map((p, i) => (
                    <p key={i} className="text-xs text-gray-800 leading-relaxed pl-4 relative mb-0.5">
                      <span className="absolute left-0 text-emerald-700 font-bold">{i + 1}.</span>
                      {stringificar(p)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO 5 — RECURSOS */}
          {recursos.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-600 uppercase mb-2">📦 Recursos didáticos</p>
              <div className="space-y-1.5">
                {recursos.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs bg-white text-gray-800 px-2 py-0.5 rounded font-bold border border-gray-200 flex-shrink-0">
                      {r.nome}
                    </span>
                    {r.uso && (
                      <span className="text-xs text-gray-600 leading-relaxed pt-0.5">
                        {r.uso}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEÇÃO 6 — AVALIAÇÃO E INTERVENÇÕES */}
          {(aula.avaliacao_da_aula || aula.onde_pode_travar || aula.diferenciacao) && (
            <div className="bg-white border border-gray-200 border-l-4 border-emerald-500 rounded-r-lg p-3">
              <p className="text-xs font-bold text-emerald-800 uppercase mb-2">
                ✅ Avaliação e intervenções
              </p>
              {aula.avaliacao_da_aula && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase mb-0.5">Como avaliar</p>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {stringificar(aula.avaliacao_da_aula)}
                  </p>
                </div>
              )}
              {aula.onde_pode_travar && (
                <div className="bg-yellow-50 rounded p-2 mb-2">
                  <p className="text-[10px] font-bold text-yellow-800 uppercase mb-0.5">Se o aluno travar</p>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {stringificar(aula.onde_pode_travar)}
                  </p>
                </div>
              )}
              {aula.diferenciacao && (
                <div className="bg-orange-50 rounded p-2">
                  <p className="text-[10px] font-bold text-orange-800 uppercase mb-0.5">Diferenciação</p>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {stringificar(aula.diferenciacao)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO 7 — NOTA PEDAGÓGICA */}
          {aula.leitura_relacional && (
            <div className="border-l-4 border-gray-300 bg-gray-50 rounded-r-lg p-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Nota pedagógica</p>
              <p className="text-xs text-gray-600 italic leading-relaxed">
                {stringificar(aula.leitura_relacional)}
              </p>
            </div>
          )}

          {/* SEÇÃO 8 — REFLEXÃO PÓS-AULA */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">📝 Reflexão pós-aula</p>
            <p className="text-[11px] text-gray-500 italic mb-2">
              Espaço reservado para o professor registrar, após a aula, o que funcionou bem e o que precisa ser ajustado.
            </p>
            {aula.reflexao_pos_aula ? (
              <p className="text-xs text-gray-800 leading-relaxed">
                {stringificar(aula.reflexao_pos_aula)}
              </p>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="h-3 border-b border-gray-200"></div>
                <div className="h-3 border-b border-gray-200"></div>
              </div>
            )}
          </div>

          {/* Campos complementares (opcionais — mostrados se existirem) */}
          {(aula.momento_de_encantamento || aula.resultado_visivel || aula.conexao_com_a_vida) && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
                Ver notas complementares
              </summary>
              <div className="mt-2 space-y-2">
                {aula.momento_de_encantamento && (
                  <div className="bg-pink-50 rounded p-2 border border-pink-200">
                    <p className="text-[10px] font-bold text-pink-800 uppercase mb-0.5">Momento de encantamento</p>
                    <p className="text-gray-800 leading-relaxed">{stringificar(aula.momento_de_encantamento)}</p>
                  </div>
                )}
                {aula.resultado_visivel && (
                  <div className="bg-green-50 rounded p-2 border border-green-200">
                    <p className="text-[10px] font-bold text-green-800 uppercase mb-0.5">Resultado visível</p>
                    <p className="text-gray-800 leading-relaxed">{stringificar(aula.resultado_visivel)}</p>
                  </div>
                )}
                {aula.conexao_com_a_vida && (
                  <div className="bg-orange-50 rounded p-2 border border-orange-200">
                    <p className="text-[10px] font-bold text-orange-800 uppercase mb-0.5">Conexão com a vida</p>
                    <p className="text-gray-800 italic leading-relaxed">{stringificar(aula.conexao_com_a_vida)}</p>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanejadorModoPlanejamento;