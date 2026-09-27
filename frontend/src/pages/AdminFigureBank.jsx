import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';

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

const AdminFigureBank = () => {
  const [stats, setStats] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(false);

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');

  const [uploadCategoria, setUploadCategoria] = useState('nenhuma');
  const [uploadSubcategoria, setUploadSubcategoria] = useState('');
  const [uploadKeywords, setUploadKeywords] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [imagens, setImagens] = useState({});
  const urlsRef = useRef(new Set());

  const [editandoItem, setEditandoItem] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: '', categoria: 'nenhuma', subcategoria: '', keywords: '' });
  const [salvando, setSalvando] = useState(false);

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
  // UPLOAD
  // ============================================================
  const uploadArquivos = async (files) => {
    if (!files || files.length === 0) return;
    setErro(''); setSucesso(''); setUploading(true);

    try {
      const form = new FormData();
      Array.from(files).forEach(f => form.append('files', f));
      if (uploadCategoria) form.append('categoria', uploadCategoria);
      if (uploadSubcategoria) form.append('subcategoria', uploadSubcategoria);
      if (uploadKeywords) form.append('keywords', uploadKeywords);

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

      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadArquivos(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  // ============================================================
  // DELETAR
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
  // EDIÇÃO
  // ============================================================
  const abrirEdicao = (item) => {
    setEditandoItem(item);
    setFormEdit({
      nome: item.nome || '',
      categoria: item.categoria || 'nenhuma',
      subcategoria: item.subcategoria || '',
      keywords: (item.keywords || []).join(', '),
    });
  };

  const salvarEdicao = async () => {
    if (!editandoItem) return;
    setSalvando(true); setErro('');
    try {
      const payload = {
        nome: formEdit.nome.trim(),
        categoria: formEdit.categoria,
        subcategoria: formEdit.subcategoria.trim() || null,
        keywords: formEdit.keywords.split(',').map(k => k.trim()).filter(k => k),
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
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

      {/* UPLOAD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">📤 Subir novas figuras</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria (aplica a todos)</label>
            <select value={uploadCategoria} onChange={(e) => setUploadCategoria(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subcategoria (opcional)</label>
            <input type="text" value={uploadSubcategoria}
              onChange={(e) => setUploadSubcategoria(e.target.value)}
              placeholder="Ex: frutas, animais, brinquedos"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Palavras-chave (separadas por vírgula)</label>
            <input type="text" value={uploadKeywords}
              onChange={(e) => setUploadKeywords(e.target.value)}
              placeholder="Ex: carrinho, brinquedo, roda"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            onChange={(e) => uploadArquivos(e.target.files)}
            className="hidden"
          />
          {uploading ? (
            <p className="text-sm text-slate-600">⏳ Enviando... Aguarde.</p>
          ) : (
            <>
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm font-medium text-slate-700">
                Arraste arquivos aqui ou clique para escolher
              </p>
              <p className="text-xs text-slate-500 mt-1">
                SVG, PNG, JPG ou WEBP — até 5 MB por arquivo
              </p>
            </>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
            <select value={filtroCategoria} onChange={(e) => { setFiltroCategoria(e.target.value); setPage(1); }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Todas</option>
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar</label>
            <input type="text" value={filtroBusca}
              onChange={(e) => { setFiltroBusca(e.target.value); setPage(1); }}
              placeholder="Nome ou palavra-chave"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={limparFiltros}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm border border-slate-300">
              Limpar
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
          ✅ {sucesso}
        </div>
      )}

      {/* Lista */}
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
          <p className="text-sm text-slate-600 mb-3">
            <strong>{total}</strong> figura(s) • Página {page} de {totalPaginas}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition">
                <div className="bg-slate-50 h-32 flex items-center justify-center p-3 border-b border-slate-200">
                  {imagens[item.id] ? (
                    <img src={imagens[item.id]} alt={item.nome} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-2xl text-slate-300">⏳</span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-slate-800 truncate" title={item.nome}>
                    {item.nome}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {labelCategoria(item.categoria)}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => abrirEdicao(item)}
                      className="flex-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 rounded">
                      ✏️ Editar
                    </button>
                    <button onClick={() => deletar(item)}
                      className="text-[10px] bg-white hover:bg-red-50 text-red-700 border border-red-300 px-2 py-1 rounded">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

      {/* Modal de Edição */}
      {editandoItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">✏️ Editar figura</h3>
              <button onClick={() => setEditandoItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center bg-slate-50 rounded-lg p-3">
                {imagens[editandoItem.id] && (
                  <img src={imagens[editandoItem.id]} alt={editandoItem.nome}
                    className="max-h-32 mx-auto object-contain" />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                <input type="text" value={formEdit.nome}
                  onChange={(e) => setFormEdit(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
                <select value={formEdit.categoria}
                  onChange={(e) => setFormEdit(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {CATEGORIAS.map(c => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subcategoria (opcional)</label>
                <input type="text" value={formEdit.subcategoria}
                  onChange={(e) => setFormEdit(f => ({ ...f, subcategoria: e.target.value }))}
                  placeholder="Ex: frutas, animais, brinquedos"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Palavras-chave (separadas por vírgula)</label>
                <input type="text" value={formEdit.keywords}
                  onChange={(e) => setFormEdit(f => ({ ...f, keywords: e.target.value }))}
                  placeholder="Ex: carrinho, brinquedo, roda"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex gap-3">
              <button onClick={() => setEditandoItem(null)}
                className="flex-1 border border-slate-300 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={salvarEdicao} disabled={salvando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded-lg">
                {salvando ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFigureBank;