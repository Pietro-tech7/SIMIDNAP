import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import SidebarBanner from './SidebarBanner';

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
    { path: '/modulo/aula_que_funciona', label: 'Aula que Funciona', icon: '🎯' },
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

  const iconeTipoRecado = {
    info: 'ℹ️',
    aviso: '⚠️',
    sucesso: '✅',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER FIXO NO TOPO */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 md:px-6">
        <div className="md:hidden">
          <Link to="/dashboard" className="text-lg font-bold text-blue-600">
            SIMIDNAPE
          </Link>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <Link
            to="/minha-assinatura"
            className="md:hidden bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            🚀 {ehTrial ? 'Upgrade' : 'Planos'}
          </Link>

          {/* SINO DE RECADOS */}
          <div className="relative" ref={sinoRef}>
            <button
              onClick={() => setSinoAberto(!sinoAberto)}
              className="relative w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
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
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">Recados</h3>
                  {recadosNaoLidos.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                      {recadosNaoLidos.length} novo{recadosNaoLidos.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {recados.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      Nenhum recado por aqui.
                    </div>
                  ) : (
                    recados.map(r => (
                      <div
                        key={r.id}
                        className={`px-4 py-3 border-b border-gray-100 border-l-4 ${
                          corTipoRecado[r.tipo] || 'border-l-blue-500'
                        } ${!r.read ? 'bg-blue-50 bg-opacity-40' : ''} hover:bg-gray-50 transition cursor-pointer`}
                        onClick={() => {
                          if (!r.read) marcarLido(r.id);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{iconeTipoRecado[r.tipo] || 'ℹ️'}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!r.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {r.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
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

          {/* AVATAR DO USUÁRIO */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarAberto(!avatarAberto)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition"
              title={user?.full_name}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user?.full_name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-blue-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm border-2 border-blue-200">
                  {user?.full_name?.[0]?.toUpperCase() || 'P'}
                </div>
              )}
            </button>

            {avatarAberto && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                  <div className="py-1">
                  <Link
                    to="/perfil"
                    onClick={() => setAvatarAberto(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    👤 Meu Perfil
                  </Link>
                  <Link
                    to="/minha-assinatura"
                    onClick={() => setAvatarAberto(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    💳 Minha Assinatura
                  </Link>
                  <Link
                    to="/minha-assinatura"
                    onClick={() => setAvatarAberto(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    🚀 {ehTrial ? 'Fazer Upgrade' : 'Ver Planos'}
                  </Link>
                </div>
                <div className="border-t border-gray-100 py-1">
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
            className="md:hidden text-gray-700 text-2xl"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Sidebar Desktop (menu esquerdo) */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 fixed h-full pt-16">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-blue-600">SIMIDNAPE</h1>
          <p className="text-xs text-gray-500 mt-1 leading-snug">
            Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem e Performance Educacional
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {creditos && (
          <div className="px-4 pb-4 space-y-2">
            <Link
              to="/minha-assinatura"
              className={`block rounded-lg p-3 transition border ${
                mostrarAlertaBaixo
                  ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-semibold ${mostrarAlertaBaixo ? 'text-orange-900' : 'text-blue-900'}`}>
                  {creditos.plano_nome}
                </span>
                <span className={`text-xs font-bold ${mostrarAlertaBaixo ? 'text-orange-700' : 'text-blue-700'}`}>
                  {creditosDisponiveis.toFixed(1)} créditos
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
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
              className="block w-full text-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm py-2.5 rounded-lg transition"
            >
              🚀 {ehTrial ? 'Fazer Upgrade' : 'Ver Planos'}
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-white w-64 h-full p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h1 className="text-xl font-bold text-blue-600 mb-2">SIMIDNAPE</h1>
            <nav className="space-y-1 mt-4">
              {menuItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
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