import React from 'react';
import { useParams, Link } from 'react-router-dom';

const conteudoModulos = {
  neuroaula: {
    icon: '🧠',
    nome: 'NeuroAula',
    cor: 'from-purple-500 to-indigo-500',
    resumo: 'Design de aprendizagem com base em neuroeducação.',
    explicacao:
      'O NeuroAula ajuda você a estruturar uma aula considerando como o cérebro aprende. Você recebe um design de aula com princípios cognitivos, explicação do porquê cada etapa funciona, e adaptações para alunos com necessidades específicas.',
    exemplo:
      'Exemplo: "Preciso ensinar frações para o 5º ano." O sistema gera uma aula executável com roteiro, falas, perguntas, ações concretas e fundamentação científica.',
    acoes: [
      'Estruturar uma aula com base em neuroeducação',
      'Selecionar habilidade BNCC (ou digitar o código)',
      'Adaptar para alunos autistas, TDAH, dislexia, etc.',
      'Gerar versão diferenciada (principal + adaptada)',
    ],
  },
  professor_inteiro: {
    icon: '❤️',
    nome: 'Terapia Pedagógica — O Professor Inesquecível',
    cor: 'from-pink-500 to-rose-500',
    resumo: 'Seu espaço de escuta e reflexão profissional.',
    explicacao:
      'Este é um espaço de conversa com um assistente pedagógico. Você escolhe um tema (relação com alunos, gestão de conflitos, ansiedade, motivação, etc.) e conversa livremente sobre o que está te mobilizando. O sistema te acompanha em etapas, com acolhimento, novas perspectivas e sugestões de pequenas ações.',
    exemplo:
      'Exemplo: "Tenho um aluno que me ignora completamente." O assistente acolhe, aprofunda, oferece uma nova lente e, ao final, sugere uma ação concreta.',
    acoes: [
      'Conversar sobre o que te mobiliza na docência',
      'Receber acolhimento sem julgamento',
      'Ver sua situação por novas lentes',
      'Sair com uma pequena ação possível',
      'Acompanhar sua evolução no histórico',
    ],
    aviso: 'Este módulo NÃO é psicoterapia nem diagnóstico clínico. Em caso de sofrimento intenso, procure apoio profissional.',
  },
  aula_que_funciona: {
    icon: '🎯',
    nome: 'Aula que Funciona',
    cor: 'from-blue-500 to-cyan-500',
    resumo: 'Script prático de execução. Roteiro minuto a minuto.',
    explicacao:
      'Aqui você informa ano/série, disciplina, conteúdo, objetivo, tempo disponível, número de alunos e necessidades específicas. O sistema gera um script cronometrado, com falas exatas, ações concretas, checklist de materiais e adaptações inclusivas — pronto para aplicar em sala.',
    exemplo:
      'Exemplo: "4º ano, Ciências, ciclo da água, 50 minutos, 25 alunos." O sistema entrega um roteiro com tempos, falas e ações.',
    acoes: [
      'Gerar script cronometrado de aula',
      'Selecionar habilidade BNCC',
      'Receber checklist de materiais',
      'Adaptar para alunos com necessidades específicas',
      'Gerar versão diferenciada (principal + adaptada)',
    ],
  },
  meu_aluno: {
    icon: '📊',
    nome: 'Meu Aluno',
    cor: 'from-green-500 to-emerald-500',
    resumo: 'Descreva uma situação e receba apoio pedagógico especializado.',
    explicacao:
      'Você descreve uma situação concreta que está vivendo com um aluno (sem nome completo, sem dado clínico) e o sistema responde como pedagogo especialista: compreensão acolhedora, hipóteses pedagógicas a investigar, intervenções concretas para testar em sala e o que observar para acompanhar a evolução.',
    exemplo:
      'Exemplo: "Tenho um aluno do 5º ano que lê devagar, troca letras e se dispersa em textos longos." O sistema analisa, sugere segmentar textos, régua de leitura, leitura em duplas, e diz o que observar.',
    acoes: [
      'Descrever uma situação pedagógica concreta',
      'Receber compreensão acolhedora (sem julgamento)',
      'Ver hipóteses pedagógicas a investigar',
      'Receber intervenções concretas para testar',
      'Saber o que observar para acompanhar a evolução',
    ],
    aviso: 'O sistema NÃO faz diagnóstico clínico. Atua como pedagogo especialista. Não inclua nome completo do aluno nem dados de saúde.',
  },
  ia_para_professor: {
    icon: '📄',
    nome: 'Gerador de Materiais',
    cor: 'from-orange-500 to-amber-500',
    resumo: 'Atividades, jogos e simulados prontos para usar.',
    explicacao:
      'Crie materiais didáticos completos em segundos: atividades imprimíveis, jogos e dinâmicas lúdicas, e simulados com gabarito. O sistema usa IA real para gerar conteúdo alinhado à BNCC, adaptado à sua turma e às necessidades específicas dos alunos.',
    exemplo:
      'Exemplo: "Simulado de Frações para o 5º ano, 5 questões." O sistema gera o simulado completo com alternativas, respostas e explicações.',
    acoes: [
      'Criar atividades imprimíveis com gabarito',
      'Criar jogos e dinâmicas lúdicas',
      'Criar simulados com questões variadas',
      'Adaptar para alunos com necessidades específicas',
      'Gerar versão diferenciada (principal + adaptada)',
    ],
    aviso: 'A IA é um copiloto. A decisão final é sempre do professor.',
  },
};

const ModuloIntro = () => {
  const { modulo } = useParams();
  const conteudo = conteudoModulos[modulo];

  if (!conteudo) {
    return (
      <div className="p-8">
        <p>Módulo não encontrado.</p>
        <Link to="/dashboard" className="text-blue-600 underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">
        ← Voltar ao início
      </Link>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${conteudo.cor} text-white text-3xl mb-4`}>
          {conteudo.icon}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{conteudo.nome}</h1>
        <p className="text-lg text-gray-600 mt-2">{conteudo.resumo}</p>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">O que você encontra aqui</h2>
          <p className="text-gray-600 leading-relaxed">{conteudo.explicacao}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">O que você pode fazer</h2>
          <ul className="space-y-2">
            {conteudo.acoes.map((acao, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{acao}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 bg-gray-50 border border-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">💡 {conteudo.exemplo}</h3>
        </div>

        {conteudo.aviso && (
          <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
            <p className="text-sm text-yellow-800">⚠️ {conteudo.aviso}</p>
          </div>
        )}

        <div className="mt-8">
          {modulo === 'neuroaula' && (
            <Link
              to="/neuroaula"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Começar a usar
            </Link>
          )}
          {modulo === 'aula_que_funciona' && (
            <Link
              to="/aula-que-funciona"
              className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Começar a usar
            </Link>
          )}
          {modulo === 'professor_inteiro' && (
            <Link
              to="/terapia-pedagogica"
              className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Iniciar conversa
            </Link>
          )}
          {modulo === 'ia_para_professor' && (
            <Link
              to="/gerador-materiais"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Gerar material
            </Link>
          )}
          {modulo === 'meu_aluno' && (
            <Link
              to="/meu-aluno"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Começar a usar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuloIntro;