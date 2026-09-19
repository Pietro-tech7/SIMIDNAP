import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('Sua conta está inativa. Entre em contato com o suporte.');
      } else {
        setError('E-mail ou senha inválidos.');
      }
    }
  };

  const benefits = [
    'Continue de onde parou, com todo seu histórico salvo',
    'Acesse os 5 motores de IA pedagógica',
    'Gerencie seus créditos e plano a qualquer momento',
    'Suporte para professores brasileiros',
  ];

  return (
    <div className="min-h-screen flex bg-white">
      {/* Coluna esquerda — marca + mensagem */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">SIMIDNAPE</h1>
          <p className="text-sm text-blue-100 mt-1">O Professor Inesquecível</p>
        </div>

        <div className="relative z-10 my-12">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Bem-vindo de volta.
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            Sua próxima aula inesquecível começa aqui.
          </p>

          <ul className="space-y-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-blue-50">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-blue-200">
          © {new Date().getFullYear()} SIMIDNAPE — Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem e Performance Educacional
        </p>
      </div>

      {/* Coluna direita — formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600">SIMIDNAPE</h1>
            <p className="text-xs text-gray-500 mt-1 italic">O Professor Inesquecível</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Entrar na sua conta</h2>
            <p className="text-sm text-gray-600 mt-1">Acesse seus módulos, créditos e materiais.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <a href="/esqueci-senha" className="text-xs text-blue-600 hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Não tem conta?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;