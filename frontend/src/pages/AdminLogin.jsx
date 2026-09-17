import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);

      // Após login, verifica se é superuser
      const res = await api.get('/users/me');

      if (!res.data.is_superuser) {
        setError('Este acesso é restrito a administradores.');
        localStorage.removeItem('access_token');
        setLoading(false);
        return;
      }

      // É superuser — vai para o painel admin
      navigate('/admin');
    } catch (err) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SIMIDNAPE</h1>
          <p className="text-sm text-red-400 mt-1 font-semibold uppercase tracking-wider">
            Painel Administrativo
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Acesso restrito ao administrador do sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="admin@simidnape.com.br"
              required
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition duration-200"
          >
            {loading ? 'Verificando acesso...' : 'Entrar no Painel Admin'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <Link
            to="/login"
            className="text-xs text-gray-400 hover:text-gray-300 transition"
          >
            ← Voltar ao acesso de professor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;