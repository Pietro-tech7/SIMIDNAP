import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import PagamentoPix from '../components/PagamentoPix';
import PagamentoCartao from '../components/PagamentoCartao';

const MinhaAssinatura = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [pacotes, setPacotes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null);
  const [msg, setMsg] = useState(null);

  // Pagamento Pix ativo (QR Code)
  const [pagamentoPix, setPagamentoPix] = useState(null);

  // Pagamento com Cartão ativo (modal transparente)
  const [pagamentoCartao, setPagamentoCartao] = useState(null);

  // Mensagem de retorno do MP (Checkout Pro)
  useEffect(() => {
    const st = searchParams.get('status');
    if (st === 'success') {
      setMsg({
        tipo: 'sucesso',
        texto: 'Pagamento em processamento! Assim que o Mercado Pago confirmar, seus créditos serão liberados automaticamente.',
      });
    } else if (st === 'failure') {
      setMsg({ tipo: 'erro', texto: 'O pagamento não foi concluído. Tente novamente.' });
    } else if (st === 'pending') {
      setMsg({
        tipo: 'info',
        texto: 'Pagamento pendente. Assim que for confirmado, seus créditos serão liberados.',
      });
    }
  }, [searchParams]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [statusRes, planosRes, pacotesRes, histRes] = await Promise.all([
        api.get('/subscriptions/status'),
        api.get('/subscriptions/planos'),
        api.get('/subscriptions/packages'),
        api.get('/subscriptions/history'),
      ]);
      setStatus(statusRes.data);
      setPlanos(planosRes.data);
      setPacotes(pacotesRes.data);
      setHistorico(histRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // ============================================================
  // PIX — Assinatura
  // ============================================================
  const assinarComPix = async (codigo, nome) => {
    setAcaoEmAndamento(`pix_${codigo}`);
    setMsg(null);
    try {
      const res = await api.post('/subscriptions/pix/subscription', { plan: codigo });
      setPagamentoPix(res.data);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Erro ao gerar QR Code.';
      setMsg({ tipo: 'erro', texto: detail });
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  // ============================================================
  // PIX — Créditos avulsos
  // ============================================================
  const comprarComPix = async (codigo, nome) => {
    setAcaoEmAndamento(`pix_${codigo}`);
    setMsg(null);
    try {
      const res = await api.post('/subscriptions/pix/credits', { package: codigo });
      setPagamentoPix(res.data);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Erro ao gerar QR Code.';
      setMsg({ tipo: 'erro', texto: detail });
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  // ============================================================
  // CARTÃO — Assinatura (modal transparente, sem redirecionar)
  // ============================================================
  const assinarComCartao = (codigo, nome) => {
    setMsg(null);
    const plano = planos.find(p => p.codigo === codigo);
    setPagamentoCartao({
      tipo: 'subscription',
      codigo,
      nome: `Plano ${nome}`,
      preco: plano?.preco || 0,
    });
  };

  // ============================================================
  // CARTÃO — Créditos avulsos (modal transparente, sem redirecionar)
  // ============================================================
  const comprarComCartao = (codigo, nome) => {
    setMsg(null);
    const pacote = pacotes.find(p => p.codigo === codigo);
    setPagamentoCartao({
      tipo: 'credits',
      codigo,
      nome,
      preco: pacote?.preco || 0,
    });
  };

  // ============================================================
  // CANCELAMENTO
  // ============================================================
  const cancelarAssinatura = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar? Você perde o acesso ao final do ciclo atual.')) return;
    if (!window.confirm('Confirma o cancelamento?')) return;

    setAcaoEmAndamento('cancelar');
    setMsg(null);
    try {
      await api.post('/subscriptions/cancel', { confirmar: true });
      setMsg({ tipo: 'sucesso', texto: 'Assinatura cancelada com sucesso.' });
      await carregarDados();
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Erro ao cancelar.';
      setMsg({ tipo: 'erro', texto: detail });
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  // ============================================================
  // SUCESSO DO PIX
  // ============================================================
  const handlePixSuccess = async () => {
    setPagamentoPix(null);
    setMsg({ tipo: 'sucesso', texto: 'Pagamento confirmado! Seus créditos foram atualizados.' });
    await carregarDados();
    window.dispatchEvent(new CustomEvent('subscription-updated'));
  };

  const handleCartaoSuccess = async () => {
    setPagamentoCartao(null);
    setMsg({ tipo: 'sucesso', texto: 'Pagamento com cartão confirmado! Seus créditos foram atualizados.' });
    await carregarDados();
    window.dispatchEvent(new CustomEvent('subscription-updated'));
  };

  const pctUsado = status
    ? (status.creditos_usados / status.creditos_total) * 100
    : 0;

  const isPlanoAtivo = status?.status === 'active' && status?.plano !== 'trial';
  const isTrial = status?.plano === 'trial';

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <p className="text-gray-500">Carregando informações da assinatura...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">
        ← Voltar ao início
      </Link>

      <div className="mt-6 mb-8 flex items-center gap-3">
        <span className="text-4xl">💳</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minha Assinatura</h1>
          <p className="text-gray-600">Gerencie seu plano, créditos e pagamentos.</p>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {msg && (
        <div className={`rounded-xl p-4 mb-6 border ${
          msg.tipo === 'sucesso' ? 'bg-green-50 border-green-200 text-green-800' :
          msg.tipo === 'erro' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {msg.tipo === 'sucesso' ? '✅' : msg.tipo === 'erro' ? '⚠️' : 'ℹ️'} {msg.texto}
        </div>
      )}

      {/* ============================================================ */}
      {/* STATUS ATUAL */}
      {/* ============================================================ */}
      {status && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 md:p-8 text-white mb-8">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-200">Plano atual</p>
              <h2 className="text-3xl font-bold mt-1">{status.plano_nome}</h2>
              <p className="text-sm text-blue-100 mt-1">
                {isTrial
                  ? 'Acesso de teste gratuito'
                  : status.plano_preco === 0
                    ? 'Grátis'
                    : `R$ ${status.plano_preco.toFixed(2).replace('.', ',')}/mês`}
              </p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
              status.status === 'active'
                ? 'bg-green-400 text-green-900'
                : 'bg-red-400 text-red-900'
            }`}>
              {status.status === 'active' ? '● Ativo' : '● Cancelado'}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-blue-100 mb-2">
              <span>Créditos usados</span>
              <span className="font-bold text-white">
                {status.creditos_usados.toFixed(1)} / {status.creditos_total.toFixed(1)}
              </span>
            </div>
            <div className="w-full bg-blue-900 bg-opacity-40 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  pctUsado > 80 ? 'bg-red-400' : pctUsado > 50 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${Math.min(pctUsado, 100)}%` }}
              />
            </div>
            <p className="text-sm text-blue-100 mt-2">
              Você ainda tem <strong className="text-white">{status.creditos_disponiveis.toFixed(1)}</strong> créditos disponíveis.
            </p>
          </div>

          {status.periodo_fim && (
            <div className="text-xs text-blue-200 border-t border-blue-500 border-opacity-50 pt-3">
              {isTrial
                ? <p>⚠️ Plano de teste — válido até {new Date(status.periodo_fim).toLocaleDateString('pt-BR')}.</p>
                : <p>Renovação automática em {new Date(status.periodo_fim).toLocaleDateString('pt-BR')}.</p>
              }
            </div>
          )}

          {isPlanoAtivo && (
            <div className="mt-4 pt-4 border-t border-blue-500 border-opacity-50">
              <button
                onClick={cancelarAssinatura}
                disabled={acaoEmAndamento === 'cancelar'}
                className="text-xs text-blue-200 hover:text-white underline disabled:opacity-50"
              >
                {acaoEmAndamento === 'cancelar' ? 'Cancelando...' : 'Cancelar assinatura'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* PLANOS DISPONÍVEIS */}
      {/* ============================================================ */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Assinar um plano</h2>
        <p className="text-sm text-gray-600 mb-5">
          Pague com <strong>Pix</strong> (instantâneo) ou com <strong>cartão</strong> (crédito ou débito).
          Cancele quando quiser.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planos.filter(p => p.codigo !== 'trial').map((p) => {
            const isAtual = status?.plano === p.codigo && status?.status === 'active';
            const destaque = p.codigo === 'padrao';
            const carregandoPix = acaoEmAndamento === `pix_${p.codigo}`;
            const carregandoCartao = acaoEmAndamento === `cartao_${p.codigo}`;
            const qualquerCarregando = !!acaoEmAndamento;

            return (
              <div
                key={p.codigo}
                className={`rounded-xl border-2 p-5 transition relative flex flex-col ${
                  isAtual
                    ? 'border-blue-500 bg-blue-50'
                    : destaque
                      ? 'border-orange-400 bg-orange-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {destaque && !isAtual && (
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    ⭐ Mais escolhido
                  </span>
                )}
                {isAtual && (
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Plano atual
                  </span>
                )}

                <h3 className="font-bold text-gray-900 text-lg mt-2">{p.nome}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-3 mb-1">
                  R$ {p.preco.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-gray-500 mb-4">por mês, renovação automática</p>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-2xl font-bold text-blue-600">{p.creditos_mes} créditos</p>
                  <p className="text-xs text-gray-500 mt-1">por mês</p>
                </div>

                <div className="mt-auto">
                  {!isAtual ? (
                    <>
                      <button
                        onClick={() => assinarComPix(p.codigo, p.nome)}
                        disabled={qualquerCarregando}
                        className={`w-full font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2 ${
                          destaque
                            ? 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
                        }`}
                      >
                        {carregandoPix ? (
                          'Gerando QR Code...'
                        ) : (
                          <>
                            <span>⚡</span> Assinar com Pix
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => assinarComCartao(p.codigo, p.nome)}
                        disabled={qualquerCarregando}
                        className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 mt-1 underline"
                      >
                        {carregandoCartao ? 'Redirecionando...' : 'ou pagar com cartão →'}
                      </button>
                    </>
                  ) : (
                    <p className="text-center text-xs text-blue-700 font-medium py-2">
                      ✓ Você está neste plano
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* PACOTES DE CRÉDITOS AVULSOS */}
      {/* ============================================================ */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Comprar créditos avulsos</h2>
        <p className="text-sm text-gray-600 mb-5">
          Precisa de mais créditos sem mudar de plano? Compre um pacote avulso.
          Os créditos não expiram.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pacotes.map((pct) => {
            const carregandoPix = acaoEmAndamento === `pix_${pct.codigo}`;
            const carregandoCartao = acaoEmAndamento === `cartao_${pct.codigo}`;
            const qualquerCarregando = !!acaoEmAndamento;
            const precoPorCredito = pct.preco / pct.creditos;

            return (
              <div
                key={pct.codigo}
                className="rounded-xl border-2 border-teal-200 bg-teal-50 p-5 hover:shadow-md transition flex flex-col"
              >
                <h3 className="font-bold text-gray-900 text-lg mb-1">{pct.nome}</h3>
                <p className="text-3xl font-bold text-teal-700 mt-2 mb-1">
                  R$ {pct.preco.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  R$ {precoPorCredito.toFixed(2).replace('.', ',')} por crédito
                </p>

                <div className="border-t border-teal-200 pt-4 mb-4">
                  <p className="text-xs text-gray-700">💡 Créditos adicionados imediatamente após a confirmação do pagamento.</p>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => comprarComPix(pct.codigo, pct.nome)}
                    disabled={qualquerCarregando}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    {carregandoPix ? (
                      'Gerando QR Code...'
                    ) : (
                      <>
                        <span>⚡</span> Comprar com Pix
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => comprarComCartao(pct.codigo, pct.nome)}
                    disabled={qualquerCarregando}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 mt-1 underline"
                  >
                    {carregandoCartao ? 'Redirecionando...' : 'ou pagar com cartão →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* HISTÓRICO */}
      {/* ============================================================ */}
      {historico.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Histórico de compras</h2>
          <p className="text-sm text-gray-600 mb-5">Suas últimas compras de créditos avulsos.</p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Créditos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Método</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {historico.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        R$ {item.amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-4 py-3 text-sm text-teal-700 font-semibold">
                        +{item.credits_added}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {item.payment_method || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.status === 'approved' ? 'bg-green-100 text-green-800' :
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'approved' ? '● Aprovado' :
                           item.status === 'pending' ? '● Pendente' :
                           '● Rejeitado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* COMO USAR */}
      {/* ============================================================ */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Como usar seus créditos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">1 crédito</p>
            <p className="text-xs text-gray-600 mt-1">NeuroAula, Aula que Funciona, Atividade, Jogo ou Simulado</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">2 créditos</p>
            <p className="text-xs text-gray-600 mt-1">Material Diferenciado (principal + adaptada)</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">3 créditos</p>
            <p className="text-xs text-gray-600 mt-1">Prática Exitosa completa</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DE PAGAMENTO PIX */}
      {/* ============================================================ */}
      {pagamentoPix && (
        <PagamentoPix
          paymentData={pagamentoPix}
          onClose={() => setPagamentoPix(null)}
          onSuccess={handlePixSuccess}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL DE PAGAMENTO COM CARTÃO */}
      {/* ============================================================ */}
      {pagamentoCartao && (
        <PagamentoCartao
          tipo={pagamentoCartao.tipo}
          codigo={pagamentoCartao.codigo}
          nome={pagamentoCartao.nome}
          preco={pagamentoCartao.preco}
          userEmail={user?.email || ''}
          onClose={() => setPagamentoCartao(null)}
          onSuccess={handleCartaoSuccess}
        />
      )}
    </div>
  );
};

export default MinhaAssinatura;