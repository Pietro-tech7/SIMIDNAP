import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

// ============================================================
// CONSTANTES
// ============================================================
const ETAPAS = [
  { value: 'EF', label: 'Ensino Fundamental' },
  { value: 'EI', label: 'Educação Infantil' },
];

const ANOS_EF = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const COMPONENTES_FALLBACK = [
  { codigo: 'MA', nome: 'Matemática' },
  { codigo: 'LP', nome: 'Língua Portuguesa' },
  { codigo: 'CI', nome: 'Ciências' },
  { codigo: 'GE', nome: 'Geografia' },
  { codigo: 'HI', nome: 'História' },
  { codigo: 'AR', nome: 'Arte' },
  { codigo: 'EF', nome: 'Educação Física' },
  { codigo: 'ER', nome: 'Ensino Religioso' },
  { codigo: 'LI', nome: 'Língua Inglesa' },
];

const REFERENCIAIS = [
  { value: 'bncc', label: 'BNCC' },
  { value: 'curriculo_piaui', label: 'Currículo do Piauí' },
  { value: 'saeb', label: 'SAEB' },
  { value: 'saepi', label: 'SAEPI' },
  { value: 'ppaic', label: 'PPAIC' },
];

const TIPOS = [
  { value: 'multipla_escolha', label: 'Múltipla escolha (A, B, C, D)' },
  { value: 'verdadeiro_falso', label: 'Verdadeiro ou Falso' },
  { value: 'dissertativa', label: 'Dissertativa' },
  { value: 'completar', label: 'Completar lacunas' },
  { value: 'ligar_colunas', label: 'Ligar colunas' },
];

const DIFICULDADES = [
  { value: '', label: 'Não especificar' },
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Média' },
  { value: 'dificil', label: 'Difícil' },
];

function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const LETRAS = ['A', 'B', 'C', 'D'];


