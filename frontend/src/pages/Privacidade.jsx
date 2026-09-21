import React from 'react';
import { Link } from 'react-router-dom';

const Privacidade = () => {
  const ultimaAtualizacao = 'Setembro de 2025';

  return (
    <div className="min-h-screen bg-white">
      {/* ============= HEADER ============= */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SIMIDNAPE PRO
          </Link>
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition">
            ← Voltar ao início
          </Link>
        </div>
      </header>

      {/* ============= CONTEÚDO ============= */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-500">
            Última atualização: {ultimaAtualizacao}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          {/* Introdução */}
          <section className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <p className="text-gray-800">
              A sua privacidade é importante para nós. Esta Política de Privacidade descreve
              como o <strong>SIMIDNAPE PRO</strong> coleta, usa, armazena e protege suas
              informações pessoais, em conformidade com a <strong>Lei Geral de Proteção de
              Dados (LGPD — Lei nº 13.709/2018)</strong>.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Quem somos</h2>
            <p>
              O SIMIDNAPE PRO é uma plataforma digital de assistência pedagógica com
              inteligência artificial, desenvolvida por <strong>Darilson Cornélio</strong>,
              destinada a professores e coordenadores pedagógicos da educação básica brasileira.
            </p>
            <p className="mt-3">
              Para fins da LGPD, o SIMIDNAPE PRO atua como <strong>Controlador</strong> dos
              dados pessoais coletados por meio da plataforma.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Dados que coletamos</h2>
            <p>Coletamos apenas os dados necessários para o funcionamento do serviço:</p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">2.1. Dados fornecidos por você</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Cadastro:</strong> nome completo, e-mail, senha (armazenada criptografada);</li>
              <li><strong>Perfil (opcional):</strong> foto de perfil;</li>
              <li><strong>Conteúdo gerado:</strong> planos de aula, materiais, práticas pedagógicas,
                  reflexões e demais textos produzidos com o uso da plataforma;</li>
              <li><strong>Contexto pedagógico (opcional):</strong> escola, município, série, disciplina,
                  perfil de turma — quando informado por você para personalizar as gerações.</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">2.2. Dados coletados automaticamente</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Dados de uso:</strong> funcionalidades acessadas, créditos consumidos, datas e horários de acesso;</li>
              <li><strong>Dados técnicos:</strong> tipo de navegador, sistema operacional, endereço IP (para segurança);</li>
              <li><strong>Cookies:</strong> utilizados apenas para autenticação e funcionamento do sistema (ver seção 6).</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">2.3. Dados de pagamento</h3>
            <p>
              <strong>Não armazenamos dados de cartão de crédito ou informações financeiras.</strong>
              Todos os pagamentos são processados pelo <strong>Mercado Pago</strong>, que possui
              sua própria política de privacidade e certificações de segurança (PCI-DSS).
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Como usamos seus dados</h2>
            <p>Utilizamos seus dados pessoais exclusivamente para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Criar e gerenciar sua conta no SIMIDNAPE PRO;</li>
              <li>Prestar o serviço contratado (geração de planos, materiais, análises, etc.);</li>
              <li>Processar pagamentos e emitir cobranças (via Mercado Pago);</li>
              <li>Enviar comunicações essenciais (recuperação de senha, avisos do sistema);</li>
              <li>Melhorar a plataforma por meio de análise de uso agregado;</li>
              <li>Cumprir obrigações legais e regulatórias;</li>
              <li>Garantir a segurança e prevenir fraudes.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Compartilhamento de dados</h2>
            <p>
              Seus dados <strong>não são vendidos</strong> a terceiros. Compartilhamos apenas o
              estritamente necessário com prestadores de serviços essenciais:
            </p>
            <div className="mt-4 space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-800">💳 Mercado Pago</p>
                <p className="text-sm text-gray-600 mt-1">
                  Processamento de pagamentos. Recebe apenas os dados necessários para
                  efetivar a cobrança (nome, e-mail, valor).
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-800">🤖 Google Gemini</p>
                <p className="text-sm text-gray-600 mt-1">
                  Motor de inteligência artificial que gera os conteúdos. Os textos enviados
                  à IA <strong>não são vinculados a dados pessoais identificáveis</strong> e
                  são processados conforme a política de privacidade do Google.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-800">📧 Brevo (Sendinblue)</p>
                <p className="text-sm text-gray-600 mt-1">
                  Envio de e-mails transacionais (boas-vindas, confirmações). Recebe apenas
                  nome e e-mail.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-800">☁️ Railway e Vercel</p>
                <p className="text-sm text-gray-600 mt-1">
                  Servidores de hospedagem do backend e frontend. Armazenam os dados em
                  ambiente seguro com criptografia.
                </p>
              </div>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Armazenamento e segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros com as seguintes medidas de proteção:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Criptografia de senhas com algoritmo bcrypt;</li>
              <li>Comunicação via HTTPS (certificado SSL);</li>
              <li>Autenticação por tokens JWT com expiração;</li>
              <li>Backup periódico do banco de dados;</li>
              <li>Acesso restrito aos servidores por credenciais protegidas.</li>
            </ul>
            <p className="mt-3">
              Os dados são mantidos enquanto sua conta estiver ativa. Após o encerramento da
              conta, os dados são eliminados em até <strong>30 dias</strong>, ressalvadas as
              obrigações legais de retenção (como registros fiscais).
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cookies</h2>
            <p>
              Utilizamos cookies <strong>estritamente necessários</strong> para o funcionamento
              do sistema:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>refresh_token:</strong> cookie httpOnly para renovação automática de sessão (7 dias);</li>
              <li><strong>localStorage:</strong> armazena o token de acesso para autenticação (não é um cookie).</li>
            </ul>
            <p className="mt-3">
              <strong>Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.</strong>
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Seus direitos (LGPD)</h2>
            <p>Como titular dos dados, você tem os seguintes direitos garantidos pela LGPD:</p>
            <div className="mt-4 space-y-2">
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-800 text-sm">✓ Confirmação e Acesso</p>
                <p className="text-sm text-gray-600">Saber se tratamos seus dados e acessá-los.</p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-800 text-sm">✓ Correção</p>
                <p className="text-sm text-gray-600">Solicitar correção de dados incompletos ou desatualizados.</p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-800 text-sm">✓ Anonimização ou Eliminação</p>
                <p className="text-sm text-gray-600">Solicitar a eliminação de dados desnecessários ou excessivos.</p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-800 text-sm">✓ Portabilidade</p>
                <p className="text-sm text-gray-600">Solicitar a exportação dos seus dados em formato estruturado.</p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-800 text-sm">✓ Revogação do Consentimento</p>
                <p className="text-sm text-gray-600">Retirar o consentimento a qualquer momento.</p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-800 text-sm">✓ Exclusão da Conta</p>
                <p className="text-sm text-gray-600">Solicitar a exclusão definitiva da sua conta e dos seus dados.</p>
              </div>
            </div>
            <p className="mt-4">
              Para exercer qualquer um desses direitos, entre em contato pelo e-mail
              <a href="mailto:contato@simidnape.com.br" className="text-blue-600 hover:underline ml-1">
                contato@simidnape.com.br
              </a>.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Dados de alunos</h2>
            <p>
              <strong>O SIMIDNAPE PRO não solicita nem armazena dados de alunos.</strong>
            </p>
            <p className="mt-3">
              Quando o professor descreve situações pedagógicas (no módulo "Meu Aluno"),
              deve fazê-lo <strong>sem identificar o aluno</strong>, usando apenas iniciais,
              características pedagógicas ou descrições genéricas. Orientamos expressamente
              a não inserir nome completo, dados de saúde ou informações sensíveis de alunos.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Transferência internacional</h2>
            <p>
              Alguns dos prestadores de serviço (Google Gemini, Vercel, Railway) possuem
              servidores fora do Brasil. Ao utilizar a plataforma, você concorda com essa
              transferência, que é realizada com prestadores que adotam padrões internacionais
              de segurança e proteção de dados.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente para refletir
              mudanças na legislação ou melhorias no serviço. A versão mais recente estará
              sempre disponível nesta página, com a data da última atualização.
            </p>
            <p className="mt-3">
              Recomendamos revisá-la periodicamente. Mudanças significativas serão comunicadas
              por e-mail ou aviso na plataforma.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Encarregado de Dados (DPO)</h2>
            <p>
              Para questões relacionadas à proteção de dados, entre em contato com nosso
              Encarregado de Proteção de Dados (DPO):
            </p>
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="mb-2"><strong>E-mail:</strong>{' '}
                <a href="mailto:contato@simidnape.com.br" className="text-blue-600 hover:underline">
                  contato@simidnape.com.br
                </a>
              </p>
              <p><strong>WhatsApp:</strong>{' '}
                <a href="https://wa.me/5589994016367" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  (89) 99401-6367
                </a>
              </p>
            </div>
          </section>

          {/* Rodapé */}
          <div className="border-t border-gray-100 pt-8 mt-12">
            <p className="text-sm text-gray-500 text-center">
              Esta Política de Privacidade está em conformidade com a LGPD (Lei nº 13.709/2018).
            </p>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <Link to="/termos" className="text-blue-600 hover:underline">
                Termos de Uso
              </Link>
              <span className="text-gray-300">•</span>
              <Link to="/" className="text-blue-600 hover:underline">
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacidade;