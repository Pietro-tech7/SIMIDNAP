import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import AlertaApiKey from '../components/AlertaApiKey';

const Dashboard = () => {
  const { user } = useAuth();

  const modules = [
    { path: '/modulo/neuroaula', name: 'NeuroAula', icon: '🧠', desc: 'Transforme conteúdo em experiência de aprendizagem.', gradient: 'from-purple-500 to-indigo-500' },
    { path: '/modulo/professor_inteiro', name: 'Terapia Pedagógica', icon: '❤️', desc: 'Converse com um terapeuta pedagógico sobre seus desafios.', gradient: 'from-pink-500 to-rose-500' },
    { path: '/modulo/planejador', name: 'PLANEJADOR SIMIDNAPE', icon: '🧠', desc: 'Três modos em um só lugar: aula, planejamento de período e coordenação. Com base em neuroeducação e BNCC.', gradient: 'from-blue-600 via-indigo-600 to-purple-700' },
    { path: '/modulo/meu_aluno', name: 'Meu Aluno', icon: '📊', desc: 'Observe, acompanhe e intervenha.', gradient: 'from-green-500 to-emerald-500' },
    { path: '/modulo/ia_para_professor', name: 'IA para Professor', icon: '🤖', desc: 'Use IA para resolver tarefas pedagógicas.', gradient: 'from-orange-500 to-amber-500' },
    { path: '/modulo/praticas_exitosas', name: 'Práticas Exitosas', icon: '🏆', desc: 'Crie, melhore ou documente práticas pedagógicas que transformam.', gradient: 'from-teal-500 to-cyan-600' },
    { path: '/banco-questoes', name: 'Banco de Questões ENEM', icon: '📚', desc: 'Busque questões oficiais do ENEM e monte simulados.', gradient: 'from-blue-600 to-indigo-700' },
    { path: '/banco-questoes-fundamental', name: 'Banco de Questões Fundamental', icon: '📖', desc: 'Questões para Educação Infantil e Ensino Fundamental — BNCC, Currículo do Piauí, SAEB e SAEPI.', gradient: 'from-amber-500 to-orange-600' },
    { path: '/banco-questoes-ia', name: 'Banco de Questões IA', icon: '✨', desc: 'Gere questões inéditas com IA — BNCC, Currículo do Piauí, SAEB e SAEPI.', gradient: 'from-purple-500 to-pink-600' },
  ];

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ---- Tokens do tema ----
  const textPrimary = { color: 'var(--theme-text-primary)' };
  const textSecondary = { color: 'var(--theme-text-secondary)' };
  const cardStyle = {
    backgroundColor: 'var(--theme-bg-light)',
    borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho de boas-vindas */}
      <div className="mb-8">
        <p className="text-sm capitalize" style={textSecondary}>{hoje}</p>
        <h1
          className="text-3xl font-bold mt-1 font-heading"
          style={textPrimary}
        >
          Olá, {user?.full_name || 'professor'} — O PROFESSOR INESQUECÍVEL
        </h1>
        <p className="text-lg mt-1" style={textSecondary}>
          O que você precisa resolver hoje?
        </p>
      </div>

      {/* ALERTA API KEY — card de destaque no topo (tratado no U1) */}
      <AlertaApiKey variant="card" />

      {/* Grid das ferramentas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map(mod => (
          <Link
            key={mod.path}
            to={mod.path}
            className="group rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 p-6"
            style={cardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-accent) 40%, transparent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-accent) 15%, transparent)';
            }}
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${mod.gradient} text-white text-2xl mb-4`}>
              {mod.icon}
            </div>
            <h3 className="text-lg font-semibold font-heading" style={textPrimary}>
              {mod.name}
            </h3>
            <p className="text-sm mt-1 leading-relaxed" style={textSecondary}>
              {mod.desc}
            </p>
            <div
              className="mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform inline-block"
              style={{ color: 'var(--theme-accent)' }}
            >
              Acessar →
            </div>
          </Link>
        ))}
      </div>

      {/* Dica do SIMIDNAPE */}
      <div
        className="mt-10 rounded-xl p-6 border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--theme-accent) 6%, white)',
          borderColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
        }}
      >
        <h3 className="font-semibold font-heading" style={{ color: 'var(--theme-accent)' }}>
          💡 Dica do SIMIDNAPE
        </h3>
        <p className="text-sm mt-1" style={textSecondary}>
          Comece pelo <strong style={textPrimary}>NeuroAula</strong> para planejar sua próxima aula ou use o{' '}
          <strong style={textPrimary}>IA para Professor</strong> para tirar dúvidas rápidas.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;