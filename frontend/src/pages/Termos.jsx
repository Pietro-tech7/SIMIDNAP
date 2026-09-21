import React from 'react';
import { Link } from 'react-router-dom';

const Termos = () => {
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
            Termos de Uso
          </h1>
          <p className="text-sm text-gray-500">
            Última atualização: {ultimaAtualizacao}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta e utilizar a plataforma <strong>SIMIDNAPE PRO</strong>,
              você declara que leu, compreendeu e concorda integralmente com estes Termos de Uso
              e com a nossa Política de Privacidade. Caso não concorde, não utilize o serviço.
            </p>
            <p className="mt-3">
              Estes Termos aplicam-se a todos os usuários, incluindo professores, coordenadores
              pedagógicos e demais profissionais da educação que acessem a plataforma.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Descrição do Serviço</h2>
            <p>
              O SIMIDNAPE PRO é uma plataforma digital de assistência pedagógica que utiliza
              inteligência artificial para auxiliar professores e coordenadores na criação de
              planos de aula, materiais didáticos, práticas pedagógicas, simulados, análises
              pedagógicas e reflexões profissionais.
            </p>
            <p className="mt-3">
              O serviço é oferecido na modalidade SaaS (Software as a Service), acessado via
              navegador web, mediante planos pagos ou período de teste gratuito.
            </p>
            <p className="mt-3">
              <strong>Importante:</strong> o SIMIDNAPE PRO é uma ferramenta de apoio pedagógico.
              As decisões finais sobre o conteúdo gerado são de responsabilidade do usuário,
              que deve avaliar criticamente todo material produzido antes de aplicá-lo em sala de aula.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cadastro e Conta do Usuário</h2>
            <p>
              Para utilizar o serviço, o usuário deve criar uma conta fornecendo informações
              verídicas, completas e atualizadas, incluindo nome completo, e-mail válido e senha
              de acesso.
            </p>
            <p className="mt-3">O usuário é responsável por:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Manter a confidencialidade de suas credenciais de acesso;</li>
              <li>Todas as atividades realizadas em sua conta;</li>
              <li>Notificar imediatamente qualquer uso não autorizado;</li>
              <li>Não compartilhar sua conta com terceiros.</li>
            </ul>
            <p className="mt-3">
              É vedada a criação de contas com dados falsos ou em nome de terceiros sem autorização.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Planos, Créditos e Pagamento</h2>
            <p>
              O SIMIDNAPE PRO oferece os seguintes planos: <strong>Trial</strong> (gratuito,
              5 créditos, 30 dias), <strong>Básico</strong> (R$ 9,90/mês — 15 créditos),
              <strong> Padrão</strong> (R$ 19,90/mês — 25 créditos) e
              <strong> Avançado</strong> (R$ 49,90/mês — 100 créditos).
            </p>
            <p className="mt-3">
              Adicionalmente, o usuário pode adquirir <strong>pacotes avulsos de créditos</strong>:
              5 créditos por R$ 4,90, 10 créditos por R$ 12,90 e 25 créditos por R$ 24,90.
            </p>
            <p className="mt-3">
              Os pagamentos são processados pelo <strong>Mercado Pago</strong>, aceitando as formas
              de pagamento Pix e cartão de crédito/débito. O SIMIDNAPE PRO não armazena dados
              financeiros do usuário — toda transação é intermediada pelo Mercado Pago.
            </p>
            <p className="mt-3">
              Os planos mensais possuem <strong>renovação automática</strong>. Os créditos
              adquiridos não expiram e permanecem na conta do usuário.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cancelamento e Reembolso</h2>
            <p>
              O usuário pode cancelar sua assinatura a qualquer momento, sem multa ou burocracia,
              diretamente na página "Minha Assinatura" do sistema.
            </p>
            <p className="mt-3">
              Ao cancelar, o usuário mantém o acesso ao serviço até o final do período já pago,
              não havendo cobrança nas renovações seguintes.
            </p>
            <p className="mt-3">
              Em caso de insatisfação nos primeiros 7 dias após a contratação de um plano pago,
              o usuário pode solicitar o reembolso integral, conforme o direito de arrependimento
              previsto no Art. 49 do Código de Defesa do Consumidor.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Uso Aceitável</h2>
            <p>O usuário concorda em não utilizar o SIMIDNAPE PRO para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Atividades ilegais, fraudulentas ou que violem direitos de terceiros;</li>
              <li>Reprodução não autorizada de conteúdo protegido por direitos autorais;</li>
              <li>Tentativas de acesso não autorizado a sistemas, dados ou contas de terceiros;</li>
              <li>Engenharia reversa, cópia ou redistribuição do software;</li>
              <li>Compartilhamento de credenciais ou revenda do serviço;</li>
              <li>Geração de conteúdo discriminatório, ofensivo ou que viole a dignidade humana.</li>
            </ul>
            <p className="mt-3">
              O descumprimento destas regras pode resultar em suspensão ou encerramento da conta,
              sem prejuízo das medidas legais cabíveis.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Propriedade Intelectual</h2>
            <p>
              Todos os direitos sobre a plataforma SIMIDNAPE PRO — incluindo marca, código-fonte,
              layout, design, textos institucionais e funcionalidades — são de propriedade
              exclusiva do desenvolvedor responsável.
            </p>
            <p className="mt-3">
              O conteúdo <strong>gerado pelo usuário</strong> (planos de aula, materiais, práticas
              pedagógicas, etc.) pertence ao próprio usuário, que pode utilizá-lo livremente em
              suas atividades profissionais.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Limitação de Responsabilidade</h2>
            <p>
              O SIMIDNAPE PRO é uma ferramenta de apoio. Não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Resultados pedagógicos obtidos a partir do conteúdo gerado;</li>
              <li>Decisões profissionais tomadas com base nas sugestões da IA;</li>
              <li>Interrupções temporárias do serviço por manutenção, falhas técnicas ou de terceiros;</li>
              <li>Uso indevido das credenciais por terceiros;</li>
              <li>Conteúdo gerado que o usuário não revise antes de aplicar.</li>
            </ul>
            <p className="mt-3">
              Empregamos os melhores esforços para manter o serviço disponível e seguro, mas não
              garantimos operação ininterrupta e livre de erros.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes Termos de Uso periodicamente para refletir melhorias no
              serviço ou mudanças na legislação. A versão mais recente estará sempre disponível
              nesta página, com a data da última atualização.
            </p>
            <p className="mt-3">
              O uso contínuo do serviço após alterações implica concordância com os novos termos.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contato</h2>
            <p>
              Em caso de dúvidas, solicitações ou reclamações relacionadas a estes Termos,
              entre em contato:
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
              Ao utilizar o SIMIDNAPE PRO, você declara ter lido e aceito estes Termos de Uso.
            </p>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <Link to="/privacidade" className="text-blue-600 hover:underline">
                Política de Privacidade
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

export default Termos;