import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';

const AdminBanners = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [bannerEditando, setBannerEditando] = useState(null);

  const [enviandoPerfil, setEnviandoPerfil] = useState(false);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [erroUpload, setErroUpload] = useState(null);

  const inputPerfilRef = useRef(null);
  const inputMidiaRef = useRef(null);

  const formVazio = {
    titulo: '',
    texto: '',
    imagem_perfil: '',
    tipo_midia: 'nenhuma',
    imagem_url: '',
    link_url: '',
    telefone: '',
  };

  const [form, setForm] = useState(formVazio);

  useEffect(() => {
    if (user && !user.is_superuser) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/banners/all');
      setBanners(res.data);
    } catch (err) {
      if (err.response?.status === 403) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const resetForm = () => {
    setForm(formVazio);
    setBannerEditando(null);
    setCriando(false);
    setErroUpload(null);
  };

  // ============================================================
  // UPLOAD DE ARQUIVO PARA O BACKEND
  // ============================================================
  const uploadArquivo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/banners/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  };

  const handleUploadPerfil = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErroUpload(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErroUpload('Foto de perfil: use JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErroUpload('Foto de perfil: máximo 5 MB.');
      return;
    }

    setEnviandoPerfil(true);
    try {
      const url = await uploadArquivo(file);
      setForm(f => ({ ...f, imagem_perfil: url }));
    } catch (err) {
      setErroUpload(err.response?.data?.detail || 'Erro ao enviar foto.');
    } finally {
      setEnviandoPerfil(false);
      if (inputPerfilRef.current) inputPerfilRef.current.value = '';
    }
  };

  const handleUploadMidia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErroUpload(null);

    const ehVideo = form.tipo_midia === 'video';
    const tiposAceitos = ehVideo
      ? ['video/mp4']
      : ['image/jpeg', 'image/png', 'image/webp'];

    if (!tiposAceitos.includes(file.type)) {
      setErroUpload(ehVideo ? 'Envie um arquivo MP4.' : 'Use JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErroUpload('Mídia: máximo 5 MB.');
      return;
    }

    setEnviandoMidia(true);
    try {
      const url = await uploadArquivo(file);
      setForm(f => ({ ...f, imagem_url: url }));
    } catch (err) {
      setErroUpload(err.response?.data?.detail || 'Erro ao enviar mídia.');
    } finally {
      setEnviandoMidia(false);
      if (inputMidiaRef.current) inputMidiaRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSalvando(true);

    try {
      if (bannerEditando) {
        await api.put(`/banners/${bannerEditando.id}`, form);
        setMsg({ tipo: 'sucesso', texto: 'Banner atualizado!' });
      } else {
        await api.post('/banners', form);
        setMsg({ tipo: 'sucesso', texto: 'Banner criado e ativado!' });
      }
      resetForm();
      await carregar();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.response?.data?.detail || 'Erro ao salvar.' });
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (banner) => {
    setBannerEditando(banner);
    setForm({
      titulo: banner.titulo || '',
      texto: banner.texto || '',
      imagem_perfil: banner.imagem_perfil || '',
      tipo_midia: banner.tipo_midia || 'nenhuma',
      imagem_url: banner.imagem_url || '',
      link_url: banner.link_url || '',
      telefone: banner.telefone || '',
    });
    setCriando(true);
    setMsg(null);
    setErroUpload(null);
  };

  const handleDesativar = async (id) => {
    if (!window.confirm('Desativar este banner?')) return;
    try {
      await api.put(`/banners/${id}/desativar`);
      await carregar();
    } catch {
      alert('Erro ao desativar.');
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir permanentemente este banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      await carregar();
    } catch {
      alert('Erro ao excluir.');
    }
  };

  if (!user?.is_superuser) return null;

  const ehUpload = form.tipo_midia === 'imagem' || form.tipo_midia === 'video';
  const ehEmbed = form.tipo_midia.startsWith('embed_');

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Banners</h1>
          <p className="text-gray-400 mt-1">
            Anúncios e mídias que aparecem na coluna lateral dos professores.
          </p>
        </div>
        <button
          onClick={() => {
            if (criando) resetForm();
            else setCriando(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
        >
          {criando ? 'Cancelar' : '+ Novo banner'}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 text-sm rounded-lg p-3 border ${
          msg.tipo === 'sucesso'
            ? 'bg-green-900 bg-opacity-50 border-green-700 text-green-200'
            : 'bg-red-900 bg-opacity-50 border-red-700 text-red-200'
        }`}>
          {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
        </div>
      )}

      {erroUpload && (
        <div className="mb-4 text-sm rounded-lg p-3 border bg-yellow-900 bg-opacity-50 border-yellow-700 text-yellow-200">
          ⚠️ {erroUpload}
        </div>
      )}

      {/* FORMULÁRIO */}
      {criando && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {bannerEditando ? 'Editar banner' : 'Novo banner'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Título (opcional)
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Atendimento Psicanalítico"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Texto principal *
              </label>
              <textarea
                value={form.texto}
                onChange={(e) => setForm({ ...form, texto: e.target.value })}
                required
                rows="3"
                placeholder="Ex: Atendimento psicanalítico com Darilson Cornelio. Agende sua sessão!"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FOTO DE PERFIL — UPLOAD */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Foto de perfil
                </label>
                <input
                  ref={inputPerfilRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadPerfil}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputPerfilRef.current?.click()}
                    disabled={enviandoPerfil}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {enviandoPerfil ? 'Enviando...' : '📷 Escolher foto'}
                  </button>
                  {form.imagem_perfil && (
                    <>
                      <img
                        src={form.imagem_perfil}
                        alt="Prévia"
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imagem_perfil: '' })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remover
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Máximo 5 MB · JPG, PNG ou WEBP</p>
              </div>

              {/* TELEFONE */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="Ex: (99) 99999-9999"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Link de destino (ao clicar)
              </label>
              <input
                type="text"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://wa.me/5599999999999"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tipo de mídia
              </label>
              <select
                value={form.tipo_midia}
                onChange={(e) => setForm({ ...form, tipo_midia: e.target.value, imagem_url: '' })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="nenhuma">Apenas texto (sem mídia)</option>
                <option value="imagem">Imagem (upload)</option>
                <option value="video">Vídeo MP4 (upload)</option>
                <option value="embed_instagram">Instagram (URL do post)</option>
                <option value="embed_tiktok">TikTok (URL do vídeo)</option>
                <option value="embed_facebook">Facebook (URL do vídeo)</option>
              </select>
            </div>

            {/* CAMPO DE MÍDIA — MUDA CONFORME O TIPO */}
            {ehUpload && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {form.tipo_midia === 'video' ? 'Arquivo de vídeo (MP4)' : 'Arquivo de imagem'}
                </label>
                <input
                  ref={inputMidiaRef}
                  type="file"
                  accept={form.tipo_midia === 'video' ? 'video/mp4' : 'image/jpeg,image/png,image/webp'}
                  onChange={handleUploadMidia}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputMidiaRef.current?.click()}
                    disabled={enviandoMidia}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {enviandoMidia
                      ? 'Enviando...'
                      : form.tipo_midia === 'video'
                        ? '🎬 Escolher vídeo MP4'
                        : '🖼️ Escolher imagem'}
                  </button>
                  {form.imagem_url && form.tipo_midia === 'imagem' && (
                    <>
                      <img
                        src={form.imagem_url}
                        alt="Prévia"
                        className="w-12 h-20 rounded object-cover border-2 border-gray-600"
                        style={{ aspectRatio: '9/16' }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imagem_url: '' })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remover
                      </button>
                    </>
                  )}
                  {form.imagem_url && form.tipo_midia === 'video' && (
                    <span className="text-xs text-green-400">✓ Vídeo enviado</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {form.tipo_midia === 'video'
                    ? 'Máximo 5 MB · formato MP4'
                    : 'Máximo 5 MB · JPG, PNG ou WEBP · recomendado 9:16 (1080×1920)'}
                </p>
              </div>
            )}

            {ehEmbed && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL do {form.tipo_midia.replace('embed_', '').replace(/^\w/, c => c.toUpperCase())}
                </label>
                <input
                  type="text"
                  value={form.imagem_url}
                  onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                  placeholder={
                    form.tipo_midia === 'embed_instagram'
                      ? 'https://www.instagram.com/p/CODIGO_DO_POST/embed'
                      : form.tipo_midia === 'embed_tiktok'
                        ? 'https://www.tiktok.com/embed/v2/CODIGO_DO_VIDEO'
                        : 'https://www.facebook.com/plugins/video.php?href=URL'
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cole a URL de incorporação (embed) da rede social. Não é upload — é o link gerado pela própria rede.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold px-5 py-2.5 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-lg"
              >
                {salvando ? 'Salvando...' : bannerEditando ? 'Salvar alterações' : 'Criar e ativar'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* LISTA */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : banners.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center text-gray-400">
          Nenhum banner criado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div
              key={b.id}
              className={`bg-gray-800 rounded-xl border p-5 ${
                b.ativo ? 'border-green-600' : 'border-gray-700 opacity-70'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {b.ativo ? (
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold">
                      ● Ativo
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-600 text-gray-200 px-2 py-0.5 rounded-full">
                      Inativo
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{b.tipo_midia}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(b.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {b.titulo && <h3 className="text-white font-semibold">{b.titulo}</h3>}
              <p className="text-sm text-gray-300 mt-1">{b.texto}</p>

              {b.telefone && (
                <p className="text-xs text-purple-400 mt-2">📞 {b.telefone}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleEditar(b)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Editar
                </button>
                {b.ativo && (
                  <button
                    onClick={() => handleDesativar(b.id)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    Desativar
                  </button>
                )}
                <button
                  onClick={() => handleExcluir(b.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBanners;