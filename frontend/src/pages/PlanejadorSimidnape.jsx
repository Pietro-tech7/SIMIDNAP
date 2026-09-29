import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Tela-mãe do PLANEJADOR SIMIDNAPE.
 *
 * Apresenta os 3 modos do módulo:
 *   - 🎯 Modo Aula — disponível (vai para /aula-que-funciona)
 *   - 📅 Modo Planejamento — "Em breve" (será habilitado no Bloco D9)
 *   - 🎓 Modo Coordenação — "Em breve" (será habilitado no Bloco D10)
 */
const PlanejadorSimidnape = () => {
  const modos = [
    {
      id: 'aula',
      icone: '🎯',
      nome: 'Modo Aula',
      subtitulo: '1 aula, executável do início ao fim',
      descricao:
        'Script cronometrado, minuto a minuto, com falas exatas, ações concretas, princípios cognitivos em cada bloco, checklist de materiais e versão diferenciada (principal + adaptada).',
      cor: 'from-blue-600 to-cyan-500',
      rota: '/aula-que-funciona',
      disponivel: true,
      cta: 'Abrir Modo Aula',
    },
    {
      id: 'planejamento',
      icone: '📅',
      nome: 'Modo Planejamento',
      subtitulo: '1 aula, 1 semana, 1 mês ou 1 bimestre',
      descricao:
        'Sequência didática completa para o período escolhido, com progressão cognitiva em cada aula, objetivos, metodologia, avaliação e princípios de neuroeducação. Alinhado a BNCC, SAEB e SAEPI.',
      cor: 'from-blue-600 via-indigo-600 to-purple-700',
      rota: null,
      disponivel: false,
      cta: '🚧 Em breve',
    },
    {
      id: 'coordenacao',
      icone: '🎓',
      nome: 'Modo Coordenação',
      subtitulo: '6 tipos de ação pedagógica',
      descricao:
        'Plano de Formação, Acompanhamento, Intervenção, Ação Pedagógica, Análise de Indicadores e Reunião. Para o coordenador que lidera a aprendizagem na escola.',
      cor: 'from-emerald-500 to-teal-600',
      rota: null,
      disponivel: false,
      cta: '🚧 Em breve',
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">
        ← Voltar ao início
      </Link>

      <div className="mt-6 mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white text-3xl mb-4">
          🧠
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          PLANEJADOR SIMIDNAPE
        </h1>
        <p className="text-lg text-gray-600 mt-2 max-w-3xl">
          O Professor Inesquecível. Três modos em um só lugar, com base em neuroeducação, ciência da aprendizagem e BNCC.
        </p>
      </div>

      {/* Faixa explicativa — base científica */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <p className="text-sm font-semibold text-blue-900 mb-2">
          💡 Cada plano que você gera aqui é desenhado por princípios cognitivos reais
        </p>
        <p className="text-sm text-blue-800 leading-relaxed">
          Atenção, carga cognitiva, recuperação ativa, dupla codificação, transferência, metacognição e clima emocional.
          Nada de plano genérico — cada bloco existe por uma razão pedagógica.
        </p>
      </div>

      {/* Os 3 modos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {modos.map((modo) => (
          <div
            key={modo.id}
            className={`relative bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition ${
              modo.disponivel
                ? 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                : 'border-gray-200 opacity-90'
            }`}
          >
            {/* Faixa superior colorida */}
            <div className={`h-2 bg-gradient-to-r ${modo.cor}`} />

            <div className="p-6">
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${modo.cor} text-white text-2xl mb-4`}
              >
                {modo.icone}
              </div>

              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {modo.nome}
              </h2>
              <p className="text-sm font-semibold text-blue-700 mt-1">
                {modo.subtitulo}
              </p>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                {modo.descricao}
              </p>

              <div className="mt-6">
                {modo.disponivel ? (
                  <Link
                    to={modo.rota}
                    className={`block text-center font-bold py-2.5 rounded-lg text-sm text-white bg-gradient-to-r ${modo.cor} hover:opacity-90 transition shadow-sm`}
                  >
                    {modo.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="block w-full text-center font-bold py-2.5 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    {modo.cta}
                  </button>
                )}
              </div>
            </div>

            {!modo.disponivel && (
              <span className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full">
                EM BREVE
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Rodapé informativo */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-xs text-gray-600 leading-relaxed">
          🔒 Sua chave de API e seus dados pessoais nunca vão para o banco público. Apenas o conteúdo
          pedagógico e as informações que você autorizar. Tudo que você cria fica salvo na sua conta.
        </p>
      </div>
    </div>
  );
};

export default PlanejadorSimidnape;