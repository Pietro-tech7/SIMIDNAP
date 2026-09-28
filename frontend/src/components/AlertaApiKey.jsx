import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

/**
 * Alerta de cadastro da API Key do Gemini.
 *
 * Duas variantes:
 *   - variant="badge" → pill compacto ao lado do avatar (Layout)
 *   - variant="card"  → card grande chamativo no Dashboard
 *
 * O componente só renderiza se o usuário NÃO tiver chave cadastrada.
 * Re-verifica sempre que o evento "gemini-key-updated" for disparado.
 */
const AlertaApiKey = ({ variant = 'card' }) => {
  const [temChave, setTemChave] = useState(null); // null = verificando | true/false

  const verificar = async () => {
    try {
      const res = await api.get('/users/me/gemini-key');
      setTemChave(res.data.tem_chave === true);
    } catch (e) {
      // Silencioso — não mostra alerta se não conseguir verificar
      setTemChave(null);
    }
  };

  useEffect(() => {
    verificar();
    const handleUpdate = () => verificar();
    window.addEventListener('gemini-key-updated', handleUpdate);
    return () => window.removeEventListener('gemini-key-updated', handleUpdate);
  }, []);

  // Não renderiza se: verificando (null) OU já tem chave (true)
  if (temChave !== false) return null;

  // ============================================================
  // VARIANTE BADGE — pill compacto
  // ============================================================
  if (variant === 'badge') {
    return (
      <>
        {/* Desktop: pill com texto */}
        <Link
          to="/perfil"
          className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-md transition animate-pulse-slow"
          title="Cadastre sua API Key e libere centenas de créditos por mês"
        >
          <span className="text-sm">🔑</span>
          <span>Cadastre sua API</span>
        </Link>

        {/* Mobile: só ícone */}
        <Link
          to="/perfil"
          className="md:hidden flex items-center justify-center w-9 h-9 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-base shadow-md"
          title="Cadastre sua API Key"
        >
          🔑
        </Link>
      </>
    );
  }

  // ============================================================
  // VARIANTE CARD — grande e chamativo (Dashboard)
  // ============================================================
  return (
    <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 mb-8 text-white shadow-xl relative overflow-hidden">
      {/* Fundo decorativo */}
      <div className="absolute -right-8 -top-8 text-[140px] opacity-10 select-none pointer-events-none">
        🔑
      </div>
      <div className="absolute -right-4 -bottom-6 text-[100px] opacity-10 select-none pointer-events-none">
        ✨
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            ⚡ Recomendado
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-2">
          🔑 Cadastre sua API Key do Gemini<br className="hidden md:inline" /> e multiplique seus créditos
        </h2>
        <p className="text-white/95 text-sm md:text-base mb-4 max-w-2xl">
          É <strong>gratuita</strong>, leva <strong>2 minutos</strong> e libera
          <strong> centenas de créditos por mês</strong> sem custo adicional.
        </p>

        <ul className="text-sm space-y-1.5 mb-5 max-w-2xl">
          <li className="flex items-start gap-2">
            <span className="text-lg leading-none">✅</span>
            <span><strong>De 10 para até 500 créditos/mês</strong> no plano Básico — e ainda mais nos planos superiores</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg leading-none">✅</span>
            <span>Chave <strong>gratuita</strong> do Google (você não paga nada além da assinatura)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg leading-none">✅</span>
            <span><strong>Tutorial passo a passo</strong> com imagens + suporte via WhatsApp</span>
          </li>
        </ul>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/perfil"
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-6 py-3 rounded-xl shadow-md transition text-sm md:text-base"
          >
            🚀 Cadastrar minha chave agora
          </Link>
          <Link
            to="/perfil"
            className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-semibold px-5 py-3 rounded-xl transition text-sm md:text-base"
          >
            📖 Ver tutorial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AlertaApiKey;