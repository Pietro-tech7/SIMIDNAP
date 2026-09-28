import React from 'react';
import { Link } from 'react-router-dom';
import { usePlan } from '../hooks/usePlan';
import { useAuth } from '../contexts/AuthContext';

// ============================================================
// Mapa de recursos → nome amigável + plano mínimo
// ============================================================
const INFO_RECURSOS = {
  banco_ia: {
    nome: 'Banco de Questões IA',
    plano_minimo: 'Intermediário',
    icone: '✨',
    beneficios: [
      'Gerar questões inéditas com IA',
      'Cascata curricular completa (Unidade → Objeto → Habilidade)',
      'Curadoria colaborativa com outros professores',
    ],
  },
  export_word: {
    nome: 'Exportação em Word',
    plano_minimo: 'Intermediário',
    icone: '📄',
    beneficios: [
      'Baixar a prova em .docx editável',
      'Editar questões livremente no Word',
      'Formatação profissional automática',
    ],
  },
  planejamento: {
    nome: 'Planejamento de Aula',
    plano_minimo: 'VIP',
    icone: '📅',
    beneficios: [
      'Planejar aulas de um dia, semana ou mês',
      'Integração com habilidades BNCC',
      'Exportação em PDF pronto para uso',
    ],
  },
  imagens_ia: {
    nome: 'Geração de Imagens com IA',
    plano_minimo: 'Premium',
    icone: '🎨',
    beneficios: [
      'Gerar ilustrações exclusivas para cada questão',
      'Personalizar imagens com descrição em linguagem natural',
      'Qualidade profissional para a prova',
    ],
  },
};

/**
 * Envolve uma página ou recurso gated.
 * Se o usuário não tiver acesso, mostra tela de upgrade amigável.
 *
 * Props:
 *   - recurso: chave do recurso ('banco_ia', 'export_word', 'planejamento', 'imagens_ia')
 *   - children: o conteúdo a renderizar quando o usuário tiver acesso
 */
const GateRecurso = ({ recurso, children }) => {
  const { user } = useAuth();
  const { temRecurso, loading, nomePlano, iconePlano, erro } = usePlan();

  // Superuser (admin) tem acesso a tudo — não bloqueia
  if (user?.is_superuser) {
    return children;
  }

  // Carregando o plano
  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p className="text-gray-500">Verificando seu plano...</p>
        </div>
      </div>
    );
  }

  // Erro ao carregar → não libera (por segurança)
  if (erro) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-800 font-medium mb-2">
            Não foi possível verificar seu plano
          </p>
          <p className="text-red-700 text-sm">{erro}</p>
        </div>
      </div>
    );
  }

  // Usuário tem acesso → renderiza o conteúdo normalmente
  if (temRecurso(recurso)) {
    return children;
  }

  // Usuário não tem acesso → tela de upgrade
  const info = INFO_RECURSOS[recurso] || {
    nome: 'Este recurso',
    plano_minimo: 'superior',
    icone: '🔒',
    beneficios: ['Acesso ao recurso'],
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white text-center relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute -right-6 -top-6 text-[120px] opacity-10 select-none pointer-events-none">
          {info.icone}
        </div>

        <div className="relative z-10">
          <div className="text-6xl mb-4">{info.icone}</div>

          <span className="inline-block bg-white/20 backdrop-blur text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            🔒 Recurso Bloqueado
          </span>

          <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-3">
            {info.nome}
          </h2>

          <p className="text-white/90 text-base mb-6 max-w-lg mx-auto">
            Este recurso está disponível a partir do plano{' '}
            <strong className="text-white">{info.plano_minimo}</strong>.
            <br />
            Você está no plano{' '}
            <strong className="text-white">
              {iconePlano ? `${iconePlano} ` : ''}{nomePlano || 'atual'}
            </strong>.
          </p>

          <div className="bg-white/10 backdrop-blur rounded-xl p-5 mb-6 text-left max-w-md mx-auto">
            <p className="text-sm font-semibold mb-3">
              💎 Ao fazer upgrade, você desbloqueia:
            </p>
            <ul className="text-sm space-y-2">
              {info.beneficios.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-base leading-none flex-shrink-0">✅</span>
                  <span>{b}</span>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <span className="text-base leading-none flex-shrink-0">🎁</span>
                <span><strong>Bônus:</strong> mais créditos mensais</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/minha-assinatura"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              🚀 Fazer Upgrade
            </Link>
            <Link
              to="/dashboard"
              className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-semibold px-5 py-3 rounded-xl transition"
            >
              ← Voltar ao Início
            </Link>
          </div>

          <p className="text-[11px] text-white/70 mt-5">
            Já é assinante de um plano superior? Recarregue a página ou fale com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GateRecurso;