import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// ============================================================
// HELPER — Imagem com fallback
// ============================================================
const ImagemComFallback = ({ src, alt, className, fallbackIcon = '📸', fallbackText = 'Foto em breve' }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.style?.setProperty('display', 'flex'); }}
      />
    );
  }
  return (
    <div className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700`}>
      <span className="text-6xl mb-3">{fallbackIcon}</span>
      <span className="text-sm font-medium opacity-70">{fallbackText}</span>
    </div>
  );
};


// ============================================================
// HERO — 2 colunas (texto + foto com badges)
// ============================================================
export const HeroSection = ({ data }) => {
  const [showVideo, setShowVideo] = useState(false);

  const handleVideo = () => {
    if (data.cta_secondary_video_url) setShowVideo(true);
  };

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-12 pb-20 md:pt-20 md:pb-28">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* ============ COLUNA ESQUERDA — Texto ============ */}
          <div className="text-center lg:text-left">
            {data.badge && (
              <div className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-blue-700">{data.badge}</span>
              </div>
            )}

            {data.brand_line && (
              <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 uppercase tracking-wide">
                {data.brand_line}
              </p>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              {data.headline}
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
              {data.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <Link
                to={data.cta_primary_link || '/register'}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
              >
                {data.cta_primary_text || 'Criar conta grátis'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              {data.cta_secondary_text && (
                <button
                  onClick={handleVideo}
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-3.5 rounded-xl border-2 border-gray-200 transition"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {data.cta_secondary_text}
                </button>
              )}
            </div>

            {/* Métricas */}
            {data.metrics?.length > 0 && (
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                {data.metrics.map((m, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{m.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============ COLUNA DIREITA — Foto + Badges ============ */}
          <div className="relative">
            {/* Foto principal */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-100 to-purple-100 aspect-[4/5] max-w-md mx-auto lg:max-w-none">
              {data.hero_image ? (
                <img
                  src={data.hero_image}
                  alt="Professor(a) usando o SIMIDNAPE PRO"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-blue-700">
                  <span className="text-8xl mb-4">👩‍🏫</span>
                  <span className="text-sm font-medium opacity-70">Foto do professor(a) aqui</span>
                </div>
              )}

              {/* Overlay gradiente suave */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Badges flutuantes (estilo Isaac) */}
            {data.float_badges?.map((badge, i) => {
              const posicoes = [
                { top: '8%', left: '-8%' },
                { top: '45%', left: '-12%' },
                { top: '75%', left: '-4%' },
              ];
              const pos = posicoes[i % 3];

              return (
                <div
                  key={i}
                  className="hidden md:flex absolute bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 items-center gap-3 max-w-[220px] z-10"
                  style={pos}
                >
                  <span className="text-2xl flex-shrink-0">{badge.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{badge.title}</p>
                    <p className="text-xs text-gray-500 truncate">{badge.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vídeo principal */}
        {data.video_enabled && data.video_url && (
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="aspect-video bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
              <VideoEmbed url={data.video_url} />
            </div>
          </div>
        )}
      </div>

      {showVideo && data.cta_secondary_video_url && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
          <div className="max-w-4xl w-full aspect-video bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <VideoEmbed url={data.cta_secondary_video_url} autoPlay />
          </div>
        </div>
      )}
    </section>
  );
};


// ============================================================
// CREDIBILITY BAR
// ============================================================
export const CredibilitySection = ({ data }) => {
  if (!data.items?.length) return null;

  return (
    <section id="credibility" className="bg-gray-900 py-6 border-y border-gray-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {data.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ============================================================
// PROBLEM
// ============================================================
export const ProblemSection = ({ data }) => {
  return (
    <section id="problem" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-center mb-14">
          {/* Imagem (opcional) */}
          {data.image && (
            <div className="lg:col-span-1">
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-square">
                <img src={data.image} alt="Rotina do professor" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* Texto */}
          <div className={data.image ? 'lg:col-span-2' : 'lg:col-span-3 text-center max-w-2xl mx-auto'}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
            {data.subtitle && <p className="text-lg text-gray-600">{data.subtitle}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {data.cards?.map((card, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6 hover:shadow-md transition"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        {data.transition_text && (
          <div className="text-center">
            <p className="inline-block bg-blue-50 border border-blue-200 text-blue-900 font-semibold px-6 py-3 rounded-full text-base md:text-lg">
              {data.transition_text}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};


// ============================================================
// SOLUTION (imagem opcional + bento grid com features)
// ============================================================
export const SolutionSection = ({ data }) => {
  return (
    <section id="solution" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-600">{data.subtitle}</p>}
        </div>

        {/* Imagem grande no topo (opcional) */}
        {data.image && (
          <div className="max-w-4xl mx-auto mb-14">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
              <img src={data.image} alt="Interface do SIMIDNAPE PRO" className="w-full h-auto" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.motors?.map((motor, i) => {
            const features = motor.features || [];
            return (
              <div
                key={i}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${motor.gradient || 'from-blue-500 to-indigo-500'} text-3xl mb-4 shadow-md`}>
                  {motor.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{motor.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{motor.description}</p>

                {features.length > 0 && (
                  <ul className="space-y-2 border-t border-gray-100 pt-4">
                    {features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
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
// FOUNDER — Seção do criador (estilo Isaac)
// ============================================================
export const FounderSection = ({ data }) => {
  return (
    <section id="founder" className="py-20 md:py-28 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          {/* Foto do criador */}
          <div className="lg:col-span-2">
            <div className="relative max-w-sm mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl opacity-20 blur-2xl" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] bg-gray-800">
                {data.photo ? (
                  <img
                    src={data.photo}
                    alt={data.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
                    <span className="text-9xl font-bold text-white/90">
                      {data.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'DC'}
                    </span>
                    <span className="text-sm mt-4 text-white/70">Foto do criador</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Texto */}
          <div className="lg:col-span-3">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              {data.title || 'Uma palavra do criador'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-2">
              {data.name}
            </h2>
            <p className="text-blue-200 mb-6">{data.subtitle}</p>

            {data.quote && (
              <blockquote className="border-l-4 border-blue-400 pl-5 mb-6 italic text-xl md:text-2xl text-blue-50 leading-relaxed">
                "{data.quote}"
              </blockquote>
            )}

            {data.bio && (
              <p className="text-blue-100 leading-relaxed mb-5">
                {data.bio}
              </p>
            )}

            {data.brand_explanation && (
              <div className="bg-blue-800/40 border border-blue-700/50 rounded-xl p-5 mt-6">
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                  O que significa SIMIDNAPE?
                </p>
                <p className="text-sm text-blue-100 leading-relaxed">
                  {data.brand_explanation}
                </p>
              </div>
            )}

            {data.video_url && (
              <div className="mt-6 aspect-video bg-black/50 rounded-xl overflow-hidden">
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
// VIDEO SECTION (standalone)
// ============================================================
export const VideoSection = ({ data }) => {
  if (!data.video_url) return null;

  return (
    <section id="video" className="py-20 md:py-28 bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-300">{data.subtitle}</p>}
        </div>

        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-600">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {data.steps?.map((step, i) => (
            <div key={i} className="relative text-center">
              {i < data.steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-purple-200" />
              )}

              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold mb-5 shadow-lg">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{step.description}</p>
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
      <video
        src={url}
        controls
        autoPlay={autoPlay}
        className="w-full h-full object-contain"
      />
    );
  }

  return (
    <iframe
      src={url}
      title="Vídeo SIMIDNAPE PRO"
      className="w-full h-full"
      frameBorder="0"
      allowFullScreen
    />
  );
};