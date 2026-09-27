import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';

// ============================================================
// CONSTANTES
// ============================================================
const CATEGORIAS = [
  { value: 'quantidade', label: 'Quantidade', icon: '🔢' },
  { value: 'ordem', label: 'Ordem / Posição', icon: '📊' },
  { value: 'medida', label: 'Medida', icon: '📏' },
  { value: 'decomposicao', label: 'Decomposição', icon: '🧱' },
  { value: 'sequencia', label: 'Sequência', icon: '🔗' },
  { value: 'comparacao', label: 'Comparação', icon: '⚖️' },
  { value: 'objetos_escolares', label: 'Objetos Escolares', icon: '✏️' },
  { value: 'formas', label: 'Formas Geométricas', icon: '⬛' },
  { value: 'numeros', label: 'Números', icon: '1️⃣' },
  { value: 'nenhuma', label: 'Sem Categoria', icon: '❓' },
];

// ============================================================
// COMPONENTE AUXILIAR — chips de categorias
// ============================================================
const CategoriaChips = ({ selecionadas, onToggle, disabled }) => (
  <div className="flex flex-wrap gap-1.5">
    {CATEGORIAS.map(c => {
      const ativo = selecionadas.includes(c.value);
      return (
        <button
          key={c.value}
          type="button"
          onClick={() => !disabled && onToggle(c.value)}
          disabled={disabled}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition border ${
            ativo
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {c.icon} {c.label}
        </button>
      );
    })}
  </div>
);


// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
const AdminFigureBank = () => {
  // ---- Stats e listagem ----
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(false);

  // ---- Filtros ----
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');

  // ---- Upload (staging) ----
  const [stagedFiles, setStagedFiles] = useState([]);       // [{ id, file, previewUrl }]
  const [uploadCategorias, setUploadCategorias] = useState(['nenhuma']);
  const [uploadSubcategoria, setUploadSubcategoria] = useState('');
  const [uploadKeywords, setUploadKeywords] = useState('');
  const [uploadAprovar, setUploadAprovar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ---- Imagens (cache blob URLs) ----
  const [imagens, setImagens] = useState({});
  const urlsRef = useRef(new Set());

  // ---- Seleção em lote ----
  const [selecionados, setSelecionados] = useState([]);

  // ---- Modal de edição individual ----
  const [editandoItem, setEditandoItem] = useState(null);
  const [formEdit, setFormEdit] = useState({
    nome: '',
    categorias: [],
    subcategoria: '',
    keywords: '',
    aprovada: true,
  });
  const [salvando, setSalvando] = useState(false);

  // ---- Modal de categorização em lote ----
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [loteCategorias, setLoteCategorias] = useState([]);
  const [loteModo, setLoteModo] = useState('adicionar');
  const [processandoLote, setProcessandoLote] = useState(false);

  // ---- Feedback ----
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // ============================================================
  // CARREGAMENTOS
  // ============================================================
  const carregarStats = async () => {
    try {
      const res = await api.get('/admin/figure-bank/stats/resumo');
      setStats(res.data);
    } catch (e) {
      console.warn('Erro ao carregar stats:', e);
    }
  };

  const carregarItens = async () => {
    setLoading(true);
    setErro('');
    try {
      const params = { page, per_page: 40 };
      if (filtroCategoria) params.categoria = filtroCategoria;
      if (filtroBusca) params.busca = filtroBusca;

      const res = await api.get('/admin/figure-bank', { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPaginas(res.data.total_pages || 1);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao carregar figuras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarStats(); }, []);
  useEffect(() => {
    carregarItens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtroCategoria, filtroBusca]);

  // ============================================================
  // CARREGAR IMAGENS (blob URLs)
  // ============================================================
  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      for (const item of items) {
        if (cancelado) return;
        if (imagens[item.id]) continue;
        try {
          const res = await api.get(`/admin/figure-bank/${item.id}/image`, {
            responseType: 'blob',
          });
          if (cancelado) return;
          const url = URL.createObjectURL(res.data);
          urlsRef.current.add(url);
          setImagens(prev => ({ ...prev, [item.id]: url }));
        } catch (e) {
          console.warn('Erro ao carregar imagem', item.id, e);
        }
      }
    };
    if (items.length > 0) carregar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    const urlsAtuais = urlsRef.current;
    return () => {
      urlsAtuais.forEach(url => URL.revokeObjectURL(url));
      urlsAtuais.clear();
    };
  }, []);

  // ============================================================
  // UPLOAD — STAGING
  // ============================================================
  const adicionarArquivosStaging = (files) => {
    if (!files || files.length === 0) return;
    const novos = [];
    for (const file of Array.from(files)) {
      // Valida tamanho antes de staged
      if (file.size > 5 * 1024 * 1024) {
        setErro(`"${file.name}" é muito grande (máx. 5 MB). Ignorado.`);
        continue;
      }
      const id = `stage-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.add(previewUrl);
      novos.push({ id, file, previewUrl });
    }
    if (novos.length > 0) {
      setStagedFiles(prev => [...prev, ...novos]);
      setSucesso(`${novos.length} arquivo(s) adicionado(s) à fila de upload.`);
      setTimeout(() => setSucesso(''), 2500);
    }
  };

  const removerStaging = (id) => {
    setStagedFiles(prev => {
      const alvo = prev.find(x => x.id === id);
      if (alvo?.previewUrl) {
        URL.revokeObjectURL(alvo.previewUrl);
        urlsRef.current.delete(alvo.previewUrl);
      }
      return prev.filter(x => x.id !== id);
    });
  };

  const limparStaging = () => {
    stagedFiles.forEach(f => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl);
        urlsRef.current.delete(f.previewUrl);
      }
    });
    setStagedFiles([]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    adicionarArquivosStaging(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const toggleUploadCategoria = (valor) => {
    setUploadCategorias(prev => {
      if (prev.includes(valor)) {
        const novas = prev.filter(x => x !== valor);
        return novas.length > 0 ? novas : ['nenhuma'];
      }
      // Se clicar em "nenhuma", limpa as outras
      if (valor === 'nenhuma') return ['nenhuma'];
      // Se clicar em outra, remove "nenhuma"
      return [...prev.filter(x => x !== 'nenhuma'), valor];
    });
  };

  const confirmarUpload = async () => {
    if (stagedFiles.length === 0) return;
    setErro(''); setSucesso(''); setUploading(true);

    try {
      const form = new FormData();
      stagedFiles.forEach(({ file }) => form.append('files', file));
      form.append('categorias', uploadCategorias.join(','));
      if (uploadSubcategoria) form.append('subcategoria', uploadSubcategoria);
      if (uploadKeywords) form.append('keywords', uploadKeywords);
      form.append('aprovada', uploadAprovar ? 'true' : 'false');

      const res = await api.post('/admin/figure-bank/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const r = res.data;
      if (r.total_erro > 0) {
        const msgErros = r.erros.map(e => `• ${e.filename}: ${e.motivo}`).join('\n');
        setErro(`${r.total_sucesso} enviadas com sucesso. ${r.total_erro} falharam:\n${msgErros}`);
      } else {
        setSucesso(`✅ ${r.total_sucesso} figura(s) enviada(s) com sucesso!`);
      }

      limparStaging();
      setUploadSubcategoria('');
      setUploadKeywords('');
      setUploadAprovar(false);

      setPage(1);
      await carregarItens();
      await carregarStats();
      setTimeout(() => setSucesso(''), 3500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao enviar figuras.');
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // SELEÇÃO EM LOTE
  // ============================================================
  const toggleSelecionado = (id) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selecionarTodos = () => setSelecionados(items.map(i => i.id));
  const limparSelecao = () => setSelecionados([]);

  const deletarLote = async () => {
    if (selecionados.length === 0) return;
    if (!window.confirm(`Excluir ${selecionados.length} figura(s)? Esta ação não pode ser desfeita.`)) return;
    setProcessandoLote(true); setErro('');
    try {
      await api.post('/admin/figure-bank/batch/delete', { ids: selecionados });
      setSucesso(`🗑️ ${selecionados.length} figura(s) removida(s).`);
      setSelecionados([]);
      await carregarItens();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao excluir em lote.');
    } finally {
      setProcessandoLote(false);
    }
  };

  const aprovarLote = async () => {
    if (selecionados.length === 0) return;
    setProcessandoLote(true); setErro('');
    try {
      await api.post('/admin/figure-bank/batch/approve', { ids: selecionados });
      setSucesso(`✅ ${selecionados.length} figura(s) aprovada(s).`);
      setSelecionados([]);
      await carregarItens();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao aprovar em lote.');
    } finally {
      setProcessandoLote(false);
    }
  };

  const desaprovarLote = async () => {
    if (selecionados.length === 0) return;
    setProcessandoLote(true); setErro('');
    try {
      await api.post('/admin/figure-bank/batch/unapprove', { ids: selecionados });
      setSucesso(`⏳ ${selecionados.length} figura(s) marcada(s) como pendente(s).`);
      setSelecionados([]);
      await carregarItens();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao desaprovar em lote.');
    } finally {
      setProcessandoLote(false);
    }
  };

  const abrirModalLote = () => {
    setLoteCategorias([]);
    setLoteModo('adicionar');
    setModalLoteAberto(true);
  };

  const confirmarCategorizacaoLote = async () => {
    if (loteCategorias.length === 0) {
      setErro('Escolha pelo menos uma categoria.');
      return;
    }
    setProcessandoLote(true); setErro('');
    try {
      await api.post('/admin/figure-bank/batch/categorize', {
        ids: selecionados,
        categorias: loteCategorias,
        modo: loteModo,
      });
      setSucesso(`✅ Categorias atualizadas em ${selecionados.length} figura(s).`);
      setSelecionados([]);
      setModalLoteAberto(false);
      await carregarItens();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao categorizar em lote.');
    } finally {
      setProcessandoLote(false);
    }
  };

  // ============================================================
  // DELETAR INDIVIDUAL
  // ============================================================
  const deletar = async (item) => {
    if (!window.confirm(`Remover a figura "${item.nome}"?`)) return;
    try {
      await api.delete(`/admin/figure-bank/${item.id}`);
      setSucesso('🗑️ Figura removida.');
      await carregarItens();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao remover.');
    }
  };

  // ============================================================
  // EDIÇÃO INDIVIDUAL
  // ============================================================
  const abrirEdicao = (item) => {
    setEditandoItem(item);
    setFormEdit({
      nome: item.nome || '',
      categorias: item.categorias && item.categorias.length > 0
        ? item.categorias
        : (item.categoria ? [item.categoria] : ['nenhuma']),
      subcategoria: item.subcategoria || '',
      keywords: (item.keywords || []).join(', '),
      aprovada: item.aprovada !== false,
    });
  };

  const toggleCategoriaEdit = (valor) => {
    setFormEdit(f => {
      const atuais = f.categorias;
      if (atuais.includes(valor)) {
        const novas = atuais.filter(x => x !== valor);
        return { ...f, categorias: novas.length > 0 ? novas : ['nenhuma'] };
      }
      if (valor === 'nenhuma') return { ...f, categorias: ['nenhuma'] };
      return { ...f, categorias: [...atuais.filter(x => x !== 'nenhuma'), valor] };
    });
  };

  const salvarEdicao = async () => {
    if (!editandoItem) return;
    setSalvando(true); setErro('');
    try {
      const payload = {
        nome: formEdit.nome.trim(),
        categorias: formEdit.categorias,
        subcategoria: formEdit.subcategoria.trim() || null,
        keywords: formEdit.keywords.split(',').map(k => k.trim()).filter(k => k),
        aprovada: formEdit.aprovada,
      };
      await api.patch(`/admin/figure-bank/${editandoItem.id}`, payload);
      setSucesso('✅ Figura atualizada.');
      setEditandoItem(null);
      await carregarItens();
      await carregarStats();
      setTimeout(() => setSucesso(''), 2500);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao salvar edição.');
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const labelCategoria = (cat) => {
    const c = CATEGORIAS.find(x => x.value === cat);
    return c ? c.label : cat;
  };

  const limparFiltros = () => {
    setFiltroCategoria('');
    setFiltroBusca('');
    setPage(1);
  };

  const todasSelecionadas = items.length > 0 && selecionados.length === items.length;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏞️</span>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Banco de Figuras</h1>
            <p className="text-slate-600 text-sm mt-0.5">
              Suba figuras/ilustrações para serem usadas nas questões geradas pelo Motor 9.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total_figuras}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-green-600">Aprovadas</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.total_aprovadas}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-600">Pendentes</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{stats.total_pendentes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-600">Categorias</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{(stats.por_categoria || []).length}</p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* UPLOAD — STAGING                                             */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">📤 Subir novas figuras</h2>
        <p className="text-xs text-slate-500 mb-4">
          Escolha os arquivos, classifique-os abaixo e confirme o upload.
        </p>

        {/* Área de escolha */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            onChange={(e) => adicionarArquivosStaging(e.target.files)}
            className="hidden"
          />
          <p className="text-3xl mb-2">📁</p>
          <p className="text-sm font-medium text-slate-700 mb-3">
            Arraste arquivos aqui ou clique no botão abaixo
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition"
          >
            📤 Escolher arquivos
          </button>
          <p className="text-xs text-slate-500 mt-2">
            SVG, PNG, JPG ou WEBP — até 5 MB por arquivo
          </p>
        </div>

        {/* Fila de upload */}
        {stagedFiles.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <p className="text-sm font-semibold text-blue-900">
                📋 {stagedFiles.length} arquivo(s) na fila — aguardando confirmação
              </p>
              <button
                type="button"
                onClick={limparStaging}
                className="text-xs text-red-700 hover:text-red-900 font-medium"
              >
                🗑️ Limpar fila
              </button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {stagedFiles.map(item => (
                <div key={item.id} className="relative bg-white border border-blue-200 rounded-lg overflow-hidden group">
                  <div className="h-20 flex items-center justify-center p-1.5">
                    <img src={item.previewUrl} alt={item.file.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removerStaging(item.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition"
                    title="Remover da fila"
                  >
                    ×
                  </button>
                  <p className="text-[9px] text-slate-500 truncate px-1 pb-1">{item.file.name}</p>
                </div>
              ))}
            </div>

            {/* Classificação */}
            <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Categorias (aplica a todos os arquivos — uma figura pode ter várias)
                </label>
                <CategoriaChips
                  selecionadas={uploadCategorias}
                  onToggle={toggleUploadCategoria}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subcategoria (opcional)
                  </label>
                  <input
                    type="text"
                    value={uploadSubcategoria}
                    onChange={(e) => setUploadSubcategoria(e.target.value)}
                    placeholder="Ex: frutas, animais, brinquedos"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Palavras-chave (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={uploadKeywords}
                    onChange={(e) => setUploadKeywords(e.target.value)}
                    placeholder="Ex: carrinho, brinquedo, roda"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={uploadAprovar}
                  onChange={(e) => setUploadAprovar(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-slate-700">
                  Aprovar automaticamente após upload
                </span>
                <span className="text-xs text-slate-500">
                  (desmarcado = figuras entram como pendentes para revisão)
                </span>
              </label>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200">
              <button
                type="button"
                onClick={confirmarUpload}
                disabled={uploading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3 rounded-lg transition"
              >
                {uploading
                  ? `⏳ Enviando ${stagedFiles.length} arquivo(s)...`
                  : `📤 Subir ${stagedFiles.length} arquivo(s)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* FILTROS                                                      */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-800">🔍 Filtrar figuras do banco</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Use os filtros abaixo para encontrar figuras específicas na listagem.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => { setFiltroCategoria(e.target.value); setPage(1); }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Todas as categorias</option>
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar</label>
            <input
              type="text"
              value={filtroBusca}
              onChange={(e) => { setFiltroBusca(e.target.value); setPage(1); }}
              placeholder="Nome ou palavra-chave"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={limparFiltros}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm border border-slate-300"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-sm whitespace-pre-line">
          ⚠️ {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4 text-sm">
          {sucesso}
        </div>
      )}

      {/* ============================================================ */}
      {/* LISTAGEM                                                     */}
      {/* ============================================================ */}
      {loading && <p className="text-slate-500 text-sm">Carregando...</p>}

      {!loading && items.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🏞️</p>
          <p className="text-slate-500">Nenhuma figura cadastrada ainda.</p>
          <p className="text-xs text-slate-400 mt-1">Use a área de upload acima para começar.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          {/* Barra de seleção */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={todasSelecionadas}
                  onChange={() => todasSelecionadas ? limparSelecao() : selecionarTodos()}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-medium text-slate-700">
                  {todasSelecionadas ? 'Desmarcar todos' : 'Selecionar todos'}
                </span>
              </label>
              {selecionados.length > 0 && (
                <>
                  <span className="text-xs text-blue-700 font-semibold">
                    {selecionados.length} selecionada(s)
                  </span>
                  <button
                    onClick={limparSelecao}
                    className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                  >
                    ✗ Limpar seleção
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500">
              <strong>{total}</strong> figura(s) • Página {page} de {totalPaginas}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map(item => {
              const selecionado = selecionados.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border-2 overflow-hidden transition ${
                    selecionado ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="relative bg-slate-50 h-32 flex items-center justify-center p-3 border-b border-slate-200">
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => toggleSelecionado(item.id)}
                      className="absolute top-2 left-2 w-4 h-4 text-blue-600 rounded cursor-pointer z-10"
                    />
                    {!item.aprovada && (
                      <span className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        PENDENTE
                      </span>
                    )}
                    {imagens[item.id] ? (
                      <img
                        src={imagens[item.id]}
                        alt={item.nome}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-2xl text-slate-300">⏳</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={item.nome}>
                      {item.nome}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(item.categorias || []).slice(0, 2).map(c => (
                        <span key={c} className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          {labelCategoria(c)}
                        </span>
                      ))}
                      {(item.categorias || []).length > 2 && (
                        <span className="text-[9px] text-slate-500">
                          +{item.categorias.length - 2}
                        </span>
                      )}
                    </div>
                    {item.subcategoria && (
                      <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                        📁 {item.subcategoria}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => abrirEdicao(item)}
                        className="flex-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 rounded"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => deletar(item)}
                        className="text-[10px] bg-white hover:bg-red-50 text-red-700 border border-red-300 px-2 py-1 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-slate-600">Página {page} de {totalPaginas}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                disabled={page === totalPaginas}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* BARRA FLUTUANTE DE AÇÕES EM LOTE                             */}
      {/* ============================================================ */}
      {selecionados.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-3 flex flex-wrap items-center gap-3 max-w-[95vw]">
          <span className="text-sm font-semibold">
            {selecionados.length} selecionada(s)
          </span>
          <div className="h-5 w-px bg-slate-700 hidden md:block" />
          <button
            onClick={aprovarLote}
            disabled={processandoLote}
            className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium px-3 py-1.5 rounded"
          >
            ✅ Aprovar
          </button>
          <button
            onClick={desaprovarLote}
            disabled={processandoLote}
            className="text-xs bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 text-white font-medium px-3 py-1.5 rounded"
          >
            ⏳ Desaprovar
          </button>
          <button
            onClick={abrirModalLote}
            disabled={processandoLote}
            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium px-3 py-1.5 rounded"
          >
            🏷️ Mudar categorias
          </button>
          <button
            onClick={deletarLote}
            disabled={processandoLote}
            className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-medium px-3 py-1.5 rounded"
          >
            🗑️ Excluir
          </button>
          <button
            onClick={limparSelecao}
            className="text-xs text-slate-400 hover:text-white font-medium"
          >
            ✗ Cancelar
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE EDIÇÃO INDIVIDUAL                                   */}
      {/* ============================================================ */}
      {editandoItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">✏️ Editar figura</h3>
              <button
                onClick={() => setEditandoItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center bg-slate-50 rounded-lg p-3">
                {imagens[editandoItem.id] && (
                  <img
                    src={imagens[editandoItem.id]}
                    alt={editandoItem.nome}
                    className="max-h-32 mx-auto object-contain"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                <input
                  type="text"
                  value={formEdit.nome}
                  onChange={(e) => setFormEdit(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Categorias (pode escolher várias)
                </label>
                <CategoriaChips
                  selecionadas={formEdit.categorias}
                  onToggle={toggleCategoriaEdit}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Subcategoria (opcional)
                </label>
                <input
                  type="text"
                  value={formEdit.subcategoria}
                  onChange={(e) => setFormEdit(f => ({ ...f, subcategoria: e.target.value }))}
                  placeholder="Ex: frutas, animais, brinquedos"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Palavras-chave (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formEdit.keywords}
                  onChange={(e) => setFormEdit(f => ({ ...f, keywords: e.target.value }))}
                  placeholder="Ex: carrinho, brinquedo, roda"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={formEdit.aprovada}
                  onChange={(e) => setFormEdit(f => ({ ...f, aprovada: e.target.checked }))}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-slate-700">Figura aprovada</span>
                <span className="text-xs text-slate-500">
                  (desmarcado = fica pendente e não aparece no Motor 9)
                </span>
              </label>
            </div>
            <div className="p-5 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setEditandoItem(null)}
                className="flex-1 border border-slate-300 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded-lg"
              >
                {salvando ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE CATEGORIZAÇÃO EM LOTE                               */}
      {/* ============================================================ */}
      {modalLoteAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                🏷️ Mudar categorias em lote
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Aplicar em <strong>{selecionados.length}</strong> figura(s) selecionada(s).
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Categorias
                </label>
                <CategoriaChips
                  selecionadas={loteCategorias}
                  onToggle={(valor) => {
                    setLoteCategorias(prev => {
                      if (prev.includes(valor)) {
                        return prev.filter(x => x !== valor);
                      }
                      if (valor === 'nenhuma') return ['nenhuma'];
                      return [...prev.filter(x => x !== 'nenhuma'), valor];
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Modo de aplicação
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-sm border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="modo-lote"
                      checked={loteModo === 'adicionar'}
                      onChange={() => setLoteModo('adicionar')}
                      className="mt-0.5"
                    />
                    <span>
                      <strong className="text-slate-800">Adicionar</strong>
                      <span className="block text-xs text-slate-600 mt-0.5">
                        Soma as novas categorias às que já existem em cada figura.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer text-sm border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="modo-lote"
                      checked={loteModo === 'substituir'}
                      onChange={() => setLoteModo('substituir')}
                      className="mt-0.5"
                    />
                    <span>
                      <strong className="text-slate-800">Substituir</strong>
                      <span className="block text-xs text-slate-600 mt-0.5">
                        Troca todas as categorias existentes pelas novas.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setModalLoteAberto(false)}
                className="flex-1 border border-slate-300 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCategorizacaoLote}
                disabled={processandoLote || loteCategorias.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded-lg"
              >
                {processandoLote ? '⏳ Aplicando...' : '💾 Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFigureBank;