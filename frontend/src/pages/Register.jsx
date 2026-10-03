import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

// Lista de UFs do Brasil
const UFS = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
];

const REDES = [
  ['estadual', 'Rede pública estadual'],
  ['municipal', 'Rede pública municipal'],
  ['privada', 'Rede privada'],
  ['outro', 'Outro'],
];

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState('');
  const [rede, setRede] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Busca config pública
  useEffect(() => {
    api.get('/landing/config')
      .then(res => setConfig(res.data?.config || null))
      .catch(() => setConfig(null));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!estado) {
      setError('Selecione o estado onde você leciona.');
      return;
    }
    if (!rede) {
      setError('Selecione a rede de ensino.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!acceptTerms) {
      setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    try {
      await register(email, password, fullName, estado, rede);
      setSuccess('Cadastro realizado! Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err?.response?.status === 400) {
        setError('Este e-mail já está cadastrado. Tente outro ou faça login.');
      } else {
        setError('Erro ao cadastrar. Verifique os dados e tente novamente.');
      }
    }
  };

  const registerCfg = config?.register || {};
  const welcomeTitle = registerCfg.welcome_title || 'Crie sua conta.';
  const welcomeSubtitle = registerCfg.welcome_subtitle || '7 créditos grátis para testar. Sem cartão de crédito.';
  const photo = registerCfg.photo || '';

  const inputStyle = {
    borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)',
    color: 'var(--theme-text-primary)',
  };
  const labelStyle = { color: 'var(--theme-text-primary)' };

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
          <p className="mb-8" style={{ color: 'var(--theme-text-secondary)' }}>
            {welcomeSubtitle}
          </p>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome completo */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 bg-white border focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
                style={inputStyle}
                placeholder="Como você se chama?"
                required
              />
            </div>

            {/* Estado + Rede */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                  Estado onde leciona
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 bg-white border focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
                  style={inputStyle}
                  required
                >
                  <option value="">Selecione...</option>
                  {UFS.map(([uf, nome]) => (
                    <option key={uf} value={uf}>{nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                  Rede de ensino
                </label>
                <select
                  value={rede}
                  onChange={(e) => setRede(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 bg-white border focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
                  style={inputStyle}
                  required
                >
                  <option value="">Selecione...</option>
                  {REDES.map(([val, nome]) => (
                    <option key={val} value={val}>{nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 bg-white border focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
                style={inputStyle}
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 pr-12 bg-white border focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
                  style={inputStyle}
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirmar senha */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 pr-12 bg-white border focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
                  style={inputStyle}
                  placeholder="Repita a senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition"
                  style={{ color: 'var(--theme-text-secondary)' }}
                  tabIndex={-1}
                >
                  {showConfirm ? (
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

            {/* Termos */}
            <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: 'var(--theme-text-secondary)' }}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded focus:ring-2"
                style={{ accentColor: 'var(--theme-primary)' }}
              />
              <span>
                Li e aceito os{' '}
                <a href="/termos" className="font-medium hover:underline" style={{ color: 'var(--theme-accent)' }}>Termos de Uso</a>
                {' '}e a{' '}
                <a href="/privacidade" className="font-medium hover:underline" style={{ color: 'var(--theme-accent)' }}>Política de Privacidade</a>.
              </span>
            </label>

            {/* Newsletter */}
            <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: 'var(--theme-text-secondary)' }}>
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded focus:ring-2"
                style={{ accentColor: 'var(--theme-primary)' }}
              />
              <span>Quero receber novidades, dicas pedagógicas e atualizações por e-mail.</span>
            </label>

            {/* Mensagens */}
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
            {success && (
              <div
                className="text-sm rounded-lg px-4 py-3 border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-success) 10%, white)',
                  borderColor: 'color-mix(in srgb, var(--theme-success) 30%, transparent)',
                  color: 'var(--theme-success)',
                }}
              >
                {success}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              className="w-full font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg hover:opacity-90 text-white"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              Criar minha conta grátis
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--theme-text-secondary)' }}>
            Já tem conta?{' '}
            <Link
              to="/login"
              className="font-semibold hover:underline"
              style={{ color: 'var(--theme-accent)' }}
            >
              Faça login
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
        {/* Card pastel atrás (o "quadro") */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-32 bottom-20 w-[340px] rounded-[2rem] shadow-2xl"
          style={{ backgroundColor: 'var(--theme-bg-light)' }}
        />

        {/* Elementos decorativos suaves */}
        <div
          className="absolute top-12 right-12 w-40 h-40 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: 'var(--theme-highlight)' }}
        />
        <div
          className="absolute bottom-24 left-8 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: 'var(--theme-bg-light)' }}
        />

        {/* Foto emergindo do card */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[380px] h-[600px] flex items-end justify-center">
          {photo ? (
            <img
              src={photo}
              alt="Professora"
              className="max-h-full object-contain object-bottom drop-shadow-2xl"
            />
          ) : (
            <div
              className="w-[280px] h-[420px] mb-4 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed"
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderColor: 'color-mix(in srgb, var(--theme-accent) 30%, transparent)',
              }}
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
      </div>
    </div>
  );
};

export default Register;