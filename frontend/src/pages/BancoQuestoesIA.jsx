import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import LatexText from '../components/LatexText';
import EditorCabecalhoProva from '../components/EditorCabecalhoProva';
import { gerarProvaPDF, gerarGabaritoPDF } from '../utils/gerarPdfProva';
import { carregarSvgsDaCategoria } from '../utils/icones';
import { usePlan } from '../hooks/usePlan';
import { useSystemFlags } from '../hooks/useSystemFlags';

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

const BATCH_SIZE = 4;

function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Converte SVG data URL em PNG data URL.
// Motivo: o python-docx (Word) não suporta SVG e o html2canvas (PDF)
// fica instável com SVG embutido. PNG funciona nos dois.
// Se a imagem NÃO for SVG, devolve como veio (passa direto).
function converterSvgParaPng(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/svg+xml')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 400;
        const h = img.naturalHeight || img.height || 400;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Falha ao converter SVG para PNG:', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}


const BancoQuestoesIA = () => {
  const { user } = useAuth();
  const { temRecurso } = usePlan();
  const { gerarImagemIAAtiva, textoImagemIAIndisponivel } = useSystemFlags();

  // Bloco C.14 + Fase 6 — o Word é um recurso pago (plano Intermediário+).
  // Superuser tem acesso sempre (para testes).
  const podeBaixarWord = user?.is_superuser || temRecurso('export_word');

  const [titulo, setTitulo] = useState('');
  const [metaQuestoes, setMetaQuestoes] = useState(10);
  const [etapa, setEtapa] = useState('EF');
  const [ano, setAno] = useState(2);
  const [componente, setComponente] = useState('MA');
  const [referencial, setReferencial] = useState('bncc');
  const [referenciais, setReferenciais] = useState(['bncc']);
  const [incluirIlustracoes, setIncluirIlustracoes] = useState(true);
  const [dificuldadePadrao, setDificuldadePadrao] = useState('');
  const [cabecalho, setCabecalho] = useState(null);
  // Fase 4 — opções de apresentação do PDF
  const [mostrarTemaCondutor, setMostrarTemaCondutor] = useState(true);
  const [mostrarDescritor, setMostrarDescritor] = useState(false);

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
  const [gerandoWord, setGerandoWord] = useState(false);
  const [jaGerou, setJaGerou] = useState(false);

  // Bloco C.15 — Geração de imagens IA por questão
  const [gerandoImagemIA, setGerandoImagemIA] = useState({});
  const [cotaImagemIA, setCotaImagemIA] = useState(null);
  const [previewImagemIA, setPreviewImagemIA] = useState({});

  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);

  // Fase 3 — SVGs sugeridos por categoria (cache global)
  const [svgsPorCategoria, setSvgsPorCategoria] = useState({});
  const [carregandoCategorias, setCarregandoCategorias] = useState({});
  // Questões com "ver todos desta categoria" expandido
  const [svgsExpandidos, setSvgsExpandidos] = useState({});

  // Carrega rascunho na montagem
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
            if (d.referenciais !== undefined) setReferenciais(d.referenciais);
            if (d.incluirIlustracoes !== undefined) setIncluirIlustracoes(d.incluirIlustracoes);
            if (d.dificuldadePadrao !== undefined) setDificuldadePadrao(d.dificuldadePadrao);
            if (d.mostrarTemaCondutor !== undefined) setMostrarTemaCondutor(d.mostrarTemaCondutor);
            if (d.mostrarDescritor !== undefined) setMostrarDescritor(d.mostrarDescritor);
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

  // Salva automaticamente
  useEffect(() => {
    if (!rascunhoCarregado) return;
    try {
      const dados = {
        titulo, metaQuestoes, etapa, ano, componente, referencial,
        referenciais,
        incluirIlustracoes, dificuldadePadrao, habilidades,
        mostrarTemaCondutor, mostrarDescritor,
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
    referenciais,
    incluirIlustracoes, dificuldadePadrao, habilidades,
    mostrarTemaCondutor, mostrarDescritor,
    pool, minhasQuestoes, jaGerou,
  ]);

  // Limpa todas as escolhas do formulário para começar de novo.
  // O auto-save vai persistir o estado vazio automaticamente.
  const limparTudo = () => {
    if (!window.confirm('Limpar todas as escolhas e começar de novo?')) return;
    setTitulo('');
    setMetaQuestoes(10);
    setEtapa('EF');
    setAno(2);
    setComponente('MA');
    setReferencial('bncc');
    setReferenciais(['bncc']);
    setIncluirIlustracoes(true);
    setDificuldadePadrao('');
    setMostrarTemaCondutor(true);
    setMostrarDescritor(false);
    setHabilidades([{
      unidade_tematica: '',
      objeto_conhecimento: '',
      codigo: '',
      texto: '',
      descritores: [],
      descritoresCorrelacionados: [],
      complementosPi: [],
      carregandoDescritores: false,
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

  const descartarRascunho = () => {
    if (!window.confirm('Descartar o rascunho atual? Tudo será perdido.')) return;
    localStorage.removeItem(STORAGE_KEY);
    setTitulo('');
    setMetaQuestoes(10);
    setEtapa('EF');
    setAno(2);
    setComponente('MA');
    setReferencial('bncc');
    setReferenciais(['bncc']);
    setIncluirIlustracoes(true);
    setDificuldadePadrao('');
    setMostrarTemaCondutor(true);
    setMostrarDescritor(false);
    setHabilidades([{
      unidade_tematica: '',
      objeto_conhecimento: '',
      codigo: '',
      texto: '',
      descritores: [],
      descritoresCorrelacionados: [],
      complementosPi: [],
      carregandoDescritores: false,
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

  useEffect(() => {
    api.get(`/bncc/componentes?etapa=${etapa}`)
      .then(res => setComponentes(res.data || []))
      .catch(() => setComponentes([]));
  }, [etapa]);

  useEffect(() => {
    if (!componente) { setUnidadesTematicas([]); return; }
    const params = { componente };
    if (etapa) params.etapa = etapa;
    if (etapa === 'EF' && ano) params.ano = ano;

    api.get('/bncc-estrutura/unidades-tematicas', { params })
      .then(res => setUnidadesTematicas(res.data?.unidades || []))
      .catch(() => setUnidadesTematicas([]));
  }, [componente, etapa, ano]);

  useEffect(() => {
    if (!componente) { setHabilidadesDisponiveis([]); return; }
    const params = { componente };
    if (etapa) params.etapa = etapa;
    if (etapa === 'EF' && ano) params.ano = ano;

    api.get('/bncc-estrutura/habilidades', { params })
      .then(res => setHabilidadesDisponiveis(res.data?.habilidades || []))
      .catch(() => setHabilidadesDisponiveis([]));
  }, [etapa, ano, componente]);

  useEffect(() => {
    if (!componente) { setDescritoresDinamicos([]); return; }
    const params = { componente };
    if (etapa === 'EF' && ano) params.ano = ano;

    api.get('/bncc-estrutura/descritores', { params })
      .then(res => setDescritoresDinamicos(res.data?.descritores || []))
      .catch(() => setDescritoresDinamicos([]));
  }, [componente, etapa, ano]);

  // ============================================================
  // FASE 3 + BLOCO F — Carrega figuras por categoria pedagógica
  // 1º tenta o Banco de Figuras (backend); 2º cai no local (icones.js)
  // ============================================================
  const carregarSvgsCategoria = async (categoria) => {
    if (!categoria) return;
    if (svgsPorCategoria[categoria] || carregandoCategorias[categoria]) return;

    setCarregandoCategorias(prev => ({ ...prev, [categoria]: true }));
    try {
      let lista = [];

      // 1º) Tenta o Banco de Figuras (backend)
      try {
        const res = await api.get(
          `/question-ia/figuras?categoria=${encodeURIComponent(categoria)}&limit=8`
        );
        const figuras = res.data?.figuras || [];
        if (figuras.length > 0) {
          lista = figuras.map(f => ({
            caminho: `banco:${f.id}`,
            dataUrl: f.dataUrl,
            nome: f.nome,
            origem: 'banco',
          }));
        }
      } catch (e) {
        console.warn('Erro ao buscar figuras do banco, usando fallback local:', e);
      }

      // 2º) Se o banco não retornou nada, cai no fallback local (icones.js)
      if (lista.length === 0) {
        const local = await carregarSvgsDaCategoria(categoria);
        lista = (local || []).map(item => ({ ...item, origem: 'local' }));
      }

      setSvgsPorCategoria(prev => ({ ...prev, [categoria]: lista }));
    } catch (e) {
      console.warn('Erro ao carregar figuras da categoria:', e);
      setSvgsPorCategoria(prev => ({ ...prev, [categoria]: [] }));
    } finally {
      setCarregandoCategorias(prev => ({ ...prev, [categoria]: false }));
    }
  };

  // Sempre que uma questão de "Minhas Questões" precisar de uma categoria,
  // dispara o carregamento (uma vez por categoria, fica em cache).
  useEffect(() => {
    if (!minhasQuestoes || minhasQuestoes.length === 0) return;
    minhasQuestoes.forEach(q => {
      const ilust = q.ilustracao || {};
      if (ilust.tipo === 'automatica' && q.tipo_figura_sugerida) {
        carregarSvgsCategoria(q.tipo_figura_sugerida);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minhasQuestoes]);

  const totalParaGerar = habilidades.reduce((s, h) => s + (Number(h.quantidade) || 0), 0);
  const custo = totalParaGerar <= 10 ? 1 : totalParaGerar <= 20 ? 2 : totalParaGerar <= 30 ? 3 : totalParaGerar <= 45 ? 4 : 5;

  const pctMeta = metaQuestoes > 0 ? Math.min(Math.round((minhasQuestoes.length / metaQuestoes) * 100), 100) : 0;
  const metaAtingida = metaQuestoes > 0 && minhasQuestoes.length >= metaQuestoes;
  const faltam = Math.max(0, metaQuestoes - minhasQuestoes.length);

  const adicionarHabilidade = () => {
    setHabilidades(prev => [...prev, {
      unidade_tematica: '',
      objeto_conhecimento: '',
      codigo: '',
      texto: '',
      descritores: [],
      descritoresCorrelacionados: [],
      complementosPi: [],
      carregandoDescritores: false,
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

      if (campo === 'unidade_tematica') {
        nova.objeto_conhecimento = '';
        nova.codigo = '';
        nova.texto = '';
        nova.complemento_pi = null;
        nova.descritores = [];
        carregarObjetos(valor);
      }

      if (campo === 'objeto_conhecimento') {
        nova.codigo = '';
        nova.texto = '';
        nova.complemento_pi = null;
        nova.descritores = [];
      }

      if (campo === 'codigo') {
        const hab = habilidadesDisponiveis.find(x => x.codigo === valor);
        if (hab) {
          nova.texto = hab.texto || '';
          nova.complemento_pi = (hab.complementos_pi && hab.complementos_pi[0]?.texto) || null;
        }
        // Reset — os descritores correlacionados serão recarregados abaixo
        nova.descritores = [];
        nova.descritoresCorrelacionados = [];
      }

      return nova;
    }));

    // Ao escolher a habilidade, busca os descritores correlacionados
    if (campo === 'codigo') {
      carregarDescritoresDaHabilidade(index, valor);
    }
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

  const carregarObjetos = async (unidade) => {
    if (!unidade) return;
    if (objetosPorUnidade[unidade]) return;

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

  // Busca os descritores correlacionados com a habilidade selecionada.
  // Usa o endpoint /bncc-estrutura/habilidade-completa/{codigo}.
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
    } catch (e) {
      console.warn('Erro ao carregar descritores correlacionados:', e);
      setHabilidades(prev => prev.map((h, i) =>
        i === index ? { ...h, descritoresCorrelacionados: [], complementosPi: [], carregandoDescritores: false } : h
      ));
    }
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
      referenciais,
      estado: user?.estado || null,
      incluir_ilustracoes: incluirIlustracoes,
      compartilhar_curadoria: true,
      dificuldade_padrao: dificuldadePadrao || null,
      habilidades: habilidades.map(h => ({
        codigo: h.codigo,
        texto: h.texto,
        complemento_pi: h.complemento_pi || null,
        // Converte "saeb:D01" → "D01" e remove duplicatas
        descritores: Array.from(new Set((h.descritores || []).map(x => {
          if (typeof x === 'string' && x.includes(':')) return x.split(':')[1];
          return x;
        }))),
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

  // ============================================================
  // BLOCO C.15 — Geração de imagem IA (por questão)
  // Respeita a flag global (feature_gerar_imagem_ia).
  // ============================================================
  const gerarImagemIA = async (localId) => {
    const questao = minhasQuestoes.find(q => q._localId === localId);
    if (!questao) return;

    const descricao = (questao.descricao_ilustracao || questao.enunciado || '').trim();
    if (descricao.length < 10) {
      alert('A questão não tem descrição suficiente para gerar a imagem.');
      return;
    }

    setGerandoImagemIA(prev => ({ ...prev, [localId]: true }));
    setErro('');
    setSucesso('');

    try {
      const res = await api.post('/question-ia/gerar-imagem', {
        descricao,
        categoria: questao.tipo_figura_sugerida || 'nenhuma',
        subcategoria: null,
        contexto: {
          etapa,
          ano: etapa === 'EF' ? Number(ano) : null,
          componente,
        },
      });

      const { dataUrl, cota_restante, ilimitado, figura_id } = res.data;

      setPreviewImagemIA(prev => ({
        ...prev,
        [localId]: { dataUrl, figura_id },
      }));

      if (ilimitado) {
        setCotaImagemIA(-1); // -1 = ilimitado
      } else {
        setCotaImagemIA(cota_restante);
      }
    } catch (err) {
      const status = err?.response?.status;
      const detalhe = err?.response?.data?.detail;
      if (status === 503) {
        setErro(detalhe || 'A geração de imagens com IA está temporariamente indisponível.');
      } else if (status === 402) {
        setErro(detalhe || 'Você usou todas as imagens deste ciclo.');
      } else {
        setErro(detalhe || 'Não foi possível gerar a imagem. Tente novamente.');
      }
    } finally {
      setGerandoImagemIA(prev => ({ ...prev, [localId]: false }));
    }
  };

  const usarImagemIA = (localId) => {
    const preview = previewImagemIA[localId];
    if (!preview) return;

    setMinhasQuestoes(prev => prev.map(q => {
      if (q._localId !== localId) return q;
      return {
        ...q,
        ilustracao: {
          ...(q.ilustracao || { tipo: 'automatica' }),
          imagem: preview.dataUrl,
          svg_escolhido: null,
          gerada_ia: true,
          figura_id: preview.figura_id,
        },
      };
    }));

    setPreviewImagemIA(prev => {
      const novo = { ...prev };
      delete novo[localId];
      return novo;
    });

    setSucesso('Imagem aplicada à questão.');
  };

  const descartarPreviewImagemIA = (localId) => {
    setPreviewImagemIA(prev => {
      const novo = { ...prev };
      delete novo[localId];
      return novo;
    });
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

  // Fase 3 — Escolhe um SVG sugerido para a questão
  const escolherSvg = async (localId, caminho, dataUrl) => {
    // Converte SVG → PNG antes de salvar.
    // Motivo: python-docx (Word) não suporta SVG; html2canvas (PDF)
    // tem problema com SVG embutido. PNG funciona nos dois.
    const imagemFinal = await converterSvgParaPng(dataUrl);

    setMinhasQuestoes(prev => prev.map(q => {
      if (q._localId !== localId) return q;
      return {
        ...q,
        ilustracao: {
          ...(q.ilustracao || { tipo: 'automatica' }),
          imagem: imagemFinal,
          svg_escolhido: caminho,
        },
      };
    }));
  };

  // Fase 3 — Remove o SVG escolhido (volta a mostrar os sugeridos)
  const removerSvgEscolhido = (localId) => {
    setMinhasQuestoes(prev => prev.map(q => {
      if (q._localId !== localId) return q;
      return {
        ...q,
        ilustracao: {
          ...(q.ilustracao || { tipo: 'automatica' }),
          imagem: null,
          svg_escolhido: null,
        },
      };
    }));
  };

  // Fase 3 — Alterna "ver todos desta categoria"
  const toggleVerTodos = (localId) => {
    setSvgsExpandidos(prev => ({ ...prev, [localId]: !prev[localId] }));
  };

  const _prepararDados = () => ({
    titulo: titulo.trim(),
    cabecalho,
    questoes: minhasQuestoes,
    opcoes: {
      mostrarTemaCondutor,
      mostrarDescritor,
    },
  });

  // ============================================================
  // BLOCO C.14 — Geração de Word (.docx)
  // ============================================================
  const gerarWord = async (tipo) => {
    if (!metaAtingida) { alert(`Faltam ${faltam} questão(ões) para a meta.`); return; }
    if (tipo !== 'prova' && tipo !== 'gabarito') return;

    setGerandoWord(true); setErro(''); setSucesso('');

    try {
      // Salva a prova no backend e envia para curadoria (mesmo comportamento do PDF)
      await _salvarProvaNoBackend();
      await _enviarCuradoria();

      // Payload para o endpoint de Word
      const payload = {
        tipo,
        titulo: titulo.trim(),
        cabecalho: cabecalho || null,
        questoes: minhasQuestoes.map((q, i) => ({
          numero: i + 1,
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
          tema_condutor: q.tema_condutor || null,
          imagem_url: q.imagem_url || null,
          ilustracao: q.ilustracao || null,
        })),
        opcoes: {
          mostrarTemaCondutor,
          mostrarDescritor,
        },
      };

      // Faz a requisição com responseType blob (arquivo binário)
      const res = await api.post('/question-ia/gerar-word', payload, {
        responseType: 'blob',
      });

      // Cria o link de download e aciona
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);

      const slug = (titulo.trim() || 'prova')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 60) || 'prova';

      const sufixo = tipo === 'prova' ? 'PROVA' : 'GABARITO';
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug}_${sufixo}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      _finalizarComSucesso(
        tipo === 'prova'
          ? '✅ Word da PROVA gerado! Verifique a pasta de Downloads.'
          : '✅ Word do GABARITO gerado! Verifique a pasta de Downloads.'
      );
    } catch (err) {
      console.error('Erro ao gerar Word:', err);
      setErro(err?.message || 'Erro ao gerar arquivo Word.');
    } finally {
      setGerandoWord(false);
    }
  };

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
            svg_escolhido: q.ilustracao?.svg_escolhido || null,
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
        referenciais,
        estado: user?.estado || null,
        dificuldade_padrao: dificuldadePadrao || null,
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
          svg_escolhido: q.ilustracao?.svg_escolhido || null,
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
      <div className="flex justify-between items-center flex-wrap gap-3">
        <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">← Voltar</Link>
        <div className="flex items-center gap-3">
          <button onClick={limparTudo}
            className="text-xs text-amber-800 hover:text-amber-900 font-medium border border-amber-300 hover:border-amber-500 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition">
            🔄 Limpar tudo e recomeçar
          </button>
          <button onClick={descartarRascunho}
            className="text-xs text-red-600 hover:text-red-800 font-medium">
            🗑️ Descartar rascunho atual
          </button>
        </div>
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

          {/* Referenciais Multi-Seleção */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📚 Referenciais curriculares (escolha um ou mais)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {REFERENCIAIS.map(r => {
                const ativo = referenciais.includes(r.value);
                const isBncc = r.value === 'bncc';
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      if (isBncc) return;
                      setReferenciais(prev =>
                        prev.includes(r.value)
                          ? prev.filter(x => x !== r.value)
                          : [...prev, r.value]
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
                      <input
                        type="checkbox"
                        checked={ativo}
                        readOnly
                        className="w-4 h-4 pointer-events-none"
                      />
                      <span className="font-medium">{r.label}</span>
                    </div>
                    {isBncc && (
                      <p className="text-[10px] text-blue-700 mt-1">(sempre ativo)</p>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 A IA vai combinar os referenciais selecionados ao gerar as questões.
            </p>
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

              {h.objeto_conhecimento && (() => {
                const doObjeto = habilidadesDisponiveis.filter(hab => {
                  const matchUnidade = !h.unidade_tematica || hab.unidade_tematica === h.unidade_tematica;
                  const matchObjeto = !h.objeto_conhecimento || hab.objeto_conhecimento === h.objeto_conhecimento;
                  return matchUnidade && matchObjeto;
                });

                const termo = (h.busca || '').toLowerCase().trim();
                const comBusca = termo
                  ? doObjeto.filter(hab =>
                      (hab.codigo || '').toLowerCase().includes(termo) ||
                      (hab.texto || '').toLowerCase().includes(termo)
                    )
                  : doObjeto;

                return (
                  <>
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

              {h.codigo && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {/* Complemento do Currículo do Piauí — só aparece se "Currículo do Piauí" estiver marcado */}
                  {referenciais.includes('curriculo_piaui') && (h.complementosPi || []).length > 0 && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        📌 Complemento do Currículo do Piauí
                      </label>
                      <div className="space-y-1">
                        {(h.complementosPi || []).map((c, ci) => (
                          <div key={ci} className="text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-900">
                            {c.codigo && <strong className="font-mono mr-2">{c.codigo}</strong>}
                            {c.texto}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Descritores SAEB/SAEPI — filtrados pelos referenciais marcados */}
                  {(referenciais.includes('saeb') || referenciais.includes('saepi')) && (() => {
                    const descsFiltrados = (h.descritoresCorrelacionados || []).filter(d => {
                      if (d.fonte === 'saeb' && referenciais.includes('saeb')) return true;
                      if (d.fonte === 'saepi' && referenciais.includes('saepi')) return true;
                      return false;
                    });

                    if (h.carregandoDescritores) {
                      return (
                        <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded border border-gray-200">
                          ⏳ Carregando descritores correlacionados...
                        </div>
                      );
                    }

                    // Sem correlação para os referenciais marcados
                    if (descsFiltrados.length === 0) {
                      return (
                        <div className="text-xs text-amber-800 bg-amber-50 rounded p-3 border border-amber-200">
                          ℹ️ Nenhum descritor SAEB/SAEPI correlacionado encontrado para esta habilidade.
                          Você pode gerar as questões mesmo assim — a IA vai usar a habilidade BNCC como referência.
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                          <label className="block text-xs font-medium text-gray-700">
                            📊 Descritores correlacionados ({h.descritores?.length || 0} selecionados)
                          </label>
                          <span className="text-[10px] text-gray-500">
                            {descsFiltrados.length} disponíveis para esta habilidade
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mb-2">
                          Clique nos descritores que deseja avaliar nesta questão.
                        </p>
                        <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                          {descsFiltrados.map(d => {
                            const codigoD = d.codigo;
                            const texto = d.texto || '';
                            const tema = d.tema || '';
                            const fonte = d.fonte || '';
                            const confianca = d.confianca || '';
                            // Chave composta: "saeb:D01" ou "saepi:D01" (evita marcar os dois juntos)
                            const chaveDescritor = `${fonte}:${codigoD}`;
                            const selecionado = h.descritores?.includes(chaveDescritor);

                            return (
                              <button
                                key={chaveDescritor}
                                type="button"
                                onClick={() => toggleDescritor(index, chaveDescritor)}
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
                                        {codigoD}
                                      </span>
                                      {tema && (
                                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                          {tema}
                                        </span>
                                      )}
                                      {fonte && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold uppercase">
                                          {fonte}
                                        </span>
                                      )}
                                      {confianca && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                          confianca === 'alta' ? 'bg-green-100 text-green-800' :
                                          confianca === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-slate-100 text-slate-600'
                                        }`}>
                                          {confianca}
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
                      </>
                    );
                  })()}
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

          {/* Fase 4 — opções de apresentação do PDF */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-purple-900">📄 Apresentação no PDF</p>

            <div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={mostrarTemaCondutor}
                  onChange={(e) => setMostrarTemaCondutor(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded" />
                Mostrar o tema condutor em cada questão
              </label>
              <p className="text-[11px] text-purple-700 ml-6 mt-0.5">
                Cada questão começa com uma faixa indicando o eixo pedagógico (QUANTIDADE, ORDEM, MEDIDA...).
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={mostrarDescritor}
                  onChange={(e) => setMostrarDescritor(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded" />
                Mostrar os descritores abaixo de cada questão
              </label>
              <p className="text-[11px] text-purple-700 ml-6 mt-0.5">
                Quando marcado, cada questão exibe o(s) descritor(es) SAEB/SAEPI que ela avalia.
              </p>
            </div>
          </div>

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
            <p className="text-xs text-purple-200 mt-1">
              Referenciais ativos: <strong>{referenciais.map(r => r.toUpperCase()).join(' + ')}</strong>
            </p>
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
              <button onClick={gerarSoProva} disabled={gerandoPdf || gerandoWord}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-lg transition">
                {gerandoPdf ? '⏳...' : '📄 Baixar Prova'}
              </button>
              <button onClick={gerarSoGabarito} disabled={gerandoPdf || gerandoWord}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 rounded-lg transition">
                {gerandoPdf ? '⏳...' : '📋 Baixar Gabarito'}
              </button>
              <button onClick={gerarAmbos} disabled={gerandoPdf || gerandoWord}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3 rounded-lg transition">
                {gerandoPdf ? '⏳ Gerando...' : '📥 Baixar Ambos'}
              </button>
            </div>
          )}

          {metaAtingida && podeBaixarWord && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                📝 <strong>Ou baixe em Word (.docx)</strong> — para editar livremente no Word
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button onClick={() => gerarWord('prova')} disabled={gerandoPdf || gerandoWord}
                  className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-bold py-3 rounded-lg transition">
                  {gerandoWord ? '⏳ Gerando...' : '📄 Word (Prova)'}
                </button>
                <button onClick={() => gerarWord('gabarito')} disabled={gerandoPdf || gerandoWord}
                  className="bg-cyan-700 hover:bg-cyan-800 disabled:bg-cyan-300 text-white font-bold py-3 rounded-lg transition">
                  {gerandoWord ? '⏳ Gerando...' : '📋 Word (Gabarito)'}
                </button>
              </div>
            </div>
          )}

          {metaAtingida && !podeBaixarWord && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-indigo-900">
                    📄 Exportação em Word (.docx)
                  </p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Edite sua prova livremente no Word. Disponível a partir do plano{' '}
                    <strong>🚀 Intermediário</strong>.
                  </p>
                </div>
                <Link
                  to="/minha-assinatura"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition whitespace-nowrap shadow-sm"
                >
                  🚀 Fazer Upgrade
                </Link>
              </div>
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

                    {ilust.tipo === 'automatica' && (
                      <>
                        {q.descricao_ilustracao && (
                          <p className="text-xs text-amber-700 mt-2">
                            💡 Sugestão da IA: {q.descricao_ilustracao}
                          </p>
                        )}

                        {q.tipo_figura_sugerida && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                              <p className="text-xs font-semibold text-blue-900">
                                🎨 Escolha uma figura sugerida ({q.tipo_figura_sugerida})
                              </p>
                              {ilust.imagem && (
                                <button
                                  type="button"
                                  onClick={() => removerSvgEscolhido(q._localId)}
                                  className="text-[10px] text-red-600 hover:text-red-800 font-medium"
                                >
                                  🗑️ Trocar figura
                                </button>
                              )}
                            </div>

                            {/* Se já escolheu, mostra preview */}
                            {ilust.imagem && (
                              <div className="bg-white border border-blue-300 rounded-lg p-3 text-center mb-2">
                                <img src={ilust.imagem} alt="SVG escolhido" className="max-h-24 mx-auto" />
                                <p className="text-[10px] text-gray-500 mt-1">
                                  Figura escolhida. Clique em "Trocar figura" acima para escolher outra.
                                </p>
                              </div>
                            )}

                            {/* Se ainda não escolheu, mostra os sugeridos */}
                            {!ilust.imagem && (() => {
                              const categoria = q.tipo_figura_sugerida;
                              const lista = svgsPorCategoria[categoria] || [];
                              const carregando = carregandoCategorias[categoria];
                              const expandido = svgsExpandidos[q._localId];
                              const visiveis = expandido ? lista : lista.slice(0, 6);

                              if (carregando) {
                                return (
                                  <p className="text-xs text-gray-500 italic p-3 bg-white rounded border border-gray-200">
                                    ⏳ Carregando figuras sugeridas...
                                  </p>
                                );
                              }

                              if (lista.length === 0) {
                                return (
                                  <p className="text-xs text-gray-500 italic p-3 bg-white rounded border border-gray-200">
                                    Nenhuma figura disponível para esta categoria.
                                    Use o upload manual abaixo.
                                  </p>
                                );
                              }

                              return (
                                <>
                                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                    {visiveis.map((item) => (
                                      <button
                                        key={item.caminho}
                                        type="button"
                                        onClick={() => escolherSvg(q._localId, item.caminho, item.dataUrl)}
                                        className="bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg p-2 transition aspect-square flex items-center justify-center"
                                        title={item.caminho}
                                      >
                                        <img src={item.dataUrl} alt={item.caminho} className="max-h-12 max-w-full" />
                                      </button>
                                    ))}
                                  </div>

                                  {lista.length > 6 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleVerTodos(q._localId)}
                                      className="mt-2 text-[10px] text-blue-700 hover:text-blue-900 font-medium"
                                    >
                                      {expandido
                                        ? '▲ Ver menos'
                                        : `▼ Ver todas as ${lista.length} figuras desta categoria`}
                                    </button>
                                  )}
                                </>
                              );
                            })()}

                            <p className="text-[10px] text-gray-500 mt-2">
                              💡 Se não encontrar a figura ideal, use a opção "⬆️ Upload" acima para enviar a sua.
                            </p>

                            {/* Bloco C.15 — Geração de imagem com IA (respeita a flag global) */}
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              {gerarImagemIAAtiva() ? (
                                <>
                                  <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                                    <p className="text-xs font-semibold text-purple-900">
                                      🎨 Gerar imagem exclusiva com IA
                                    </p>
                                    {cotaImagemIA !== null && (
                                      <span className="text-[10px] text-purple-700 font-medium">
                                        {cotaImagemIA === -1
                                          ? '♾️ Ilimitado'
                                          : `${cotaImagemIA} imagem(ns) disponível(is) este mês`}
                                      </span>
                                    )}
                                  </div>

                                  {!previewImagemIA[q._localId] && (
                                    <button
                                      type="button"
                                      onClick={() => gerarImagemIA(q._localId)}
                                      disabled={gerandoImagemIA[q._localId]}
                                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-bold py-2 rounded-lg transition"
                                    >
                                      {gerandoImagemIA[q._localId]
                                        ? '⏳ Gerando imagem...'
                                        : '🎨 Gerar imagem com IA'}
                                    </button>
                                  )}

                                  {previewImagemIA[q._localId] && (
                                    <div className="bg-purple-50 border border-purple-300 rounded-lg p-3">
                                      <img
                                        src={previewImagemIA[q._localId].dataUrl}
                                        alt="Preview IA"
                                        className="max-h-32 mx-auto mb-2 bg-white rounded"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => usarImagemIA(q._localId)}
                                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded"
                                        >
                                          ✅ Usar esta
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => gerarImagemIA(q._localId)}
                                          disabled={gerandoImagemIA[q._localId]}
                                          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-bold py-1.5 rounded"
                                        >
                                          {gerandoImagemIA[q._localId] ? '⏳...' : '🔄 Gerar outra'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => descartarPreviewImagemIA(q._localId)}
                                          className="bg-white hover:bg-red-50 text-red-600 border border-red-300 text-xs font-medium px-2 py-1.5 rounded"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <p className="text-[10px] text-gray-500 mt-2">
                                    💡 A imagem gerada é salva automaticamente no Banco de Figuras.
                                  </p>
                                </>
                              ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-gray-700">
                                    🎨 Geração de imagens com IA
                                  </p>
                                  <p className="text-[10px] text-gray-500 mt-1">
                                    {textoImagemIAIndisponivel()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
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