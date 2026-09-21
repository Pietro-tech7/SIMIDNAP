import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';

const PagamentoPix = ({ paymentData, onClose, onSuccess }) => {
  const [status, setStatus] = useState('pending');
  const [segundos, setSegundos] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState(null);
  const pollingRef = useRef(null);

  // ============================================================
  // POLLING — consulta status a cada 3s
  // ============================================================
  useEffect(() => {
    if (!paymentData?.payment_id) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/subscriptions/payment-status/${paymentData.payment_id}`);
        const st = res.data.status;

        if (st === 'approved') {
          setStatus('approved');
          clearInterval(pollingRef.current);
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 2500);
        } else if (st === 'rejected' || st === 'cancelled') {
          setStatus(st);
          clearInterval(pollingRef.current);
        }
      } catch (err) {
        // ignora erros temporários de rede durante polling
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [paymentData?.payment_id, onSuccess]);

  // ============================================================
  // CONTADOR DE TEMPO
  // ============================================================
  useEffect(() => {
    const interval = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatarTempo = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ============================================================
  // COPIAR CÓDIGO PIX
  // ============================================================
  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(paymentData.qr_code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (err) {
      // Fallback para navegadores antigos
      const textarea = document.createElement('textarea');
      textarea.value = paymentData.qr_code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  // ============================================================
  // MONTAR IMAGEM DO QR CODE
  // ============================================================
  const getQrImageSrc = () => {
    const b64 = paymentData?.qr_code_base64;
    if (!b64) return null;
    if (b64.startsWith('data:')) return b64;
    return `data:image/png;base64,${b64}`;
  };

  const qrSrc = getQrImageSrc();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8">
        {/* ============= CABEÇALHO ============= */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pagar com Pix</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {paymentData?.tipo === 'subscription'
                ? `Assinatura: plano ${paymentData?.item}`
                : `Compra: ${paymentData?.item}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
            disabled={status === 'approved'}
          >
            ×
          </button>
        </div>

        {/* ============= CONTEÚDO ============= */}
        <div className="p-6">
          {/* --- STATUS: SUCESSO --- */}
          {status === 'approved' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">Pagamento confirmado!</h3>
              <p className="text-gray-600">
                {paymentData?.tipo === 'subscription'
                  ? 'Sua assinatura foi ativada. Aproveite!'
                  : 'Seus créditos foram adicionados à sua conta.'}
              </p>
              <p className="text-xs text-gray-400 mt-4">Atualizando...</p>
            </div>
          )}

          {/* --- STATUS: REJEITADO --- */}
          {(status === 'rejected' || status === 'cancelled') && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-red-700 mb-2">
                {status === 'rejected' ? 'Pagamento rejeitado' : 'Pagamento cancelado'}
              </h3>
              <p className="text-gray-600 mb-6">
                O pagamento não foi concluído. Você pode tentar novamente.
              </p>
              <button
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg"
              >
                Voltar
              </button>
            </div>
          )}

          {/* --- STATUS: AGUARDANDO PAGAMENTO --- */}
          {status === 'pending' && (
            <>
              {/* Valor */}
              <div className="text-center mb-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Valor a pagar</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  R$ {paymentData?.valor?.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* QR Code */}
              {qrSrc ? (
                <div className="flex justify-center mb-5">
                  <div className="bg-white p-4 border-2 border-gray-200 rounded-xl">
                    <img
                      src={qrSrc}
                      alt="QR Code Pix"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-8 bg-gray-50 rounded-lg mb-5">
                  Gerando QR Code...
                </div>
              )}

              {/* Instruções */}
              <p className="text-sm text-gray-700 text-center mb-4">
                Abra o app do seu banco, escolha <strong>Pix</strong> e leia o QR Code.
              </p>

              {/* Copia e cola */}
              {paymentData?.qr_code && (
                <div className="mb-5">
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">
                    Ou copie o código abaixo:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                    <code className="flex-1 text-xs text-gray-600 break-all line-clamp-2">
                      {paymentData.qr_code.substring(0, 80)}...
                    </code>
                    <button
                      onClick={copiarCodigo}
                      className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded ${
                        copiado
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {copiado ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status + timer */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-blue-900 font-medium">Aguardando pagamento...</span>
                </div>
                <span className="text-blue-700 font-mono text-xs">
                  {formatarTempo(segundos)}
                </span>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                💡 Esta página atualiza automaticamente quando o pagamento for confirmado.
              </p>
            </>
          )}

          {/* Erro genérico */}
          {erro && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {erro}
            </div>
          )}
        </div>

        {/* ============= RODAPÉ ============= */}
        {status === 'pending' && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium py-1"
            >
              Cancelar pagamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagamentoPix;