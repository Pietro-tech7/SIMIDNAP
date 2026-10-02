import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useSEO } from '../hooks/useSEO';
import BotaoWhatsApp from '../components/BotaoWhatsApp';

// Seções — Parte 1
import {
  HeroSection,
  CredibilitySection,
  ProblemSection,
  BeforeAfterSection,
  SolutionSection,
  FounderSection,
  VideoSection,
  HowItWorksSection,
} from '../components/landing/LandingSectionsPart1';

// Seções — Parte 2
import {
  MetricsSection,
  TestimonialsSection,
  ComparisonSection,
  FounderOfferSection,
  PlansSection,
  GuaranteeSection,
  FAQSection,
  FinalCTASection,
  FooterSection,
  PopupSection,
} from '../components/landing/LandingSectionsPart2';

const LandingPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // SEO Dinâmico — aplica o que o admin configurou
  useSEO({
    title: config?.seo_title,
    description: config?.seo_description,
    url: 'https://simidnape.com.br',
  });

  // ============================================================
  // SCROLL
  // ============================================================
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================================
  // CARREGAR CONFIG
  // ============================================================
  useEffect(() => {
    api.get('/landing/config')
      .then(res => {
        setConfig(res.data?.config || null);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // ============================================================
  // NAVEGAÇÃO POR ÂNCORAS
  // ============================================================
  const scrollTo = (id) => {
    setMenuAberto(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ============================================================
  // RENDERIZAR SEÇÃO POR NOME
  // ============================================================
  const renderSecao = (nome, data) => {
    if (!data || data.enabled === false) return null;

    switch (nome) {
      case 'hero':          return <HeroSection key={nome} data={data} />;
      case 'credibility':   return <CredibilitySection key={nome} data={data} />;
      case 'problem':       return <ProblemSection key={nome} data={data} />;
      case 'before_after':  return <BeforeAfterSection key={nome} data={data} />;
      case 'solution':      return <SolutionSection key={nome} data={data} />;
      case 'founder':       return <FounderSection key={nome} data={data} />;
      case 'video':         return <VideoSection key={nome} data={data} />;
      case 'how_it_works':  return <HowItWorksSection key={nome} data={data} />;
      case 'metrics':       return <MetricsSection key={nome} data={data} />;
      case 'testimonials':  return <TestimonialsSection key={nome} data={data} />;
      case 'comparison':    return <ComparisonSection key={nome} data={data} />;
      case 'founder_offer': return <FounderOfferSection key={nome} data={data} />;
      case 'plans':         return <PlansSection key={nome} data={data} />;
      case 'guarantee':     return <GuaranteeSection key={nome} data={data} />;
      case 'faq':           return <FAQSection key={nome} data={data} />;
      case 'final_cta':     return <FinalCTASection key={nome} data={data} />;
      case 'footer':        return <FooterSection key={nome} data={data} />;
      default:              return null;
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{config?.error_page?.loading_text || 'Carregando...'}</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERRO — fallback básico
  // ============================================================
  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
        <div className="text-center max-w-lg">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {config?.error_page?.title || 'SIMIDNAPE PRO'}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {config?.error_page?.subtitle || 'O assistente pedagógico com IA para professores brasileiros.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md"
            >
              {config?.error_page?.register_text || 'Criar conta grátis'}
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-3 rounded-xl border-2 border-gray-200"
            >
              {config?.error_page?.login_text || 'Já tenho conta'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ===================== HEADER ===================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-white/95 shadow-md backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="flex flex-col items-start leading-none">
            <div className="inline-flex items-end pt-3">
              {'SIMIDNAPE'.split('').map((letra, i) => (
                <span
                  key={i}
                  className="relative font-display text-2xl md:text-3xl font-bold text-petrol tracking-tight"
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
            <span className="font-serif italic text-[10px] md:text-xs text-ink-soft mt-1 tracking-wide">
              O Professor Inesquecível
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            <button onClick={() => scrollTo('solution')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              {config?.header?.nav_motors_label || 'Motores de IA'}
            </button>
            <button onClick={() => scrollTo('how_it_works')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              {config?.header?.nav_how_label || 'Como funciona'}
            </button>
            <button onClick={() => scrollTo('comparison')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              {config?.header?.nav_comparison_label || 'Comparativo'}
            </button>
            <button onClick={() => scrollTo('plans')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              {config?.header?.nav_plans_label || 'Planos'}
            </button>
            <button onClick={() => scrollTo('faq')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              {config?.header?.nav_faq_label || 'FAQ'}
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 transition text-sm"
            >
              {config?.header?.login_text || 'Entrar'}
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg transition shadow-sm text-sm"
            >
              {config?.header?.register_text || 'Criar conta grátis'}
            </Link>
          </div>

          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden text-gray-700 text-2xl"
          >
            ☰
          </button>
        </div>

        {/* Menu mobile */}
        {menuAberto && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 shadow-lg">
            <button onClick={() => scrollTo('solution')} className="block w-full text-left text-gray-700 font-medium py-2">
              {config?.header?.nav_motors_label || 'Motores de IA'}
            </button>
            <button onClick={() => scrollTo('how_it_works')} className="block w-full text-left text-gray-700 font-medium py-2">
              {config?.header?.nav_how_label || 'Como funciona'}
            </button>
            <button onClick={() => scrollTo('comparison')} className="block w-full text-left text-gray-700 font-medium py-2">
              {config?.header?.nav_comparison_label || 'Comparativo'}
            </button>
            <button onClick={() => scrollTo('plans')} className="block w-full text-left text-gray-700 font-medium py-2">
              {config?.header?.nav_plans_label || 'Planos'}
            </button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-gray-700 font-medium py-2">
              {config?.header?.nav_faq_label || 'FAQ'}
            </button>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link to="/login" className="block text-center text-gray-700 font-medium py-2">
                {config?.header?.login_text || 'Entrar'}
              </Link>
              <Link
                to="/register"
                className="block text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg"
              >
                {config?.header?.register_text || 'Criar conta grátis'}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ===================== SEÇÕES DINÂMICAS ===================== */}
      <main className="pt-16">
        {config.sections_order?.map((nome) => {
          const data = config[nome];
          return renderSecao(nome, data);
        })}
      </main>

      {/* ===================== POPUP (opcional) ===================== */}
      {config.popup?.enabled && <PopupSection data={config.popup} />}

      {/* ===================== BOTÃO WHATSAPP FLUTUANTE ===================== */}
      <BotaoWhatsApp variant="flutuante" />
    </div>
  );
};

export default LandingPage;