import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VideoEmbed } from './LandingSectionsPart1';

const Check = ({ className = '' }) => (
  <svg
    className={`w-5 h-5 flex-shrink-0 ${className}`}
    style={{ color: 'var(--theme-success)' }}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="3"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);


// ============================================================
// METRICS — Faixa azul escura com números em destaque
// ============================================================
export const MetricsSection = ({ data }) => {
  if (!data.metrics?.length) return null;

  const overlay = data.background_overlay ?? 0.85;

  return (
    <section id="metrics" className="relative py-20 md:py-28 overflow-hidden">
      {/* Vídeo de fundo (prioridade) */}
      {data.background_video_url ? (
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={data.background_video_url} />
          </video>
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--theme-bg-dark)', opacity: overlay }}
          />
        </div>
      ) : data.background_image ? (
        /* Imagem de fundo */
        <div className="absolute inset-0 z-0">
          <img
            src={data.background_image}
            alt=""
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--theme-bg-dark)', opacity: overlay }}
          />
        </div>
      ) : (
        /* Fallback: fundo sólido */
        <div className="absolute inset-0 z-0" style={{ backgroundColor: 'var(--theme-bg-dark)' }} />
      )}

      {/* Conteúdo */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 font-heading">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {data.subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {data.metrics.map((m, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-6xl font-bold text-white mb-3 leading-none font-heading">
                {m.value}
              </p>
              <p className="text-sm md:text-base leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ============================================================
// TESTIMONIALS — Foto destaque + quote + cards menores
// ============================================================
export const TestimonialsSection = ({ data }) => {
  const temDestaque = data.image || data.video_url;
  const temTestemunhos = data.testimonials?.length > 0;

  // Placeholder: sem nada
  if (!temDestaque && !temTestemunhos) {
    return (
      <section id="testimonials" className="py-20 md:py-28" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 font-heading"
              style={{ color: 'var(--theme-text-primary)' }}
            >{data.title}</h2>
            {data.subtitle && (
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: 'var(--theme-text-secondary)' }}
              >{data.subtitle}</p>
            )}
          </div>
          <div
            className="text-center border-2 border-dashed rounded-2xl p-12 max-w-2xl mx-auto"
            style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)' }}
          >
            <p className="text-5xl mb-3">💬</p>
            <p style={{ color: 'var(--theme-text-secondary)' }}>
              {data.empty_message || 'Em breve: depoimentos de professores que estão usando o SIMIDNAPE PRO.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Com destaque (foto + vídeo)
  if (temDestaque) {
    return (
      <section id="testimonials" className="py-20 md:py-28" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--theme-accent)' }}
            >
              {data.kicker || 'Depoimentos'}
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 font-heading"
              style={{ color: 'var(--theme-text-primary)' }}
            >{data.title}</h2>
            {data.subtitle && (
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: 'var(--theme-text-secondary)' }}
              >{data.subtitle}</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            {/* Foto */}
            <div className="lg:col-span-2">
              <div
                className="relative rounded-2xl overflow-hidden shadow-lg aspect-[3/4]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 10%, white)' }}
              >
                {data.image ? (
                  <>
                    <img src={data.image} alt="Depoimento destaque" className="w-full h-full object-cover" />
                    {data.video_url && (
                      <a
                        href={data.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
                      >
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
                          <svg className="w-10 h-10 ml-1" style={{ color: 'var(--theme-primary)' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </a>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span className="text-8xl mb-3">🎤</span>
                    <span className="text-sm font-medium">{data.image_placeholder || 'Foto do depoimento'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quote */}
            <div
              className="lg:col-span-3 bg-white rounded-2xl p-8 md:p-10 border shadow-sm"
              style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}
            >
              {data.testimonials?.[0] ? (
                <>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-4"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    {data.testimonials[0].school || 'Depoimento'}
                  </p>
                  <blockquote
                    className="text-xl md:text-2xl leading-relaxed mb-6 font-accent italic"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    "{data.testimonials[0].text}"
                  </blockquote>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold"
                      style={{ backgroundColor: 'var(--theme-primary)' }}
                    >
                      {data.testimonials[0].name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{data.testimonials[0].name}</p>
                      <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{data.testimonials[0].school}</p>
                    </div>
                  </div>
                  {data.video_url && (
                    <a
                      href={data.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-lg transition hover:opacity-90"
                      style={{ backgroundColor: 'var(--theme-primary)' }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Assistir ao depoimento
                    </a>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-5xl mb-3">💬</p>
                  <p style={{ color: 'var(--theme-text-secondary)' }}>Depoimento em breve.</p>
                </div>
              )}
            </div>
          </div>

          {/* Outros depoimentos */}
          {data.testimonials?.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {data.testimonials.slice(1).map((t, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border"
                  style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: 'var(--theme-primary)' }}
                    >
                      {t.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--theme-text-primary)' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>{t.school}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed italic" style={{ color: 'var(--theme-text-secondary)' }}>"{t.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Só depoimentos em cards
  return (
    <section id="testimonials" className="py-20 md:py-28" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 font-heading"
            style={{ color: 'var(--theme-text-primary)' }}
          >{data.title}</h2>
          {data.subtitle && (
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: 'var(--theme-text-secondary)' }}
            >{data.subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border"
              style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  {t.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--theme-text-primary)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>{t.school}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed italic" style={{ color: 'var(--theme-text-secondary)' }}>"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ============================================================
// COMPARISON
// ============================================================
export const ComparisonSection = ({ data }) => {
  return (
    <section id="comparison" className="py-20 md:py-28" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 font-heading"
            style={{ color: 'var(--theme-text-primary)' }}
          >{data.title}</h2>
        </div>

        <div
          className="overflow-hidden rounded-2xl border bg-white shadow-sm"
          style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 6%, white)' }}>
                <tr>
                  <th
                    className="px-4 md:px-6 py-4 text-left text-xs md:text-sm font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    {data.feature_column_label || 'Recurso'}
                  </th>
                  {data.columns?.map((col, i) => (
                    <th
                      key={i}
                      className="px-4 md:px-6 py-4 text-center text-xs md:text-sm font-bold uppercase tracking-wide"
                      style={
                        i === 0
                          ? {
                              color: 'var(--theme-accent)',
                              backgroundColor: 'color-mix(in srgb, var(--theme-accent) 12%, white)',
                            }
                          : { color: 'var(--theme-text-secondary)' }
                      }
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows?.map((row, i) => (
                  <tr
                    key={i}
                    className="transition"
                    style={{ borderTop: '1px solid color-mix(in srgb, var(--theme-accent) 10%, transparent)' }}
                  >
                    <td
                      className="px-4 md:px-6 py-4 text-sm font-medium"
                      style={{ color: 'var(--theme-text-primary)' }}
                    >
                      {row.feature}
                    </td>
                    {row.values?.map((val, j) => (
                      <td
                        key={j}
                        className="px-4 md:px-6 py-4 text-center text-lg"
                        style={
                          j === 0
                            ? { backgroundColor: 'color-mix(in srgb, var(--theme-accent) 6%, transparent)' }
                            : {}
                        }
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// FOUNDER OFFER — Oferta de Fundador com urgência
// ============================================================
export const FounderOfferSection = ({ data }) => {
  if (!data.enabled) return null;

  const pct = data.spots_total > 0
    ? Math.round(((data.spots_total - data.spots_remaining) / data.spots_total) * 100)
    : 0;

  const vagasRestantes = data.spots_remaining;
  const isUrgente = vagasRestantes <= 10;

  return (
    <section id="founder_offer" className="relative py-20 md:py-28 overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      {/* Elemento decorativo de fundo */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30 z-0" style={{ backgroundColor: 'var(--theme-primary)' }} />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30 z-0" style={{ backgroundColor: 'var(--theme-highlight)' }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6">
        <div
          className="relative rounded-3xl p-8 md:p-14 text-center shadow-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--theme-bg-dark) 0%, var(--theme-bg-dark) 70%, color-mix(in srgb, var(--theme-accent) 40%, var(--theme-bg-dark)) 100%)' }}
        >
          <div className="relative z-10">
            {/* Badge */}
            {data.badge && (
              <div
                className="inline-flex items-center gap-2 text-white text-xs md:text-sm font-bold uppercase tracking-wider px-5 py-2 rounded-full mb-8 shadow-lg"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                {data.badge}
              </div>
            )}

            {/* Título */}
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight max-w-3xl mx-auto font-heading">
              {data.title}
            </h2>

            {/* Descrição */}
            {data.description && (
              <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {data.description}
              </p>
            )}

            {/* Preço */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12 mb-10">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  De
                </p>
                <p className="text-2xl md:text-3xl line-through" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {data.price_normal}
                </p>
              </div>

              <div className="hidden sm:block w-px h-16" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />

              <div className="text-center">
                <p className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: 'var(--theme-highlight)' }}>
                  Por
                </p>
                <p className="text-5xl md:text-7xl font-bold text-white leading-none font-heading">
                  {data.price_founder}
                </p>
                <p className="text-xs md:text-sm font-bold uppercase tracking-wider mt-3" style={{ color: 'var(--theme-highlight)' }}>
                  {data.period_label || 'para sempre'}
                </p>
              </div>
            </div>

            {/* Barra de progresso de vagas */}
            {data.spots_total > 0 && (
              <div className="max-w-lg mx-auto mb-10">
                <div className="flex justify-between items-baseline text-sm mb-3">
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <strong className="text-white">{data.spots_total - data.spots_remaining}</strong>{' '}
                    vagas preenchidas
                  </span>
                  <span className={`font-bold ${isUrgente ? 'text-red-400' : 'text-white'}`}>
                    Restam {data.spots_remaining} de {data.spots_total}
                  </span>
                </div>
                <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: isUrgente
                        ? 'linear-gradient(90deg, #F97316, #DC2626)'
                        : 'linear-gradient(90deg, var(--theme-primary), var(--theme-highlight))',
                    }}
                  />
                </div>
                {isUrgente && (
                  <p className="text-xs text-red-400 font-semibold mt-2 animate-pulse">
                    🔥 Poucas vagas restantes
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <Link
              to={data.cta_link || '/register'}
              className="inline-flex items-center gap-3 bg-white font-bold px-8 md:px-10 py-4 md:py-5 rounded-xl hover:bg-gray-100 transition shadow-xl text-base md:text-lg transform hover:-translate-y-0.5"
              style={{ color: 'var(--theme-bg-dark)' }}
            >
              {data.cta_text || 'Quero garantir minha vaga'}
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {/* Aviso de segurança abaixo do CTA */}
            <p className="text-xs mt-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              💳 Pagamento seguro · Cancele quando quiser · Sem multa
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// PLANS
// ============================================================
const PLANOS_FIXOS = [
  {
    codigo: 'trial',
    nome: 'Grátis',
    icone: '🎁',
    preco: 0,
    creditos_sem_api: 7,
    creditos_com_api: 7,
    trial: true,
    itens: [
      '7 créditos para testar',
      '✨ Acesso a TODOS os motores',
      'Sem cartão de crédito',
      'Válido por 30 dias',
    ],
  },
  {
    codigo: 'basico',
    nome: 'Básico',
    icone: '🎒',
    preco: 9.90,
    creditos_sem_api: 15,
    creditos_com_api: 50,
    itens: [
      'Motores básicos (NeuroAula, Materiais...)',
      'Banco de Questões ENEM',
      'Banco de Questões Fundamental',
      'Exportação em PDF',
    ],
  },
  {
    codigo: 'padrao',
    nome: 'Intermediário',
    icone: '🚀',
    preco: 19.90,
    creditos_sem_api: 25,
    creditos_com_api: 150,
    destaque: true,
    itens: [
      'Tudo do Básico, mais:',
      '✨ Banco de Questões IA (Motor 9)',
      '📄 Exportação em Word editável',
      'Cascata curricular completa',
    ],
  },
  {
    codigo: 'vip',
    nome: 'VIP',
    icone: '💎',
    preco: 29.90,
    creditos_sem_api: 50,
    creditos_com_api: 500,
    itens: [
      'Tudo do Intermediário, mais:',
      '📅 Planejamento de Aula',
      'De 1 dia até 2 meses',
      'Curadoria colaborativa',
    ],
  },
  {
    codigo: 'avancado',
    nome: 'Premium',
    icone: '👑',
    preco: 44.90,
    creditos_sem_api: 100,
    creditos_com_api: 1000,
    itens: [
      'Tudo do VIP, mais:',
      '🎨 Geração de imagens com IA',
      'Ilustrações exclusivas por questão',
      'Acesso a novidades primeiro',
    ],
  },
];

export const PlansSection = ({ data }) => {
  return (
    <section id="plans" className="py-20 md:py-28" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 font-heading"
            style={{ color: 'var(--theme-text-primary)' }}
          >{data.title}</h2>
          {data.subtitle && (
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: 'var(--theme-text-secondary)' }}
            >{data.subtitle}</p>
          )}
        </div>

        {/* Faixa de destaque: bônus do Modo Turbo */}
        <div
          className="max-w-3xl mx-auto mb-12 rounded-2xl p-5 text-white text-center shadow-lg"
          style={{ background: 'linear-gradient(90deg, var(--theme-primary) 0%, var(--theme-accent) 100%)' }}
        >
          <p className="text-base md:text-lg font-bold leading-snug">
            🔑 Ative o <span className="bg-white/25 px-2 py-0.5 rounded">Modo Turbo</span> e ganhe até 10x mais créditos
          </p>
          <p className="text-sm mt-2 text-white/90">
            É grátis, leva 2 minutos. Você conecta uma <strong className="text-white">chave gratuita do Google</strong> e multiplica seus créditos — sem pagar a mais.
          </p>
        </div>

        {/* Grid dos planos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANOS_FIXOS.map((p) => {
            const precoPorDia = p.preco > 0 ? (p.preco / 30).toFixed(2).replace('.', ',') : null;
            const multiplicador = p.creditos_sem_api > 0
              ? (p.creditos_com_api / p.creditos_sem_api).toFixed(1)
              : null;

            return (
              <div
                key={p.codigo}
                className="relative rounded-2xl p-5 border-2 transition flex flex-col bg-white"
                style={{
                  borderColor: p.destaque
                    ? 'var(--theme-primary)'
                    : 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
                  boxShadow: p.destaque ? '0 10px 25px -5px color-mix(in srgb, var(--theme-primary) 30%, transparent)' : undefined,
                  transform: p.destaque ? 'scale(1.02)' : undefined,
                }}
              >
                {p.destaque && (
                  <div
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                  >
                    ⭐ MAIS ESCOLHIDO
                  </div>
                )}

                {/* Ícone + Nome */}
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <span className="text-2xl leading-none">{p.icone}</span>
                  <h3 className="text-lg font-bold leading-tight font-heading" style={{ color: 'var(--theme-text-primary)' }}>{p.nome}</h3>
                </div>

                {/* Preço */}
                <div className="mb-1">
                  <span className="text-2xl font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                    {p.preco === 0 ? 'Grátis' : `R$ ${p.preco.toFixed(2).replace('.', ',')}`}
                  </span>
                  {p.preco > 0 && <span className="ml-1 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>/mês</span>}
                </div>
                {precoPorDia && (
                  <p className="text-[10px] mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
                    Apenas R$ {precoPorDia} por dia
                  </p>
                )}

                {/* Bloco de créditos: sem Turbo vs com Turbo */}
                <div
                  className="rounded-lg p-3 mb-4 border"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--theme-accent) 8%, white)',
                    borderColor: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)',
                  }}
                >
                  <p
                    className="text-[9px] uppercase tracking-widest font-bold mb-2"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    Seus créditos/mês
                  </p>

                  {p.trial ? (
                    <div className="text-center">
                      <p className="text-2xl font-bold leading-none" style={{ color: 'var(--theme-accent)' }}>
                        {p.creditos_com_api}
                      </p>
                      <p className="text-[10px] font-medium mt-1" style={{ color: 'var(--theme-accent)' }}>
                        para testar tudo
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      {/* Sem Turbo */}
                      <div className="text-center flex-1">
                        <p className="text-base font-bold leading-none" style={{ color: 'var(--theme-text-secondary)' }}>
                          {p.creditos_sem_api}
                        </p>
                        <p className="text-[9px] mt-1 leading-none" style={{ color: 'var(--theme-text-secondary)' }}>
                          sem Turbo
                        </p>
                      </div>

                      {/* Seta */}
                      <div className="text-sm leading-none" style={{ color: 'var(--theme-accent)' }}>→</div>

                      {/* Com Turbo */}
                      <div className="text-center flex-1">
                        <p className="text-2xl font-bold leading-none" style={{ color: 'var(--theme-accent)' }}>
                          {p.creditos_com_api}
                        </p>
                        <p className="text-[9px] font-bold mt-1 leading-none" style={{ color: 'var(--theme-accent)' }}>
                          com Turbo ✨
                        </p>
                      </div>
                    </div>
                  )}

                  {multiplicador && (
                    <p
                      className="text-[10px] text-center font-bold mt-2 rounded py-1"
                      style={{ color: 'var(--theme-accent)', backgroundColor: 'rgba(255,255,255,0.7)' }}
                    >
                      ⬆ {multiplicador}x mais créditos
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-4 flex-1">
                  {p.itens.map((item, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-[11px] leading-snug" style={{ color: 'var(--theme-text-secondary)' }}>
                      <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to="/register"
                  className="block text-center font-bold py-2.5 rounded-lg transition text-sm"
                  style={
                    p.destaque
                      ? { backgroundColor: 'var(--theme-primary)', color: '#FFFFFF' }
                      : p.trial
                        ? { backgroundColor: '#FFFFFF', color: 'var(--theme-accent)', border: '2px solid color-mix(in srgb, var(--theme-accent) 30%, transparent)' }
                        : { backgroundColor: 'var(--theme-bg-dark)', color: '#FFFFFF' }
                  }
                >
                  {p.trial ? '🚀 Começar grátis' : 'Assinar agora'}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Rodapé explicativo */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div
            className="rounded-xl p-5 text-center border bg-white"
            style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
              <strong>💡 O que é o Modo Turbo?</strong> Cada plano tem uma cota mensal de créditos.
              Quando você ativa o Modo Turbo (conectando uma <strong>chave gratuita do Google</strong>), essa cota
              <strong> multiplica automaticamente</strong> — sem custo extra e sem trocar de plano.
              Você ativa e desativa quando quiser.
            </p>
            <p className="text-xs mt-3" style={{ color: 'var(--theme-text-secondary)' }}>
              🔒 Sua chave é criptografada e fica só na sua conta. Você mantém total controle.
            </p>
          </div>
        </div>

        <p className="text-center text-sm mt-8" style={{ color: 'var(--theme-text-secondary)' }}>
          💳 Pagamento via cartão de crédito (recomendado) ou Pix. Cancele quando quiser, sem multa.
        </p>
      </div>
    </section>
  );
};


// ============================================================
// GUARANTEE
// ============================================================
export const GuaranteeSection = ({ data }) => {
  return (
    <section id="guarantee" className="py-16 md:py-20" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div
          className="rounded-2xl p-8 md:p-12 border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--theme-success) 8%, white)',
            borderColor: 'color-mix(in srgb, var(--theme-success) 25%, transparent)',
          }}
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🛡️</div>
            <h2
              className="text-2xl md:text-3xl font-bold font-heading"
              style={{ color: 'var(--theme-text-primary)' }}
            >{data.title}</h2>
          </div>
          <ul className="space-y-3 max-w-2xl mx-auto">
            {data.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3" style={{ color: 'var(--theme-text-primary)' }}>
                <Check className="mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// FAQ — 2 colunas (título + foto à esquerda, accordion à direita)
// ============================================================
export const FAQSection = ({ data }) => {
  const [aberto, setAberto] = useState(null);

  return (
    <section id="faq" className="py-20 md:py-28" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Coluna esquerda */}
          <div className="lg:col-span-2">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--theme-accent)' }}
            >
              {data.kicker || 'Perguntas frequentes'}
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 leading-tight font-heading"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {data.title}
            </h2>
            {data.subtitle && (
              <p className="text-lg mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
                {data.subtitle}{' '}
                <a
                  href={`mailto:${data.contact_email || 'contato@simidnape.com.br'}`}
                  className="hover:underline font-semibold"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {data.contact_text || 'Entre em contato conosco.'}
                </a>
              </p>
            )}

            {/* Foto */}
            <div className="hidden lg:block mt-8">
              <div
                className="rounded-2xl overflow-hidden shadow-lg aspect-square max-w-sm"
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 10%, white)' }}
              >
                {data.image ? (
                  <img src={data.image} alt="Professora" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span className="text-8xl mb-3">👩‍🏫</span>
                    <span className="text-sm font-medium">{data.image_placeholder || 'Foto da professora'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna direita — Accordion */}
          <div className="lg:col-span-3">
            <div className="space-y-3">
              {data.items?.map((f, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden transition bg-white border"
                  style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}
                >
                  <button
                    onClick={() => setAberto(aberto === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 transition hover:opacity-90"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <span
                      className="text-xl font-bold flex-shrink-0 w-8"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="font-semibold flex-1 leading-snug"
                      style={{ color: 'var(--theme-text-primary)' }}
                    >
                      {f.question}
                    </span>
                    <span
                      className={`text-2xl flex-shrink-0 transition-transform ${aberto === i ? 'rotate-45' : ''}`}
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      +
                    </span>
                  </button>
                  {aberto === i && (
                    <div
                      className="px-5 py-4 border-t"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--theme-accent) 5%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--theme-accent) 12%, transparent)',
                      }}
                    >
                      <p
                        className="leading-relaxed pl-12"
                        style={{ color: 'var(--theme-text-secondary)' }}
                      >
                        {f.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// FINAL CTA
// ============================================================
export const FinalCTASection = ({ data }) => {
  return (
    <section id="final_cta" className="py-20 md:py-28" style={{ backgroundColor: 'var(--theme-bg-dark)' }}>
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight font-heading">
          {data.headline}
        </h2>
        <p
          className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          {data.subheadline}
        </p>
        <Link
          to={data.cta_link || '/register'}
          className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-lg transition shadow-sm text-lg hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-primary)', color: '#FFFFFF' }}
        >
          {data.cta_text || 'Criar conta grátis'}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
};


// ============================================================
// FOOTER
// ============================================================
export const FooterSection = ({ data }) => {
  return (
    <footer className="py-14 px-4 md:px-6" style={{ backgroundColor: 'var(--theme-bg-dark)', color: 'rgba(255,255,255,0.55)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            {/* Logo tipográfico — mesmo do header */}
            <div className="inline-flex items-end pt-3 mb-2">
              {'SIMIDNAPE'.split('').map((letra, i) => (
                <span
                  key={i}
                  className="relative font-display text-2xl md:text-3xl font-bold text-white tracking-tight"
                >
                  {letra === 'I' && (
                    <span
                      className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                        i === 1 ? 'bg-coral' : 'bg-gold'
                      }`}
                    />
                  )}
                  {letra}
                </span>
              ))}
            </div>
            <p className="font-serif italic text-xs mb-4 tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
              O Professor Inesquecível
            </p>

            {data.brand_explanation && (
              <p className="text-xs leading-relaxed mb-4 max-w-md" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {data.brand_explanation}
              </p>
            )}
            <p className="text-sm leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Assistente pedagógico com IA para professores brasileiros.
              Neuroeducação, ciência da aprendizagem e respeito à autonomia docente.
            </p>
            <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
              🇧🇷 Feito no Brasil · Alinhado à BNCC
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 font-heading">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#solution" className="hover:text-white transition" style={{ color: 'inherit' }}>Motores de IA</a></li>
              <li><a href="#comparison" className="hover:text-white transition" style={{ color: 'inherit' }}>Comparativo</a></li>
              <li><a href="#plans" className="hover:text-white transition" style={{ color: 'inherit' }}>Planos</a></li>
              <li><a href="#faq" className="hover:text-white transition" style={{ color: 'inherit' }}>FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 font-heading">Institucional</h4>
            <ul className="space-y-2 text-sm">
              {data.links?.map((link, i) => (
                <li key={i}>
                  {link.href?.startsWith('http') || link.href?.startsWith('mailto') ? (
                    <a href={link.href} className="hover:text-white transition" style={{ color: 'inherit' }}>{link.label}</a>
                  ) : (
                    <Link to={link.href} className="hover:text-white transition" style={{ color: 'inherit' }}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 text-center text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p>{data.copyright_text || '© 2025 SIMIDNAPE PRO — O Professor Inesquecível. Todos os direitos reservados.'}</p>
        </div>
      </div>
    </footer>
  );
};


// ============================================================
// POPUP
// ============================================================
export const PopupSection = ({ data }) => {
  const [visivel, setVisivel] = useState(false);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    if (!data.enabled || fechado) return;
    if (data.show_once_per_user && sessionStorage.getItem('popup_landing_shown')) return;

    const timer = setTimeout(() => {
      setVisivel(true);
      sessionStorage.setItem('popup_landing_shown', '1');
    }, (data.delay_seconds || 8) * 1000);

    return () => clearTimeout(timer);
  }, [data.enabled, data.delay_seconds, data.show_once_per_user, fechado]);

  if (!data.enabled || !visivel || fechado) return null;

  // Paletas de cor (gradiente + cor do botão + cor do badge)
  const TEMAS = {
    azul: {
      gradiente: 'from-blue-600 to-indigo-700',
      botao: 'bg-white text-blue-700 hover:bg-blue-50',
    },
    roxo: {
      gradiente: 'from-purple-600 to-indigo-700',
      botao: 'bg-white text-purple-700 hover:bg-purple-50',
    },
    laranja: {
      gradiente: 'from-orange-500 to-red-600',
      botao: 'bg-white text-orange-700 hover:bg-orange-50',
    },
    verde: {
      gradiente: 'from-emerald-500 to-teal-600',
      botao: 'bg-white text-emerald-700 hover:bg-emerald-50',
    },
    preto: {
      gradiente: 'from-gray-900 via-gray-900 to-blue-950',
      botao: 'bg-white text-gray-900 hover:bg-gray-100',
    },
  };
  const tema = TEMAS[data.cor_tema] || TEMAS.roxo;

  const bullets = Array.isArray(data.bullets) ? data.bullets.filter(Boolean) : [];
  const temImagem = !!data.image;
  const horizontal = temImagem && data.layout !== 'vertical';

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
      <a
        href={data.cta_link || '/register'}
        className={`pointer-events-auto relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br ${tema.gradiente} text-white transform transition-all duration-500 ease-out ${
          visivel ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Botão de fechar */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFechado(true); }}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white text-lg flex items-center justify-center transition"
          aria-label="Fechar pop-up"
        >
          ×
        </button>

        <div className={`flex ${horizontal ? 'flex-col sm:flex-row' : 'flex-col'}`}>
          {/* Imagem (opcional) */}
          {temImagem && (
            <div className={`${horizontal ? 'sm:w-2/5' : 'w-full'} bg-white/10 overflow-hidden flex items-center justify-center`}>
              <img
                src={data.image}
                alt=""
                className={`${horizontal ? 'w-full h-full object-cover min-h-[180px]' : 'w-full h-40 object-cover'}`}
              />
            </div>
          )}

          {/* Conteúdo */}
          <div className={`${horizontal ? 'sm:w-3/5' : 'w-full'} p-6 sm:p-7 md:p-8`}>
            {/* Badge */}
            {data.badge && (
              <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                {data.badge}
              </div>
            )}

            {/* Título */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-2 font-heading">
              {data.title}
            </h3>

            {/* Subtítulo */}
            {data.subtitle && (
              <p className="text-white/90 text-sm md:text-base leading-snug mb-3">
                {data.subtitle}
              </p>
            )}

            {/* Fallback: mensagem antiga (se não houver subtítulo) */}
            {!data.subtitle && data.message && (
              <p className="text-white/80 text-sm leading-snug mb-3">
                {data.message}
              </p>
            )}

            {/* Bullets */}
            {bullets.length > 0 && (
              <ul className="space-y-1.5 mb-5">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/95 leading-snug">
                    <span className="text-white font-bold flex-shrink-0">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* CTA (botão visível — o card inteiro também é clicável) */}
            <div className={`inline-flex items-center gap-2 ${tema.botao} font-bold px-5 py-3 rounded-lg transition text-sm shadow-md`}>
              {data.cta_text || 'Ver planos'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            <p className="text-xs text-white/70 mt-3">
              🔒 Pagamento seguro · Cancele quando quiser
            </p>
          </div>
        </div>
      </a>
    </div>
  );
};