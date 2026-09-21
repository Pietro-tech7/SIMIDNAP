import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import FeedbackCard from '../components/FeedbackCard';

// ============================================================
// DEFINIÇÃO DAS CATEGORIAS POR ETAPA E PERFIL
// ============================================================
const CATEGORIAS = {
  EI: {
    professor: [
      { v: 'educacao_infantil', l: '🧸 Educação Infantil' },
    ],
    coordenador: [
      { v: 'gestao_escolar', l: '🏫 Gestão Escolar' },
    ],
  },
  EF: {
    professor: [
      { v: 'ciclo_alfabetizacao', l: '📖 Ciclo de Alfabetização (1º e 2º anos)' },
      { v: 'ensino_fundamental', l: '📘 Ensino Fundamental (3º ao 9º ano)' },
    ],
    coordenador: [
      { v: 'gestao_escolar', l: '🏫 Gestão Escolar' },
    ],
  },
  EM: {
    professor: [
      { v: 'linguagens', l: '📚 Linguagens e suas Tecnologias' },
      { v: 'matematica', l: '🔢 Matemática e suas Tecnologias' },
      { v: 'ciencias_natureza', l: '🔬 Ciências da Natureza e suas Tecnologias' },
      { v: 'ciencias_humanas', l: '🌍 Ciências Humanas e Sociais Aplicadas' },
    ],
    coordenador: [
      { v: 'gestao_escolar', l: '🏫 Gestão Escolar' },
    ],
  },
};

// ============================================================
// ITINERÁRIOS FORMATIVOS DO ENSINO MÉDIO
// ============================================================
const ITINERARIOS_EM = [
  'Projeto de Vida',
  'Aprofundamento em Linguagens',
  'Aprofundamento em Matemática',
  'Aprofundamento em Ciências da Natureza',
  'Aprofundamento em Ciências Humanas',
  'Eletivas',
  'Não se aplica',
];

