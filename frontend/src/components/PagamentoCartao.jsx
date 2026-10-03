import React, { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import api from '../api/api';

// ============================================================
// Inicializa o SDK do Mercado Pago UMA ÚNICA VEZ por sessão.
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

// ============================================================
// Extrai mensagem de erro legível de qualquer formato do backend.
// ============================================================
function extrairMensagemErro(err) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const campo = Array.isArray(d?.loc) ? d.loc.slice(-1)[0] : '';
        const msg = d?.msg || 'valor inválido';
        return campo ? `${campo}: ${msg}` : msg;
      })
      .join(' | ');
  }

  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }

  return (
    err?.response?.data?.message ||
    err?.message ||
    'Erro ao processar pagamento. Tente novamente em alguns instantes.'
  );
}

// ============================================================
// Extrai o formData do argumento do CardPayment Brick.
// ============================================================
function extrairFormData(arg) {
  if (!arg) return null;
  if (arg.formData && typeof arg.formData === 'object') return arg.formData;
  if (arg.token) return arg;
  return arg;
}

/**
 * Modal de pagamento com cartão (Checkout Transparente do Mercado Pago).
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
  const [estado, setEstado] = useState('form');
  const [msgErro, setMsgErro] = useState(null);
  const [mpOk, setMpOk] = useState(true);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    setMpOk(garantirInitMP());

    api.get('/landing/config')
      .then(res => setConfig(res.data?.config || null))
      .catch(() => setConfig(null));
  }, []);

  const formatBRL = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

  const paymentCfg = config?.payment || {};
  const emitterName = paymentCfg.emitter_name || '';
  const emitterDocument = paymentCfg.emitter_document || '';
  const supportEmail = paymentCfg.support_email || '';
  const supportPhone = paymentCfg.support_phone || '';
  const termsText = paymentCfg.terms_text || '';
  const termsLink = paymentCfg.terms_link || '/termos';
  const privacyLink = paymentCfg.privacy_link || '/privacidade';

  const temRodape = emitterName || emitterDocument || supportEmail || supportPhone || termsText;

  // ============================================================
  // Callback chamado pelo CardPayment quando o cliente clica em Pagar
  // ============================================================
  const handleSubmit = async (arg) => {
    const formData = extrairFormData(arg);

    if (!formData || !formData.token) {
      setEstado('erro');
      setMsgErro(
        'Não foi possível validar os dados do cartão. Preencha todos os campos e tente novamente.'
      );
      return;
    }

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
      console.error('[PagamentoCartao] erro:', err?.response?.data || err);
      setEstado('erro');
      setMsgErro(extrairMensagemErro(err));
    }
  };

  const handleError = (err) => {
    console.error('[CardPayment Brick]', err);
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={estado === 'processando'}
          className="absolute top-3 right-3 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40 text-2xl leading-none shadow-sm border border-gray-200"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="p-6">
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

          {estado === 'erro' && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 text-sm">
              ⚠️ {typeof msgErro === 'string' ? msgErro : 'Erro ao processar pagamento.'}
            </div>
          )}

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

          {/* ==================== RODAPÉ DE CONFIANÇA ==================== */}
          {temRodape && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-1">
              {(emitterName || emitterDocument) && (
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Emitente: <strong className="text-gray-700">{emitterName}</strong>
                  {emitterDocument && (
                    <>
                      {' · '}
                      <span className="font-mono">{emitterDocument}</span>
                    </>
                  )}
                </p>
              )}

              {(supportEmail || supportPhone) && (
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Suporte:{' '}
                  {supportEmail && (
                    <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                      {supportEmail}
                    </a>
                  )}
                  {supportEmail && supportPhone && ' · '}
                  {supportPhone && <span>{supportPhone}</span>}
                </p>
              )}

              {termsText && (
                <p className="text-[10px] text-gray-400 leading-relaxed pt-1">
                  {termsText}{' '}
                  <a href={termsLink} className="hover:underline">Termos</a>
                  {' · '}
                  <a href={privacyLink} className="hover:underline">Privacidade</a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}