import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

// Seções — Parte 1
import {
  HeroSection,
  CredibilitySection,
  ProblemSection,
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
          <p className="text-gray-500">Carregando...</p>
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
            SIMIDNAPE PRO
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            O assistente pedagógico com IA para professores brasileiros.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md"
            >
              Criar conta grátis
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-3 rounded-xl border-2 border-gray-200"
            >
              Já tenho conta
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
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SIMIDNAPE PRO
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            <button onClick={() => scrollTo('solution')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              Motores de IA
            </button>
            <button onClick={() => scrollTo('how_it_works')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              Como funciona
            </button>
            <button onClick={() => scrollTo('comparison')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              Comparativo
            </button>
            <button onClick={() => scrollTo('plans')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              Planos
            </button>
            <button onClick={() => scrollTo('faq')} className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">
              FAQ
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 transition text-sm"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg transition shadow-sm text-sm"
            >
              Criar conta grátis
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
              Motores de IA
            </button>
            <button onClick={() => scrollTo('how_it_works')} className="block w-full text-left text-gray-700 font-medium py-2">
              Como funciona
            </button>
            <button onClick={() => scrollTo('comparison')} className="block w-full text-left text-gray-700 font-medium py-2">
              Comparativo
            </button>
            <button onClick={() => scrollTo('plans')} className="block w-full text-left text-gray-700 font-medium py-2">
              Planos
            </button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-gray-700 font-medium py-2">
              FAQ
            </button>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link to="/login" className="block text-center text-gray-700 font-medium py-2">
                Entrar
              </Link>
              <Link
                to="/register"
                className="block text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg"
              >
                Criar conta grátis
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
    </div>
  );
};

export default LandingPage;