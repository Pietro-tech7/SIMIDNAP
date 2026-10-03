import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import FeedbackCard from '../components/FeedbackCard';

// ============================================================
// PALETA SIMIDNAPE (mesma dos demais motores)
// ============================================================
const AZUL          = '#2C5F7C';
const AZUL_CLARO    = '#E8F0F5';
const VERDE         = '#5FA68D';
const VERDE_CLARO   = '#EAF4F0';
const PESSEGO       = '#E8A87C';
const PESSEGO_CLARO = '#FDF1E7';
const CORAL         = '#E07856';
const OURO          = '#D4A843';
const OURO_CLARO    = '#FBF3E0';
const CREME         = '#FDFBF7';
const BRANCO        = '#FFFFFF';
const TEXTO         = '#2D2D2D';
const TEXTO_2       = '#6B6B6B';
const BORDA         = '#E5E0D8';

// ============================================================
// DEFINIÇÃO DAS CATEGORIAS POR ETAPA E PERFIL
// ============================================================
const CATEGORIAS = {
  EI: {
    professor: [{ v: 'educacao_infantil', l: '🧸 Educação Infantil' }],
    coordenador: [{ v: 'gestao_escolar', l: '🏫 Gestão Escolar' }],
  },
  EF: {
    professor: [
      { v: 'ciclo_alfabetizacao', l: '📖 Ciclo de Alfabetização (1º e 2º anos)' },
      { v: 'ensino_fundamental', l: '📘 Ensino Fundamental (3º ao 9º ano)' },
    ],
    coordenador: [{ v: 'gestao_escolar', l: '🏫 Gestão Escolar' }],
  },
  EM: {
    professor: [
      { v: 'linguagens', l: '📚 Linguagens e suas Tecnologias' },
      { v: 'matematica', l: '🔢 Matemática e suas Tecnologias' },
      { v: 'ciencias_natureza', l: '🔬 Ciências da Natureza e suas Tecnologias' },
      { v: 'ciencias_humanas', l: '🌍 Ciências Humanas e Sociais Aplicadas' },
    ],
    coordenador: [{ v: 'gestao_escolar', l: '🏫 Gestão Escolar' }],
  },
};

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

  const [componentes, setComponentes] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [codigoComponente, setCodigoComponente] = useState('');
  const [anoNumero, setAnoNumero] = useState('');
  const [loadingHabilidades, setLoadingHabilidades] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateResource = (key, value) => setForm(prev => ({ ...prev, resources: { ...prev.resources, [key]: value } }));

  const toggleArrayItem = (field, item) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };

  const mudarEtapa = (novaEtapa) => {
    setForm(prev => ({ ...prev, education_stage: novaEtapa, category: '', subject: '', grade: '', itinerario: '', bncc_codigo: '', bncc_texto: '' }));
    setCodigoComponente(''); setAnoNumero(''); setHabilidades([]);
  };

  const mudarCategoria = (novaCat) => {
    setForm(prev => ({ ...prev, category: novaCat, bncc_codigo: '', bncc_texto: '' }));
    setCodigoComponente(''); setAnoNumero(''); setHabilidades([]);
  };

  useEffect(() => {
    if (step === 3 && form.education_stage) {
      api.get(`/bncc/componentes?etapa=${form.education_stage}`).then(res => setComponentes(res.data)).catch(() => setComponentes([]));
    }
  }, [step, form.education_stage]);

  useEffect(() => {
    if (!codigoComponente || !form.education_stage) { setHabilidades([]); return; }
    if (form.education_stage === 'EF' && !anoNumero) { setHabilidades([]); return; }
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
    setForm(prev => ({ ...prev, bncc_codigo: codigo, bncc_texto: habilidade ? habilidade.texto : '' }));
  };

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
        return form.goal.trim().length >= 30 && form.what_you_imagine.trim().length >= 30 && form.what_you_expect.trim().length >= 30;
      }
      return form.what_was_done.trim().length >= 30 && form.how_it_went.trim().length >= 30 && form.what_was_noticed.trim().length >= 30;
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

  const handleSubmit = async () => {
    if (!podeAvancar()) return;
    setLoading(true); setError(''); setResult(null);

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
      if (err?.response?.status === 402) setError('Créditos insuficientes. Faça upgrade do seu plano para continuar.');
      else if (err?.response?.status === 400) setError(err?.response?.data?.detail || 'Verifique os dados e tente novamente.');
      else setError('Erro ao gerar a prática. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarPDF = async () => {
    try {
      const elemento = document.getElementById('pratica-conteudo');
      if (!elemento) { alert('Conteúdo não encontrado.'); return; }
      const nome = result?.title ? result.title.replace(/\s+/g, '_') : 'pratica_exitosa';

      const sd = result?.structured_data?.output || result?.structured_data || {};
      const cab = sd.cabecalho || {};

      const dadosCapa = [];
      if (cab.perfil) dadosCapa.push({ label: 'Perfil', valor: cab.perfil });
      if (cab.etapa_ensino) dadosCapa.push({ label: 'Etapa', valor: cab.etapa_ensino });
      if (cab.categoria) dadosCapa.push({ label: 'Categoria', valor: cab.categoria });
      if (cab.escola) dadosCapa.push({ label: 'Escola', valor: cab.escola });
      if (cab.municipio) dadosCapa.push({ label: 'Município', valor: cab.municipio });
      if (cab.serie_ou_etapa) dadosCapa.push({ label: 'Série/Etapa', valor: cab.serie_ou_etapa });
      if (cab.disciplina_ou_area) dadosCapa.push({ label: 'Componente', valor: cab.disciplina_ou_area });
      if (cab.bncc?.codigo) dadosCapa.push({ label: 'Habilidade BNCC', valor: cab.bncc.codigo });

      await gerarPDF(elemento, nome, {
        capa: {
          badge: 'Práticas Exitosas · Documentação Pedagógica',
          titulo: cab.titulo || result?.title,
          dados: dadosCapa,
        },
      });
      setPdfBaixado(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    }
  };

  const reiniciar = () => {
    setStep(1); setResult(null); setError('');
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
    setComponentes([]); setHabilidades([]); setCodigoComponente(''); setAnoNumero('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCoordenador = form.perfil === 'coordenador';
  const isFluxoC = form.flow_type === 'criar';
  const categoriasDisponiveis = form.education_stage ? CATEGORIAS[form.education_stage][form.perfil] || [] : [];

  const inputStyle = { borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO };
  const labelStyle = { color: TEXTO };
  const hintStyle  = { color: TEXTO_2 };

  const cardSelectStyle = (ativo) => ({
    borderColor: ativo ? AZUL : BORDA,
    backgroundColor: ativo ? AZUL_CLARO : BRANCO,
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="print:hidden">
        <Link to="/modulo/praticas_exitosas" className="text-sm hover:underline" style={{ color: AZUL }}>
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">🏆</span>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
              Práticas Exitosas
            </h1>
            <p style={hintStyle}>
              Crie, melhore ou documente práticas pedagógicas com foco em resultados.
            </p>
          </div>
        </div>

        {step <= 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs mb-2" style={hintStyle}>
              <span>Etapa {step} de 5</span>
              <span>{Math.round((step / 5) * 100)}%</span>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: CREME }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${(step / 5) * 100}%`, backgroundColor: AZUL }} />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 1 — PERFIL */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>Quem está usando?</h2>
            <p className="mb-6" style={hintStyle}>Escolha o perfil para que a IA adapte a prática ao seu papel.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => update('perfil', 'professor')}
                className="p-6 rounded-xl border-2 text-left transition"
                style={cardSelectStyle(form.perfil === 'professor')}
              >
                <div className="text-3xl mb-2">👩🏫</div>
                <div className="font-semibold text-lg" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>Professor(a)</div>
                <p className="text-sm mt-1" style={hintStyle}>Prática de sala de aula, com foco nos alunos.</p>
              </button>

              <button
                onClick={() => update('perfil', 'coordenador')}
                className="p-6 rounded-xl border-2 text-left transition"
                style={cardSelectStyle(form.perfil === 'coordenador')}
              >
                <div className="text-3xl mb-2">🧑💼</div>
                <div className="font-semibold text-lg" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>Coordenador(a)</div>
                <p className="text-sm mt-1" style={hintStyle}>Gestão escolar, formação de professores, uso de dados.</p>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 2 — FLUXO */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>Você já tem uma prática?</h2>
            <p className="mb-6" style={hintStyle}>Escolha o caminho que faz sentido para você.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => { update('flow_type', 'ja_tenho'); update('sub_flow', ''); }}
                className="p-6 rounded-xl border-2 text-left transition"
                style={cardSelectStyle(form.flow_type === 'ja_tenho')}
              >
                <div className="text-3xl mb-2">📚</div>
                <div className="font-semibold text-lg" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>Já tenho uma prática</div>
                <p className="text-sm mt-1" style={hintStyle}>Quero melhorar ou documentar uma prática que já realizei.</p>
              </button>

              <button
                onClick={() => { update('flow_type', 'criar'); update('sub_flow', ''); }}
                className="p-6 rounded-xl border-2 text-left transition"
                style={cardSelectStyle(form.flow_type === 'criar')}
              >
                <div className="text-3xl mb-2">✨</div>
                <div className="font-semibold text-lg" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>Quero criar do zero</div>
                <p className="text-sm mt-1" style={hintStyle}>Quero uma prática nova para executar.</p>
              </button>
            </div>

            {form.flow_type === 'ja_tenho' && (
              <div className="border-t pt-6" style={{ borderColor: BORDA }}>
                <h3 className="font-semibold mb-3" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>O que você quer fazer com essa prática?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => update('sub_flow', 'melhorar')}
                    className="p-4 rounded-lg border-2 text-left transition"
                    style={cardSelectStyle(form.sub_flow === 'melhorar')}
                  >
                    <div className="font-semibold" style={{ color: TEXTO }}>🔧 Modelar e melhorar</div>
                    <p className="text-xs mt-1" style={hintStyle}>A IA analisa e propõe melhorias concretas.</p>
                  </button>

                  <button
                    onClick={() => update('sub_flow', 'documento')}
                    className="p-4 rounded-lg border-2 text-left transition"
                    style={cardSelectStyle(form.sub_flow === 'documento')}
                  >
                    <div className="font-semibold" style={{ color: TEXTO }}>📄 Documento para seminário</div>
                    <p className="text-xs mt-1" style={hintStyle}>Organiza em formato para apresentar/premiar.</p>
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
          <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>Sobre a prática e o contexto</h2>
            <p className="mb-6" style={hintStyle}>Essas informações adaptam a prática à sua realidade.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={labelStyle}>Etapa de Ensino *</label>
              <p className="text-xs mb-3" style={hintStyle}>Escolha a etapa em que você atua. Isso define as categorias e os campos seguintes.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {!isCoordenador && (
                  <button onClick={() => mudarEtapa('EI')} className="p-4 rounded-lg border-2 text-center transition" style={cardSelectStyle(form.education_stage === 'EI')}>
                    <div className="text-2xl mb-1">🧒</div>
                    <div className="font-semibold text-sm" style={{ color: TEXTO }}>Educação Infantil</div>
                  </button>
                )}
                <button onClick={() => mudarEtapa('EF')} className="p-4 rounded-lg border-2 text-center transition" style={cardSelectStyle(form.education_stage === 'EF')}>
                  <div className="text-2xl mb-1">📘</div>
                  <div className="font-semibold text-sm" style={{ color: TEXTO }}>Ensino Fundamental</div>
                </button>
                <button onClick={() => mudarEtapa('EM')} className="p-4 rounded-lg border-2 text-center transition" style={cardSelectStyle(form.education_stage === 'EM')}>
                  <div className="text-2xl mb-1">🎓</div>
                  <div className="font-semibold text-sm" style={{ color: TEXTO }}>Ensino Médio</div>
                </button>
              </div>
            </div>

            {form.education_stage && categoriasDisponiveis.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={labelStyle}>Categoria *</label>
                <p className="text-xs mb-3" style={hintStyle}>
                  {form.education_stage === 'EM' ? 'Escolha a área do conhecimento ou atuação.' : 'Escolha a categoria da prática.'}
                </p>
                <div className={`grid grid-cols-1 ${categoriasDisponiveis.length > 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3`}>
                  {categoriasDisponiveis.map(cat => (
                    <button key={cat.v} onClick={() => mudarCategoria(cat.v)} className="p-4 rounded-lg border-2 text-left transition" style={cardSelectStyle(form.category === cat.v)}>
                      <div className="font-semibold text-sm" style={{ color: TEXTO }}>{cat.l}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.education_stage && form.category && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>Tema do Seminário ou Evento <span className="text-xs" style={hintStyle}>(opcional)</span></label>
                  <p className="text-xs mb-2" style={hintStyle}>Se você vai apresentar em um seminário, cole o tema para a IA alinhar a narrativa.</p>
                  <input type="text" value={form.seminar_theme} onChange={(e) => update('seminar_theme', e.target.value)} placeholder="Ex: 'Alfabetizar com equidade: boas práticas para ensinar a todos'" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Escola</label>
                    <input type="text" value={form.school} onChange={(e) => update('school', e.target.value)} placeholder="Nome da escola" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Município</label>
                    <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Cidade" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>GRE (Gerência Regional)</label>
                    <input type="text" value={form.gre} onChange={(e) => update('gre', e.target.value)} placeholder="Ex: 1ª GRE" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  </div>
                </div>

                {!isCoordenador && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={labelStyle}>
                          {form.education_stage === 'EI' ? 'Faixa Etária / Etapa' : 'Série / Ano'}
                        </label>
                        <p className="text-xs mb-1" style={hintStyle}>
                          {form.education_stage === 'EI' ? 'Ex: Berçário, Maternal, Pré-escola I, Pré-escola II' : form.education_stage === 'EM' ? 'Ex: 1ª série, 2ª série, 3ª série' : 'Ex: 3º ano, 5º ano, 9º ano'}
                        </p>
                        <input type="text" value={form.grade} onChange={(e) => update('grade', e.target.value)} placeholder={form.education_stage === 'EI' ? 'Ex: Pré-escola II' : form.education_stage === 'EM' ? 'Ex: 2ª série' : 'Ex: 5º ano'} className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={labelStyle}>
                          {form.education_stage === 'EM' ? 'Componente / Área específica' : 'Disciplina / Área'}
                        </label>
                        <p className="text-xs mb-1" style={hintStyle}>
                          {form.education_stage === 'EM' ? 'Ex: Língua Portuguesa, História, Biologia' : 'Ex: Matemática, História, Linguagens'}
                        </p>
                        <input type="text" value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder={form.education_stage === 'EM' ? 'Ex: Biologia' : 'Ex: Matemática'} className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={labelStyle}>Nº de alunos</label>
                        <input type="number" value={form.num_alunos} onChange={(e) => update('num_alunos', e.target.value)} placeholder="Ex: 25" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                      </div>

                      {form.education_stage === 'EM' && (
                        <div>
                          <label className="block text-sm font-medium mb-1" style={labelStyle}>Itinerário Formativo <span className="text-xs" style={hintStyle}>(opcional)</span></label>
                          <select value={form.itinerario} onChange={(e) => update('itinerario', e.target.value)} className="w-full rounded-lg px-4 py-2 border" style={inputStyle}>
                            <option value="">Selecione...</option>
                            {ITINERARIOS_EM.map(it => <option key={it} value={it}>{it}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-1" style={labelStyle}>Perfil da turma</label>
                      <p className="text-xs mb-1" style={hintStyle}>
                        {form.education_stage === 'EI' ? 'Descreva o desenvolvimento das crianças, rotina, interesses. Ex: "Crianças curiosas, mas com rotina agitada."' : form.education_stage === 'EM' ? 'Descreva os interesses dos jovens, aspirações, desafios de engajamento. Ex: "Turma com boa participação oral, mas pouco engajada em tarefas longas."' : 'Descreva a turma: nível de leitura, participação, dificuldades. Ex: "Turma agitada, mas participativa."'}
                      </p>
                      <textarea value={form.class_profile} onChange={(e) => update('class_profile', e.target.value)} rows="2" placeholder={form.education_stage === 'EI' ? 'Ex: Crianças curiosas e ativas, com boa socialização.' : form.education_stage === 'EM' ? 'Ex: Turma participativa, com interesse em projetos práticos.' : 'Ex: Turma agitada, mas participativa.'} className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                    </div>
                  </>
                )}

                {isCoordenador && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2" style={labelStyle}>Eixo de atuação *</label>
                      <p className="text-xs mb-2" style={hintStyle}>Qual eixo da gestão escolar essa prática vai trabalhar?</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          { v: 'formacao_continuada', l: '🎓 Formação continuada de professores' },
                          { v: 'acompanhamento_pedagogico', l: '🔍 Acompanhamento pedagógico' },
                          { v: 'uso_de_dados', l: '📊 Uso de dados (SAEPI, IDEB, internas)' },
                          { v: 'engajamento_equipe', l: '🤝 Engajamento da equipe / clima escolar' },
                          { v: 'relacao_escola_familia', l: '👨‍👩‍👧 Relação escola-família' },
                          { v: 'conselho_classe', l: '📋 Conselho de classe / articulação' },
                        ].map(item => (
                          <button key={item.v} onClick={() => update('eixo_atuacao', item.v)} className="p-3 rounded-lg border-2 text-left text-sm transition" style={cardSelectStyle(form.eixo_atuacao === item.v)}>
                            <span style={{ color: TEXTO }}>{item.l}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={labelStyle}>Nº de professores envolvidos</label>
                        <input type="number" value={form.num_professores} onChange={(e) => update('num_professores', e.target.value)} placeholder="Ex: 12" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={labelStyle}>Séries / Etapas impactadas</label>
                        <input type="text" value={form.series_impactadas} onChange={(e) => update('series_impactadas', e.target.value)} placeholder="Ex: Anos iniciais e finais" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-1" style={labelStyle}>Perfil da equipe docente</label>
                      <p className="text-xs mb-1" style={hintStyle}>Descreva a equipe: experiência, abertura a mudanças, desafios.</p>
                      <textarea value={form.perfil_equipe} onChange={(e) => update('perfil_equipe', e.target.value)} rows="2" placeholder="Ex: Equipe jovem, aberta a inovações, mas com pouca formação." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                    </div>
                  </>
                )}

                <div className="border-t pt-6" style={{ borderColor: BORDA }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>
                    📖 {form.education_stage === 'EI' ? 'Campos de Experiência' : form.education_stage === 'EM' ? 'Competências da Área' : 'Habilidade BNCC'}
                    <span className="text-xs ml-2" style={hintStyle}>(opcional, mas recomendada)</span>
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Código BNCC (digite se souber)</label>
                    <div className="flex gap-2">
                      <input type="text" value={form.bncc_codigo} onChange={(e) => setForm({ ...form, bncc_codigo: e.target.value.toUpperCase(), bncc_texto: '' })} placeholder="EF05MA03" className="flex-1 rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!form.bncc_codigo) return;
                          try {
                            const res = await api.get(`/bncc/habilidades/${form.bncc_codigo}`);
                            if (res.data?.texto) setForm(f => ({ ...f, bncc_texto: res.data.texto }));
                            else setForm(f => ({ ...f, bncc_texto: 'Código não encontrado.' }));
                          } catch {
                            setForm(f => ({ ...f, bncc_texto: 'Código não encontrado.' }));
                          }
                        }}
                        className="text-sm font-medium px-4 py-2 rounded-lg border"
                        style={{ backgroundColor: BRANCO, color: TEXTO, borderColor: BORDA }}
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={labelStyle}>
                        {form.education_stage === 'EI' ? 'Campo' : form.education_stage === 'EM' ? 'Área' : 'Componente'}
                      </label>
                      <select value={codigoComponente} onChange={(e) => setCodigoComponente(e.target.value)} className="w-full rounded-lg px-4 py-2 border" style={inputStyle}>
                        <option value="">Selecione...</option>
                        {componentes.map(c => <option key={c.codigo} value={c.codigo}>{c.nome}</option>)}
                      </select>
                    </div>
                    {form.education_stage === 'EF' && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={labelStyle}>Ano (1 a 9)</label>
                        <input type="number" min="1" max="9" value={anoNumero} onChange={(e) => setAnoNumero(e.target.value)} className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
                      </div>
                    )}
                    <div className={form.education_stage === 'EF' ? '' : 'md:col-span-2'}>
                      <label className="block text-sm font-medium mb-1" style={labelStyle}>
                        {form.education_stage === 'EI' ? 'Objetivo' : form.education_stage === 'EM' ? 'Competência' : 'Habilidade'}
                      </label>
                      <select value={form.bncc_codigo} onChange={handleSelecionarHabilidade} disabled={!habilidades.length} className="w-full rounded-lg px-4 py-2 border disabled:opacity-60" style={inputStyle}>
                        <option value="">{loadingHabilidades ? 'Carregando...' : habilidades.length === 0 ? 'Selecione componente/área' : 'Selecione...'}</option>
                        {habilidades.map(h => <option key={h.codigo} value={h.codigo}>{h.codigo} — {h.texto?.substring(0, 60)}...</option>)}
                      </select>
                    </div>
                  </div>

                  {form.bncc_texto && (
                    <p className="mt-3 text-xs rounded p-2 border" style={{ color: TEXTO_2, backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
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
          <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>Particularidades</h2>
            <p className="mb-6" style={hintStyle}>Detalhes que fazem toda a diferença na qualidade da prática.</p>

            {form.flow_type === 'ja_tenho' && (
              <div className="rounded-lg p-4 mb-6 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.original_grade !== '' || form.target_grade !== ''}
                    onChange={(e) => {
                      if (!e.target.checked) { update('original_grade', ''); update('target_grade', ''); }
                      else { update('original_grade', form.grade || ''); }
                    }}
                    className="mt-0.5 w-5 h-5 rounded"
                    style={{ accentColor: AZUL }}
                  />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: OURO }}>Vou aplicar esta prática em uma turma/série diferente</div>
                    <p className="text-xs mt-1" style={hintStyle}>Ex: a prática foi feita para o 2º ano, mas este ano vou aplicar no 5º ano.</p>
                  </div>
                </label>

                {(form.original_grade !== '' || form.target_grade !== '') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: OURO }}>Original</label>
                      <input type="text" value={form.original_grade} onChange={(e) => update('original_grade', e.target.value)} placeholder="Ex: 2º ano" className="w-full rounded-lg px-3 py-2 text-sm border" style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: OURO }}>Novo alvo</label>
                      <input type="text" value={form.target_grade} onChange={(e) => update('target_grade', e.target.value)} placeholder="Ex: 5º ano" className="w-full rounded-lg px-3 py-2 text-sm border" style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.flow_type === 'criar' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Duração desejada</label>
                <p className="text-xs mb-1" style={hintStyle}>Quanto tempo a prática vai durar?</p>
                <select value={form.duration} onChange={(e) => update('duration', e.target.value)} className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle}>
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
                <label className="block text-sm font-medium mb-1" style={labelStyle}>O que você já tentou e não funcionou?</label>
                <p className="text-xs mb-1" style={hintStyle}>Isso evita que a IA sugira o que já falhou.</p>
                <textarea value={form.already_tried} onChange={(e) => update('already_tried', e.target.value)} rows="3" placeholder="Ex: 'Tentei dividir em grupos, mas os alunos ficaram dispersos'" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
              </div>
            )}

            <div className="border-t pt-6 mb-6" style={{ borderColor: BORDA }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>🛠️ Recursos disponíveis na escola</h3>
              <p className="text-xs mb-3" style={hintStyle}>A IA só vai sugerir atividades que usem o que você tem.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { k: 'internet', l: '🌐 Internet' },
                  { k: 'projetor', l: '📽️ Projetor / TV' },
                  { k: 'impressora', l: '🖨️ Impressora' },
                  { k: 'espaco_externo', l: '🌳 Espaço externo (pátio, quadra)' },
                  { k: 'laboratorio', l: '🔬 Laboratório (informática, ciências)' },
                ].map(item => (
                  <label key={item.k} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg" style={{ backgroundColor: CREME }}>
                    <input type="checkbox" checked={form.resources[item.k]} onChange={(e) => updateResource(item.k, e.target.checked)} className="w-5 h-5 rounded" style={{ accentColor: AZUL }} />
                    <span className="text-sm" style={{ color: TEXTO }}>{item.l}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium mb-1" style={labelStyle}>Outros materiais de consumo <span style={hintStyle}>(opcional)</span></label>
                <input type="text" value={form.resources_extra} onChange={(e) => update('resources_extra', e.target.value)} placeholder="Ex: papel, cartolina, cola, tintas, sucata..." className="w-full rounded-lg px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition" style={inputStyle} />
              </div>
            </div>

            {form.flow_type === 'ja_tenho' && (
              <div className="border-t pt-6 mb-6" style={{ borderColor: BORDA }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>📋 Evidências e resultados</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Resultados já observados <span className="text-xs" style={hintStyle}>(opcional)</span></label>
                    <p className="text-xs mb-1" style={hintStyle}>O que mudou nos alunos? Se tiver dados do SAEPI ou avaliações, mencione.</p>
                    <textarea value={form.observed_results} onChange={(e) => update('observed_results', e.target.value)} rows="2" placeholder="Ex: 'Os alunos melhoraram a participação oral', 'Ainda não medi formalmente'..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Evidências disponíveis <span className="text-xs" style={hintStyle}>(opcional)</span></label>
                    <p className="text-xs mb-1" style={hintStyle}>Fotos, produções dos alunos, depoimentos, gráficos de desempenho...</p>
                    <textarea value={form.evidences} onChange={(e) => update('evidences', e.target.value)} rows="2" placeholder="Ex: 'Tenho fotos', 'Tenho produções dos alunos'..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  </div>
                </div>
              </div>
            )}

            {form.sub_flow === 'documento' && (
              <div className="border-t pt-6 mb-6" style={{ borderColor: BORDA }}>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Culminância realizada ou desejada <span className="text-xs" style={hintStyle}>(opcional)</span></label>
                <p className="text-xs mb-1" style={hintStyle}>Como a prática foi (ou será) socializada? Mostra, apresentação, exposição...</p>
                <textarea value={form.culminancia} onChange={(e) => update('culminancia', e.target.value)} rows="2" placeholder="Ex: 'Mostra cultural para as famílias', 'Exposição dos trabalhos'..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
              </div>
            )}

            {(form.sub_flow === 'documento' || form.flow_type === 'criar') && (
              <div className="border-t pt-6 mb-6" style={{ borderColor: BORDA }}>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Potencial de Replicabilidade <span className="text-xs" style={hintStyle}>(opcional)</span></label>
                <p className="text-xs mb-1" style={hintStyle}>Como essa prática pode ser adaptada para outras escolas/realidades? Critério valorizado pelo PPAIC.</p>
                <textarea value={form.replicability} onChange={(e) => update('replicability', e.target.value)} rows="2" placeholder="Ex: 'Pode ser adaptada para outras escolas', 'Funciona com qualquer realidade'..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
              </div>
            )}

            {isCoordenador && (
              <div className="border-t pt-6 mb-6 rounded-lg p-4" style={{ borderColor: BORDA, backgroundColor: AZUL_CLARO }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>📊 Dados de avaliações externas</h3>
                <p className="text-xs mb-4" style={hintStyle}>
                  Se você tem dados do SAEPI, IDEB, avaliações internas ou de empresa contratada, informe aqui. A IA vai direcionar a prática para atacar os descritores com baixo desempenho.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={labelStyle}>A escola participa de quais avaliações?</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { v: 'saepi', l: '📘 SAEPI' },
                      { v: 'saeb', l: '📗 SAEB / IDEB' },
                      { v: 'interna', l: '📙 Avaliações internas' },
                      { v: 'empresa', l: '📕 Empresa contratada' },
                      { v: 'olimpiadas', l: '🏅 Olimpíadas (OBMEP, OBL, OBA...)' },
                    ].map(item => (
                      <label key={item.v} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg" style={{ backgroundColor: BRANCO }}>
                        <input type="checkbox" checked={form.avaliacoes_participa.includes(item.v)} onChange={() => toggleArrayItem('avaliacoes_participa', item.v)} className="w-4 h-4 rounded" style={{ accentColor: AZUL }} />
                        <span className="text-sm" style={{ color: TEXTO }}>{item.l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>Resultados e descritores com baixo desempenho</label>
                  <p className="text-xs mb-1" style={hintStyle}>Ex: "SAEPI 5º ano LP — proficiência média 210, descritores D01 e D03 com baixo desempenho. IDEB anos iniciais 4,5."</p>
                  <textarea value={form.avaliacoes_resultados} onChange={(e) => update('avaliacoes_resultados', e.target.value)} rows="3" placeholder="Descreva os resultados e descritores frágeis..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>Frequência de análise dos dados com a equipe</label>
                  <select value={form.frequencia_analise} onChange={(e) => update('frequencia_analise', e.target.value)} className="w-full rounded-lg px-4 py-2 border" style={inputStyle}>
                    <option value="">Selecione...</option>
                    <option value="nunca">Nunca</option>
                    <option value="anual">Anual</option>
                    <option value="semestral">Semestral</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={labelStyle}>Intervenções anteriores com base nos dados</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { v: 'formacao', l: '🎓 Formação de professores' },
                      { v: 'reagrupamento', l: '👥 Reagrupamento de alunos' },
                      { v: 'material', l: '📚 Material didático específico' },
                      { v: 'auloes', l: '📝 Aulões de reforço' },
                    ].map(item => (
                      <label key={item.v} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg" style={{ backgroundColor: BRANCO }}>
                        <input type="checkbox" checked={form.intervencoes_anteriores.includes(item.v)} onChange={() => toggleArrayItem('intervencoes_anteriores', item.v)} className="w-4 h-4 rounded" style={{ accentColor: AZUL }} />
                        <span className="text-sm" style={{ color: TEXTO }}>{item.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isCoordenador && (
              <div className="rounded-lg p-4 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.has_special_needs} onChange={(e) => update('has_special_needs', e.target.checked)} className="mt-0.5 w-5 h-5 rounded" style={{ accentColor: AZUL }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: AZUL }}>Há alunos com laudo ou que precisam de atenção especial?</div>
                    <p className="text-xs mt-1" style={hintStyle}>
                      Ex: autismo, TDAH, dislexia, altas habilidades, dificuldades de leitura. A IA integrará adaptações concretas. <strong>Não fazemos diagnóstico.</strong>
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
          <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
              {isFluxoC ? 'Descreva sua ideia' : 'Conte a sua prática'}
            </h2>
            <p className="mb-6" style={hintStyle}>Responda as perguntas abaixo com o máximo de detalhes.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Título provisório *</label>
              <p className="text-xs mb-1" style={hintStyle}>Dê um nome provisório para a sua prática. A IA vai sugerir um título final melhor.</p>
              <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Ex: Viajante da Leitura" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
            </div>

            {isFluxoC && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>1. Qual é o objetivo principal? * <span className="text-xs" style={hintStyle}>(mín. 30 caracteres)</span></label>
                  <p className="text-xs mb-1" style={hintStyle}>O que você quer alcançar? Seja específico.</p>
                  <textarea value={form.goal} onChange={(e) => update('goal', e.target.value)} rows="3" placeholder="Ex: Quero melhorar a compreensão leitora dos alunos do 5º ano..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  <p className="text-xs mt-1" style={hintStyle}>{form.goal.length} caracteres</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>2. O que você imagina fazer? * <span className="text-xs" style={hintStyle}>(mín. 30 caracteres)</span></label>
                  <p className="text-xs mb-1" style={hintStyle}>Suas ideias iniciais, abordagens que gostaria de usar.</p>
                  <textarea value={form.what_you_imagine} onChange={(e) => update('what_you_imagine', e.target.value)} rows="4" placeholder="Ex: Pensei em usar leitura compartilhada, produção de cartazes, dramatizações..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  <p className="text-xs mt-1" style={hintStyle}>{form.what_you_imagine.length} caracteres</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>3. O que você espera alcançar? * <span className="text-xs" style={hintStyle}>(mín. 30 caracteres)</span></label>
                  <p className="text-xs mb-1" style={hintStyle}>Resultados desejados.</p>
                  <textarea value={form.what_you_expect} onChange={(e) => update('what_you_expect', e.target.value)} rows="3" placeholder="Ex: Espero que os alunos melhorem a compreensão leitora..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  <p className="text-xs mt-1" style={hintStyle}>{form.what_you_expect.length} caracteres</p>
                </div>
              </>
            )}

            {!isFluxoC && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>1. O que você fez? * <span className="text-xs" style={hintStyle}>(mín. 30 caracteres)</span></label>
                  <p className="text-xs mb-1" style={hintStyle}>Descreva a prática: o que fez, como fez, quais atividades realizou.</p>
                  <textarea value={form.what_was_done} onChange={(e) => update('what_was_done', e.target.value)} rows="4" placeholder="Descreva detalhadamente o que foi feito..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  <p className="text-xs mt-1" style={hintStyle}>{form.what_was_done.length} caracteres</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>2. Como foi? * <span className="text-xs" style={hintStyle}>(mín. 30 caracteres)</span></label>
                  <p className="text-xs mb-1" style={hintStyle}>Como os alunos reagiram? O que funcionou? O que não funcionou?</p>
                  <textarea value={form.how_it_went} onChange={(e) => update('how_it_went', e.target.value)} rows="4" placeholder="Descreva como foi a execução, reações, desafios..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  <p className="text-xs mt-1" style={hintStyle}>{form.how_it_went.length} caracteres</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>3. O que você percebeu? * <span className="text-xs" style={hintStyle}>(mín. 30 caracteres)</span></label>
                  <p className="text-xs mb-1" style={hintStyle}>Quais resultados você já observou? O que mudou na aprendizagem?</p>
                  <textarea value={form.what_was_noticed} onChange={(e) => update('what_was_noticed', e.target.value)} rows="4" placeholder="Descreva os resultados, mudanças, aprendizados..." className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  <p className="text-xs mt-1" style={hintStyle}>{form.what_was_noticed.length} caracteres</p>
                </div>

                {form.sub_flow === 'documento' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>4. Contexto da escola <span className="text-xs" style={hintStyle}>(opcional)</span></label>
                    <p className="text-xs mb-1" style={hintStyle}>Conte sobre a escola e a comunidade.</p>
                    <textarea value={form.school_context} onChange={(e) => update('school_context', e.target.value)} rows="3" placeholder="Ex: 'A escola fica numa comunidade ribeirinha...'" className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition" style={inputStyle} />
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mt-4 text-sm rounded-lg px-4 py-3 border" style={{ backgroundColor: PESSEGO_CLARO, borderColor: CORAL, color: CORAL }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !podeAvancar()}
              className="mt-6 w-full font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg text-white disabled:opacity-60"
              style={{ backgroundColor: AZUL }}
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
              <button onClick={reiniciar} className="text-sm font-medium hover:underline" style={{ color: AZUL }}>
                ← Criar outra prática
              </button>
              <button
                onClick={handleBaixarPDF}
                disabled={pdfBaixado && false}
                className="font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 text-white disabled:opacity-60"
                style={{ backgroundColor: AZUL }}
              >
                📥 Baixar PDF
              </button>
            </div>
            <div id="pratica-conteudo" style={{ backgroundColor: CREME, padding: '24px', borderRadius: '12px' }}>
              <PraticaResultado data={result} />
            </div>
            <div className="mt-6">
              <FeedbackCard
                content_type="pratica_exitosa"
                content_id={result.id}
                initialFeedback={result.structured_data?.feedback || null}
              />
            </div>
          </div>
        )}
      </div>

      {step >= 1 && step <= 5 && (
        <div className="print:hidden mt-6 flex justify-between">
          <button onClick={voltar} disabled={step === 1} className="text-sm font-medium disabled:opacity-40" style={{ color: TEXTO_2 }}>
            ← Voltar
          </button>
          {step < 5 && (
            <button
              onClick={avancar}
              disabled={!podeAvancar()}
              className="font-semibold px-6 py-2.5 rounded-lg transition text-white disabled:opacity-60"
              style={{ backgroundColor: AZUL }}
            >
              Continuar →
            </button>
          )}
        </div>
      )}

      {error && step < 5 && (
        <p className="mt-4 text-sm" style={{ color: CORAL }}>{error}</p>
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

  const cardStyle = { backgroundColor: BRANCO, borderColor: BORDA };
  const metaStyle = { color: TEXTO_2 };

  return (
    <div className="rounded-xl shadow-sm border p-6 md:p-8" style={cardStyle}>
      <div className="border-b pb-6 mb-6" style={{ borderColor: BORDA }}>
        <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3" style={{ backgroundColor: OURO_CLARO, color: OURO }}>
          🏆 Prática Exitosa
        </div>
        <h2 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Lora', serif" }}>
          {cab.titulo || data.title}
        </h2>
        {cab.subtitulo && <p className="text-lg mt-2 italic" style={metaStyle}>{cab.subtitulo}</p>}
        <div className="mt-4 flex flex-wrap gap-4 text-sm" style={metaStyle}>
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
          <div className="mt-3 rounded-lg p-3 text-sm border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
            <strong style={{ color: AZUL }}>📖 BNCC {cab.bncc.codigo}:</strong>{' '}
            <span style={{ color: TEXTO }}>{cab.bncc.texto}</span>
          </div>
        )}
        {cab.tema_seminario && (
          <div className="mt-3 text-sm" style={{ color: TEXTO }}>
            <strong>Tema do seminário:</strong> {cab.tema_seminario}
          </div>
        )}
      </div>

      {sd.resumo_executivo && (
        <Section title="📌 Resumo Executivo">
          <p className="leading-relaxed whitespace-pre-line" style={{ color: TEXTO }}>{sd.resumo_executivo}</p>
        </Section>
      )}
      {sd.justificativa && (
        <Section title="💡 Justificativa">
          <p className="leading-relaxed whitespace-pre-line" style={{ color: TEXTO }}>{sd.justificativa}</p>
        </Section>
      )}

      {sd.conexao_avaliacoes && sd.conexao_avaliacoes.tipo_conexao && sd.conexao_avaliacoes.tipo_conexao !== 'nenhuma' && (
        <Section title="🎯 Conexão com Avaliações Externas">
          <div className="rounded-lg p-4 mb-3 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
            <p className="text-sm font-semibold mb-2" style={{ color: AZUL }}>
              Tipo de conexão: <span className="uppercase">{sd.conexao_avaliacoes.tipo_conexao}</span>
            </p>
            {sd.conexao_avaliacoes.como_contribui && (
              <p className="text-sm mb-3" style={{ color: TEXTO }}>{sd.conexao_avaliacoes.como_contribui}</p>
            )}
            {sd.conexao_avaliacoes.avaliacoes_relacionadas?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-1" style={{ color: AZUL }}>Avaliações relacionadas:</p>
                <p className="text-sm" style={{ color: TEXTO }}>{sd.conexao_avaliacoes.avaliacoes_relacionadas.join(', ')}</p>
              </div>
            )}
            {sd.conexao_avaliacoes.descritores_ou_habilidades?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-1" style={{ color: AZUL }}>Descritores / Habilidades:</p>
                <ul className="space-y-1 ml-2">
                  {sd.conexao_avaliacoes.descritores_ou_habilidades.map((d, i) => (
                    <li key={i} className="text-sm" style={{ color: TEXTO }}>• {d}</li>
                  ))}
                </ul>
              </div>
            )}
            {sd.conexao_avaliacoes.meta_sugerida && (
              <div className="rounded p-2 text-sm" style={{ backgroundColor: BRANCO }}>
                <strong style={{ color: AZUL }}>Meta sugerida:</strong> <span style={{ color: TEXTO }}>{sd.conexao_avaliacoes.meta_sugerida}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {sd.objetivos && (
        <Section title="🎯 Objetivos">
          {sd.objetivos.geral && (
            <p className="mb-3" style={{ color: TEXTO }}><strong>Geral:</strong> {sd.objetivos.geral}</p>
          )}
          {sd.objetivos.especificos?.length > 0 && (
            <>
              <p className="font-medium mb-2" style={{ color: TEXTO }}>Específicos:</p>
              <ul className="space-y-1.5 ml-4">
                {sd.objetivos.especificos.map((o, i) => (
                  <li key={i} className="flex gap-2" style={{ color: TEXTO }}>
                    <span style={{ color: AZUL }}>•</span><span>{o}</span>
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
            <p className="mb-4 whitespace-pre-line" style={{ color: TEXTO }}>{sd.metodologia.descricao_geral}</p>
          )}
          <div className="space-y-4">
            {sd.metodologia.etapas.map((etapa, i) => (
              <div key={i} className="pl-4 py-2" style={{ borderLeft: `4px solid ${PESSEGO}` }}>
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="font-semibold" style={{ color: TEXTO }}>{etapa.numero}. {etapa.titulo}</h4>
                  {etapa.duracao && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: CREME, color: TEXTO_2 }}>{etapa.duracao}</span>
                  )}
                </div>
                {etapa.descricao && <p className="text-sm mb-2 whitespace-pre-line" style={{ color: TEXTO }}>{etapa.descricao}</p>}
                {etapa.acao_do_educador && (
                  <p className="text-sm mb-1" style={{ color: TEXTO }}><strong style={{ color: AZUL }}>Educador:</strong> {etapa.acao_do_educador}</p>
                )}
                {etapa.acao_dos_estudantes && (
                  <p className="text-sm mb-1" style={{ color: TEXTO }}><strong style={{ color: AZUL }}>Estudantes:</strong> {etapa.acao_dos_estudantes}</p>
                )}
                {etapa.recursos_necessarios?.length > 0 && (
                  <p className="text-xs mt-2" style={metaStyle}><strong>Recursos:</strong> {etapa.recursos_necessarios.join(', ')}</p>
                )}
                {etapa.como_avaliar && (
                  <p className="text-xs mt-1" style={metaStyle}><strong>Avaliação:</strong> {etapa.como_avaliar}</p>
                )}
                {etapa.adequacoes_inclusivas && (
                  <p className="text-xs rounded p-2 mt-2" style={{ color: AZUL, backgroundColor: AZUL_CLARO }}>
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
              <div key={i} className="rounded-lg p-4" style={{ backgroundColor: CREME }}>
                <div className="flex justify-between items-baseline mb-1">
                  <strong style={{ color: TEXTO }}>{c.periodo}</strong>
                  <span className="text-xs" style={metaStyle}>{c.foco}</span>
                </div>
                {c.atividades_principais?.length > 0 && (
                  <ul className="mt-2 space-y-1 ml-4">
                    {c.atividades_principais.map((a, j) => (
                      <li key={j} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                        <span style={{ color: AZUL }}>•</span><span>{a}</span>
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
            <p className="mb-3" style={{ color: TEXTO }}><strong>Foco:</strong> {sd.plano_intervencao.foco}</p>
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
                <p className="font-medium mb-1" style={{ color: TEXTO }}>{label}:</p>
                <ul className="space-y-1 ml-4">
                  {sd.plano_intervencao[key].map((it, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                      <span style={{ color: AZUL }}>•</span><span>{it}</span>
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
              <div key={i} className="rounded-lg overflow-hidden border" style={{ borderColor: BORDA }}>
                <div className="px-4 py-2" style={{ backgroundColor: AZUL_CLARO }}>
                  <h4 className="font-semibold text-sm" style={{ color: AZUL }}>{ad.necessidade}</h4>
                </div>
                <ul className="p-4 space-y-1.5">
                  {ad.estrategias?.map((e, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                      <span className="mt-0.5" style={{ color: AZUL }}>✓</span><span>{e}</span>
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
                <p className="font-medium mb-1" style={{ color: TEXTO }}>{label}:</p>
                <ul className="space-y-1 ml-4">
                  {sd.avaliacao[key].map((it, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                      <span style={{ color: AZUL }}>•</span><span>{it}</span>
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
          {sd.culminancia.descricao && <p className="mb-3 whitespace-pre-line" style={{ color: TEXTO }}>{sd.culminancia.descricao}</p>}
          {sd.culminancia.sugestoes?.length > 0 && (
            <ul className="space-y-1.5 ml-4 mb-3">
              {sd.culminancia.sugestoes.map((s, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                  <span style={{ color: AZUL }}>•</span><span>{s}</span>
                </li>
              ))}
            </ul>
          )}
          {sd.culminancia.publico_esperado && (
            <p className="text-sm" style={metaStyle}><strong>Público esperado:</strong> {sd.culminancia.publico_esperado}</p>
          )}
        </Section>
      )}

      {sd.resultados_esperados?.length > 0 && (
        <Section title="🌟 Resultados Esperados">
          <ul className="space-y-1.5 ml-4">
            {sd.resultados_esperados.map((r, i) => (
              <li key={i} className="flex gap-2" style={{ color: TEXTO }}>
                <span style={{ color: AZUL }}>•</span><span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {sd.replicabilidade && (sd.replicabilidade.descricao || sd.replicabilidade.adaptacoes_para_outras_escolas?.length > 0) && (
        <Section title="🔄 Replicabilidade">
          {sd.replicabilidade.descricao && <p className="mb-3 whitespace-pre-line" style={{ color: TEXTO }}>{sd.replicabilidade.descricao}</p>}
          {sd.replicabilidade.adaptacoes_para_outras_escolas?.length > 0 && (
            <div className="mb-3">
              <p className="font-medium mb-1" style={{ color: TEXTO }}>Adaptações para outras escolas:</p>
              <ul className="space-y-1 ml-4">
                {sd.replicabilidade.adaptacoes_para_outras_escolas.map((a, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                    <span style={{ color: AZUL }}>•</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sd.replicabilidade.condicoes_minimas?.length > 0 && (
            <div>
              <p className="font-medium mb-1" style={{ color: TEXTO }}>Condições mínimas:</p>
              <ul className="space-y-1 ml-4">
                {sd.replicabilidade.condicoes_minimas.map((c, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                    <span style={{ color: AZUL }}>•</span><span>{c}</span>
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
              <div key={i} className="rounded-lg p-4 border" style={{ borderColor: BORDA, backgroundColor: OURO_CLARO }}>
                <div className="flex justify-between items-baseline mb-1">
                  <strong className="text-sm" style={{ color: OURO }}>{ev.tipo}</strong>
                  {ev.quando_registrar && <span className="text-xs" style={{ color: OURO }}>{ev.quando_registrar}</span>}
                </div>
                {ev.descricao && <p className="text-sm" style={{ color: TEXTO }}>{ev.descricao}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {sd.dicas_de_aprimoramento?.length > 0 && (
        <Section title="💬 Dicas de Aprimoramento">
          <div className="rounded-lg p-4 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}>
            <ul className="space-y-1.5">
              {sd.dicas_de_aprimoramento.map((d, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                  <span style={{ color: OURO }}>→</span><span>{d}</span>
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
              <li key={i} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                <span style={{ color: AZUL }}>•</span><span>{r}</span>
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
    <h3 className="text-xl font-semibold mb-3" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>{title}</h3>
    {content && <p className="leading-relaxed whitespace-pre-line" style={{ color: TEXTO }}>{content}</p>}
    {children}
  </div>
);

export default PraticasExitosas;