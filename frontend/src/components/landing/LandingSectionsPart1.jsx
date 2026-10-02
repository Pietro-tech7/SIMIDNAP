import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ============================================================
// HELPERS
// ============================================================
const ButtonPrimary = ({ children, to, onClick, className = '' }) => {
  const base = "inline-flex items-center justify-center gap-2 bg-amber hover:bg-amber/90 text-white font-semibold px-7 py-3.5 rounded-lg shadow-sm hover:shadow-md transition";
  if (to) return <Link to={to} className={`${base} ${className}`}>{children}</Link>;
  return <button onClick={onClick} className={`${base} ${className}`}>{children}</button>;
};

const ButtonSecondary = ({ children, to, onClick, className = '' }) => {
  const base = "inline-flex items-center justify-center gap-2 bg-transparent hover:bg-petrol/5 text-petrol font-semibold px-7 py-3.5 rounded-lg border-2 border-petrol/30 hover:border-petrol/60 transition";
  if (to) return <Link to={to} className={`${base} ${className}`}>{children}</Link>;
  return <button onClick={onClick} className={`${base} ${className}`}>{children}</button>;
};

const Check = ({ className = 'text-blue-600' }) => (
  <svg className={`w-5 h-5 ${className} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);


// ============================================================
// HERO — 2 colunas, paleta clara, foto + badges flutuantes
// ============================================================
export const HeroSection = ({ data }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [slideAtivo, setSlideAtivo] = useState(0);
  const touchStart = useRef(0);

  const slides = data.slides || [];
  const isCarousel = data.carousel_enabled && slides.length > 0;

  // Auto-rotação do carrossel
  useEffect(() => {
    if (!isCarousel || slides.length <= 1) return;
    const interval = setInterval(() => {
      setSlideAtivo((prev) => (prev + 1) % slides.length);
    }, data.carousel_interval || 6000);
    return () => clearInterval(interval);
  }, [isCarousel, slides.length, data.carousel_interval]);

  // Swipe touch
  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (!isCarousel || slides.length <= 1) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setSlideAtivo((prev) => (prev + 1) % slides.length);
      } else {
        setSlideAtivo((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  };

  const irParaSlide = (idx) => setSlideAtivo(idx);
  const proximoSlide = () => setSlideAtivo((prev) => (prev + 1) % slides.length);
  const slideAnterior = () => setSlideAtivo((prev) => (prev - 1 + slides.length) % slides.length);

  // Se carrossel desativado ou sem slides → usa o slide único (campos legados)
  const slidesEfetivos = isCarousel ? slides : [{
    badge: data.badge,
    brand_line: data.brand_line,
    headline: data.headline,
    subheadline: data.subheadline,
    cta_primary_text: data.cta_primary_text,
    cta_primary_link: data.cta_primary_link,
    cta_secondary_text: data.cta_secondary_text,
    cta_secondary_video_url: data.cta_secondary_video_url,
    image: data.hero_image,
    gradient: 'from-cream via-cream-soft to-cream',
  }];

  const slide = slidesEfetivos[slideAtivo] || slidesEfetivos[0];
  const isDark = slide.gradient?.includes('gray-900')
    || slide.gradient?.includes('blue-900')
    || slide.gradient?.includes('black');

  return (
    <section id="hero" className="relative overflow-hidden">
      <div
        className={`relative bg-gradient-to-br ${slide.gradient || 'from-cream via-cream-soft to-cream'} transition-all duration-700`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Imagem de fundo (opcional) */}
        {slide.image && (
          <div className="absolute inset-0 z-0 opacity-15">
            <img src={slide.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[500px]">
            {/* Coluna esquerda — Texto do slide */}
            <div className="text-center lg:text-left">
              {slide.badge && (
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 ${
                  isDark ? 'bg-white/15 border border-amber/40' : 'bg-badge-cream border border-amber/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-amber' : 'bg-coral'}`} />
                  <span className={`text-xs font-semibold ${isDark ? 'text-amber' : 'text-terracotta'}`}>
                    {slide.badge}
                  </span>
                </div>
              )}

              {slide.brand_line && (
                <p className={`text-sm font-bold uppercase tracking-widest mb-3 ${
                  isDark ? 'text-gold' : 'text-terracotta'
                }`}>
                  {slide.brand_line}
                </p>
              )}

              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 ${
                isDark ? 'text-white' : 'text-petrol'
              }`}>
                {slide.headline}
              </h1>

              <p className={`text-lg md:text-xl leading-relaxed mb-8 ${
                isDark ? 'text-gray-200' : 'text-petrol-deep/85'
              }`}>
                {slide.subheadline}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {slide.cta_primary_text && (
                  <ButtonPrimary to={slide.cta_primary_link || '/register'}>
                    {slide.cta_primary_text}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </ButtonPrimary>
                )}
                {slide.cta_secondary_text && (
                  <ButtonSecondary onClick={() => setShowVideo(true)}>
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {slide.cta_secondary_text}
                  </ButtonSecondary>
                )}
              </div>

              {/* Métricas (só no primeiro slide) */}
              {slideAtivo === 0 && data.metrics?.length > 0 && (
                <div className={`grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 pt-6 mt-8 border-t ${
                  isDark ? 'border-white/20' : 'border-petrol/15'
                }`}>
                  {data.metrics.map((m, i) => (
                    <div key={i} className="text-center lg:text-left">
                      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-petrol-deep'}`}>{m.value}</p>
                      <p className={`text-xs mt-1 leading-snug ${isDark ? 'text-gray-300' : 'text-ink-soft'}`}>{m.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna direita — Imagem do slide */}
            <div className="relative">
              <div className={`relative rounded-2xl overflow-hidden shadow-xl aspect-[4/5] max-w-md mx-auto lg:max-w-none ${
                isDark ? 'bg-white/5 backdrop-blur border border-white/10' : 'bg-white/60 backdrop-blur'
              }`}>
                {slide.image ? (
                  <img src={slide.image} alt="Slide" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <span className="text-8xl mb-4">👩‍🏫</span>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {data.image_placeholder || 'Foto do slide'}
                    </span>
                  </div>
                )}
              </div>

              {/* Badges flutuantes — só no primeiro slide */}
              {slideAtivo === 0 && data.float_badges?.map((badge, i) => {
                const posicoes = [
                  { top: '6%', left: '-8%' },
                  { top: '42%', left: '-12%' },
                  { top: '72%', left: '-6%' },
                ];
                const pos = posicoes[i % 3];
                return (
                  <div
                    key={i}
                    className="hidden md:flex absolute bg-cream rounded-xl shadow-lg border border-petrol/15 px-4 py-3 items-center gap-3 max-w-[230px] z-10"
                    style={pos}
                  >
                    <span className="text-2xl flex-shrink-0">{badge.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-petrol-deep truncate">{badge.title}</p>
                      <p className="text-xs text-ink-soft truncate">{badge.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots de navegação */}
          {slidesEfetivos.length > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {slidesEfetivos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => irParaSlide(i)}
                  aria-label={`Ir para o slide ${i + 1}`}
                  className={`transition-all rounded-full ${
                    i === slideAtivo
                      ? `w-10 h-2.5 bg-amber`
                      : `w-2.5 h-2.5 ${isDark ? 'bg-white/40 hover:bg-white/60' : 'bg-petrol/25 hover:bg-petrol/40'}`
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Setas de navegação (desktop) */}
        {slidesEfetivos.length > 1 && (
          <>
            <button
              onClick={slideAnterior}
              aria-label="Slide anterior"
              className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full shadow-lg items-center justify-center transition z-20 ${
                isDark ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur' : 'bg-cream hover:bg-cream-soft text-petrol-deep'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={proximoSlide}
              aria-label="Próximo slide"
              className={`hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full shadow-lg items-center justify-center transition z-20 ${
                isDark ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur' : 'bg-cream hover:bg-cream-soft text-petrol-deep'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Vídeo principal (abaixo do carrossel) */}
      {data.video_enabled && data.video_url && (
        <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-12 mb-16 relative z-20">
          <div className="aspect-video bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <VideoEmbed url={data.video_url} />
          </div>
        </div>
      )}

      {/* Modal do vídeo secundário */}
      {showVideo && slide.cta_secondary_video_url && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="max-w-4xl w-full aspect-video bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <VideoEmbed url={slide.cta_secondary_video_url} autoPlay />
          </div>
        </div>
      )}
    </section>
  );
};


// ============================================================
// CREDIBILITY — 4 mini-cards com números (prova social)
// ============================================================
export const CredibilitySection = ({ data }) => {
  if (!data.items?.length) return null;

  return (
    <section id="credibility" className="bg-gray-900 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {data.items.map((item, i) => (
            <div key={i} className="text-center lg:text-left">
              {/* Número grande */}
              <p className="text-4xl md:text-5xl font-bold text-white mb-2 leading-none">
                {item.title}
              </p>
              {/* Rótulo curto */}
              <p className="text-xs md:text-sm text-blue-300 font-semibold uppercase tracking-wider mb-2">
                {item.description}
              </p>
              {/* Detalhe extra */}
              {item.icon && (
                <p className="text-xs text-gray-500 leading-snug">
                  {item.icon}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ============================================================
// PROBLEM — Copy emocional com cards limpos
// ============================================================
export const ProblemSection = ({ data }) => {
  return (
    <section id="problem" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="text-lg md:text-xl text-gray-600">{data.subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {data.cards?.map((card, i) => (
            <div
              key={i}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-7 hover:border-gray-300 hover:shadow-md transition"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{card.title}</h3>
              <p className="text-gray-700 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        {data.transition_text && (
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xl md:text-2xl font-bold text-gray-900 leading-relaxed">
              {data.transition_text}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

// ============================================================
// BEFORE / AFTER — Antes vs Depois da transformação
// ============================================================
export const BeforeAfterSection = ({ data }) => {
  if (!data.items?.length) return null;

  return (
    <section id="before_after" className="py-20 md:py-28 bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        {/* Cabeçalho */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              {data.subtitle}
            </p>
          )}
        </div>

        {/* Header das 2 colunas */}
        <div className="hidden md:grid grid-cols-2 gap-6 mb-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-bold text-red-700 uppercase tracking-wide text-sm">
              {data.before_label || 'Antes'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold text-green-700 uppercase tracking-wide text-sm">
              {data.after_label || 'Depois'}
            </span>
          </div>
        </div>

        {/* Linhas */}
        <div className="space-y-3">
          {data.items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              {/* Antes */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-800 leading-relaxed md:hidden text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                  {data.before_label || 'Antes'}:
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {item.before}
                </p>
              </div>

              {/* Depois */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-5 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-800 leading-relaxed md:hidden text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                  {data.after_label || 'Depois'}:
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {item.after}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================
// SOLUTION — Motores com features
// ============================================================
export const SolutionSection = ({ data }) => {
  return (
    <section id="solution" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            {data.title}
          </h2>
          {data.subtitle && <p className="text-lg text-gray-600 leading-relaxed">{data.subtitle}</p>}
        </div>

        {data.image && (
          <div className="max-w-4xl mx-auto mb-14">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
              <img src={data.image} alt="Interface do SIMIDNAPE PRO" className="w-full h-auto" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.motors?.map((motor, i) => {
            const features = motor.features || [];
            return (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition flex flex-col"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${motor.gradient || 'from-blue-500 to-indigo-500'} text-3xl mb-4 shadow-sm`}>
                  {motor.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{motor.name}</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-5">{motor.description}</p>

                {features.length > 0 && (
                  <ul className="space-y-2 border-t border-gray-100 pt-5 mt-auto">
                    {features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="text-blue-600 w-4 h-4 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};


// ============================================================
// FOUNDER — Seção do criador com bio poderosa
// ============================================================
export const FounderSection = ({ data }) => {
  return (
    <section id="founder" className="py-20 md:py-28 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          {/* Foto + Stats */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] bg-gray-800">
                {data.photo ? (
                  <img src={data.photo} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <span className="text-9xl font-bold text-white">
                      {data.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'DC'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats abaixo da foto */}
            {data.highlight_stats?.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-8">
                {data.highlight_stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-snug">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bio + Quote + Brand */}
          <div className="lg:col-span-3">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
              {data.title || 'Uma palavra do criador'}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {data.name}
            </h2>
            <p className="text-gray-400 mb-8">{data.subtitle}</p>

            {data.quote && (
              <blockquote className="border-l-4 border-blue-500 pl-5 mb-8 italic text-xl md:text-2xl text-gray-100 leading-relaxed">
                "{data.quote}"
              </blockquote>
            )}

            {data.bio && (
              <div className="text-gray-300 leading-relaxed space-y-4">
                {data.bio.split('\n\n').map((paragrafo, i) => (
                  <p key={i}>{paragrafo}</p>
                ))}
              </div>
            )}

            {/* Bloco do significado */}
            {data.brand_explanation && (
              <div className="mt-8 bg-blue-600 rounded-xl p-6">
                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-2">
                  O que significa SIMIDNAPE?
                </p>
                <p className="text-white leading-relaxed">
                  {data.brand_explanation}
                </p>
              </div>
            )}

            {data.video_url && (
              <div className="mt-8 aspect-video bg-black rounded-xl overflow-hidden">
                <VideoEmbed url={data.video_url} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// VIDEO — Seção escura standalone
// ============================================================
export const VideoSection = ({ data }) => {
  if (!data.video_url) return null;

  return (
    <section id="video" className="py-20 md:py-28 bg-black">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-400">{data.subtitle}</p>}
        </div>

        <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          <VideoEmbed url={data.video_url} />
        </div>
      </div>
    </section>
  );
};


// ============================================================
// HOW IT WORKS
// ============================================================
export const HowItWorksSection = ({ data }) => {
  return (
    <section id="how_it_works" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            {data.title}
          </h2>
          {data.subtitle && <p className="text-lg text-gray-600">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {data.steps?.map((step, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-5">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ============================================================
// HELPER — Embed de vídeo
// ============================================================
export const VideoEmbed = ({ url, autoPlay = false }) => {
  if (!url) return null;

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const params = autoPlay ? '?autoplay=1' : '';
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}${params}`}
        title="Vídeo SIMIDNAPE PRO"
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    const params = autoPlay ? '?autoplay=1' : '';
    return (
      <iframe
        src={`https://player.vimeo.com/video/${videoId}${params}`}
        title="Vídeo SIMIDNAPE PRO"
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video src={url} controls autoPlay={autoPlay} className="w-full h-full object-contain" />
    );
  }

  return (
    <iframe src={url} title="Vídeo SIMIDNAPE PRO" className="w-full h-full" frameBorder="0" allowFullScreen />
  );
};