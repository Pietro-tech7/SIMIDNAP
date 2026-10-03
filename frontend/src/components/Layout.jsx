import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import SidebarBanner from './SidebarBanner';
import AlertaApiKey from './AlertaApiKey';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditos, setCreditos] = useState(null);
  const [recados, setRecados] = useState([]);
  const [sinoAberto, setSinoAberto] = useState(false);
  const [avatarAberto, setAvatarAberto] = useState(false);
  const sinoRef = useRef(null);
  const avatarRef = useRef(null);

  const carregarCreditos = () => {
    api.get('/subscriptions/status')
      .then(res => setCreditos(res.data))
      .catch(() => setCreditos(null));
  };

  const carregarRecados = () => {
    api.get('/announcements/me')
      .then(res => setRecados(res.data || []))
      .catch(() => setRecados([]));
  };

  useEffect(() => {
    carregarCreditos();
    carregarRecados();

    const handleUpdate = () => carregarCreditos();
    window.addEventListener('subscription-updated', handleUpdate);

    return () => {
      window.removeEventListener('subscription-updated', handleUpdate);
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (sinoRef.current && !sinoRef.current.contains(e.target)) {
        setSinoAberto(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const recadosNaoLidos = recados.filter(r => !r.read);

  const marcarLido = async (id) => {
    try {
      await api.put(`/announcements/${id}/read`);
    } catch {}
    setRecados(prev => prev.map(r => r.id === id ? { ...r, read: true } : r));
  };

  const menuItems = [
    { path: '/dashboard', label: 'Início', icon: '🏠' },
    { path: '/modulo/neuroaula', label: 'NeuroAula', icon: '🧠' },
    { path: '/modulo/professor_inteiro', label: 'Terapia Pedagógica', icon: '❤️' },
    { path: '/modulo/planejador', label: 'PLANEJADOR SIMIDNAPE', icon: '🧠' },
    { path: '/meus-planejamentos', label: 'Meus Planejamentos', icon: '📚' },
    { path: '/meu-acervo', label: 'Meu Acervo', icon: '🗂️' },
    { path: '/comunidade', label: 'Comunidade', icon: '🌐' },
    { path: '/modulo/meu_aluno', label: 'Meu Aluno', icon: '📊' },
    { path: '/modulo/ia_para_professor', label: 'Gerador de Materiais', icon: '📄' },
    { path: '/modulo/praticas_exitosas', label: 'Práticas Exitosas', icon: '🏆' },
    { path: '/banco-questoes', label: 'Banco de Questões ENEM', icon: '📚' },
    { path: '/banco-questoes-fundamental', label: 'Banco de Questões Fundamental', icon: '📖' },
    { path: '/banco-questoes-ia', label: 'Banco de Questões IA', icon: '✨' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/modulo/professor_inteiro') {
      return location.pathname === path || location.pathname.startsWith('/terapia-pedagogica');
    }
    if (path === '/modulo/ia_para_professor') {
      return location.pathname === path || location.pathname.startsWith('/gerador-materiais');
    }
    if (path === '/modulo/meu_aluno') {
      return location.pathname === path || location.pathname.startsWith('/meu-aluno');
    }
    if (path === '/modulo/planejador') {
      return location.pathname.startsWith('/planejador');
    }
    if (path === '/meus-planejamentos') {
      return location.pathname.startsWith('/meus-planejamentos');
    }
    if (path === '/meu-acervo') {
      return location.pathname.startsWith('/meu-acervo');
    }
    if (path === '/comunidade') {
      return location.pathname.startsWith('/comunidade');
    }
    if (path === '/modulo/praticas_exitosas') {
      return location.pathname === path || location.pathname.startsWith('/praticas-exitosas');
    }
    if (path === '/banco-questoes') {
      return location.pathname === '/banco-questoes' || location.pathname.startsWith('/modulo/banco_questoes');
    }
    if (path === '/banco-questoes-fundamental') {
      return location.pathname.startsWith('/banco-questoes-fundamental');
    }
    if (path === '/banco-questoes-ia') {
      return location.pathname.startsWith('/banco-questoes-ia');
    }
    return location.pathname === path;
  };

  const pctUsado = creditos
    ? (creditos.creditos_usados / creditos.creditos_total) * 100
    : 0;

  const creditosDisponiveis = creditos?.creditos_disponiveis ?? 0;
  const mostrarAlertaBaixo = creditos && pctUsado >= 70;
  const ehTrial = creditos?.plano === 'trial';

  const corTipoRecado = {
    info: 'border-l-blue-500',
    aviso: 'border-l-yellow-500',
    sucesso: 'border-l-green-500',
  };

  // Nome do CTA de upgrade (adapta por plano) — copy psicológica
  const getCTAName = () => {
    if (!creditos) return 'Ver planos';
    if (creditos.plano === 'trial') return 'Desbloquear recursos';
    if (creditos.plano === 'avancado') return 'Mais créditos';
    return 'Subir de nível';
  };

  // Nome curto para o botão do mobile
  const getCTAMobile = () => {
    if (!creditos) return 'Planos';
    if (creditos.plano === 'trial') return 'Desbloquear';
    if (creditos.plano === 'avancado') return 'Créditos';
    return 'Subir';
  };

  const iconeTipoRecado = {
    info: 'ℹ️',
    aviso: '⚠️',
    sucesso: '✅',
  };

  // ---- ESTILOS DO TEMA (reaproveitados em vários lugares) ----
  const bgLight = { backgroundColor: 'var(--theme-bg-light)' };
  const borderSubtle = { borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' };
  const textPrimary = { color: 'var(--theme-text-primary)' };
  const textSecondary = { color: 'var(--theme-text-secondary)' };

  return (
    <div className="min-h-screen" style={bgLight}>
      {/* HEADER FIXO NO TOPO */}
      <header
        className="fixed top-0 left-0 right-0 h-16 border-b z-30 flex items-center justify-between px-4 md:px-6"
        style={{ backgroundColor: 'var(--theme-bg-light)', ...borderSubtle }}
      >
        <div className="md:hidden">
          <Link to="/dashboard" className="flex items-end">
            {'SIMIDNAPE'.split('').map((letra, i) => (
              <span
                key={i}
                className="relative font-display text-lg font-bold tracking-tight"
                style={{ color: 'var(--theme-accent)' }}
              >
                {letra === 'I' && (
                  <span
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                      i === 1 ? 'bg-coral' : 'bg-gold'
                    }`}
                  />
                )}
                {letra}
              </span>
            ))}
          </Link>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <Link
            to="/minha-assinatura"
            className="md:hidden text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            🚀 {getCTAMobile()}
          </Link>

          {/* SINO DE RECADOS */}
          <div className="relative" ref={sinoRef}>
            <button
              onClick={() => setSinoAberto(!sinoAberto)}
              className="relative w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center transition"
              title="Recados"
            >
              <span className="text-xl">🔔</span>
              {recadosNaoLidos.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {recadosNaoLidos.length > 9 ? '9+' : recadosNaoLidos.length}
                </span>
              )}
            </button>

            {sinoAberto && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl shadow-xl border overflow-hidden z-50" style={{ backgroundColor: 'var(--theme-bg-light)', ...borderSubtle }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={borderSubtle}>
                  <h3 className="font-semibold text-sm font-heading" style={textPrimary}>Recados</h3>
                  {recadosNaoLidos.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                      {recadosNaoLidos.length} novo{recadosNaoLidos.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {recados.length === 0 ? (
                    <div className="p-6 text-center text-sm" style={textSecondary}>
                      Nenhum recado por aqui.
                    </div>
                  ) : (
                    recados.map(r => (
                      <div
                        key={r.id}
                        className={`px-4 py-3 border-b border-l-4 ${
                          corTipoRecado[r.tipo] || 'border-l-blue-500'
                        } ${!r.read ? 'bg-blue-50/40' : ''} hover:bg-black/5 transition cursor-pointer`}
                        style={{ borderBottomColor: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)' }}
                        onClick={() => {
                          if (!r.read) marcarLido(r.id);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{iconeTipoRecado[r.tipo] || 'ℹ️'}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!r.read ? 'font-semibold' : 'font-medium'}`} style={textPrimary}>
                              {r.title}
                            </p>
                            <p className="text-xs mt-1 leading-relaxed" style={textSecondary}>{r.message}</p>
                            <p className="text-xs mt-2" style={{ color: 'color-mix(in srgb, var(--theme-text-secondary) 60%, transparent)' }}>
                              {new Date(r.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {!r.read && (
                            <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ALERTA API KEY — badge ao lado do avatar */}
          <AlertaApiKey variant="badge" />

          {/* AVATAR DO USUÁRIO */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarAberto(!avatarAberto)}
              className="flex items-center gap-2 hover:bg-black/5 rounded-full p-1 transition"
              title={user?.full_name}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user?.full_name}
                  className="w-9 h-9 rounded-full object-cover border-2"
                  style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)' }}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm border-2"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
                    color: 'var(--theme-accent)',
                    borderColor: 'color-mix(in srgb, var(--theme-accent) 30%, transparent)',
                  }}
                >
                  {user?.full_name?.[0]?.toUpperCase() || 'P'}
                </div>
              )}
            </button>

            {avatarAberto && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50" style={{ backgroundColor: 'var(--theme-bg-light)', ...borderSubtle }}>
                <div className="px-4 py-3 border-b" style={borderSubtle}>
                  <p className="text-sm font-semibold truncate" style={textPrimary}>{user?.full_name}</p>
                  <p className="text-xs truncate" style={textSecondary}>{user?.email}</p>
                  {creditos && (
                    <div
                      className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--theme-accent) 12%, transparent)',
                        color: 'var(--theme-accent)',
                        borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)',
                      }}
                    >
                      <span>{creditos.plano_icone || '📋'}</span>
                      <span className="uppercase tracking-wide">
                        Plano {creditos.plano_nome}
                      </span>
                    </div>
                  )}
                </div>
                <div className="py-1">
                  <Link
                    to="/perfil"
                    onClick={() => setAvatarAberto(false)}
                    className="block px-4 py-2 text-sm hover:bg-black/5 transition"
                    style={textPrimary}
                  >
                    👤 Meu Perfil
                  </Link>
                  <Link
                    to="/minha-assinatura"
                    onClick={() => setAvatarAberto(false)}
                    className="block px-4 py-2 text-sm hover:bg-black/5 transition"
                    style={textPrimary}
                  >
                    💳 Minha Assinatura
                  </Link>
                  <Link
                    to="/minha-assinatura"
                    onClick={() => setAvatarAberto(false)}
                    className="block px-4 py-2 text-sm font-semibold hover:bg-black/5 transition"
                    style={{ color: 'var(--theme-primary)' }}
                  >
                    🚀 {getCTAName()}
                  </Link>
                </div>
                <div className="border-t py-1" style={borderSubtle}>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-2xl"
            style={textPrimary}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Sidebar Desktop (menu esquerdo) */}
      <aside
        className="hidden md:flex md:flex-col w-64 border-r fixed h-full pt-16"
        style={{ backgroundColor: 'var(--theme-bg-light)', ...borderSubtle }}
      >
        <div className="px-6 py-5 border-b" style={borderSubtle}>
          <div className="flex flex-col items-start">
            <div className="inline-flex items-end pt-3">
              {'SIMIDNAPE'.split('').map((letra, i) => (
                <span
                  key={i}
                  className="relative font-display text-xl font-bold tracking-tight"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {letra === 'I' && (
                    <span
                      className={`absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        i === 1 ? 'bg-coral' : 'bg-gold'
                      }`}
                    />
                  )}
                  {letra}
                </span>
              ))}
            </div>
            <span
              className="font-serif italic text-[10px] mt-0.5 tracking-wide"
              style={textSecondary}
            >
              O Professor Inesquecível
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const ativo = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition"
                style={
                  ativo
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--theme-accent) 12%, transparent)',
                        color: 'var(--theme-accent)',
                        fontWeight: 600,
                      }
                    : { color: 'var(--theme-text-secondary)' }
                }
                onMouseEnter={(e) => { if (!ativo) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={(e) => { if (!ativo) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {creditos && (
          <div className="px-4 pb-4 space-y-2">
            <Link
              to="/minha-assinatura"
              className="block rounded-lg p-3 transition border"
              style={{
                backgroundColor: mostrarAlertaBaixo
                  ? 'color-mix(in srgb, var(--theme-warning) 8%, white)'
                  : 'color-mix(in srgb, var(--theme-accent) 6%, white)',
                borderColor: mostrarAlertaBaixo
                  ? 'color-mix(in srgb, var(--theme-warning) 25%, transparent)'
                  : 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
              }}
            >
              {/* Badge de identificação do plano */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-2xl leading-none">
                  {creditos.plano_icone || '📋'}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[9px] uppercase tracking-widest font-bold"
                    style={{ color: mostrarAlertaBaixo ? 'var(--theme-warning)' : 'var(--theme-accent)' }}
                  >
                    Seu plano
                  </p>
                  <p className="text-sm font-bold truncate font-heading" style={textPrimary}>
                    {creditos.plano_nome}
                  </p>
                </div>
              </div>

              {/* Créditos */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-medium" style={textSecondary}>
                  {creditosDisponiveis.toFixed(1)} créditos
                </span>
              </div>
              <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                <div
                  className={`h-full ${
                    pctUsado > 80 ? 'bg-red-500' : pctUsado > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(pctUsado, 100)}%` }}
                />
              </div>
            </Link>

            <Link
              to="/minha-assinatura"
              className="block w-full text-center text-white font-bold text-sm py-2.5 rounded-lg transition shadow-md hover:opacity-90"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              🚀 {getCTAName()}
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full p-4 overflow-y-auto"
            style={bgLight}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2">
              <div className="inline-flex items-end pt-2">
                {'SIMIDNAPE'.split('').map((letra, i) => (
                  <span
                    key={i}
                    className="relative font-display text-lg font-bold tracking-tight"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    {letra === 'I' && (
                      <span
                        className={`absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                          i === 1 ? 'bg-coral' : 'bg-gold'
                        }`}
                      />
                    )}
                    {letra}
                  </span>
                ))}
              </div>
            </div>
            <nav className="space-y-1 mt-4">
              {menuItems.map(item => {
                const ativo = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition"
                    style={
                      ativo
                        ? {
                            backgroundColor: 'color-mix(in srgb, var(--theme-accent) 12%, transparent)',
                            color: 'var(--theme-accent)',
                            fontWeight: 600,
                          }
                        : { color: 'var(--theme-text-secondary)' }
                    }
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 mt-4 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              Sair
            </button>
          </div>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO: main (esquerda) + coluna lateral (direita) */}
      <div className="md:ml-64 pt-16 flex gap-6 px-4 md:px-6">
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        <SidebarBanner />
      </div>
    </div>
  );
};

export default Layout;