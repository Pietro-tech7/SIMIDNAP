import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

/**
 * Alerta do Modo Turbo (antes "API Key do Gemini").
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
  const [config, setConfig] = useState(null);

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

    api.get('/landing/config')
      .then(res => setConfig(res.data?.config || null))
      .catch(() => setConfig(null));

    const handleUpdate = () => verificar();
    window.addEventListener('gemini-key-updated', handleUpdate);
    return () => window.removeEventListener('gemini-key-updated', handleUpdate);
  }, []);

  // Não renderiza se: verificando (null) OU já tem chave (true)
  if (temChave !== false) return null;

  const cfg = config?.api_banner || {};
  const pillText = cfg.badge_pill_text || 'Cadastre sua API';
  const pillTooltip = cfg.badge_pill_tooltip || 'Ative o Modo Turbo e libere centenas de créditos por mês';
  const cardBadge = cfg.card_badge || '⚡ Recomendado';
  const cardTitle = cfg.card_title || '🔑 Ative o Modo Turbo e multiplique seus créditos';
  const cardSubtitle = cfg.card_subtitle || 'É gratuita, leva 2 minutos e libera centenas de créditos por mês sem custo adicional.';
  const cardBullets = cfg.card_bullets?.length
    ? cfg.card_bullets
    : [
        'De 10 para até 500 créditos/mês no plano Básico — e ainda mais nos planos superiores',
        'Chave gratuita do Google (você não paga nada além da assinatura)',
        'Tutorial passo a passo com imagens + suporte via WhatsApp',
      ];
  const ctaPrimary = cfg.cta_primary_text || '🚀 Ativar Modo Turbo agora';
  const ctaSecondary = cfg.cta_secondary_text || '📖 Ver tutorial';

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
          title={pillTooltip}
        >
          <span className="text-sm">🔑</span>
          <span>{pillText}</span>
        </Link>

        {/* Mobile: só ícone */}
        <Link
          to="/perfil"
          className="md:hidden flex items-center justify-center w-9 h-9 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-base shadow-md"
          title={pillTooltip}
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
            {cardBadge}
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-2 font-heading">
          {cardTitle}
        </h2>
        <p className="text-white/95 text-sm md:text-base mb-4 max-w-2xl">
          {cardSubtitle}
        </p>

        <ul className="text-sm space-y-1.5 mb-5 max-w-2xl">
          {cardBullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-lg leading-none">✅</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/perfil"
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-6 py-3 rounded-xl shadow-md transition text-sm md:text-base"
          >
            {ctaPrimary}
          </Link>
          <Link
            to="/perfil"
            className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-semibold px-5 py-3 rounded-xl transition text-sm md:text-base"
          >
            {ctaSecondary}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AlertaApiKey;