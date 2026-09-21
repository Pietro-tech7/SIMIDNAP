import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// ============================================================
// HELPERS
// ============================================================
const ButtonPrimary = ({ children, to, onClick, className = '' }) => {
  const base = "inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-lg shadow-sm hover:shadow-md transition";
  if (to) return <Link to={to} className={`${base} ${className}`}>{children}</Link>;
  return <button onClick={onClick} className={`${base} ${className}`}>{children}</button>;
};

const ButtonSecondary = ({ children, to, onClick, className = '' }) => {
  const base = "inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-7 py-3.5 rounded-lg border border-gray-300 transition";
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

  return (
    <section id="hero" className="relative bg-white pt-12 pb-20 md:pt-20 md:pb-28">
      <div className="relative max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ============ COLUNA ESQUERDA — Texto ============ */}
          <div className="text-center lg:text-left">
            {data.badge && (
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-xs font-semibold text-blue-700">{data.badge}</span>
              </div>
            )}

            {data.brand_line && (
              <p className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">
                {data.brand_line}
              </p>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              {data.headline}
            </h1>

            <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
              {data.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
              <ButtonPrimary to={data.cta_primary_link || '/register'}>
                {data.cta_primary_text || 'Criar conta grátis'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </ButtonPrimary>
              {data.cta_secondary_text && (
                <ButtonSecondary onClick={() => setShowVideo(true)}>
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {data.cta_secondary_text}
                </ButtonSecondary>
              )}
            </div>

            {/* Métricas */}
            {data.metrics?.length > 0 && (
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 pt-6 border-t border-gray-200">
                {data.metrics.map((m, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <p className="text-3xl font-bold text-gray-900">{m.value}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-snug">{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============ COLUNA DIREITA — Foto + Badges ============ */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-100 aspect-[4/5] max-w-md mx-auto lg:max-w-none">
              {data.hero_image ? (
                <img
                  src={data.hero_image}
                  alt="Professor(a) usando o SIMIDNAPE PRO"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                  <span className="text-8xl mb-4">👩‍🏫</span>
                  <span className="text-sm font-medium">Foto do professor(a)</span>
                </div>
              )}
            </div>

            {/* Badges flutuantes */}
            {data.float_badges?.map((badge, i) => {
              const posicoes = [
                { top: '6%', left: '-8%' },
                { top: '42%', left: '-12%' },
                { top: '72%', left: '-6%' },
              ];
              const pos = posicoes[i % 3];
              return (
                <div
                  key={i}
                  className="hidden md:flex absolute bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 items-center gap-3 max-w-[230px] z-10"
                  style={pos}
                >
                  <span className="text-2xl flex-shrink-0">{badge.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{badge.title}</p>
                    <p className="text-xs text-gray-600 truncate">{badge.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vídeo principal */}
        {data.video_enabled && data.video_url && (
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="aspect-video bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
              <VideoEmbed url={data.video_url} />
            </div>
          </div>
        )}
      </div>

      {/* Modal do vídeo secundário */}
      {showVideo && data.cta_secondary_video_url && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="max-w-4xl w-full aspect-video bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <VideoEmbed url={data.cta_secondary_video_url} autoPlay />
          </div>
        </div>
      )}
    </section>
  );
};


// ============================================================
// CREDIBILITY — 4 cards com ícone + título + descrição
// ============================================================
export const CredibilitySection = ({ data }) => {
  if (!data.items?.length) return null;

  return (
    <section id="credibility" className="bg-gray-900 py-14">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.items.map((item, i) => (
            <div key={i} className="text-center sm:text-left">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
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