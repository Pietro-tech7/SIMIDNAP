import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Usuários', icon: '👥' },
    { path: '/admin/question-bank', label: 'Banco de Questões', icon: '📚' },
    { path: '/admin/correlacoes', label: 'Correlações', icon: '🔗' },
    { path: '/admin/figure-bank', label: 'Banco de Figuras', icon: '🏞️' },
    { path: '/admin/announcements', label: 'Recados', icon: '📢' },
    { path: '/admin/banners', label: 'Banners', icon: '🎨' },
    { path: '/admin/landing', label: 'Landing Page', icon: '🖼️' },
    { path: '/admin/perfil', label: 'Meu Perfil', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ============================================================ */}
      {/* SIDEBAR DESKTOP */}
      {/* ============================================================ */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-950 fixed h-full">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800/60">
          <Link to="/admin" className="block">
            <h1 className="text-lg font-bold text-white tracking-tight">
              SIMIDNAPE <span className="text-blue-400">PRO</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
              Painel Administrativo
            </p>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => {
            const ativo = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  ativo
                    ? 'bg-blue-500/10 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className="text-base opacity-90">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {ativo && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé — usuário + ações */}
        <div className="px-3 pb-4 pt-4 border-t border-slate-800/60 space-y-3">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium py-2.5 rounded-lg transition border border-slate-700/50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Modo Professor
          </Link>

          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/5 py-2 rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE HEADER */}
      {/* ============================================================ */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-950 border-b border-slate-800/60 z-20 px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="block">
          <h1 className="text-base font-bold text-white leading-tight">
            SIMIDNAPE <span className="text-blue-400">PRO</span>
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            Painel Administrativo
          </p>
        </Link>
        <Link
          to="/dashboard"
          className="text-xs bg-slate-800 text-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-700/50"
        >
          Modo Professor
        </Link>
      </div>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM NAV */}
      {/* ============================================================ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800/60 z-20 flex overflow-x-auto">
        {menuItems.map(item => {
          const ativo = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 min-w-[70px] text-center py-2.5 text-[10px] transition ${
                ativo ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <div className="text-lg mb-0.5">{item.icon}</div>
              <div className="truncate px-1 font-medium">{item.label}</div>
            </Link>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* CONTEÚDO */}
      {/* ============================================================ */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;