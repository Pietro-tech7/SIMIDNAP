import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import LatexText from '../components/LatexText';
import EditorCabecalhoProva from '../components/EditorCabecalhoProva';
import { gerarProvaPDF, gerarGabaritoPDF } from '../utils/gerarPdfProva';

const STORAGE_KEY = 'simidnape_rascunho_prova_ia';

const ETAPAS = [
  { value: 'EF', label: 'Ensino Fundamental' },
  { value: 'EI', label: 'Educação Infantil' },
];

const REFERENCIAIS = [
  { value: 'bncc', label: 'BNCC' },
  { value: 'curriculo_piaui', label: 'Currículo do Piauí' },
  { value: 'saeb', label: 'SAEB' },
  { value: 'saepi', label: 'SAEPI' },
  { value: 'ppaic', label: 'PPAIC' },
];

const NIVEIS_BLOOM = ['Lembrar', 'Compreender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'];
const ANOS_EF = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Descritores agora são carregados dinamicamente do backend

const BATCH_SIZE = 4;

function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


const BancoQuestoesIA = () => {
  const { user } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [metaQuestoes, setMetaQuestoes] = useState(10);
  const [etapa, setEtapa] = useState('EF');
  const [ano, setAno] = useState(2);
  const [componente, setComponente] = useState('MA');
  const [referencial, setReferencial] = useState('bncc');
  const [incluirIlustracoes, setIncluirIlustracoes] = useState(true);
  const [dificuldadePadrao, setDificuldadePadrao] = useState('');
  const [cabecalho, setCabecalho] = useState(null);

  const [habilidades, setHabilidades] = useState([
    {
      unidade_tematica: '',
      objeto_conhecimento: '',
      codigo: '',
      texto: '',
      descritores: [],
      nivel_cognitivo: 'Aplicar',
      dificuldade: '',
      quantidade: 2,
      busca: '',
    },
  ]);

  const [componentes, setComponentes] = useState([]);
  const [habilidadesDisponiveis, setHabilidadesDisponiveis] = useState([]);
  const [unidadesTematicas, setUnidadesTematicas] = useState([]);
  const [objetosPorUnidade, setObjetosPorUnidade] = useState({});
  const [descritoresDinamicos, setDescritoresDinamicos] = useState([]);

  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [pool, setPool] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [minhasQuestoes, setMinhasQuestoes] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [jaGerou, setJaGerou] = useState(false);

  // ---------- PERSISTÊNCIA ----------
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);

  // Carrega rascunho na montagem (só uma vez)
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const d = JSON.parse(salvo);
        const temConteudo = (d.minhasQuestoes?.length > 0) || (d.pool?.length > 0) || (d.titulo?.trim()) || (d.habilidades?.some(h => h.codigo));

        if (temConteudo) {
          const continuar = window.confirm(
            `📋 Você tem uma prova em andamento:\n\n"${d.titulo || 'Sem título'}"\n\nDeseja continuar de onde parou?`
          );
          if (continuar) {
            if (d.titulo !== undefined) setTitulo(d.titulo);
            if (d.metaQuestoes !== undefined) setMetaQuestoes(d.metaQuestoes);
            if (d.etapa !== undefined) setEtapa(d.etapa);
            if (d.ano !== undefined) setAno(d.ano);
            if (d.componente !== undefined) setComponente(d.componente);
            if (d.referencial !== undefined) setReferencial(d.referencial);
            if (d.incluirIlustracoes !== undefined) setIncluirIlustracoes(d.incluirIlustracoes);
            if (d.dificuldadePadrao !== undefined) setDificuldadePadrao(d.dificuldadePadrao);
            if (d.habilidades !== undefined) setHabilidades(d.habilidades);
            if (d.pool !== undefined) setPool(d.pool);
            if (d.minhasQuestoes !== undefined) setMinhasQuestoes(d.minhasQuestoes);
            if (d.jaGerou !== undefined) setJaGerou(d.jaGerou);
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

  // Salva automaticamente a cada mudança
  useEffect(() => {
    if (!rascunhoCarregado) return;
    try {
      const dados = {
        titulo, metaQuestoes, etapa, ano, componente, referencial,
        incluirIlustracoes, dificuldadePadrao, habilidades,
        pool, minhasQuestoes, jaGerou,
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
    rascunhoCarregado, titulo, metaQuestoes, etapa, ano, componente, referencial,
    incluirIlustracoes, dificuldadePadrao, habilidades, pool, minhasQuestoes, jaGerou,
  ]);

  const descartarRascunho = () => {
    if (!window.confirm('Descartar o rascunho atual? Tudo será perdido.')) return;
    localStorage.removeItem(STORAGE_KEY);
    setTitulo('');
    setMetaQuestoes(10);
    setEtapa('EF');
    setAno(2);
    setComponente('MA');
    setReferencial('bncc');
    setIncluirIlustracoes(true);
    setDificuldadePadrao('');
    setHabilidades([{
      unidade_tematica: '',
      objeto_conhecimento: '',
      codigo: '',
      texto: '',
      descritores: [],
      nivel_cognitivo: 'Aplicar',
      dificuldade: '',
      quantidade: 2,
      busca: '',
    }]);
    setPool([]);
    setMinhasQuestoes([]);
    setSelecionadas([]);
    setJaGerou(false);
    setErro(''); setSucesso('');
  };

  // ---------- FIM PERSISTÊNCIA ----------

  useEffect(() => {
    api.get(`/bncc/componentes?etapa=${etapa}`)
      .then(res => setComponentes(res.data || []))
      .catch(() => setComponentes([]));
  }, [etapa]);

  // Carrega unidades temáticas quando componente/ano/etapa mudam
  useEffect(() => {
    if (!componente) { setUnidadesTematicas([]); return; }
    const params = { componente };
    if (etapa) params.etapa = etapa;
    if (etapa === 'EF' && ano) params.ano = ano;

    api.get('/bncc-estrutura/unidades-tematicas', { params })
      .then(res => setUnidadesTematicas(res.data?.unidades || []))
      .catch(() => setUnidadesTematicas([]));
  }, [componente, etapa, ano]);

    // Carrega habilidades quando componente/ano/etapa mudam
  useEffect(() => {
    if (!componente) { setHabilidadesDisponiveis([]); return; }
    const params = { componente };
    if (etapa) params.etapa = etapa;
    if (etapa === 'EF' && ano) params.ano = ano;

    api.get('/bncc-estrutura/habilidades', { params })
      .then(res => setHabilidadesDisponiveis(res.data?.habilidades || []))
      .catch(() => setHabilidadesDisponiveis([]));
  }, [etapa, ano, componente]);

  // Carrega descritores dinâmicos quando componente/ano mudam
  useEffect(() => {
    if (!componente) { setDescritoresDinamicos([]); return; }
    const params = { componente };
    if (etapa === 'EF' && ano) params.ano = ano;

    api.get('/bncc-estrutura/descritores', { params })
      .then(res => setDescritoresDinamicos(res.data?.descritores || []))
      .catch(() => setDescritoresDinamicos([]));
  }, [componente, etapa, ano]);

  const totalParaGerar = habilidades.reduce((s, h) => s + (Number(h.quantidade) || 0), 0);
  const custo = totalParaGerar <= 10 ? 1 : totalParaGerar <= 20 ? 2 : totalParaGerar <= 30 ? 3 : totalParaGerar <= 45 ? 4 : 5;

  const pctMeta = metaQuestoes > 0 ? Math.min(Math.round((minhasQuestoes.length / metaQuestoes) * 100), 100) : 0;
  const metaAtingida = metaQuestoes > 0 && minhasQuestoes.length >= metaQuestoes;
  const faltam = Math.max(0, metaQuestoes - minhasQuestoes.length);

  const filtrarHabilidades = (busca) => {
    if (!busca || !busca.trim()) return habilidadesDisponiveis;
    const termo = busca.toLowerCase().trim();
    return habilidadesDisponiveis.filter(h =>
      (h.codigo || '').toLowerCase().includes(termo) ||
      (h.texto || '').toLowerCase().includes(termo)
    );
  };

  const adicionarHabilidade = () => {
    setHabilidades(prev => [...prev, {
      unidade_tematica: '',
      objeto_conhecimento: '',
      codigo: '',
      texto: '',
      descritores: [],
      nivel_cognitivo: 'Aplicar',
      dificuldade: '',
      quantidade: 1,
      busca: '',
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

      // Quando escolhe unidade, carrega os objetos
      if (campo === 'unidade_tematica') {
        nova.objeto_conhecimento = '';
        nova.codigo = '';
        nova.texto = '';
        nova.complemento_pi = null;
        nova.descritores = [];
        carregarObjetos(valor);
      }

      // Quando escolhe objeto, limpa a habilidade
      if (campo === 'objeto_conhecimento') {
        nova.codigo = '';
        nova.texto = '';
        nova.complemento_pi = null;
        nova.descritores = [];
      }

      // Quando escolhe código, preenche o texto
      if (campo === 'codigo') {
        const hab = habilidadesDisponiveis.find(x => x.codigo === valor);
        if (hab) {
          nova.texto = hab.texto || '';
          nova.complemento_pi = (hab.complementos_pi && hab.complementos_pi[0]?.texto) || null;
        }
      }

      return nova;
    }));
  };

  const toggleDescritor = (index, descritor) => {
    setHabilidades(prev => prev.map((h, i) => {
      if (i !== index) return h;
      const lista = h.descritores || [];
      return {
        ...h,
        descritores: lista.includes(descritor) ? lista.filter(d => d !== descritor) : [...lista, descritor],
      };
    }));
  };

  // Carrega objetos de conhecimento de uma unidade (com cache por unidade)
  const carregarObjetos = async (unidade) => {
    if (!unidade) return;
    if (objetosPorUnidade[unidade]) return; // já está em cache

    try {
      const params = { componente, unidade_tematica: unidade };
      if (etapa) params.etapa = etapa;
      if (etapa === 'EF' && ano) params.ano = ano;

      const res = await api.get('/bncc-estrutura/objetos-conhecimento', { params });
      setObjetosPorUnidade(prev => ({ ...prev, [unidade]: res.data?.objetos || [] }));
    } catch {
      setObjetosPorUnidade(prev => ({ ...prev, [unidade]: [] }));
    }
  };

  const descritoresDisponiveis = () => {
    return descritoresDinamicos;
  };

  const gerarQuestoes = async () => {
    setErro(''); setSucesso('');
    if (!titulo.trim()) { setErro('Dê um título à prova.'); return; }
    if (!metaQuestoes || metaQuestoes < 1) { setErro('Defina a quantidade total da prova.'); return; }
    if (metaQuestoes > 60) { setErro('Máximo de 60 questões por prova.'); return; }
    for (let i = 0; i < habilidades.length; i++) {
      const h = habilidades[i];
      if (!h.codigo) { setErro(`Habilidade ${i + 1}: selecione um código.`); return; }
      if (!h.quantidade || h.quantidade < 1) { setErro(`Habilidade ${i + 1}: quantidade inválida.`); return; }
    }
    if (totalParaGerar < 1) { setErro('Adicione ao menos 1 questão.'); return; }

    setGerando(true);
    setProgresso({ atual: 0, total: totalParaGerar });

    const payload = {
      titulo: titulo.trim(),
      etapa,
      ano: etapa === 'EF' ? Number(ano) : null,
      componente,
      disciplina_nome: componentes.find(c => c.codigo === componente)?.nome || componente,
      referencial,
      estado: user?.estado || null,
      incluir_ilustracoes: incluirIlustracoes,
      compartilhar_curadoria: true,
      dificuldade_padrao: dificuldadePadrao || null,
      habilidades: habilidades.map(h => ({
        codigo: h.codigo,
        texto: h.texto,
        complemento_pi: h.complemento_pi || null,
        descritores: h.descritores || [],
        unidade_tematica: h.unidade_tematica || null,
        objeto_conhecimento: h.objeto_conhecimento || null,
        nivel_cognitivo: h.nivel_cognitivo,
        dificuldade: h.dificuldade || null,
        quantidade: Number(h.quantidade),
      })),
    };

    const acumuladas = [];

    try {
      let batchStart = 1;
      while (batchStart <= totalParaGerar) {
        const res = await api.post(`/question-ia/gerar?batch_start=${batchStart}`, payload);

        if (res.data?.sucesso && res.data?.questoes?.length > 0) {
          const novas = res.data.questoes.map((q, i) => ({
            ...q,
            _localId: `pool-${Date.now()}-${batchStart + i}`,
            ilustracao: { tipo: 'automatica', imagem: null },
          }));
          acumuladas.push(...novas);
          setProgresso({ atual: acumuladas.length, total: totalParaGerar });
          setPool(prev => [...prev, ...novas]);
        } else {
          throw new Error(res.data?.mensagem || 'A IA não retornou questões.');
        }

        batchStart += BATCH_SIZE;
      }

      setSucesso(`${acumuladas.length} questão(ões) gerada(s). Selecione as que deseja manter.`);
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (err) {
      if (err?.response?.status === 402) setErro('Créditos insuficientes. Faça upgrade do seu plano.');
      else setErro(err?.response?.data?.detail || err?.message || 'Erro ao gerar questões.');
    } finally {
      setGerando(false);
      setProgresso({ atual: 0, total: 0 });
    }
  };

  const togglePool = (localId) => {
    setSelecionadas(prev => prev.includes(localId) ? prev.filter(x => x !== localId) : [...prev, localId]);
  };

  const selecionarTodas = () => setSelecionadas(pool.map(q => q._localId));
  const limparSelecao = () => setSelecionadas([]);

  const adicionarSelecionadas = () => {
    if (selecionadas.length === 0) { alert('Selecione ao menos 1 questão.'); return; }
    const novas = pool.filter(q => selecionadas.includes(q._localId));
    if (minhasQuestoes.length + novas.length > metaQuestoes) {
      if (!window.confirm(`Adicionar ${novas.length} questão(ões)? Você terá mais que a meta de ${metaQuestoes}.`)) return;
    }
    setMinhasQuestoes(prev => [...prev, ...novas]);
    setPool(prev => prev.filter(q => !selecionadas.includes(q._localId)));
    setSelecionadas([]);
  };

  const descartarSelecionadas = () => {
    if (selecionadas.length === 0) { alert('Selecione ao menos 1 questão.'); return; }
    if (!window.confirm(`Descartar ${selecionadas.length} questão(ões)?`)) return;
    setPool(prev => prev.filter(q => !selecionadas.includes(q._localId)));
    setSelecionadas([]);
  };

  const descartarPool = () => {
    if (!window.confirm('Descartar TODAS as questões do pool?')) return;
    setPool([]);
    setSelecionadas([]);
  };

  const removerDaMinhas = (localId) => {
    setMinhasQuestoes(prev => prev.filter(q => q._localId !== localId));
  };

  const atualizarIlustracao = (localId, campo, valor) => {
    setMinhasQuestoes(prev => prev.map(q => {
      if (q._localId !== localId) return q;
      const ilust = { ...(q.ilustracao || { tipo: 'automatica', imagem: null }), [campo]: valor };
      return { ...q, ilustracao: ilust };
    }));
  };

  const uploadIlustracao = async (localId, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande. Máximo 2 MB.'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      alert('Formato inválido. Use PNG, JPG, WEBP ou SVG.'); return;
    }
    const b64 = await arquivoParaBase64(file);
    atualizarIlustracao(localId, 'imagem', b64);
  };

  const _prepararDados = () => ({
    titulo: titulo.trim(),
    cabecalho,
    questoes: minhasQuestoes,
  });

  const _salvarProvaNoBackend = async () => {
    try {
      const payloadProva = {
        titulo: titulo.trim(),
        modo: 'ia_gerada',
        etapa,
        ano: etapa === 'EF' ? Number(ano) : null,
        serie: null,
        componente,
        disciplina_nome: componentes.find(c => c.codigo === componente)?.nome || componente,
        cabecalho: cabecalho || null,
        questoes: minhasQuestoes.map((q, i) => ({
          ordem: i + 1,
          question_bank_id: null,
          snapshot: {
            enunciado: q.enunciado,
            alternativas: q.alternativas,
            gabarito: q.gabarito,
            explicacao_gabarito: q.explicacao_gabarito,
            habilidade_codigo: q.habilidade_codigo,
            habilidade_texto: q.habilidade_texto,
            descritor: q.descritor,
            descritor_texto: q.descritor_texto,
            nivel_cognitivo: q.nivel_cognitivo,
            dificuldade: q.dificuldade,
            imagem_url: q.ilustracao?.imagem || q.imagem_url || null,
          },
          icone_svg: q.ilustracao?.imagem || null,
        })),
        gabarito_incluido: true,
      };
      await api.post('/question-bank/exam-papers', payloadProva);
    } catch (e) {
      console.warn('Erro ao salvar prova no backend:', e);
    }
  };

  const _enviarCuradoria = async () => {
    try {
      const payload = {
        etapa,
        ano: etapa === 'EF' ? Number(ano) : null,
        serie: null,
        componente,
        disciplina_nome: componentes.find(c => c.codigo === componente)?.nome || componente,
        referencial,
        estado: user?.estado || null,
        questoes: minhasQuestoes.map(q => ({
          numero: q.numero,
          tipo: q.tipo,
          enunciado: q.enunciado,
          alternativas: q.alternativas,
          gabarito: q.gabarito,
          habilidade_codigo: q.habilidade_codigo,
          unidade_tematica: q.unidade_tematica,
          objeto_conhecimento: q.objeto_conhecimento,
          descritor: q.descritor,
          nivel_cognitivo: q.nivel_cognitivo,
          dificuldade: q.dificuldade || dificuldadePadrao || null,
          imagem_url: q.ilustracao?.imagem || q.imagem_url || null,
        })),
      };
      await api.post('/question-ia/enviar-curadoria', payload);
    } catch (e) {
      console.warn('Erro ao enviar curadoria:', e);
    }
  };

  const _finalizarComSucesso = (msg) => {
    setJaGerou(true);
    setSucesso(msg);
    // Limpa o rascunho após gerar com sucesso
    localStorage.removeItem(STORAGE_KEY);
  };

  const gerarSoProva = async () => {
    if (!metaAtingida) { alert(`Faltam ${faltam} questão(ões) para a meta.`); return; }
    setGerandoPdf(true); setErro(''); setSucesso('');
    try {
      await _salvarProvaNoBackend();
      await _enviarCuradoria();
      await gerarProvaPDF(_prepararDados());
      _finalizarComSucesso('✅ PDF da PROVA gerado! Verifique a pasta de Downloads.');
    } catch (err) {
      setErro(err?.message || 'Erro ao gerar PDF da prova.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const gerarSoGabarito = async () => {
    if (!metaAtingida) { alert(`Faltam ${faltam} questão(ões) para a meta.`); return; }
    setGerandoPdf(true); setErro(''); setSucesso('');
    try {
      await gerarGabaritoPDF(_prepararDados());
      _finalizarComSucesso('✅ PDF do GABARITO gerado! Verifique a pasta de Downloads.');
    } catch (err) {
      setErro(err?.message || 'Erro ao gerar PDF do gabarito.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const gerarAmbos = async () => {
    if (!metaAtingida) { alert(`Faltam ${faltam} questão(ões) para a meta.`); return; }
    setGerandoPdf(true); setErro(''); setSucesso('');

    const avisos = [];
    try {
      await _salvarProvaNoBackend();
      await _enviarCuradoria();

      try { await gerarGabaritoPDF(_prepararDados()); }
      catch (e) { avisos.push('Gabarito: ' + (e?.message || 'erro')); }

      await new Promise(r => setTimeout(r, 1800));

      try { await gerarProvaPDF(_prepararDados()); }
      catch (e) { avisos.push('Prova: ' + (e?.message || 'erro')); }

      if (avisos.length === 0) {
        _finalizarComSucesso('✅ PDFs gerados! Verifique a pasta de Downloads.');
      } else {
        setJaGerou(true);
        setErro('Alguns PDFs falharam: ' + avisos.join(' | ') + '. Use os botões individuais.');
      }
    } catch (err) {
      setErro(err?.message || 'Erro ao gerar PDFs.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const pctProgresso = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">← Voltar</Link>
        <button onClick={descartarRascunho}
          className="text-xs text-red-600 hover:text-red-800 font-medium">
          🗑️ Descartar rascunho atual
        </button>
      </div>

      <div className="mt-6 mb-8 flex items-center gap-3">
        <span className="text-4xl">✨</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões IA</h1>
          <p className="text-gray-600">Gere questões inéditas com IA — BNCC, Currículo do Piauí, SAEB e SAEPI.</p>
        </div>
      </div>

      {rascunhoSalvo && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-semibold z-50">
          💾 Rascunho salvo
        </div>
      )}

      {/* PASSO 1 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Passo 1 — Identificação da prova</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título da prova *</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Avaliação de Matemática — Maio/2026"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade total da prova *</label>
            <input type="number" min="1" max="60" value={metaQuestoes}
              onChange={(e) => setMetaQuestoes(Number(e.target.value) || 0)}
              className="w-full border-2 border-purple-300 rounded-lg px-3 py-2 text-sm font-semibold text-purple-700" />
            <p className="text-xs text-gray-500 mt-1">Quantas questões a prova terá no total?</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <select value={etapa} onChange={(e) => setEtapa(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {ETAPAS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          {etapa === 'EF' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ANOS_EF.map(a => <option key={a} value={a}>{a}º ano</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Componente</label>
            <select value={componente} onChange={(e) => setComponente(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecione...</option>
              {componentes.map(c => <option key={c.codigo} value={c.codigo}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencial</label>
            <select value={referencial} onChange={(e) => setReferencial(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {REFERENCIAIS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <EditorCabecalhoProva onChange={setCabecalho} professorNome={user?.full_name || ''} />

      {/* PASSO 2 — HABILIDADES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📚 Passo 2 — Habilidades e Descritores</h2>

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

              {/* 1. Unidade Temática */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  📖 Unidade Temática ({unidadesTematicas.length} disponíveis)
                </label>
                <select value={h.unidade_tematica || ''}
                  onChange={(e) => atualizarHabilidade(index, 'unidade_tematica', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Selecione a unidade temática...</option>
                  {unidadesTematicas.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* 2. Objeto de Conhecimento */}
              {h.unidade_tematica && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    🎯 Objeto de Conhecimento ({(objetosPorUnidade[h.unidade_tematica] || []).length} disponíveis)
                  </label>
                  <select value={h.objeto_conhecimento || ''}
                    onChange={(e) => atualizarHabilidade(index, 'objeto_conhecimento', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Selecione o objeto de conhecimento...</option>
                    {(objetosPorUnidade[h.unidade_tematica] || []).map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 3. Habilidade (só aparece após escolher objeto) */}
              {h.objeto_conhecimento && (() => {
                // Filtra habilidades deste objeto
                const doObjeto = habilidadesDisponiveis.filter(hab => {
                  const matchUnidade = !h.unidade_tematica || hab.unidade_tematica === h.unidade_tematica;
                  const matchObjeto = !h.objeto_conhecimento || hab.objeto_conhecimento === h.objeto_conhecimento;
                  return matchUnidade && matchObjeto;
                });

                // Filtro local pela busca (opcional)
                const termo = (h.busca || '').toLowerCase().trim();
                const comBusca = termo
                  ? doObjeto.filter(hab =>
                      (hab.codigo || '').toLowerCase().includes(termo) ||
                      (hab.texto || '').toLowerCase().includes(termo)
                    )
                  : doObjeto;

                return (
                  <>
                    {/* Campo de busca (opcional) */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        🔍 Buscar habilidade (opcional)
                      </label>
                      <input
                        type="text"
                        value={h.busca || ''}
                        onChange={(e) => atualizarHabilidade(index, 'busca', e.target.value)}
                        placeholder="Digite o código (EF02MA01) ou palavra-chave..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                      />

                      {/* Lista de sugestões (só quando digitar) */}
                      {termo && (
                        <div className="mt-1 max-h-48 overflow-y-auto border border-blue-200 rounded-lg bg-blue-50">
                          {comBusca.length === 0 ? (
                            <div className="p-3 text-xs text-gray-500 italic">
                              Nenhuma habilidade corresponde a "{h.busca}"
                            </div>
                          ) : (
                            comBusca.slice(0, 20).map(hab => (
                              <button
                                key={hab.codigo}
                                type="button"
                                onClick={() => {
                                  atualizarHabilidade(index, 'codigo', hab.codigo);
                                  atualizarHabilidade(index, 'busca', '');
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-100 border-b border-blue-100 last:border-0 transition"
                              >
                                <strong className="font-mono text-blue-700">{hab.codigo}</strong>
                                <span className="text-gray-700 ml-2">
                                  {(hab.texto || '').slice(0, 80)}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dropdown de habilidades (independente da busca) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          ✨ Habilidade * ({doObjeto.length} disponíveis)
                        </label>
                        <select
                          value={h.codigo}
                          onChange={(e) => atualizarHabilidade(index, 'codigo', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          <option value="">Clique aqui para escolher...</option>
                          {doObjeto.map(hab => (
                            <option key={hab.codigo} value={hab.codigo}>
                              {hab.codigo} — {(hab.texto || '').slice(0, 60)}
                            </option>
                          ))}
                        </select>
                        {doObjeto.length === 0 && (
                          <p className="text-xs text-amber-700 mt-1">
                            ⚠️ Nenhuma habilidade cadastrada para este objeto ainda.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade *</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={h.quantidade}
                          onChange={(e) => atualizarHabilidade(index, 'quantidade', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Info da habilidade escolhida */}
              {h.texto && (
                <div className="text-xs text-gray-600 bg-white rounded p-2 mb-3 border border-gray-100">
                  <strong>Texto:</strong> {h.texto}
                </div>
              )}
              {h.complemento_pi && (
                <div className="text-xs text-amber-800 bg-amber-50 rounded p-2 mb-3 border border-amber-100">
                  <strong>📌 Complemento Piauí:</strong> {h.complemento_pi}
                </div>
              )}

              {/* 4. Bloom + Dificuldade */}
              {h.codigo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nível cognitivo (Bloom)</label>
                    <select value={h.nivel_cognitivo}
                      onChange={(e) => atualizarHabilidade(index, 'nivel_cognitivo', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                      {NIVEIS_BLOOM.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dificuldade desta habilidade</label>
                    <select value={h.dificuldade || ''}
                      onChange={(e) => atualizarHabilidade(index, 'dificuldade', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                      <option value="">Usar padrão</option>
                      <option value="facil">🟢 Fácil</option>
                      <option value="media">🟡 Média</option>
                      <option value="dificil">🔴 Difícil</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 5. Descritores (só se a habilidade os tiver) */}
              {h.codigo && descritoresDisponiveis().length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    📊 Descritores SAEB/SAEPI ({h.descritores?.length || 0} selecionados)
                  </label>
                  <p className="text-[10px] text-gray-500 mb-2">
                    Clique nos descritores que deseja avaliar nesta questão.
                  </p>
                  <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                    {descritoresDisponiveis().map(d => {
                      const codigo = d.codigo || d;
                      const texto = d.texto || '';
                      const tema = d.tema || '';
                      const selecionado = h.descritores?.includes(codigo);

                      return (
                        <button
                          key={codigo}
                          type="button"
                          onClick={() => toggleDescritor(index, codigo)}
                          className={`w-full text-left px-3 py-2 rounded-lg border-2 transition ${
                            selecionado
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selecionado}
                              readOnly
                              className="mt-0.5 w-4 h-4 text-blue-600 rounded flex-shrink-0 pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap gap-1.5 items-center mb-1">
                                <span className="font-mono font-bold text-xs text-blue-700">
                                  {codigo}
                                </span>
                                {tema && (
                                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                    {tema}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 leading-snug">
                                {texto}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
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

      {/* PASSO 3 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🎨 Passo 3 — Opções</h2>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={incluirIlustracoes}
              onChange={(e) => setIncluirIlustracoes(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded" />
            Incluir sugestões de ilustrações nas questões
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dificuldade padrão (opcional)
            </label>
            <select value={dificuldadePadrao}
              onChange={(e) => setDificuldadePadrao(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white max-w-xs">
              <option value="">Não especificar</option>
              <option value="facil">🟢 Fácil</option>
              <option value="media">🟡 Média</option>
              <option value="dificil">🔴 Difícil</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              A IA vai gerar as questões nesse nível (quando não especificado por habilidade).
            </p>
          </div>
        </div>
      </div>

      {/* RESUMO E BOTÃO GERAR */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-200">Gerar mais questões</p>
            <p className="text-2xl font-bold">{totalParaGerar} questão(ões) neste lote</p>
            <p className="text-sm text-purple-100 mt-1">Custo: <strong>{custo} crédito(s)</strong></p>
          </div>
          <button onClick={gerarQuestoes} disabled={gerando || totalParaGerar < 1}
            className="bg-white text-purple-700 hover:bg-purple-50 disabled:bg-purple-300 disabled:text-white font-bold px-6 py-3 rounded-xl transition">
            {gerando ? `✨ Gerando... (${progresso.atual}/${progresso.total})` : '✨ Gerar Questões com IA'}
          </button>
        </div>

        {gerando && progresso.total > 0 && (
          <div className="mt-4">
            <div className="w-full bg-purple-900 bg-opacity-40 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-white transition-all duration-500" style={{ width: `${pctProgresso}%` }} />
            </div>
            <p className="text-xs text-purple-100 mt-1">
              {progresso.atual} de {progresso.total} questões ({pctProgresso}%)
            </p>
          </div>
        )}
      </div>

      {/* BARRA DE META + 3 BOTÕES */}
      {metaQuestoes > 0 && (
        <div className={`rounded-xl p-5 mb-6 ${metaAtingida ? 'bg-green-50 border-2 border-green-300' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${metaAtingida ? 'text-green-900' : 'text-blue-900'}`}>
              {metaAtingida ? '✅ Meta atingida!' : `📋 Progresso da prova`}
            </span>
            <span className={`text-lg font-bold ${metaAtingida ? 'text-green-700' : 'text-blue-700'}`}>
              {minhasQuestoes.length} / {metaQuestoes}
            </span>
          </div>
          <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-gray-200">
            <div className={`h-full transition-all duration-500 ${metaAtingida ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${pctMeta}%` }} />
          </div>
          <p className={`text-xs mt-2 ${metaAtingida ? 'text-green-800' : 'text-blue-800'}`}>
            {metaAtingida ? 'Você pode baixar os PDFs quantas vezes quiser.' : `Faltam ${faltam} questão(ões).`}
          </p>

          {jaGerou && (
            <div className="mt-2 text-xs bg-yellow-50 border border-yellow-300 text-yellow-900 rounded p-2">
              ℹ️ Os PDFs já foram gerados antes. Verifique a pasta de <strong>Downloads</strong>.
            </div>
          )}

          {metaAtingida && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <button onClick={gerarSoProva} disabled={gerandoPdf}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-lg transition">
                {gerandoPdf ? '⏳...' : '📄 Baixar Prova'}
              </button>
              <button onClick={gerarSoGabarito} disabled={gerandoPdf}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 rounded-lg transition">
                {gerandoPdf ? '⏳...' : '📋 Baixar Gabarito'}
              </button>
              <button onClick={gerarAmbos} disabled={gerandoPdf}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3 rounded-lg transition">
                {gerandoPdf ? '⏳ Gerando...' : '📥 Baixar Ambos'}
              </button>
            </div>
          )}
        </div>
      )}

      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">⚠️ {erro}</div>}
      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 text-sm">✅ {sucesso}</div>}

      {/* POOL */}
      {pool.length > 0 && (
        <div className="mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="font-bold text-amber-900">🎯 Pool de Questões ({pool.length})</h2>
              <p className="text-xs text-amber-800 mt-0.5">Selecione as que deseja manter em "Minhas Questões".</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={selecionarTodas} className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded">Selecionar todas</button>
              <button onClick={limparSelecao} className="text-xs bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium px-3 py-1.5 rounded">Limpar seleção</button>
              <button onClick={descartarPool} className="text-xs text-red-700 hover:text-red-900 font-medium px-3 py-1.5">🗑️ Descartar tudo</button>
            </div>
          </div>

          {selecionadas.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 flex flex-wrap justify-between items-center gap-3">
              <span className="text-sm text-teal-900 font-semibold">{selecionadas.length} selecionada(s)</span>
              <div className="flex gap-2">
                <button onClick={adicionarSelecionadas} className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-1.5 rounded">✅ Adicionar a Minhas Questões</button>
                <button onClick={descartarSelecionadas} className="text-xs bg-white hover:bg-red-50 text-red-700 border border-red-300 font-medium px-4 py-1.5 rounded">🗑️ Descartar selecionadas</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {pool.map((q) => (
              <div key={q._localId}
                className={`bg-white border-2 rounded-xl p-4 transition ${
                  selecionadas.includes(q._localId) ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                }`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selecionadas.includes(q._localId)}
                    onChange={() => togglePool(q._localId)}
                    className="mt-1 w-5 h-5 text-teal-600 rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {q.dificuldade && (
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          q.dificuldade === 'facil' ? 'bg-green-100 text-green-800' :
                          q.dificuldade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {q.dificuldade === 'facil' ? '🟢 Fácil' : q.dificuldade === 'media' ? '🟡 Média' : '🔴 Difícil'}
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-gray-800 mb-2"><LatexText text={q.enunciado} /></div>
                    <div className="space-y-0.5 mb-2">
                      {(q.alternativas || []).map((a, ai) => (
                        <div key={ai} className="text-xs text-gray-700"><strong>({a.letra})</strong> {a.texto}</div>
                      ))}
                    </div>
                    <div className="text-xs text-green-900 bg-green-50 rounded p-1.5">
                      <strong>Gabarito:</strong> {q.gabarito}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MINHAS QUESTÕES */}
      {minhasQuestoes.length > 0 && (
        <div className="mb-8">
          <div className="bg-teal-600 rounded-xl p-4 mb-4">
            <h2 className="font-bold text-white">✅ Minhas Questões ({minhasQuestoes.length})</h2>
            <p className="text-xs text-teal-100 mt-0.5">Configure a ilustração de cada questão.</p>
          </div>

          <div className="space-y-4">
            {minhasQuestoes.map((q, qi) => {
              const ilust = q.ilustracao || { tipo: 'automatica', imagem: null };
              return (
                <div key={q._localId} className="bg-white border-2 border-teal-500 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-semibold text-xs">
                      Questão {qi + 1}
                    </span>
                    <button onClick={() => removerDaMinhas(q._localId)}
                      className="text-xs text-red-600 hover:text-red-800">🗑️ Remover</button>
                  </div>

                  {q.dificuldade && (
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-semibold mb-2 ${
                      q.dificuldade === 'facil' ? 'bg-green-100 text-green-800' :
                      q.dificuldade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {q.dificuldade === 'facil' ? '🟢 Fácil' : q.dificuldade === 'media' ? '🟡 Média' : '🔴 Difícil'}
                    </span>
                  )}

                  <div className="text-sm text-gray-800 mb-3"><LatexText text={q.enunciado} /></div>

                  <div className="space-y-1 mb-3">
                    {(q.alternativas || []).map((a, ai) => (
                      <div key={ai} className="text-sm text-gray-700">
                        <strong className="text-purple-600">({a.letra})</strong> {a.texto}
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">🎨 Ilustração desta questão</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={`ilust-${q._localId}`} checked={ilust.tipo === 'nenhuma'}
                          onChange={() => atualizarIlustracao(q._localId, 'tipo', 'nenhuma')} />
                        🚫 Sem
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={`ilust-${q._localId}`} checked={ilust.tipo === 'automatica'}
                          onChange={() => atualizarIlustracao(q._localId, 'tipo', 'automatica')} />
                        ✨ Automática
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={`ilust-${q._localId}`} checked={ilust.tipo === 'personalizada'}
                          onChange={() => atualizarIlustracao(q._localId, 'tipo', 'personalizada')} />
                        ⬆️ Upload
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={`ilust-${q._localId}`} checked={ilust.tipo === 'espaco'}
                          onChange={() => atualizarIlustracao(q._localId, 'tipo', 'espaco')} />
                        📐 Espaço p/ colar
                      </label>
                    </div>

                    {ilust.tipo === 'automatica' && q.descricao_ilustracao && (
                      <p className="text-xs text-amber-700 mt-2">
                        💡 Sugestão da IA: {q.descricao_ilustracao}
                      </p>
                    )}

                    {ilust.tipo === 'personalizada' && (
                      <div className="mt-2">
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(e) => uploadIlustracao(q._localId, e.target.files?.[0])}
                          className="block w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium" />
                        {ilust.imagem && (
                          <div className="mt-2 flex items-center gap-2">
                            <img src={ilust.imagem} alt="Preview" className="max-h-20 border border-gray-300 rounded" />
                            <button onClick={() => atualizarIlustracao(q._localId, 'imagem', null)}
                              className="text-xs text-red-600">🗑️ Remover</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-green-900 bg-green-50 rounded p-2">
                    <strong>Gabarito:</strong> {q.gabarito}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BancoQuestoesIA;