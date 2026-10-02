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
    'Continue de onde parou — todo seu histórico salvo',
    'Acesse os 9 motores de IA pedagógica',
    'Gerencie seus créditos e plano quando quiser',
    'Suporte humano para professores brasileiros',
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--theme-bg-light)' }}>
      {/* Coluna esquerda — 60% — marca + formulário */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md">

          {/* Logo SIMIDNAPE tipográfico */}
          <Link to="/" className="inline-block mb-10">
            <div className="inline-flex items-end pt-3">
              {'SIMIDNAPE'.split('').map((letra, i) => (
                <span
                  key={i}
                  className="relative font-display text-2xl md:text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--theme-accent)' }}
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
            <span
              className="block font-serif italic text-[10px] md:text-xs mt-1 tracking-wide"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              O Professor Inesquecível
            </span>
          </Link>

          {/* Boas-vindas */}
          <h1
            className="text-3xl md:text-4xl font-bold mb-2 font-heading"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Bem-vindo de volta.
          </h1>
          <p className="mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            Sua próxima aula inesquecível começa aqui.
          </p>

          {/* Checklist de benefícios */}
          <ul className="space-y-2.5 mb-8">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--theme-success) 20%, transparent)' }}
                >
                  <svg
                    className="w-3 h-3"
                    style={{ color: 'var(--theme-success)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span style={{ color: 'var(--theme-text-secondary)' }}>{b}</span>
              </li>
            ))}
          </ul>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 bg-white border focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
                style={{
                  borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)',
                  color: 'var(--theme-text-primary)',
                }}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-sm font-medium"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  Senha
                </label>
                <a
                  href="/esqueci-senha"
                  className="text-xs hover:underline"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 pr-12 bg-white border focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)',
                    color: 'var(--theme-text-primary)',
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition"
                  style={{ color: 'var(--theme-text-secondary)' }}
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

            {error && (
              <div
                className="text-sm rounded-lg px-4 py-3 border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-warning) 10%, white)',
                  borderColor: 'color-mix(in srgb, var(--theme-warning) 30%, transparent)',
                  color: 'var(--theme-warning)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg hover:opacity-90 text-white"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--theme-text-secondary)' }}>
            Não tem conta?{' '}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: 'var(--theme-accent)' }}
            >
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>

      {/* Coluna direita — 40% — foto da professora (só desktop) */}
      <div
        className="hidden lg:flex lg:w-2/5 items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 8%, white)' }}
      >
        {/* Elementos decorativos */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: 'var(--theme-highlight)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        />

        {/* Placeholder da foto */}
        <div className="relative z-10 text-center p-8">
          <div
            className="w-72 h-96 mx-auto rounded-3xl flex items-center justify-center mb-4 border-2 border-dashed"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
              borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)',
            }}
          >
            <div className="text-center">
              <span className="text-8xl block mb-3">👩‍🏫</span>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Foto da professora
              </p>
            </div>
          </div>
          <p
            className="text-xs italic"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Espaço reservado — proporção retrato
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;