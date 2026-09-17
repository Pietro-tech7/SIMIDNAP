import React, { useState, useEffect } from 'react';
import api from '../api/api';

const SidebarBanner = () => {
  const [banner, setBanner] = useState(null);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    const jaFechou = sessionStorage.getItem('sidebar_banner_fechado');
    if (jaFechou === 'true') {
      setFechado(true);
      return;
    }

    api.get('/banners/ativo')
      .then(res => {
        if (res.data && res.data.ativo) {
          setBanner(res.data);
        }
      })
      .catch(() => setBanner(null));
  }, []);

  const handleFechar = () => {
    sessionStorage.setItem('sidebar_banner_fechado', 'true');
    setFechado(true);
  };

  if (fechado || !banner) return null;

  // Renderiza o conteúdo de mídia conforme o tipo
  const renderMidia = () => {
    if (!banner.imagem_url) return null;

    switch (banner.tipo_midia) {
      case 'imagem':
  return (
    <img
      src={banner.imagem_url}
      alt={banner.titulo || 'Banner'}
      className="w-full h-full object-cover"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );

      case 'video':
        return (
          <video
            src={banner.imagem_url}
            controls
            className="w-full h-full object-cover"
            playsInline
          />
        );

      case 'embed_instagram':
        return (
          <iframe
            src={banner.imagem_url}
            className="w-full h-full"
            frameBorder="0"
            scrolling="no"
            allowTransparency="true"
            allowFullScreen
            title="Instagram"
          />
        );

      case 'embed_tiktok':
        return (
          <iframe
            src={banner.imagem_url}
            className="w-full h-full"
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            title="TikTok"
          />
        );

      case 'embed_facebook':
        return (
          <iframe
            src={banner.imagem_url}
            className="w-full h-full"
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            title="Facebook"
          />
        );

      default:
        return null;
    }
  };

  const temMidia = banner.tipo_midia && banner.tipo_midia !== 'nenhuma' && banner.imagem_url;

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {/* Cabeçalho do banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-white font-semibold uppercase tracking-wide">
              ✨ Recomendado
            </span>
            <button
              onClick={handleFechar}
              className="w-6 h-6 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 flex items-center justify-center text-white font-bold text-sm transition"
              title="Ocultar"
            >
              ×
            </button>
          </div>

            {/* Mídia (9:16) */}
          {temMidia && (
            <div
              className="relative w-full bg-gray-100 overflow-hidden"
              style={{ paddingBottom: '177.78%' }} // 16/9 = 1.7778 → 9:16
            >
              <div className="absolute inset-0">
                {renderMidia()}
              </div>
            </div>
          )}

          {/* Conteúdo textual */}
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              {banner.imagem_perfil && (
                <img
                  src={banner.imagem_perfil}
                  alt="Perfil"
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-200 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                {banner.titulo && (
                  <h3 className="font-bold text-gray-900 text-sm">
                    {banner.titulo}
                  </h3>
                )}
                <p className="text-sm text-gray-700 leading-snug mt-1">
                  {banner.texto}
                </p>
              </div>
            </div>

            {/* Botão de ação */}
            {banner.link_url && (
              <a
                href={banner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm py-2.5 rounded-lg transition"
              >
                {banner.telefone ? `📞 ${banner.telefone}` : 'Saiba mais'}
              </a>
            )}

            {!banner.link_url && banner.telefone && (
              <p className="text-center text-sm font-semibold text-purple-700">
                📞 {banner.telefone}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarBanner;