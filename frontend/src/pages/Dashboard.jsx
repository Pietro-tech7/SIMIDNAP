import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  const modules = [
    { path: '/modulo/neuroaula', name: 'NeuroAula', icon: '🧠', desc: 'Transforme conteúdo em experiência de aprendizagem.', gradient: 'from-purple-500 to-indigo-500' },
    { path: '/modulo/professor_inteiro', name: 'Terapia Pedagógica', icon: '❤️', desc: 'Converse com um terapeuta pedagógico sobre seus desafios.', gradient: 'from-pink-500 to-rose-500' },
    { path: '/modulo/aula_que_funciona', name: 'Aula que Funciona', icon: '🎯', desc: 'Planeje e melhore sua aula.', gradient: 'from-blue-500 to-cyan-500' },
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-gray-500 capitalize">{hoje}</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">
          Olá, {user?.full_name || 'professor'} — O PROFESSOR INESQUECÍVEL
        </h1>
        <p className="text-lg text-gray-600 mt-1">O que você precisa resolver hoje?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map(mod => (
          <Link
            key={mod.path}
            to={mod.path}
            className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 p-6"
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${mod.gradient} text-white text-2xl mb-4`}>
              {mod.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{mod.name}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{mod.desc}</p>
            <div className="mt-4 text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
              Acessar →
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900">💡 Dica do SIMIDNAPE</h3>
        <p className="text-sm text-blue-800 mt-1">
          Comece pelo <strong>NeuroAula</strong> para planejar sua próxima aula ou use o <strong>IA para Professor</strong> para tirar dúvidas rápidas.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;