import React, { useState, useEffect } from 'react';
import api from '../api/api';

const Banner = () => {
  const [banner, setBanner] = useState(null);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    // Não busca se o usuário já fechou nesta sessão
    const jaFechou = sessionStorage.getItem('banner_fechado');
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
    sessionStorage.setItem('banner_fechado', 'true');
    setFechado(true);
  };

  if (fechado || !banner) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
        {/* Imagem opcional */}
        {banner.imagem_url && (
          <img
            src={banner.imagem_url}
            alt="Banner"
            className="w-12 h-12 rounded-full object-cover border-2 border-white border-opacity-50 flex-shrink-0"
          />
        )}

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-base font-medium leading-snug">
            {banner.texto}
          </p>
        </div>

        {/* Ação */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {banner.link_url && (
            <a
              href={banner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-purple-700 text-xs md:text-sm font-semibold px-3 md:px-4 py-1.5 rounded-full hover:bg-opacity-90 transition whitespace-nowrap"
            >
              {banner.telefone ? `📞 ${banner.telefone}` : 'Saiba mais'}
            </a>
          )}

          {/* Botão fechar */}
          <button
            onClick={handleFechar}
            className="w-7 h-7 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center text-white font-bold transition"
            title="Fechar"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;