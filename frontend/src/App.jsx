import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ModuloIntro from './pages/ModuloIntro';
import NeuroAula from './pages/NeuroAula';
import AulaQueFunciona from './pages/AulaQueFunciona';
import TerapiaPedagogica from './pages/TerapiaPedagogica';
import GeradorMateriais from './pages/GeradorMateriais';
import MeuAluno from './pages/MeuAluno';
import PraticasExitosas from './pages/PraticasExitosas';
import Perfil from './pages/Perfil';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminPerfil from './pages/AdminPerfil';
import AdminLogin from './pages/AdminLogin';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminBanners from './pages/AdminBanners';
import LandingPage from './pages/LandingPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

const SuperuserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" />;
  if (!user.is_superuser) return <Navigate to="/admin/login" />;
  return children;
};

// Página inicial: se logado vai para dashboard, senão mostra a landing
const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" />;
  return <LandingPage />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Página inicial (landing pública) */}
      <Route path="/" element={<HomeRoute />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Login separado do Super Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Área do Professor */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/modulo/:modulo" element={<ModuloIntro />} />
        <Route path="/neuroaula" element={<NeuroAula />} />
        <Route path="/aula-que-funciona" element={<AulaQueFunciona />} />
        <Route path="/terapia-pedagogica" element={<TerapiaPedagogica />} />
        <Route path="/gerador-materiais" element={<GeradorMateriais />} />
        <Route path="/praticas-exitosas" element={<PraticasExitosas />} />
        <Route path="/meu-aluno" element={<MeuAluno />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      {/* Área do Super Admin (layout escuro próprio) */}
      <Route
        element={
          <SuperuserRoute>
            <AdminLayout />
          </SuperuserRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/admin/banners" element={<AdminBanners />} />
        <Route path="/admin/perfil" element={<AdminPerfil />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;