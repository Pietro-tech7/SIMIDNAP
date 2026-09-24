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
import BancoQuestoes from './pages/BancoQuestoes';
import BancoQuestoesFundamental from './pages/BancoQuestoesFundamental';
import BancoQuestoesIA from './pages/BancoQuestoesIA';
import MinhaAssinatura from './pages/MinhaAssinatura';
import Perfil from './pages/Perfil';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminPerfil from './pages/AdminPerfil';
import AdminLogin from './pages/AdminLogin';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminBanners from './pages/AdminBanners';
import AdminLanding from './pages/AdminLanding';
import AdminQuestionBank from './pages/AdminQuestionBank';
import AdminQuestionForm from './pages/AdminQuestionForm';
import LandingPage from './pages/LandingPage';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';

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
      <Route path="/" element={<HomeRoute />} />
      <Route path="/termos" element={<Termos />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/modulo/:modulo" element={<ModuloIntro />} />
        <Route path="/neuroaula" element={<NeuroAula />} />
        <Route path="/aula-que-funciona" element={<AulaQueFunciona />} />
        <Route path="/terapia-pedagogica" element={<TerapiaPedagogica />} />
        <Route path="/gerador-materiais" element={<GeradorMateriais />} />
        <Route path="/praticas-exitosas" element={<PraticasExitosas />} />
        <Route path="/banco-questoes" element={<BancoQuestoes />} />
        <Route path="/banco-questoes-fundamental" element={<BancoQuestoesFundamental />} />
        <Route path="/banco-questoes-ia" element={<BancoQuestoesIA />} />
        <Route path="/minha-assinatura" element={<MinhaAssinatura />} />
        <Route path="/meu-aluno" element={<MeuAluno />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      <Route element={<SuperuserRoute><AdminLayout /></SuperuserRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/admin/banners" element={<AdminBanners />} />
        <Route path="/admin/landing" element={<AdminLanding />} />
        <Route path="/admin/question-bank" element={<AdminQuestionBank />} />
        <Route path="/admin/question-bank/criar" element={<AdminQuestionForm />} />
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