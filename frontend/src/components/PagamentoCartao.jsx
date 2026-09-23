import React, { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import api from '../api/api';

// ============================================================
// Inicializa o SDK do Mercado Pago UMA ÚNICA VEZ por sessão.
// Chamar initMercadoPago() duas vezes causa erro.
// ============================================================
let mpJaInicializado = false;

function garantirInitMP() {
  const pk = import.meta.env.VITE_MP_PUBLIC_KEY;
  if (!pk) {
    console.warn('[MP] VITE_MP_PUBLIC_KEY não configurada.');
    return false;
  }
  if (!mpJaInicializado) {
    initMercadoPago(pk, { locale: 'pt-BR' });
    mpJaInicializado = true;
  }
  return true;
}

/**
 * Modal de pagamento com cartão (Checkout Transparente do Mercado Pago).
 *
 * Props:
 *  - tipo:      'subscription' | 'credits'
 *  - codigo:    código do plano (ex: 'padrao') ou pacote (ex: 'pack_5')
 *  - nome:      nome amigável para exibir (ex: "Plano Padrão" / "5 créditos")
 *  - preco:     número em reais (ex: 19.90)
 *  - userEmail: email do usuário logado (preenche o campo payer.email)
 *  - onClose:   () => void
 *  - onSuccess: (data) => void  — chamado após aprovação
 */
export default function PagamentoCartao({
  tipo,
  codigo,
  nome,
  preco,
  userEmail,
  onClose,
  onSuccess,
}) {
  const [estado, setEstado] = useState('form'); // form | processando | sucesso | erro
  const [msgErro, setMsgErro] = useState(null);
  const [mpOk, setMpOk] = useState(true);

  useEffect(() => {
    setMpOk(garantirInitMP());
  }, []);

  const formatBRL = (v) =>
    `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

  // ============================================================
  // Callback chamado pelo CardPayment quando o cliente clica em Pagar
  // ============================================================
  const handleSubmit = async ({ formData }) => {
    setEstado('processando');
    setMsgErro(null);

    try {
      const endpoint =
        tipo === 'subscription'
          ? '/subscriptions/card/subscription'
          : '/subscriptions/card/credits';

      const payload =
        tipo === 'subscription'
          ? { plan: codigo, card: formData }
          : { package: codigo, card: formData };

      const res = await api.post(endpoint, payload);
      const status = res.data?.status;

      if (status === 'approved' || status === 'authorized') {
        setEstado('sucesso');
        setTimeout(() => onSuccess?.(res.data), 1800);
      } else {
        setEstado('erro');
        setMsgErro(
          res.data?.status_detail
            ? `Pagamento não aprovado: ${res.data.status_detail}`
            : 'Pagamento não aprovado. Verifique os dados e tente outro cartão.',
        );
      }
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        'Erro ao processar pagamento. Tente novamente em alguns instantes.';
      setEstado('erro');
      setMsgErro(detail);
    }
  };

  const handleError = (err) => {
    // Erros do próprio Brick (ex: validação de formulário)
    console.error('[CardPayment Brick]', err);
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 relative">
        {/* Botão fechar */}
        <button
          type="button"
          onClick={onClose}
          disabled={estado === 'processando'}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 disabled:opacity-40 text-3xl leading-none w-8 h-8 flex items-center justify-center"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="p-6">
          {/* Cabeçalho */}
          <div className="mb-5 pr-8">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
              {tipo === 'subscription' ? 'Assinatura mensal' : 'Compra de créditos'}
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-1">{nome}</h2>
            <p className="text-2xl font-bold text-teal-700 mt-2">
              {formatBRL(preco)}
              {tipo === 'subscription' && (
                <span className="text-sm font-normal text-gray-500 ml-1">/mês</span>
              )}
            </p>
          </div>

          {/* Estado: SUCESSO */}
          {estado === 'sucesso' && (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-lg font-semibold text-green-700">
                Pagamento aprovado!
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {tipo === 'subscription'
                  ? 'Sua assinatura foi ativada com sucesso.'
                  : 'Seus créditos foram adicionados à sua conta.'}
              </p>
            </div>
          )}

          {/* Estado: ERRO */}
          {estado === 'erro' && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 text-sm">
              ⚠️ {msgErro}
            </div>
          )}

          {/* Estado: FORMULÁRIO / PROCESSANDO */}
          {(estado === 'form' || estado === 'erro' || estado === 'processando') && (
            <>
              {!mpOk ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 text-sm">
                  ⚠️ Sistema de pagamento indisponível. A chave pública do Mercado Pago
                  não está configurada. Contate o suporte.
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-800 leading-relaxed">
                    🔒 Seus dados são criptografados e processados diretamente pelo
                    Mercado Pago. O SIMIDNAPE PRO <strong>não armazena</strong> os
                    dados do seu cartão.
                  </div>

                  <CardPayment
                    initialization={{
                      amount: Number(preco),
                      payer: { email: userEmail || '' },
                    }}
                    customization={{
                      paymentMethods: {
                        minInstallments: 1,
                        maxInstallments: 1,
                      },
                    }}
                    onSubmit={handleSubmit}
                    onError={handleError}
                  />

                  {estado === 'processando' && (
                    <p className="text-center text-sm text-gray-600 mt-3 animate-pulse">
                      Processando pagamento...
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}