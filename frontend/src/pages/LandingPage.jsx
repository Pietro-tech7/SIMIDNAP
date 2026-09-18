import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faqAberto, setFaqAberto] = useState(null);
  const [vagasFundador] = useState(77);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const modulos = [
    {
      icone: '🧠',
      nome: 'NeuroAula',
      promessa: 'Aula que engaja de verdade',
      desc: 'Transforme qualquer conteúdo em uma aula pronta para executar, com base em como o cérebro aprende. Objetivo, conhecimentos prévios, estratégias de atenção, verificação e adaptações — tudo estruturado.',
      cor: 'from-purple-500 to-indigo-500',
    },
    {
      icone: '❤️',
      nome: 'Terapia Pedagógica',
      promessa: 'Suporte emocional para o professor',
      desc: 'Um espaço seguro para refletir sobre emoções, conflitos e desafios da docência. O professor conversa livremente e recebe acolhimento, novas perspectivas e pequenas ações práticas.',
      cor: 'from-pink-500 to-rose-500',
    },
    {
      icone: '🎯',
      nome: 'Aula que Funciona',
      promessa: 'Script cronometrado, pronto para aplicar',
      desc: 'Informe série, disciplina, conteúdo e tempo. O sistema gera um roteiro minuto a minuto, com falas exatas, ações concretas, checklist de materiais e adaptações.',
      cor: 'from-blue-500 to-cyan-500',
    },
    {
      icone: '📊',
      nome: 'Meu Aluno',
      promessa: 'Acompanhamento individualizado',
      desc: 'Descreva uma situação concreta e receba hipóteses pedagógicas, intervenções sugeridas e o que observar. Nunca faz diagnóstico clínico — atua como pedagogo especialista.',
      cor: 'from-green-500 to-emerald-500',
    },
    {
      icone: '📄',
      nome: 'Gerador de Materiais',
      promessa: 'Atividades, jogos e simulados em segundos',
      desc: 'Crie atividades imprimíveis, jogos e dinâmicas, simulados com gabarito, e materiais diferenciados (versão principal + adaptada). Tudo alinhado à BNCC.',
      cor: 'from-orange-500 to-amber-500',
    },
  ];

  const planos = [
    {
      nome: 'Trial',
      preco: 'Grátis',
      periodo: 'para testar',
      creditos: '5 créditos',
      destaque: false,
      trial: true,
      itens: ['5 gerações de IA', 'Acesso a todos os módulos', 'Sem cartão de crédito'],
    },
    {
      nome: 'Básico',
      preco: 'R$ 9,90',
      periodo: '/mês',
      creditos: '15 créditos/mês',
      destaque: false,
      itens: ['15 gerações de IA', 'Acesso a todos os módulos', 'Cancele quando quiser'],
    },
    {
      nome: 'Padrão',
      preco: 'R$ 19,90',
      periodo: '/mês',
      creditos: '25 créditos/mês',
      destaque: true,
      itens: ['25 gerações de IA', 'Acesso a todos os módulos', 'Suporte prioritário', 'Cancele quando quiser'],
    },
    {
      nome: 'Avançado',
      preco: 'R$ 49,90',
      periodo: '/mês',
      creditos: '100 créditos/mês',
      destaque: false,
      itens: ['100 gerações de IA', 'Acesso a todos os módulos', 'Suporte prioritário', 'Cancele quando quiser'],
    },
  ];

  const depoimentos = [
    {
      nome: 'Ana Paula',
      info: 'Prof. 5º ano · São Paulo/SP',
      texto: 'Em 3 dias, usei o NeuroAula para preparar frações e foi a melhor aula do bimestre. Meus alunos participaram de verdade.',
      avatar: 'AP',
    },
    {
      nome: 'Carlos Eduardo',
      info: 'Prof. Matemática · Belo Horizonte/MG',
      texto: 'O Aula que Funciona me deu um script cronometrado que usei literalmente em sala. Zero improviso.',
      avatar: 'CE',
    },
    {
      nome: 'Juliana Santos',
      info: 'Prof. Educação Infantil · Salvador/BA',
      texto: 'A Terapia Pedagógica me ajudou a entender por que eu estava exausta. Hoje chego em casa mais leve.',
      avatar: 'JS',
    },
  ];

  const faqs = [
    {
      p: 'Por que o nome SIMIDNAPE?',
      r: 'SIMIDNAPE significa Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem e Performance Educacional. Nasceu como um projeto de rede pública e evoluiu para um assistente pedagógico do professor brasileiro.',
    },
    {
      p: 'Quem é Darilson Cornélio?',
      r: 'Darilson Cornélio é psicanalista, educador e pesquisador da neuroaprendizagem. Criador da metodologia SIMIDNAPE e do conceito "O Professor Inesquecível". Atua há anos na formação de professores e na criação de ferramentas que respeitam a autonomia docente.',
    },
    {
      p: 'O SIMIDNAPE substitui o professor?',
      r: 'Não. O SIMIDNAPE é um copiloto pedagógico. Ele ajuda o professor a planejar, refletir e agir melhor — mas todas as decisões continuam sendo do professor.',
    },
    {
      p: 'O sistema faz diagnósticos clínicos?',
      r: 'Não. Em nenhum módulo o sistema realiza diagnóstico de transtornos. O Meu Aluno, por exemplo, sugere apenas hipóteses pedagógicas e intervenções concretas para a sala de aula.',
    },
    {
      p: 'Os materiais são alinhados à BNCC?',
      r: 'Sim. Você seleciona a habilidade BNCC ou digita o código, e o sistema usa aquela habilidade para orientar o objetivo, as atividades e a avaliação.',
    },
    {
      p: 'Como funcionam os créditos?',
      r: 'Cada operação consome uma quantidade de créditos: 1 crédito por geração simples, 2 créditos por material diferenciado e 0,2 crédito por mensagem de chat terapêutico.',
    },
    {
      p: 'Posso cancelar quando quiser?',
      r: 'Sim. Sem multa, sem burocracia. Basta acessar o perfil e cancelar.',
    },
    {
      p: 'Meus dados e dos meus alunos estão seguros?',
      r: 'Sim. Seguimos a LGPD. Não armazenamos dados desnecessários de alunos, e todos os dados ficam vinculados ao professor cadastrado.',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ===================== HEADER ===================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md' : 'bg-white bg-opacity-95 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-blue-600">SIMIDNAPE</span>
            <span className="text-[10px] text-gray-500 hidden md:block">
              Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem e Performance Educacional
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            <a href="#modulos" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">Os 5 Motores</a>
            <a href="#como-funciona" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">Como funciona</a>
            <a href="#comparativo" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">Por que não é ChatGPT</a>
            <a href="#precos" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">Preços</a>
            <a href="#faq" className="text-gray-700 hover:text-blue-600 font-medium transition text-sm">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full hidden lg:inline">
              🇧🇷 Feito no Brasil
            </span>
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 transition text-sm"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition shadow-sm text-sm"
            >
              Criar conta
            </Link>
          </div>

          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden text-gray-700 text-2xl"
          >
            ☰
          </button>
        </div>

        {menuAberto && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <a href="#modulos" onClick={() => setMenuAberto(false)} className="block text-gray-700 font-medium py-2">Os 5 Motores</a>
            <a href="#como-funciona" onClick={() => setMenuAberto(false)} className="block text-gray-700 font-medium py-2">Como funciona</a>
            <a href="#comparativo" onClick={() => setMenuAberto(false)} className="block text-gray-700 font-medium py-2">Por que não é ChatGPT</a>
            <a href="#precos" onClick={() => setMenuAberto(false)} className="block text-gray-700 font-medium py-2">Preços</a>
            <a href="#faq" onClick={() => setMenuAberto(false)} className="block text-gray-700 font-medium py-2">FAQ</a>
            <Link to="/login" className="block text-gray-700 font-medium py-2">Entrar</Link>
            <Link to="/register" className="block text-center bg-orange-500 text-white font-semibold py-2.5 rounded-lg">
              Criar conta
            </Link>
          </div>
        )}
      </header>

      {/* ===================== HERO ===================== */}
      <section className="pt-32 pb-20 px-4 md:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20"></div>

        <div className="max-w-6xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm text-gray-600 font-medium">✨ Para professores que querem deixar marca</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Torne-se <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">O Professor Inesquecível</span><br />
            na vida dos seus alunos
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            O SIMIDNAPE é o copiloto pedagógico que transforma a sua prática diária
            em aulas que os alunos não esquecem — com base em neuroeducação e ciência da aprendizagem.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg hover:shadow-xl text-lg"
            >
              Quero ser O Professor Inesquecível →
            </Link>
            <a
              href="#modulos"
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-4 rounded-xl transition border border-gray-200 text-lg"
            >
              Ver os 5 motores
            </a>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            ✅ 5 créditos grátis · ✅ Sem cartão de crédito · ✅ Cancele quando quiser
          </p>

          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 md:p-4">
              <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-400 text-xs ml-3">simidnape.com.br/dashboard</span>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 text-left">
                <div className="text-sm text-gray-500 mb-1">Segunda-feira, 17 de setembro</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">Olá, professor.</div>
                <div className="text-gray-600 mb-6">O que você precisa resolver hoje?</div>
                <div className="grid grid-cols-3 gap-3">
                  {['🧠 NeuroAula', '❤️ Terapia', '🎯 Aula'].map((m, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-3 text-sm font-medium text-gray-700 border border-gray-100">
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== OS 5 MOTORES (logo após o Hero) ===================== */}
      <section id="modulos" className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-700 uppercase tracking-wider">O que você recebe</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 mt-2">
              Cinco motores pedagógicos
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Cada módulo tem função própria. Juntos, cobrem todo o ciclo do professor:
              pensar → planejar → agir → observar → intervir → melhorar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulos.map((m, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${m.cor} text-white text-2xl mb-4`}
                >
                  {m.icone}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{m.nome}</h3>
                <p className="text-sm font-semibold text-blue-600 mb-2">{m.promessa}</p>
                <p className="text-gray-600 leading-relaxed text-sm">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== VÍDEO DO FUNDADOR (espaço reservado) ===================== */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1 text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-5xl font-bold shadow-lg">
                DC
              </div>
              <p className="mt-4 font-bold text-white">Darilson Cornélio</p>
              <p className="text-sm text-blue-200">Psicanalista e Educador</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Uma palavra do criador</span>
              <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                "Ensinar não é transferir conhecimento — é criar marcas que ficam para a vida."
              </h3>
              <p className="text-blue-100 leading-relaxed mb-4">
                Criei o SIMIDNAPE porque vi professores brilhantes sendo consumidos por um sistema
                que não os apoia. Este não é um gerador de textos genérico.
                É um copiloto pedagógico que respeita a sua autonomia e fortalece a sua prática.
              </p>
              <p className="text-blue-100 leading-relaxed">
                Cada módulo foi desenhado com base em ciência da aprendizagem, neuroeducação
                e, acima de tudo, respeito ao professor brasileiro.
              </p>
              <div className="mt-6 bg-blue-800 bg-opacity-50 border border-blue-700 rounded-xl p-6 text-center">
                <p className="text-blue-200 text-sm">🎥 Vídeo de apresentação do criador em breve</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== DOR ===================== */}
      <section className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Você se identifica com isso?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
            O professor precisa decidir tudo sozinho, todos os dias:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              'Entrar em sala sem saber se a aula vai engajar',
              'Perceber que o aluno está travado e não saber o que fazer',
              'Chegar em casa exausto, sem tempo para planejar melhor',
              'Não ter com quem conversar sobre a sua prática',
            ].map((item, i) => (
              <div
                key={i}
                className="bg-red-50 border border-red-100 rounded-xl p-5 text-gray-800 font-medium text-left flex items-start gap-3"
              >
                <span className="text-red-500 text-xl flex-shrink-0">❌</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <p className="text-xl text-gray-800 font-semibold mt-12">
            O SIMIDNAPE existe para virar essa chave.
          </p>
        </div>
      </section>

      {/* ===================== TRANSFORMAÇÃO ===================== */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que muda quando você assina
            </h2>
            <p className="text-lg text-gray-600">
              A transformação real, no dia a dia do professor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                <span>😩</span> Antes do SIMIDNAPE
              </h3>
              <ul className="space-y-3">
                {[
                  'Aula improvisada na hora',
                  'Dúvida sobre o que fazer com o aluno',
                  'Cansaço emocional sem apoio',
                  'Aluno invisível no fundo da sala',
                  'Atividade genérica baixada da internet',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <span>✨</span> Com o SIMIDNAPE
              </h3>
              <ul className="space-y-3">
                {[
                  'Aula com arquitetura cognitiva',
                  'Intervenção pedagógica clara',
                  'Reflexão guiada sobre a prática',
                  'Acompanhamento individualizado',
                  'Material pronto e alinhado à BNCC',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== COMO FUNCIONA ===================== */}
      <section id="como-funciona" className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-gray-600">
              Três passos. Sem curso, sem manual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '1', t: 'Crie sua conta', d: 'Cadastro rápido e seguro. 5 créditos grátis para testar.', icon: '📝' },
              { n: '2', t: 'Escolha o módulo', d: 'Cinco motores para diferentes necessidades pedagógicas.', icon: '🧭' },
              { n: '3', t: 'Receba o resultado', d: 'Aulas executáveis, reflexões, materiais ou análises em segundos.', icon: '✨' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-700 text-2xl font-bold mb-4">
                  {s.n}
                </div>
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.t}</h3>
                <p className="text-gray-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== DEPOIMENTOS ===================== */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que professores estão dizendo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depoimentos.map((d, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                    {d.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{d.nome}</p>
                    <p className="text-xs text-gray-500">{d.info}</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed italic">"{d.texto}"</p>
                <div className="text-yellow-500 text-sm mt-3">★★★★★</div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Depoimentos ilustrativos de professores parceiros em fase de testes.
          </p>
        </div>
      </section>

      {/* ===================== COMPARATIVO ===================== */}
      <section id="comparativo" className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que o SIMIDNAPE não é um ChatGPT
            </h2>
            <p className="text-lg text-gray-600">
              Um copiloto pedagógico é diferente de um chat genérico.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">Chat Genérico</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-600 uppercase">SIMIDNAPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Responde o que você digita', 'Entende o contexto pedagógico'],
                  ['Resposta genérica', 'Resposta baseada em BNCC, neuroeducação e DUA'],
                  ['Não conhece sua turma', 'Você informa o perfil da turma'],
                  ['Sem histórico organizado', 'Histórico de aulas, alunos e reflexões'],
                  ['Você precisa saber o que pedir', 'O sistema te guia em cada etapa'],
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-sm text-gray-600">{row[0]}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===================== PREÇOS ===================== */}
      <section id="precos" className="py-20 px-4 md:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos para cada professor
            </h2>
            <p className="text-lg text-gray-600">
              Todos os planos incluem acesso a todos os módulos. Cancele quando quiser.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white text-center shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-90">🎁 Preço de Fundador</p>
            <p className="text-lg font-bold mt-1">
              Os primeiros 100 assinantes pagam <span className="text-yellow-200">R$ 14,90/mês para sempre</span> no plano Padrão.
            </p>
            <p className="text-sm mt-2 opacity-90">
              Restam apenas <strong>{vagasFundador} vagas</strong> neste preço.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {planos.map((p, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 border-2 transition ${
                  p.destaque
                    ? 'border-blue-500 bg-white shadow-xl lg:scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    ⭐ Mais escolhido
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-2">{p.nome}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{p.preco}</span>
                  <span className="text-gray-500 ml-1">{p.periodo}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{p.creditos}</p>

                <ul className="space-y-2 mb-6">
                  {p.itens.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block text-center font-semibold py-2.5 rounded-lg transition ${
                    p.destaque
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : p.trial
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {p.trial ? 'Começar grátis' : 'Assinar agora'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== GARANTIA ===================== */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-8 md:p-12">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Garantia incondicional de 7 dias
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Se em 7 dias você sentir que o SIMIDNAPE não te ajuda a ser um professor melhor,
            devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.
          </p>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900">{f.p}</span>
                  <span className="text-2xl text-gray-400 ml-4">{faqAberto === i ? '−' : '+'}</span>
                </button>
                {faqAberto === i && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-gray-700 leading-relaxed">{f.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Você pode continuar ensinando como sempre.<br />
            Ou pode se tornar <span className="text-yellow-200">O Professor Inesquecível</span>.
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Comece grátis hoje. Sem cartão de crédito. Sem compromisso.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-blue-600 font-bold px-10 py-4 rounded-xl hover:bg-gray-100 transition shadow-xl text-lg"
          >
            Criar minha conta grátis →
          </Link>
          <p className="text-sm text-blue-200 mt-6">
            ✅ 5 créditos grátis · ✅ Sem cartão · ✅ Garantia de 7 dias
          </p>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-2">SIMIDNAPE</h3>
              <p className="text-xs text-gray-500 mb-3">
                Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem e Performance Educacional
              </p>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                O assistente pedagógico diário do professor brasileiro.
                Construído com base em neuroeducação, ciência da aprendizagem e respeito à autonomia docente.
              </p>
              <p className="text-xs text-gray-500 mt-4">
                🇧🇷 Feito no Brasil · © 2026 O Professor Inesquecível
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#modulos" className="hover:text-white transition">Os 5 Motores</a></li>
                <li><a href="#comparativo" className="hover:text-white transition">Por que não é ChatGPT</a></li>
                <li><a href="#precos" className="hover:text-white transition">Preços</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/termos" className="hover:text-white transition">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-white transition">Privacidade</Link></li>
                <li><a href="mailto:contato@simidnape.com.br" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-xs">
            <p>© 2026 SIMIDNAPE — O Professor Inesquecível. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;