const PraticasExitosas = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [pdfBaixado, setPdfBaixado] = useState(false);

  const [form, setForm] = useState({
    // Identificação
    title: '',
    perfil: '',
    flow_type: '',
    sub_flow: '',
    category: '',
    education_stage: '',

    // Contexto escolar (professor)
    school: '',
    city: '',
    gre: '',
    grade: '',
    subject: '',
    num_alunos: '',
    class_profile: '',
    itinerario: '',  // EM

    // Contexto de gestão (coordenador)
    eixo_atuacao: '',
    num_professores: '',
    series_impactadas: '',
    perfil_equipe: '',

    // Dados de avaliações (coordenador)
    avaliacoes_participa: [],
    avaliacoes_resultados: '',
    frequencia_analise: '',
    intervencoes_anteriores: [],

    // Seminário
    seminar_theme: '',

    // BNCC
    bncc_codigo: '',
    bncc_texto: '',

    // Particularidades
    original_grade: '',
    target_grade: '',
    has_special_needs: false,
    duration: '',

    // Recursos
    resources: {
      internet: false,
      projetor: false,
      impressora: false,
      espaco_externo: false,
      laboratorio: false,
    },
    resources_extra: '',

    // Histórico e evidências
    already_tried: '',
    evidences: '',
    observed_results: '',
    culminancia: '',
    replicability: '',

    // Relato guiado — Fluxos A e B
    what_was_done: '',
    how_it_went: '',
    what_was_noticed: '',
    school_context: '',

    // Relato guiado — Fluxo C
    goal: '',
    what_you_imagine: '',
    what_you_expect: '',
  });

  // BNCC
  const [componentes, setComponentes] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [codigoComponente, setCodigoComponente] = useState('');
  const [anoNumero, setAnoNumero] = useState('');
  const [loadingHabilidades, setLoadingHabilidades] = useState(false);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateResource = (key, value) => {
    setForm(prev => ({
      ...prev,
      resources: { ...prev.resources, [key]: value },
    }));
  };

  const toggleArrayItem = (field, item) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(item)
          ? arr.filter(i => i !== item)
          : [...arr, item],
      };
    });
  };

  // Resetar campos dependentes quando a etapa muda
  const mudarEtapa = (novaEtapa) => {
    setForm(prev => ({
      ...prev,
      education_stage: novaEtapa,
      category: '',
      subject: '',
      grade: '',
      itinerario: '',
      bncc_codigo: '',
      bncc_texto: '',
    }));
    setCodigoComponente('');
    setAnoNumero('');
    setHabilidades([]);
  };

  // Resetar campos dependentes quando a categoria muda
  const mudarCategoria = (novaCat) => {
    setForm(prev => ({
      ...prev,
      category: novaCat,
      bncc_codigo: '',
      bncc_texto: '',
    }));
    setCodigoComponente('');
    setAnoNumero('');
    setHabilidades([]);
  };

  // ============================================================
  // CARREGAR COMPONENTES BNCC
  // ============================================================
  useEffect(() => {
    if (step === 3 && form.education_stage) {
      api.get(`/bncc/componentes?etapa=${form.education_stage}`)
        .then(res => setComponentes(res.data))
        .catch(() => setComponentes([]));
    }
  }, [step, form.education_stage]);

  // ============================================================
  // CARREGAR HABILIDADES
  // ============================================================
  useEffect(() => {
    if (!codigoComponente || !form.education_stage) {
      setHabilidades([]);
      return;
    }
    if (form.education_stage === 'EF' && !anoNumero) {
      setHabilidades([]);
      return;
    }
    setLoadingHabilidades(true);
    const anoParam = form.education_stage === 'EF' ? `&ano=${anoNumero}` : '';
    api.get(`/bncc/habilidades?etapa=${form.education_stage}&componente=${codigoComponente}${anoParam}`)
      .then(res => setHabilidades(res.data || []))
      .catch(() => setHabilidades([]))
      .finally(() => setLoadingHabilidades(false));
  }, [codigoComponente, anoNumero, form.education_stage]);

  const handleSelecionarHabilidade = (e) => {
    const codigo = e.target.value;
    const habilidade = habilidades.find(h => h.codigo === codigo);
    setForm(prev => ({
      ...prev,
      bncc_codigo: codigo,
      bncc_texto: habilidade ? habilidade.texto : '',
    }));
  };

  // ============================================================
  // NAVEGAÇÃO
  // ============================================================
  const podeAvancar = () => {
    if (step === 1) return form.perfil !== '';
    if (step === 2) {
      if (form.flow_type === '') return false;
      if (form.flow_type === 'ja_tenho' && form.sub_flow === '') return false;
      return true;
    }
    if (step === 3) {
      if (form.education_stage === '') return false;
      if (form.category === '') return false;
      return true;
    }
    if (step === 4) return true;
    if (step === 5) {
      if (form.title.trim() === '') return false;
      if (form.flow_type === 'criar') {
        return (
          form.goal.trim().length >= 30 &&
          form.what_you_imagine.trim().length >= 30 &&
          form.what_you_expect.trim().length >= 30
        );
      }
      return (
        form.what_was_done.trim().length >= 30 &&
        form.how_it_went.trim().length >= 30 &&
        form.what_was_noticed.trim().length >= 30
      );
    }
    return true;
  };

  const avancar = () => {
    if (!podeAvancar()) return;
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const voltar = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async () => {
    if (!podeAvancar()) return;
    setLoading(true);
    setError('');
    setResult(null);

    let descriptionConsolidada = '';
    if (form.flow_type === 'criar') {
      const partes = [
        form.goal && `OBJETIVO:\n${form.goal}`,
        form.what_you_imagine && `O QUE IMAGINA FAZER:\n${form.what_you_imagine}`,
        form.what_you_expect && `O QUE ESPERA ALCANÇAR:\n${form.what_you_expect}`,
      ].filter(Boolean);
      descriptionConsolidada = partes.join('\n\n');
    } else {
      const partes = [
        form.what_was_done && `O QUE FOI FEITO:\n${form.what_was_done}`,
        form.how_it_went && `COMO FOI:\n${form.how_it_went}`,
        form.what_was_noticed && `O QUE FOI PERCEBIDO:\n${form.what_was_noticed}`,
        form.school_context && `CONTEXTO DA ESCOLA:\n${form.school_context}`,
      ].filter(Boolean);
      descriptionConsolidada = partes.join('\n\n');
    }

    const dadosAvaliacoes = {
      participa: form.avaliacoes_participa,
      resultados: form.avaliacoes_resultados,
      frequencia_analise: form.frequencia_analise,
      intervencoes_anteriores: form.intervencoes_anteriores,
    };

    try {
      const payload = {
        ...form,
        num_alunos: form.num_alunos ? parseInt(form.num_alunos) : null,
        num_professores: form.num_professores ? parseInt(form.num_professores) : null,
        dados_avaliacoes: form.perfil === 'coordenador' ? dadosAvaliacoes : {},
        description: descriptionConsolidada,
        answers: form,
      };
      const response = await api.post('/successful-practices/generate', payload);
      setResult(response.data);
      setPdfBaixado(false);
      setStep(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err?.response?.status === 402) {
        setError('Créditos insuficientes. Faça upgrade do seu plano para continuar.');
      } else if (err?.response?.status === 400) {
        setError(err?.response?.data?.detail || 'Verifique os dados e tente novamente.');
      } else {
        setError('Erro ao gerar a prática. Tente novamente em alguns instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarPDF = async () => {
    try {
      const elemento = document.getElementById('pratica-conteudo');
      if (!elemento) {
        alert('Conteúdo não encontrado.');
        return;
      }
      const nome = result?.title ? result.title.replace(/\s+/g, '_') : 'pratica_exitosa';
      await gerarPDF(elemento, nome);
      setPdfBaixado(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    }
  };

  const reiniciar = () => {
    setStep(1);
    setResult(null);
    setError('');
    setForm({
      title: '', perfil: '', flow_type: '', sub_flow: '', category: '', education_stage: '',
      school: '', city: '', gre: '', grade: '', subject: '', num_alunos: '', class_profile: '', itinerario: '',
      eixo_atuacao: '', num_professores: '', series_impactadas: '', perfil_equipe: '',
      avaliacoes_participa: [], avaliacoes_resultados: '', frequencia_analise: '', intervencoes_anteriores: [],
      seminar_theme: '', bncc_codigo: '', bncc_texto: '',
      original_grade: '', target_grade: '', has_special_needs: false, duration: '',
      resources: { internet: false, projetor: false, impressora: false, espaco_externo: false, laboratorio: false },
      resources_extra: '',
      already_tried: '', evidences: '', observed_results: '', culminancia: '', replicability: '',
      what_was_done: '', how_it_went: '', what_was_noticed: '', school_context: '',
      goal: '', what_you_imagine: '', what_you_expect: '',
    });
    setComponentes([]);
    setHabilidades([]);
    setCodigoComponente('');
    setAnoNumero('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCoordenador = form.perfil === 'coordenador';
  const isFluxoC = form.flow_type === 'criar';
  const categoriasDisponiveis = form.education_stage
    ? CATEGORIAS[form.education_stage][form.perfil] || []
    : [];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="print:hidden">
        <Link to="/modulo/praticas_exitosas" className="text-teal-600 text-sm hover:underline">
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">🏆</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Práticas Exitosas</h1>
            <p className="text-gray-600">
              Crie, melhore ou documente práticas pedagógicas com foco em resultados.
            </p>
          </div>
        </div>

        {step <= 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Etapa {step} de 5</span>
              <span>{Math.round((step / 5) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 1 — PERFIL */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quem está usando?</h2>
            <p className="text-gray-600 mb-6">
              Escolha o perfil para que a IA adapte a prática ao seu papel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => update('perfil', 'professor')}
                className={`p-6 rounded-xl border-2 text-left transition ${
                  form.perfil === 'professor' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">👩‍🏫</div>
                <div className="font-semibold text-gray-900 text-lg">Professor(a)</div>
                <p className="text-sm text-gray-600 mt-1">Prática de sala de aula, com foco nos alunos.</p>
              </button>

              <button
                onClick={() => update('perfil', 'coordenador')}
                className={`p-6 rounded-xl border-2 text-left transition ${
                  form.perfil === 'coordenador' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">🧑‍💼</div>
                <div className="font-semibold text-gray-900 text-lg">Coordenador(a)</div>
                <p className="text-sm text-gray-600 mt-1">Gestão escolar, formação de professores, uso de dados.</p>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 2 — FLUXO */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Você já tem uma prática?</h2>
            <p className="text-gray-600 mb-6">Escolha o caminho que faz sentido para você.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => { update('flow_type', 'ja_tenho'); update('sub_flow', ''); }}
                className={`p-6 rounded-xl border-2 text-left transition ${
                  form.flow_type === 'ja_tenho' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">📚</div>
                <div className="font-semibold text-gray-900 text-lg">Já tenho uma prática</div>
                <p className="text-sm text-gray-600 mt-1">Quero melhorar ou documentar uma prática que já realizei.</p>
              </button>

              <button
                onClick={() => { update('flow_type', 'criar'); update('sub_flow', ''); }}
                className={`p-6 rounded-xl border-2 text-left transition ${
                  form.flow_type === 'criar' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">✨</div>
                <div className="font-semibold text-gray-900 text-lg">Quero criar do zero</div>
                <p className="text-sm text-gray-600 mt-1">Quero uma prática nova para executar.</p>
              </button>
            </div>

            {form.flow_type === 'ja_tenho' && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-800 mb-3">O que você quer fazer com essa prática?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => update('sub_flow', 'melhorar')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      form.sub_flow === 'melhorar' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">🔧 Modelar e melhorar</div>
                    <p className="text-xs text-gray-600 mt-1">A IA analisa e propõe melhorias concretas.</p>
                  </button>

                  <button
                    onClick={() => update('sub_flow', 'documento')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      form.sub_flow === 'documento' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">📄 Documento para seminário</div>
                    <p className="text-xs text-gray-600 mt-1">Organiza em formato para apresentar/premiar.</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 3 — ETAPA DE ENSINO + CATEGORIA + CONTEXTO */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sobre a prática e o contexto</h2>
            <p className="text-gray-600 mb-6">Essas informações adaptam a prática à sua realidade.</p>

            {/* 3.1 — ETAPA DE ENSINO (PRIMEIRO) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etapa de Ensino *
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Escolha a etapa em que você atua. Isso define as categorias e os campos seguintes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {!isCoordenador && (
                  <button
                    onClick={() => mudarEtapa('EI')}
                    className={`p-4 rounded-lg border-2 text-center transition ${
                      form.education_stage === 'EI' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🧒</div>
                    <div className="font-semibold text-gray-800 text-sm">Educação Infantil</div>
                  </button>
                )}
                <button
                  onClick={() => mudarEtapa('EF')}
                  className={`p-4 rounded-lg border-2 text-center transition ${
                    form.education_stage === 'EF' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📘</div>
                  <div className="font-semibold text-gray-800 text-sm">Ensino Fundamental</div>
                </button>
                <button
                  onClick={() => mudarEtapa('EM')}
                  className={`p-4 rounded-lg border-2 text-center transition ${
                    form.education_stage === 'EM' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🎓</div>
                  <div className="font-semibold text-gray-800 text-sm">Ensino Médio</div>
                </button>
              </div>
            </div>

            {/* 3.2 — CATEGORIA (dinâmica por etapa + perfil) */}
            {form.education_stage && categoriasDisponiveis.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {form.education_stage === 'EM'
                    ? 'Escolha a área do conhecimento ou atuação.'
                    : form.education_stage === 'EI'
                      ? 'Escolha a categoria da prática.'
                      : 'Escolha a categoria da prática.'}
                </p>
                <div className={`grid grid-cols-1 ${categoriasDisponiveis.length > 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3`}>
                  {categoriasDisponiveis.map(cat => (
                    <button
                      key={cat.v}
                      onClick={() => mudarCategoria(cat.v)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        form.category === cat.v ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-800 text-sm">{cat.l}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3.3 — RESTO DOS CAMPOS (só aparecem depois de escolher etapa + categoria) */}
            {form.education_stage && form.category && (
              <>
                {/* Tema do Seminário */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tema do Seminário ou Evento <span className="text-xs text-gray-500">(opcional)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Se você vai apresentar em um seminário, cole o tema para a IA alinhar a narrativa.
                  </p>
                  <input
                    type="text"
                    value={form.seminar_theme}
                    onChange={(e) => update('seminar_theme', e.target.value)}
                    placeholder="Ex: 'Alfabetizar com equidade: boas práticas para ensinar a todos'"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Escola / Município / GRE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Escola</label>
                    <input
                      type="text"
                      value={form.school}
                      onChange={(e) => update('school', e.target.value)}
                      placeholder="Nome da escola"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      placeholder="Cidade"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GRE (Gerência Regional)</label>
                    <input
                      type="text"
                      value={form.gre}
                      onChange={(e) => update('gre', e.target.value)}
                      placeholder="Ex: 1ª GRE"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* ==================== CAMPOS DO PROFESSOR ==================== */}
                {!isCoordenador && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {form.education_stage === 'EI' ? 'Faixa Etária / Etapa' : 'Série / Ano'}
                        </label>
                        <p className="text-xs text-gray-500 mb-1">
                          {form.education_stage === 'EI'
                            ? 'Ex: Berçário, Maternal, Pré-escola I, Pré-escola II'
                            : form.education_stage === 'EM'
                              ? 'Ex: 1ª série, 2ª série, 3ª série'
                              : 'Ex: 3º ano, 5º ano, 9º ano'}
                        </p>
                        <input
                          type="text"
                          value={form.grade}
                          onChange={(e) => update('grade', e.target.value)}
                          placeholder={
                            form.education_stage === 'EI'
                              ? 'Ex: Pré-escola II'
                              : form.education_stage === 'EM'
                                ? 'Ex: 2ª série'
                                : 'Ex: 5º ano'
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {form.education_stage === 'EM' ? 'Componente / Área específica' : 'Disciplina / Área'}
                        </label>
                        <p className="text-xs text-gray-500 mb-1">
                          {form.education_stage === 'EM'
                            ? 'Ex: Língua Portuguesa, História, Biologia'
                            : 'Ex: Matemática, História, Linguagens'}
                        </p>
                        <input
                          type="text"
                          value={form.subject}
                          onChange={(e) => update('subject', e.target.value)}
                          placeholder={form.education_stage === 'EM' ? 'Ex: Biologia' : 'Ex: Matemática'}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº de alunos</label>
                        <input
                          type="number"
                          value={form.num_alunos}
                          onChange={(e) => update('num_alunos', e.target.value)}
                          placeholder="Ex: 25"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      {/* Itinerário formativo (só EM) */}
                      {form.education_stage === 'EM' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Itinerário Formativo <span className="text-xs text-gray-500">(opcional)</span>
                          </label>
                          <select
                            value={form.itinerario}
                            onChange={(e) => update('itinerario', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Selecione...</option>
                            {ITINERARIOS_EM.map(it => (
                              <option key={it} value={it}>{it}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Perfil da turma</label>
                      <p className="text-xs text-gray-500 mb-1">
                        {form.education_stage === 'EI'
                          ? 'Descreva o desenvolvimento das crianças, rotina, interesses. Ex: "Crianças curiosas, mas com rotina agitada."'
                          : form.education_stage === 'EM'
                            ? 'Descreva os interesses dos jovens, aspirações, desafios de engajamento. Ex: "Turma com boa participação oral, mas pouco engajada em tarefas longas."'
                            : 'Descreva a turma: nível de leitura, participação, dificuldades. Ex: "Turma agitada, mas participativa."'}
                      </p>
                      <textarea
                        value={form.class_profile}
                        onChange={(e) => update('class_profile', e.target.value)}
                        rows="2"
                        placeholder={
                          form.education_stage === 'EI'
                            ? 'Ex: Crianças curiosas e ativas, com boa socialização.'
                            : form.education_stage === 'EM'
                              ? 'Ex: Turma participativa, com interesse em projetos práticos.'
                              : 'Ex: Turma agitada, mas participativa.'
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </>
                )}

                {/* ==================== CAMPOS DO COORDENADOR ==================== */}
                {isCoordenador && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Eixo de atuação *</label>
                      <p className="text-xs text-gray-500 mb-2">
                        Qual eixo da gestão escolar essa prática vai trabalhar?
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          { v: 'formacao_continuada', l: '🎓 Formação continuada de professores' },
                          { v: 'acompanhamento_pedagogico', l: '🔍 Acompanhamento pedagógico' },
                          { v: 'uso_de_dados', l: '📊 Uso de dados (SAEPI, IDEB, internas)' },
                          { v: 'engajamento_equipe', l: '🤝 Engajamento da equipe / clima escolar' },
                          { v: 'relacao_escola_familia', l: '👨‍👩‍👧 Relação escola-família' },
                          { v: 'conselho_classe', l: '📋 Conselho de classe / articulação' },
                        ].map(item => (
                          <button
                            key={item.v}
                            onClick={() => update('eixo_atuacao', item.v)}
                            className={`p-3 rounded-lg border-2 text-left text-sm transition ${
                              form.eixo_atuacao === item.v ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {item.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº de professores envolvidos</label>
                        <input
                          type="number"
                          value={form.num_professores}
                          onChange={(e) => update('num_professores', e.target.value)}
                          placeholder="Ex: 12"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Séries / Etapas impactadas</label>
                        <input
                          type="text"
                          value={form.series_impactadas}
                          onChange={(e) => update('series_impactadas', e.target.value)}
                          placeholder="Ex: Anos iniciais e finais"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Perfil da equipe docente</label>
                      <p className="text-xs text-gray-500 mb-1">
                        Descreva a equipe: experiência, abertura a mudanças, desafios.
                      </p>
                      <textarea
                        value={form.perfil_equipe}
                        onChange={(e) => update('perfil_equipe', e.target.value)}
                        rows="2"
                        placeholder="Ex: Equipe jovem, aberta a inovações, mas com pouca formação."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </>
                )}

                {/* ==================== BNCC ==================== */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    📖 {form.education_stage === 'EI' ? 'Campos de Experiência' : form.education_stage === 'EM' ? 'Competências da Área' : 'Habilidade BNCC'}
                    <span className="text-xs text-gray-500 ml-2">(opcional, mas recomendada)</span>
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código BNCC (digite se souber)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.bncc_codigo}
                        onChange={(e) => setForm({ ...form, bncc_codigo: e.target.value.toUpperCase(), bncc_texto: '' })}
                        placeholder="EF05MA03"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!form.bncc_codigo) return;
                          try {
                            const res = await api.get(`/bncc/habilidades/${form.bncc_codigo}`);
                            if (res.data?.texto) {
                              setForm(f => ({ ...f, bncc_texto: res.data.texto }));
                            } else {
                              setForm(f => ({ ...f, bncc_texto: 'Código não encontrado.' }));
                            }
                          } catch {
                            setForm(f => ({ ...f, bncc_texto: 'Código não encontrado.' }));
                          }
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {form.education_stage === 'EI' ? 'Campo' : form.education_stage === 'EM' ? 'Área' : 'Componente'}
                      </label>
                      <select
                        value={codigoComponente}
                        onChange={(e) => setCodigoComponente(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      >
                        <option value="">Selecione...</option>
                        {componentes.map(c => (
                          <option key={c.codigo} value={c.codigo}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                    {form.education_stage === 'EF' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ano (1 a 9)</label>
                        <input
                          type="number" min="1" max="9"
                          value={anoNumero}
                          onChange={(e) => setAnoNumero(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                      </div>
                    )}
                    <div className={form.education_stage === 'EF' ? '' : 'md:col-span-2'}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {form.education_stage === 'EI' ? 'Objetivo' : form.education_stage === 'EM' ? 'Competência' : 'Habilidade'}
                      </label>
                      <select
                        value={form.bncc_codigo}
                        onChange={handleSelecionarHabilidade}
                        disabled={!habilidades.length}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100"
                      >
                        <option value="">
                          {loadingHabilidades ? 'Carregando...' : habilidades.length === 0 ? 'Selecione componente/área' : 'Selecione...'}
                        </option>
                        {habilidades.map(h => (
                          <option key={h.codigo} value={h.codigo}>
                            {h.codigo} — {h.texto?.substring(0, 60)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {form.bncc_texto && (
                    <p className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded p-2">
                      <strong>{form.bncc_codigo}:</strong> {form.bncc_texto}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 4 — PARTICULARIDADES */}
        {/* ============================================================ */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Particularidades</h2>
            <p className="text-gray-600 mb-6">Detalhes que fazem toda a diferença na qualidade da prática.</p>

            {form.flow_type === 'ja_tenho' && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.original_grade !== '' || form.target_grade !== ''}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        update('original_grade', ''); update('target_grade', '');
                      } else {
                        update('original_grade', form.grade || '');
                      }
                    }}
                    className="mt-0.5 w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-amber-900">
                      Vou aplicar esta prática em uma turma/série diferente
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      Ex: a prática foi feita para o 2º ano, mas este ano vou aplicar no 5º ano.
                    </p>
                  </div>
                </label>

                {(form.original_grade !== '' || form.target_grade !== '') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">Original</label>
                      <input type="text" value={form.original_grade} onChange={(e) => update('original_grade', e.target.value)} placeholder="Ex: 2º ano" className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">Novo alvo</label>
                      <input type="text" value={form.target_grade} onChange={(e) => update('target_grade', e.target.value)} placeholder="Ex: 5º ano" className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.flow_type === 'criar' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração desejada</label>
                <p className="text-xs text-gray-500 mb-1">Quanto tempo a prática vai durar?</p>
                <select
                  value={form.duration}
                  onChange={(e) => update('duration', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Selecione...</option>
                  <option value="um dia">Um dia</option>
                  <option value="uma semana">Uma semana</option>
                  <option value="um mês">Um mês</option>
                  <option value="um bimestre">Um bimestre</option>
                  <option value="um semestre">Um semestre</option>
                  <option value="o ano todo">O ano todo</option>
                </select>
              </div>
            )}

            {form.sub_flow === 'melhorar' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">O que você já tentou e não funcionou?</label>
                <p className="text-xs text-gray-500 mb-1">Isso evita que a IA sugira o que já falhou.</p>
                <textarea
                  value={form.already_tried}
                  onChange={(e) => update('already_tried', e.target.value)}
                  rows="3"
                  placeholder="Ex: 'Tentei dividir em grupos, mas os alunos ficaram dispersos'"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            <div className="border-t border-gray-100 pt-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">🛠️ Recursos disponíveis na escola</h3>
              <p className="text-xs text-gray-500 mb-3">A IA só vai sugerir atividades que usem o que você tem.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { k: 'internet', l: '🌐 Internet' },
                  { k: 'projetor', l: '📽️ Projetor / TV' },
                  { k: 'impressora', l: '🖨️ Impressora' },
                  { k: 'espaco_externo', l: '🌳 Espaço externo (pátio, quadra)' },
                  { k: 'laboratorio', l: '🔬 Laboratório (informática, ciências)' },
                ].map(item => (
                  <label key={item.k} className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={form.resources[item.k]}
                      onChange={(e) => updateResource(item.k, e.target.checked)}
                      className="w-5 h-5 text-teal-600 rounded"
                    />
                    <span className="text-sm">{item.l}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Outros materiais de consumo <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.resources_extra}
                  onChange={(e) => update('resources_extra', e.target.value)}
                  placeholder="Ex: papel, cartolina, cola, tintas, sucata..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {form.flow_type === 'ja_tenho' && (
              <div className="border-t border-gray-100 pt-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">📋 Evidências e resultados</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resultados já observados <span className="text-xs text-gray-500">(opcional)</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      O que mudou nos alunos? Se tiver dados do SAEPI ou avaliações, mencione.
                    </p>
                    <textarea
                      value={form.observed_results}
                      onChange={(e) => update('observed_results', e.target.value)}
                      rows="2"
                      placeholder="Ex: 'Os alunos melhoraram a participação oral', 'Ainda não medi formalmente'..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evidências disponíveis <span className="text-xs text-gray-500">(opcional)</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Fotos, produções dos alunos, depoimentos, gráficos de desempenho...
                    </p>
                    <textarea
                      value={form.evidences}
                      onChange={(e) => update('evidences', e.target.value)}
                      rows="2"
                      placeholder="Ex: 'Tenho fotos', 'Tenho produções dos alunos'..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {form.sub_flow === 'documento' && (
              <div className="border-t border-gray-100 pt-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Culminância realizada ou desejada <span className="text-xs text-gray-500">(opcional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Como a prática foi (ou será) socializada? Mostra, apresentação, exposição...
                </p>
                <textarea
                  value={form.culminancia}
                  onChange={(e) => update('culminancia', e.target.value)}
                  rows="2"
                  placeholder="Ex: 'Mostra cultural para as famílias', 'Exposição dos trabalhos'..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {(form.sub_flow === 'documento' || form.flow_type === 'criar') && (
              <div className="border-t border-gray-100 pt-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potencial de Replicabilidade <span className="text-xs text-gray-500">(opcional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Como essa prática pode ser adaptada para outras escolas/realidades? Critério valorizado pelo PPAIC.
                </p>
                <textarea
                  value={form.replicability}
                  onChange={(e) => update('replicability', e.target.value)}
                  rows="2"
                  placeholder="Ex: 'Pode ser adaptada para outras escolas', 'Funciona com qualquer realidade'..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {isCoordenador && (
              <div className="border-t border-gray-100 pt-6 mb-6 bg-blue-50 rounded-lg p-4 -mx-4 md:mx-0">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 Dados de avaliações externas</h3>
                <p className="text-xs text-blue-700 mb-4">
                  Se você tem dados do SAEPI, IDEB, avaliações internas ou de empresa contratada,
                  informe aqui. A IA vai direcionar a prática para atacar os descritores com baixo desempenho.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">A escola participa de quais avaliações?</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { v: 'saepi', l: '📘 SAEPI' },
                      { v: 'saeb', l: '📗 SAEB / IDEB' },
                      { v: 'interna', l: '📙 Avaliações internas' },
                      { v: 'empresa', l: '📕 Empresa contratada' },
                      { v: 'olimpiadas', l: '🏅 Olimpíadas (OBMEP, OBL, OBA...)' },
                    ].map(item => (
                      <label key={item.v} className="flex items-center gap-3 cursor-pointer p-2 bg-white rounded-lg">
                        <input
                          type="checkbox"
                          checked={form.avaliacoes_participa.includes(item.v)}
                          onChange={() => toggleArrayItem('avaliacoes_participa', item.v)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{item.l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resultados e descritores com baixo desempenho</label>
                  <p className="text-xs text-gray-500 mb-1">
                    Ex: "SAEPI 5º ano LP — proficiência média 210, descritores D01 e D03 com baixo desempenho. IDEB anos iniciais 4,5."
                  </p>
                  <textarea
                    value={form.avaliacoes_resultados}
                    onChange={(e) => update('avaliacoes_resultados', e.target.value)}
                    rows="3"
                    placeholder="Descreva os resultados e descritores frágeis..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de análise dos dados com a equipe</label>
                  <select
                    value={form.frequencia_analise}
                    onChange={(e) => update('frequencia_analise', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="nunca">Nunca</option>
                    <option value="anual">Anual</option>
                    <option value="semestral">Semestral</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Intervenções anteriores com base nos dados</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { v: 'formacao', l: '🎓 Formação de professores' },
                      { v: 'reagrupamento', l: '👥 Reagrupamento de alunos' },
                      { v: 'material', l: '📚 Material didático específico' },
                      { v: 'auloes', l: '📝 Aulões de reforço' },
                    ].map(item => (
                      <label key={item.v} className="flex items-center gap-3 cursor-pointer p-2 bg-white rounded-lg">
                        <input
                          type="checkbox"
                          checked={form.intervencoes_anteriores.includes(item.v)}
                          onChange={() => toggleArrayItem('intervencoes_anteriores', item.v)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{item.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isCoordenador && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_special_needs}
                    onChange={(e) => update('has_special_needs', e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-blue-900">
                      Há alunos com laudo ou que precisam de atenção especial?
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Ex: autismo, TDAH, dislexia, altas habilidades, dificuldades de leitura.
                      A IA integrará adaptações concretas. <strong>Não fazemos diagnóstico.</strong>
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 5 — RELATO GUIADO */}
        {/* ============================================================ */}
        {step === 5 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isFluxoC ? 'Descreva sua ideia' : 'Conte a sua prática'}
            </h2>
            <p className="text-gray-600 mb-6">Responda as perguntas abaixo com o máximo de detalhes.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título provisório *</label>
              <p className="text-xs text-gray-500 mb-1">Dê um nome provisório para a sua prática. A IA vai sugerir um título final melhor.</p>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Ex: Viajante da Leitura"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {isFluxoC && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    1. Qual é o objetivo principal? * <span className="text-xs text-gray-500">(mín. 30 caracteres)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-1">O que você quer alcançar? Seja específico.</p>
                  <textarea
                    value={form.goal}
                    onChange={(e) => update('goal', e.target.value)}
                    rows="3"
                    placeholder="Ex: Quero melhorar a compreensão leitora dos alunos do 5º ano..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.goal.length} caracteres</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    2. O que você imagina fazer? * <span className="text-xs text-gray-500">(mín. 30 caracteres)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Suas ideias iniciais, abordagens que gostaria de usar.</p>
                  <textarea
                    value={form.what_you_imagine}
                    onChange={(e) => update('what_you_imagine', e.target.value)}
                    rows="4"
                    placeholder="Ex: Pensei em usar leitura compartilhada, produção de cartazes, dramatizações..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.what_you_imagine.length} caracteres</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    3. O que você espera alcançar? * <span className="text-xs text-gray-500">(mín. 30 caracteres)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Resultados desejados.</p>
                  <textarea
                    value={form.what_you_expect}
                    onChange={(e) => update('what_you_expect', e.target.value)}
                    rows="3"
                    placeholder="Ex: Espero que os alunos melhorem a compreensão leitora..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.what_you_expect.length} caracteres</p>
                </div>
              </>
            )}

            {!isFluxoC && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    1. O que você fez? * <span className="text-xs text-gray-500">(mín. 30 caracteres)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Descreva a prática: o que fez, como fez, quais atividades realizou.</p>
                  <textarea
                    value={form.what_was_done}
                    onChange={(e) => update('what_was_done', e.target.value)}
                    rows="4"
                    placeholder="Descreva detalhadamente o que foi feito..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.what_was_done.length} caracteres</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    2. Como foi? * <span className="text-xs text-gray-500">(mín. 30 caracteres)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Como os alunos reagiram? O que funcionou? O que não funcionou?</p>
                  <textarea
                    value={form.how_it_went}
                    onChange={(e) => update('how_it_went', e.target.value)}
                    rows="4"
                    placeholder="Descreva como foi a execução, reações, desafios..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.how_it_went.length} caracteres</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    3. O que você percebeu? * <span className="text-xs text-gray-500">(mín. 30 caracteres)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Quais resultados você já observou? O que mudou na aprendizagem?</p>
                  <textarea
                    value={form.what_was_noticed}
                    onChange={(e) => update('what_was_noticed', e.target.value)}
                    rows="4"
                    placeholder="Descreva os resultados, mudanças, aprendizados..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.what_was_noticed.length} caracteres</p>
                </div>

                {form.sub_flow === 'documento' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      4. Contexto da escola <span className="text-xs text-gray-500">(opcional)</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-1">Conte sobre a escola e a comunidade.</p>
                    <textarea
                      value={form.school_context}
                      onChange={(e) => update('school_context', e.target.value)}
                      rows="3"
                      placeholder="Ex: 'A escola fica numa comunidade ribeirinha...'"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !podeAvancar()}
              className="mt-6 w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-teal-300 disabled:to-cyan-300 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg"
            >
              {loading ? 'Gerando prática (pode levar 1-2 minutos)...' : 'Gerar minha prática'}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* RESULTADO */}
        {/* ============================================================ */}
        {step === 6 && result && (
          <div>
            <div className="print:hidden flex flex-wrap gap-3 justify-between items-center mb-4">
              <button onClick={reiniciar} className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                ← Criar outra prática
              </button>
              <button
                onClick={handleBaixarPDF}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
              >
                📥 Baixar PDF
              </button>
            </div>
            <div id="pratica-conteudo">
              <PraticaResultado data={result} />
            </div>
      {/* Feedback (fora do PDF) */}
    <FeedbackCard
      content_type="pratica_exitosa"
      content_id={result.id}
      initialFeedback={result.structured_data?.feedback || null}
    />
          </div>
        )}
      </div>

      {step >= 1 && step <= 5 && (
        <div className="print:hidden mt-6 flex justify-between">
          <button
            onClick={voltar}
            disabled={step === 1}
            className="text-gray-600 hover:text-gray-800 disabled:opacity-40 text-sm font-medium"
          >
            ← Voltar
          </button>
          {step < 5 && (
            <button
              onClick={avancar}
              disabled={!podeAvancar()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Continuar →
            </button>
          )}
        </div>
      )}

      {error && step < 5 && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

// ============================================================
// RESULTADO
// ============================================================
const PraticaResultado = ({ data }) => {
  const sd = data.structured_data?.output || data.structured_data || {};
  const cab = sd.cabecalho || {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="border-b border-gray-100 pb-6 mb-6">
        <div className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          🏆 Prática Exitosa
        </div>
        <h2 className="text-3xl font-bold text-gray-900">{cab.titulo || data.title}</h2>
        {cab.subtitulo && <p className="text-lg text-gray-600 mt-2 italic">{cab.subtitulo}</p>}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          {cab.perfil && <span>👤 {cab.perfil}</span>}
          {cab.etapa_ensino && <span>🎓 {cab.etapa_ensino}</span>}
          {cab.categoria && <span>📂 {cab.categoria}</span>}
          {cab.escola && <span>🏫 {cab.escola}</span>}
          {cab.municipio && <span>📍 {cab.municipio}</span>}
          {cab.gre && <span>🗺️ {cab.gre}</span>}
          {cab.serie_ou_etapa && <span>📚 {cab.serie_ou_etapa}</span>}
          {cab.disciplina_ou_area && <span>✏️ {cab.disciplina_ou_area}</span>}
          {cab.duracao && <span>⏱️ {cab.duracao}</span>}
          {cab.num_alunos ? <span>👥 {cab.num_alunos} alunos</span> : null}
          {cab.num_professores ? <span>👥 {cab.num_professores} professores</span> : null}
        </div>
        {cab.bncc?.codigo && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
            <strong className="text-blue-900">📖 BNCC {cab.bncc.codigo}:</strong>{' '}
            <span className="text-blue-800">{cab.bncc.texto}</span>
          </div>
        )}
        {cab.tema_seminario && (
          <div className="mt-3 text-sm text-gray-700">
            <strong>Tema do seminário:</strong> {cab.tema_seminario}
          </div>
        )}
      </div>

      {sd.resumo_executivo && (
        <Section title="📌 Resumo Executivo">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{sd.resumo_executivo}</p>
        </Section>
      )}
      {sd.justificativa && (
        <Section title="💡 Justificativa">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{sd.justificativa}</p>
        </Section>
      )}

      {sd.conexao_avaliacoes && sd.conexao_avaliacoes.tipo_conexao && sd.conexao_avaliacoes.tipo_conexao !== 'nenhuma' && (
        <Section title="🎯 Conexão com Avaliações Externas">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-3">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Tipo de conexão: <span className="uppercase">{sd.conexao_avaliacoes.tipo_conexao}</span>
            </p>
            {sd.conexao_avaliacoes.como_contribui && (
              <p className="text-sm text-blue-800 mb-3">{sd.conexao_avaliacoes.como_contribui}</p>
            )}
            {sd.conexao_avaliacoes.avaliacoes_relacionadas?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">Avaliações relacionadas:</p>
                <p className="text-sm text-blue-800">{sd.conexao_avaliacoes.avaliacoes_relacionadas.join(', ')}</p>
              </div>
            )}
            {sd.conexao_avaliacoes.descritores_ou_habilidades?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">Descritores / Habilidades:</p>
                <ul className="space-y-1 ml-2">
                  {sd.conexao_avaliacoes.descritores_ou_habilidades.map((d, i) => (
                    <li key={i} className="text-sm text-blue-800">• {d}</li>
                  ))}
                </ul>
              </div>
            )}
            {sd.conexao_avaliacoes.meta_sugerida && (
              <div className="bg-white rounded p-2 text-sm">
                <strong className="text-blue-900">Meta sugerida:</strong> {sd.conexao_avaliacoes.meta_sugerida}
              </div>
            )}
          </div>
        </Section>
      )}

      {sd.objetivos && (
        <Section title="🎯 Objetivos">
          {sd.objetivos.geral && (
            <p className="text-gray-700 mb-3"><strong>Geral:</strong> {sd.objetivos.geral}</p>
          )}
          {sd.objetivos.especificos?.length > 0 && (
            <>
              <p className="font-medium text-gray-800 mb-2">Específicos:</p>
              <ul className="space-y-1.5 ml-4">
                {sd.objetivos.especificos.map((o, i) => (
                  <li key={i} className="text-gray-700 flex gap-2">
                    <span className="text-teal-600">•</span><span>{o}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}

      {sd.metodologia?.etapas?.length > 0 && (
        <Section title="⚙️ Metodologia">
          {sd.metodologia.descricao_geral && (
            <p className="text-gray-700 mb-4 whitespace-pre-line">{sd.metodologia.descricao_geral}</p>
          )}
          <div className="space-y-4">
            {sd.metodologia.etapas.map((etapa, i) => (
              <div key={i} className="border-l-4 border-teal-400 pl-4 py-2">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="font-semibold text-gray-800">{etapa.numero}. {etapa.titulo}</h4>
                  {etapa.duracao && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{etapa.duracao}</span>
                  )}
                </div>
                {etapa.descricao && <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{etapa.descricao}</p>}
                {etapa.acao_do_educador && (
                  <p className="text-sm text-gray-700 mb-1"><strong className="text-teal-700">Educador:</strong> {etapa.acao_do_educador}</p>
                )}
                {etapa.acao_dos_estudantes && (
                  <p className="text-sm text-gray-700 mb-1"><strong className="text-teal-700">Estudantes:</strong> {etapa.acao_dos_estudantes}</p>
                )}
                {etapa.recursos_necessarios?.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2"><strong>Recursos:</strong> {etapa.recursos_necessarios.join(', ')}</p>
                )}
                {etapa.como_avaliar && (
                  <p className="text-xs text-gray-600 mt-1"><strong>Avaliação:</strong> {etapa.como_avaliar}</p>
                )}
                {etapa.adequacoes_inclusivas && (
                  <p className="text-xs text-blue-700 bg-blue-50 rounded p-2 mt-2">
                    <strong>🧩 Inclusão:</strong> {etapa.adequacoes_inclusivas}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {sd.cronograma?.length > 0 && (
        <Section title="📅 Cronograma">
          <div className="space-y-3">
            {sd.cronograma.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-baseline mb-1">
                  <strong className="text-gray-800">{c.periodo}</strong>
                  <span className="text-xs text-gray-600">{c.foco}</span>
                </div>
                {c.atividades_principais?.length > 0 && (
                  <ul className="mt-2 space-y-1 ml-4">
                    {c.atividades_principais.map((a, j) => (
                      <li key={j} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-teal-600">•</span><span>{a}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {sd.plano_intervencao?.aplicavel && (
        <Section title="📋 Plano de Intervenção (Gestão Escolar)">
          {sd.plano_intervencao.foco && (
            <p className="text-gray-700 mb-3"><strong>Foco:</strong> {sd.plano_intervencao.foco}</p>
          )}
          {[
            ['acoes_com_professores', 'Ações com professores'],
            ['formacao_continuada', 'Formação continuada'],
            ['acompanhamento_pedagogico', 'Acompanhamento pedagógico'],
            ['uso_de_dados', 'Uso de dados'],
            ['engajamento_da_equipe', 'Engajamento da equipe'],
          ].map(([key, label]) => (
            sd.plano_intervencao[key]?.length > 0 && (
              <div key={key} className="mb-3">
                <p className="font-medium text-gray-800 mb-1">{label}:</p>
                <ul className="space-y-1 ml-4">
                  {sd.plano_intervencao[key].map((it, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-teal-600">•</span><span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </Section>
      )}

      {sd.adaptacoes_inclusivas?.length > 0 && (
        <Section title="🧩 Adaptações Inclusivas">
          <div className="space-y-3">
            {sd.adaptacoes_inclusivas.map((ad, i) => (
              <div key={i} className="border border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2">
                  <h4 className="font-semibold text-blue-900 text-sm">{ad.necessidade}</h4>
                </div>
                <ul className="p-4 space-y-1.5">
                  {ad.estrategias?.map((e, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-0.5">✓</span><span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {sd.avaliacao && (
        <Section title="📊 Avaliação">
          {[
            ['instrumentos', 'Instrumentos'],
            ['indicadores_de_sucesso', 'Indicadores de sucesso'],
            ['como_registrar_evidencias', 'Como registrar evidências'],
          ].map(([key, label]) => (
            sd.avaliacao[key]?.length > 0 && (
              <div key={key} className="mb-3">
                <p className="font-medium text-gray-800 mb-1">{label}:</p>
                <ul className="space-y-1 ml-4">
                  {sd.avaliacao[key].map((it, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-teal-600">•</span><span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </Section>
      )}

      {sd.culminancia && (sd.culminancia.descricao || sd.culminancia.sugestoes?.length > 0) && (
        <Section title="🎉 Culminância">
          {sd.culminancia.descricao && <p className="text-gray-700 mb-3 whitespace-pre-line">{sd.culminancia.descricao}</p>}
          {sd.culminancia.sugestoes?.length > 0 && (
            <ul className="space-y-1.5 ml-4 mb-3">
              {sd.culminancia.sugestoes.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-teal-600">•</span><span>{s}</span>
                </li>
              ))}
            </ul>
          )}
          {sd.culminancia.publico_esperado && (
            <p className="text-sm text-gray-600"><strong>Público esperado:</strong> {sd.culminancia.publico_esperado}</p>
          )}
        </Section>
      )}

      {sd.resultados_esperados?.length > 0 && (
        <Section title="🌟 Resultados Esperados">
          <ul className="space-y-1.5 ml-4">
            {sd.resultados_esperados.map((r, i) => (
              <li key={i} className="text-gray-700 flex gap-2">
                <span className="text-teal-600">•</span><span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {sd.replicabilidade && (sd.replicabilidade.descricao || sd.replicabilidade.adaptacoes_para_outras_escolas?.length > 0) && (
        <Section title="🔄 Replicabilidade">
          {sd.replicabilidade.descricao && <p className="text-gray-700 mb-3 whitespace-pre-line">{sd.replicabilidade.descricao}</p>}
          {sd.replicabilidade.adaptacoes_para_outras_escolas?.length > 0 && (
            <div className="mb-3">
              <p className="font-medium text-gray-800 mb-1">Adaptações para outras escolas:</p>
              <ul className="space-y-1 ml-4">
                {sd.replicabilidade.adaptacoes_para_outras_escolas.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-teal-600">•</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sd.replicabilidade.condicoes_minimas?.length > 0 && (
            <div>
              <p className="font-medium text-gray-800 mb-1">Condições mínimas:</p>
              <ul className="space-y-1 ml-4">
                {sd.replicabilidade.condicoes_minimas.map((c, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-teal-600">•</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {sd.evidencias_sugeridas?.length > 0 && (
        <Section title="📸 Evidências Sugeridas">
          <div className="space-y-3">
            {sd.evidencias_sugeridas.map((ev, i) => (
              <div key={i} className="border border-amber-100 rounded-lg p-4 bg-amber-50">
                <div className="flex justify-between items-baseline mb-1">
                  <strong className="text-amber-900 text-sm">{ev.tipo}</strong>
                  {ev.quando_registrar && <span className="text-xs text-amber-700">{ev.quando_registrar}</span>}
                </div>
                {ev.descricao && <p className="text-sm text-amber-900">{ev.descricao}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {sd.dicas_de_aprimoramento?.length > 0 && (
        <Section title="💬 Dicas de Aprimoramento">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <ul className="space-y-1.5">
              {sd.dicas_de_aprimoramento.map((d, i) => (
                <li key={i} className="text-sm text-amber-900 flex gap-2">
                  <span className="text-amber-600">→</span><span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {sd.referencias_regionais?.length > 0 && (
        <Section title="🗺️ Referências Regionais">
          <ul className="space-y-1.5 ml-4">
            {sd.referencias_regionais.map((r, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-teal-600">•</span><span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
};

const Section = ({ title, content, children }) => (
  <div className="mb-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    {content && <p className="text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>}
    {children}
  </div>
);

export default PraticasExitosas;