const AdminQuestionForm = () => {
  const navigate = useNavigate();

  // ----- FORM -----
  const [etapa, setEtapa] = useState('EF');
  const [ano, setAno] = useState(2);
  const [serie, setSerie] = useState('');
  const [componente, setComponente] = useState('MA');
  const [referenciais, setReferenciais] = useState(['bncc']);
  const [habilidadeCodigo, setHabilidadeCodigo] = useState('');
  const [habilidadeTexto, setHabilidadeTexto] = useState('');
  const [habilidadeComplementoPi, setHabilidadeComplementoPi] = useState('');
  const [unidadeTematica, setUnidadeTematica] = useState('');
  const [objetoConhecimento, setObjetoConhecimento] = useState('');
  const [descritores, setDescritores] = useState([]);
  const [dificuldade, setDificuldade] = useState('');
  const [tipo, setTipo] = useState('multipla_escolha');
  const [enunciado, setEnunciado] = useState('');
  const [imagemPrincipal, setImagemPrincipal] = useState(null);
  const [alternativas, setAlternativas] = useState([
    { letra: 'A', texto: '', imagem_url: null },
    { letra: 'B', texto: '', imagem_url: null },
    { letra: 'C', texto: '', imagem_url: null },
    { letra: 'D', texto: '', imagem_url: null },
  ]);
  const [gabarito, setGabarito] = useState('A');
  const [aprovada, setAprovada] = useState(true);

  // ----- LISTAS -----
  const [componentes, setComponentes] = useState(COMPONENTES_FALLBACK);
  const [habilidadesDisponiveis, setHabilidadesDisponiveis] = useState([]);
  const [unidadesTematicas, setUnidadesTematicas] = useState([]);
  const [objetosPorUnidade, setObjetosPorUnidade] = useState({});
  const [descritoresCorrelacionados, setDescritoresCorrelacionados] = useState([]);
  const [carregandoDescritores, setCarregandoDescritores] = useState(false);
  const [buscaHabilidade, setBuscaHabilidade] = useState('');

  // ----- ESTADOS -----
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // ============================================================
  // CARREGAR COMPONENTES
  // ============================================================
  useEffect(() => {
    api.get(`/bncc/componentes?etapa=${etapa}`)
      .then(res => setComponentes(res.data && res.data.length > 0 ? res.data : COMPONENTES_FALLBACK))
      .catch(() => setComponentes(COMPONENTES_FALLBACK));
  }, [etapa]);

  // ============================================================
  // CARREGAR HABILIDADES
  // ============================================================
  useEffect(() => {
    if (!componente) { setHabilidadesDisponiveis([]); return; }
    const params = { etapa, componente };
    if (etapa === 'EF' && ano) params.ano = ano;

    api.get('/bncc-estrutura/habilidades', { params })
      .then(res => setHabilidadesDisponiveis(res.data?.habilidades || []))
      .catch(() => setHabilidadesDisponiveis([]));
  }, [etapa, ano, componente]);

  // Unidades temáticas (cascata)
  useEffect(() => {
    if (!componente) { setUnidadesTematicas([]); return; }
    const params = { componente };
    if (etapa) params.etapa = etapa;
    if (etapa === 'EF' && ano) params.ano = ano;

    api.get('/bncc-estrutura/unidades-tematicas', { params })
      .then(res => setUnidadesTematicas(res.data?.unidades || []))
      .catch(() => setUnidadesTematicas([]));
  }, [componente, etapa, ano]);

  // ============================================================
  // FILTRO DE HABILIDADES
  // ============================================================
  const habilidadesFiltradas = (() => {
    if (!buscaHabilidade.trim()) return habilidadesDisponiveis;
    const termo = buscaHabilidade.toLowerCase().trim();
    return habilidadesDisponiveis.filter(h =>
      (h.codigo || '').toLowerCase().includes(termo) ||
      (h.texto || '').toLowerCase().includes(termo)
    );
  })();

  // ============================================================
  // DESCRITORES DISPONÍVEIS (dinâmico — vem do backend, por habilidade)
  // ============================================================
  const descritoresDisponiveis = descritoresCorrelacionados;

  // ============================================================
  // AÇÕES DAS ALTERNATIVAS
  // ============================================================
  const atualizarAlternativa = (idx, campo, valor) => {
    setAlternativas(prev => prev.map((a, i) => i === idx ? { ...a, [campo]: valor } : a));
  };

  const uploadImagemAlternativa = async (idx, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande. Máximo 2 MB.'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      alert('Formato inválido. Use PNG, JPG, WEBP ou SVG.'); return;
    }
    const b64 = await arquivoParaBase64(file);
    atualizarAlternativa(idx, 'imagem_url', b64);
  };

  const removerImagemAlternativa = (idx) => {
    atualizarAlternativa(idx, 'imagem_url', null);
  };

  const uploadImagemPrincipal = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande. Máximo 2 MB.'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      alert('Formato inválido. Use PNG, JPG, WEBP ou SVG.'); return;
    }
    const b64 = await arquivoParaBase64(file);
    setImagemPrincipal(b64);
  };

  // ============================================================
  // CARREGAR OBJETOS (sob demanda)
  // ============================================================
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

  // ============================================================
  // CARREGAR DESCRITORES CORRELACIONADOS (por habilidade)
  // ============================================================
  const carregarDescritores = async (codigoHabilidade) => {
    if (!codigoHabilidade) {
      setDescritoresCorrelacionados([]);
      setCarregandoDescritores(false);
      return;
    }
    setCarregandoDescritores(true);
    try {
      const res = await api.get(`/bncc-estrutura/habilidade-completa/${codigoHabilidade}`);
      setDescritoresCorrelacionados(res.data?.descritores || []);
      const comps = res.data?.complementos_pi || [];
      setHabilidadeComplementoPi(comps.length > 0 ? (comps[0].texto || '') : '');
    } catch (e) {
      console.warn('Erro ao carregar descritores correlacionados:', e);
      setDescritoresCorrelacionados([]);
      setHabilidadeComplementoPi('');
    } finally {
      setCarregandoDescritores(false);
    }
  };

  // ============================================================
  // SELECIONAR HABILIDADE (preenche unidade + objeto automaticamente)
  // ============================================================
  const selecionarHabilidade = (codigo) => {
    setHabilidadeCodigo(codigo);
    setDescritores([]);
    const h = habilidadesDisponiveis.find(x => x.codigo === codigo);
    if (h) {
      setHabilidadeTexto(h.texto || '');
      setUnidadeTematica(h.unidade_tematica || '');
      setObjetoConhecimento(h.objeto_conhecimento || '');
      if (h.unidade_tematica && !objetosPorUnidade[h.unidade_tematica]) {
        carregarObjetos(h.unidade_tematica);
      }
    } else {
      setHabilidadeTexto('');
      setUnidadeTematica('');
      setObjetoConhecimento('');
      setHabilidadeComplementoPi('');
    }
    carregarDescritores(codigo);
  };

  const toggleDescritor = (d) => {
    setDescritores(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  // Handlers da cascata — resetam os níveis inferiores quando um superior muda
  const handleMudarUnidade = (novaUnidade) => {
    setUnidadeTematica(novaUnidade);
    setObjetoConhecimento('');
    setHabilidadeCodigo('');
    setHabilidadeTexto('');
    setHabilidadeComplementoPi('');
    setDescritores([]);
    setDescritoresCorrelacionados([]);
    if (novaUnidade) carregarObjetos(novaUnidade);
  };

  const handleMudarObjeto = (novoObjeto) => {
    setObjetoConhecimento(novoObjeto);
    setHabilidadeCodigo('');
    setHabilidadeTexto('');
    setHabilidadeComplementoPi('');
    setDescritores([]);
    setDescritoresCorrelacionados([]);
  };

  // BNCC é fixo (sempre ativo). Os demais são toggleáveis.
  const toggleReferencial = (valor) => {
    if (valor === 'bncc') return;
    setReferenciais(prev =>
      prev.includes(valor) ? prev.filter(x => x !== valor) : [...prev, valor]
    );
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(''); setSucesso('');

    // Validações
    if (!enunciado.trim() || enunciado.trim().length < 10) {
      setErro('O enunciado precisa ter ao menos 10 caracteres.');
      return;
    }
    if (!componente) { setErro('Selecione o componente.'); return; }
    if (tipo === 'multipla_escolha') {
      const alternativasVazias = alternativas.filter(a => !a.texto?.trim() && !a.imagem_url);
      if (alternativasVazias.length > 0) {
        setErro('Preencha todas as alternativas (ou remova as vazias).');
        return;
      }
      if (!gabarito) { setErro('Selecione o gabarito.'); return; }
    }

    setSalvando(true);

    try {
      const payload = {
        etapa,
        ano: etapa === 'EF' ? Number(ano) : null,
        serie: serie || null,
        componente,
        disciplina: componentes.find(c => c.codigo === componente)?.nome || componente,
        referenciais,
        unidade_tematica: unidadeTematica || null,
        objeto_conhecimento: objetoConhecimento || null,
        habilidade_codigo: habilidadeCodigo || null,
        descritores: descritores.length > 0 ? descritores : null,
        dificuldade: dificuldade || null,
        tipo,
        enunciado: enunciado.trim(),
        alternativas: tipo === 'multipla_escolha'
          ? alternativas.map(a => ({ letra: a.letra, texto: a.texto, imagem_url: a.imagem_url }))
          : null,
        gabarito: tipo === 'multipla_escolha' ? gabarito : null,
        imagem_url: imagemPrincipal,
        imagens_extras: null,
        aprovada,
      };

      await api.post('/admin/question-bank/criar', payload);

      setSucesso('✅ Questão criada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/admin/question-bank'), 1500);
    } catch (err) {
      setErro(err?.response?.data?.detail || 'Erro ao criar questão.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <Link to="/admin/question-bank" className="text-blue-600 text-sm hover:underline">
        ← Voltar para a curadoria
      </Link>

      <div className="mt-6 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">➕</span>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nova Questão Manual</h1>
            <p className="text-slate-600 text-sm mt-0.5">
              Adicione uma questão ao banco do Motor 8. Ela entra já aprovada por padrão.
            </p>
          </div>
        </div>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-sm">⚠️ {erro}</div>}
      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4 text-sm">✅ {sucesso}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================ */}
        {/* FORMULÁRIO */}
        {/* ============================================================ */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">

          {/* Identificação */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">📋 Identificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Etapa *</label>
                <select value={etapa} onChange={(e) => setEtapa(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {ETAPAS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select>
              </div>

              {etapa === 'EF' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ano *</label>
                  <select value={ano} onChange={(e) => setAno(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    {ANOS_EF.map(a => <option key={a} value={a}>{a}º ano</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Série (opcional)</label>
                <input type="text" value={serie} onChange={(e) => setSerie(e.target.value)}
                  placeholder="Ex: 2º A"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Componente *</label>
                <select value={componente} onChange={(e) => setComponente(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {componentes.map(c => <option key={c.codigo} value={c.codigo}>{c.nome}</option>)}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Referenciais * <span className="text-slate-400 font-normal">(BNCC sempre ativo — clique para marcar os demais)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REFERENCIAIS.map(r => {
                    const ativo = referenciais.includes(r.value);
                    const fixo = r.value === 'bncc';
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => toggleReferencial(r.value)}
                        disabled={fixo}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition border ${
                          ativo
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        } ${fixo ? 'opacity-90 cursor-not-allowed' : ''}`}
                      >
                        {ativo ? '☑ ' : '☐ '}{r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dificuldade</label>
                <select value={dificuldade} onChange={(e) => setDificuldade(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {DIFICULDADES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Habilidade e descritores — cascata completa */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">📚 Habilidade e Descritores</h2>

            {/* Cascata: Unidade → Objeto → Habilidade */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                📖 Unidade Temática ({unidadesTematicas.length} disponíveis)
              </label>
              <select value={unidadeTematica}
                onChange={(e) => handleMudarUnidade(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Selecione a unidade temática...</option>
                {unidadesTematicas.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {unidadeTematica && (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  🎯 Objeto de Conhecimento ({(objetosPorUnidade[unidadeTematica] || []).length} disponíveis)
                </label>
                <select value={objetoConhecimento}
                  onChange={(e) => handleMudarObjeto(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Selecione o objeto de conhecimento...</option>
                  {(objetosPorUnidade[unidadeTematica] || []).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}

            {objetoConhecimento && (() => {
              const doObjeto = habilidadesDisponiveis.filter(hab => {
                const matchUnidade = !unidadeTematica || hab.unidade_tematica === unidadeTematica;
                const matchObjeto = !objetoConhecimento || hab.objeto_conhecimento === objetoConhecimento;
                return matchUnidade && matchObjeto;
              });

              const termo = (buscaHabilidade || '').toLowerCase().trim();
              const comBusca = termo
                ? doObjeto.filter(hab =>
                    (hab.codigo || '').toLowerCase().includes(termo) ||
                    (hab.texto || '').toLowerCase().includes(termo)
                  )
                : doObjeto;

              return (
                <>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      🔍 Buscar habilidade (opcional)
                    </label>
                    <input
                      type="text"
                      value={buscaHabilidade}
                      onChange={(e) => setBuscaHabilidade(e.target.value)}
                      placeholder="Digite o código (EF02MA01) ou palavra-chave..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ✨ Habilidade ({doObjeto.length} disponíveis)
                    </label>
                    <select
                      value={habilidadeCodigo}
                      onChange={(e) => selecionarHabilidade(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Nenhuma (opcional)</option>
                      {(termo ? comBusca : doObjeto).map(hab => (
                        <option key={hab.codigo} value={hab.codigo}>
                          {hab.codigo} — {(hab.texto || '').slice(0, 80)}
                        </option>
                      ))}
                    </select>
                    {doObjeto.length === 0 && (
                      <p className="text-xs text-amber-700 mt-1">
                        ⚠️ Nenhuma habilidade cadastrada para este objeto ainda.
                      </p>
                    )}
                  </div>
                </>
              );
            })()}

            {habilidadeTexto && (
              <div className="text-xs text-slate-700 bg-slate-50 rounded p-2 mb-3 border border-slate-200">
                <strong>Texto:</strong> {habilidadeTexto}
              </div>
            )}

            {habilidadeComplementoPi && (
              <div className="text-xs text-amber-800 bg-amber-50 rounded p-2 mb-3 border border-amber-100">
                <strong>📌 Complemento Piauí:</strong> {habilidadeComplementoPi}
              </div>
            )}

            {carregandoDescritores && (
              <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200 mb-3">
                ⏳ Carregando descritores correlacionados...
              </div>
            )}

            {!carregandoDescritores && habilidadeCodigo && descritoresDisponiveis.length === 0 && (
              <div className="text-xs text-amber-800 bg-amber-50 rounded p-3 border border-amber-200">
                ℹ️ Nenhum descritor SAEB/SAEPI correlacionado encontrado para esta habilidade.
                Você pode criar a questão mesmo assim.
              </div>
            )}

            {!carregandoDescritores && descritoresDisponiveis.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  📊 Descritores correlacionados ({descritores.length} selecionados)
                </label>
                <p className="text-[10px] text-slate-500 mb-2">
                  Clique nos descritores que deseja avaliar nesta questão.
                </p>
                <div className="space-y-1 max-h-64 overflow-y-auto border border-slate-200 rounded p-2 bg-white">
                  {descritoresDisponiveis.map(d => {
                    const codigo = d.codigo || d;
                    const texto = d.texto || '';
                    const tema = d.tema || '';
                    const fonte = d.fonte || '';
                    const selecionado = descritores.includes(codigo);

                    return (
                      <button
                        key={codigo + (fonte || '')}
                        type="button"
                        onClick={() => toggleDescritor(codigo)}
                        className={`w-full text-left px-3 py-2 rounded-lg border-2 transition ${
                          selecionado
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
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
                              {fonte && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold uppercase">
                                  {fonte}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 leading-snug">
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

          {/* Conteúdo da questão */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">📝 Conteúdo</h2>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de questão *</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Enunciado *</label>
              <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)}
                rows="5" placeholder="Digite o enunciado da questão..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Imagem principal (opcional)
              </label>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => uploadImagemPrincipal(e.target.files?.[0])}
                className="block w-full text-xs text-slate-600 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700" />
              {imagemPrincipal && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={imagemPrincipal} alt="Preview" className="max-h-24 border border-slate-300 rounded" />
                  <button type="button" onClick={() => setImagemPrincipal(null)}
                    className="text-xs text-red-600 hover:text-red-800">🗑️ Remover</button>
                </div>
              )}
            </div>

            {tipo === 'multipla_escolha' && (
              <>
                <label className="block text-xs font-semibold text-slate-600 mb-2 mt-4">Alternativas *</label>
                <div className="space-y-3">
                  {alternativas.map((alt, idx) => (
                    <div key={alt.letra} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 mt-1 w-6">{alt.letra})</span>
                        <div className="flex-1">
                          <textarea value={alt.texto}
                            onChange={(e) => atualizarAlternativa(idx, 'texto', e.target.value)}
                            rows="2" placeholder={`Texto da alternativa ${alt.letra}`}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />

                          <div className="mt-2 flex items-center gap-2">
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={(e) => uploadImagemAlternativa(idx, e.target.files?.[0])}
                              className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-slate-600 file:text-white file:font-medium file:text-xs" />
                            {alt.imagem_url && (
                              <>
                                <img src={alt.imagem_url} alt={`Alt ${alt.letra}`} className="max-h-12 border border-slate-300 rounded" />
                                <button type="button" onClick={() => removerImagemAlternativa(idx)}
                                  className="text-xs text-red-600">🗑️</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gabarito *</label>
                  <div className="flex gap-2">
                    {LETRAS.map(l => (
                      <button key={l} type="button" onClick={() => setGabarito(l)}
                        className={`w-12 h-12 rounded-lg font-bold transition ${
                          gabarito === l
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}>{l}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Publicação */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">📢 Publicação</h2>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={aprovada} onChange={(e) => setAprovada(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded" />
              Aprovar imediatamente (aparece no Motor 8 para os professores)
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Se desmarcar, a questão vai para a fila de curadoria como pendente.
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/admin/question-bank')}
              className="flex-1 border border-slate-300 text-slate-700 font-medium py-3 rounded-lg hover:bg-slate-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3 rounded-lg transition">
              {salvando ? '⏳ Salvando...' : '✅ Criar Questão'}
            </button>
          </div>
        </form>

        {/* ============================================================ */}
        {/* PREVIEW */}
        {/* ============================================================ */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              👁️ Pré-visualização
            </h3>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs">
              {/* Badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {etapa && (
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                    {etapa === 'EF' ? `Fund. ${ano}º ano` : 'Ed. Infantil'}
                  </span>
                )}
                {componente && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px]">
                    {componentes.find(c => c.codigo === componente)?.nome || componente}
                  </span>
                )}
                {referenciais.map(r => (
                  <span key={r} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px]">
                    {r === 'curriculo_piaui' ? 'PIAUÍ' : r.toUpperCase()}
                  </span>
                ))}
                {unidadeTematica && (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px]">
                    {unidadeTematica}
                  </span>
                )}
                {habilidadeCodigo && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-mono">
                    {habilidadeCodigo}
                  </span>
                )}
              </div>

              {/* Enunciado */}
              <p className="text-slate-800 font-medium mb-2 whitespace-pre-line">
                {enunciado || <em className="text-slate-400">O enunciado aparecerá aqui...</em>}
              </p>

              {/* Imagem principal */}
              {imagemPrincipal && (
                <img src={imagemPrincipal} alt="Imagem" className="my-2 max-h-32 rounded border border-slate-200" />
              )}

              {/* Alternativas */}
              {tipo === 'multipla_escolha' && (
                <div className="space-y-1 mt-3">
                  {alternativas.map((alt, i) => {
                    if (!alt.texto && !alt.imagem_url) return null;
                    return (
                      <div key={i} className={`text-xs ${gabarito === alt.letra ? 'bg-green-50 rounded p-1' : ''}`}>
                        <strong className="text-blue-600">({alt.letra})</strong>{' '}
                        <span className="text-slate-700">{alt.texto || '(imagem)'}</span>
                        {alt.imagem_url && (
                          <img src={alt.imagem_url} alt={`Alt ${alt.letra}`}
                            className="max-h-12 my-1 border border-slate-200 rounded" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionForm;