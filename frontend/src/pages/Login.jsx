import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Busca config pública (foto e textos editáveis pelo admin)
  useEffect(() => {
    api.get('/landing/config')
      .then(res => setConfig(res.data?.config || null))
      .catch(() => setConfig(null));
  }, []);

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

  const loginCfg = config?.login || {};
  const welcomeTitle = loginCfg.welcome_title || 'Bem-vindo de volta.';
  const welcomeSubtitle = loginCfg.welcome_subtitle || 'Sua próxima aula inesquecível começa aqui.';
  const benefits = loginCfg.benefits?.length
    ? loginCfg.benefits
    : [
        'Continue de onde parou — todo seu histórico salvo',
        'Acesse os 9 motores de IA pedagógica',
        'Gerencie seus créditos e plano quando quiser',
        'Suporte humano para professores brasileiros',
      ];
  const photo = loginCfg.photo || '';

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
            {welcomeTitle}
          </h1>
          <p className="mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            {welcomeSubtitle}
          </p>

          {/* Checklist de benefícios */}
          <ul className="space-y-2.5 mb-8">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
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

      {/* Coluna direita — 40% — foto da professora com efeito "através do quadro" */}
      <div
        className="hidden lg:block lg:w-2/5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent) 45%, color-mix(in srgb, var(--theme-highlight) 70%, var(--theme-accent)) 100%)',
        }}
      >
        {/* Card pastel — moldura da foto (rounded só no topo, desce até o fim) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-24 bottom-0 w-[420px] rounded-t-[2.5rem] shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--theme-bg-light)' }}
        >
          {photo ? (
            <img
              src={photo}
              alt="Professora"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
            >
              <span className="text-9xl mb-4">👩‍🏫</span>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Foto da professora
              </p>
            </div>
          )}
        </div>

        {/* Elementos decorativos suaves */}
        <div
          className="absolute top-12 right-12 w-40 h-40 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: 'var(--theme-highlight)' }}
        />
        <div
          className="absolute bottom-24 left-8 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: 'var(--theme-bg-light)' }}
        />
      </div>
    </div>
  );
};

export default Login;