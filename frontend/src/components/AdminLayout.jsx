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
    { path: '/admin/announcements', label: 'Recados', icon: '📢' },
    { path: '/admin/banners', label: 'Banners', icon: '🎨' },
    { path: '/admin/perfil', label: 'Meu Perfil', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Admin */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gray-900 text-white fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">SIMIDNAPE</h1>
          <p className="text-xs text-red-400 mt-1 font-semibold uppercase tracking-wider">
            🔐 Painel Administrativo
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(item.path)
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Botão "voltar ao modo professor" */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            to="/dashboard"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 rounded-lg transition"
          >
            ← Voltar ao modo professor
          </Link>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-semibold text-sm">
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-20 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">SIMIDNAPE</h1>
          <p className="text-xs text-red-400 font-semibold">🔐 Painel Admin</p>
        </div>
        <Link
          to="/dashboard"
          className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-full"
        >
          Modo Professor
        </Link>
      </div>

      {/* Mobile nav bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-20 flex">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 text-center py-3 text-xs font-medium ${
              isActive(item.path) ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            <div className="text-lg">{item.icon}</div>
            <div>{item.label}</div>
          </Link>
        ))}
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;