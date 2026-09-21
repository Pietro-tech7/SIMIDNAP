import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// ============================================================
// HERO
// ============================================================
export const HeroSection = ({ data }) => {
  const [showVideo, setShowVideo] = useState(false);

  const handleVideo = () => {
    if (data.cta_secondary_video_url) setShowVideo(true);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Elementos decorativos */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          {data.badge && (
            <div className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-blue-700">{data.badge}</span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            {data.headline}
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
            {data.subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
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
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {data.metrics.map((m, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          )}
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

      {/* Modal do vídeo secundário */}
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
    <section className="bg-gray-900 py-6 border-y border-gray-800">
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
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-600">{data.subtitle}</p>}
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
            <p className="inline-block bg-blue-50 border border-blue-200 text-blue-900 font-semibold px-6 py-3 rounded-full">
              {data.transition_text}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};


// ============================================================
// SOLUTION (Bento Grid com os motores)
// ============================================================
export const SolutionSection = ({ data }) => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-600">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.motors?.map((motor, i) => {
            // O primeiro motor (ou algum destaque) pode ocupar 2 colunas
            const isHighlight = i === 0;
            return (
              <div
                key={i}
                className={`group bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-xl transition transform hover:-translate-y-1 ${
                  isHighlight ? 'lg:col-span-2 lg:row-span-1' : ''
                }`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${motor.gradient || 'from-blue-500 to-indigo-500'} text-3xl mb-4 shadow-md`}>
                  {motor.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{motor.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{motor.description}</p>
              </div>
            );
          })}
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
    <section className="py-20 md:py-28 bg-gray-900">
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
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-600">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {data.steps?.map((step, i) => (
            <div key={i} className="relative text-center">
              {/* Linha conectora */}
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
// HELPER — Embed de vídeo (YouTube, Vimeo, mp4)
// ============================================================
export const VideoEmbed = ({ url, autoPlay = false }) => {
  if (!url) return null;

  // YouTube
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

  // Vimeo
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

  // mp4 direto
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

  // Fallback: iframe genérico
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