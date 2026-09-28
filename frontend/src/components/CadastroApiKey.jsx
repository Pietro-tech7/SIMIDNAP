import React, { useState, useEffect } from 'react';
import api from '../api/api';

// ============================================================
// CONFIGURAÇÃO — preencher depois
// ============================================================
const WHATSAPP_NUMERO = ''; // Ex: '5589999999999' (formato internacional, sem + e sem espaços)
const TUTORIAL_VIDEO_URL = ''; // Ex: 'https://www.youtube.com/embed/...' (opcional)

// ============================================================
// COMPONENTE
// ============================================================
const CadastroApiKey = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mostrarTutorial, setMostrarTutorial] = useState(false);
  const [msg, setMsg] = useState(null);

  // Carrega o status atual
  const carregarStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me/gemini-key');
      setStatus(res.data);
    } catch (err) {
      setStatus({ tem_chave: false });
      console.warn('Erro ao carregar status da chave Gemini:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarStatus(); }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!apiKey.trim()) {
      setMsg({ tipo: 'erro', texto: 'Cole sua chave do Gemini antes de salvar.' });
      return;
    }
    if (apiKey.trim().length < 20) {
      setMsg({ tipo: 'erro', texto: 'Chave muito curta. O formato esperado começa com "AIzaSy".' });
      return;
    }

    setSalvando(true);
    try {
      const res = await api.post('/users/me/gemini-key', { api_key: apiKey.trim() });
      setStatus(res.data);
      setApiKey('');
      setMsg({
        tipo: 'sucesso',
        texto: res.data.mensagem || '✅ Chave cadastrada com sucesso!',
      });
      // Notifica todos os AlertasApiKey (badge no topo, card no dashboard) para sumirem
      window.dispatchEvent(new CustomEvent('gemini-key-updated'));
    } catch (err) {
      const detalhe = err?.response?.data?.detail || 'Erro ao cadastrar a chave. Tente novamente.';
      setMsg({ tipo: 'erro', texto: detalhe });
    } finally {
      setSalvando(false);
    }
  };

  const whatsappLink = WHATSAPP_NUMERO
    ? `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(
        'Olá! Preciso de ajuda para cadastrar minha API Key do Gemini no SIMIDNAPE PRO.'
      )}`
    : null;

  // ============================================================
  // ESTADOS DE CARREGAMENTO
  // ============================================================
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <p className="text-gray-500 text-sm">Carregando status da sua chave...</p>
      </div>
    );
  }

  const temChave = status?.tem_chave === true;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">🔑 Minha API Key do Gemini</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Cadastre sua chave própria e libere mais créditos mensais por plano.
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
            temChave
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {temChave ? '● Chave cadastrada' : '● Usando chave do sistema'}
        </span>
      </div>

      {/* Estado 1 — sem chave cadastrada */}
      {!temChave && (
        <>
          {/* Bloco de benefícios — destaque */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-bold text-blue-900 mb-2">
              🎁 O que você ganha cadastrando sua chave:
            </p>
            <ul className="text-sm text-blue-900 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-base leading-none flex-shrink-0">📈</span>
                <span>
                  <strong>Multiplica seus créditos</strong> — de 10 para <strong>até 500/mês</strong> no plano Básico
                  (e mais nos planos superiores)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base leading-none flex-shrink-0">💸</span>
                <span>
                  <strong>Zero custo adicional</strong> — a chave do Google Gemini é <strong>gratuita</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base leading-none flex-shrink-0">⏱️</span>
                <span>
                  <strong>2 minutos</strong> para cadastrar — com tutorial passo a passo abaixo
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base leading-none flex-shrink-0">🔒</span>
                <span>
                  <strong>Você no controle</strong> — usa a cota do seu próprio Google, sem intermediários
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base leading-none flex-shrink-0">💬</span>
                <span>
                  <strong>Ajuda quando precisar</strong> — suporte via WhatsApp durante o cadastro
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-900">
            <p className="font-semibold mb-1">⚠️ Você está usando a chave do sistema</p>
            <p>
              Isso significa que você tem direito a <strong>5 créditos grátis</strong>.
              Após esse período, cadastre sua chave própria do Google Gemini
              (é gratuita) para liberar <strong>centenas de créditos por mês</strong> —
              dependendo do seu plano.
            </p>
          </div>

          <form onSubmit={handleSalvar} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cole sua API Key do Gemini
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                autoComplete="off"
                spellCheck="false"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                A chave começa com <strong>AIzaSy</strong> e tem cerca de 39 caracteres.
              </p>
            </div>

            {msg && (
              <div
                className={`text-sm rounded-lg p-3 border ${
                  msg.tipo === 'sucesso'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="submit"
                disabled={salvando}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition"
              >
                {salvando ? '⏳ Validando chave...' : '💾 Salvar chave'}
              </button>
              <button
                type="button"
                onClick={() => setMostrarTutorial(!mostrarTutorial)}
                className="text-sm text-blue-700 hover:text-blue-900 font-medium underline"
              >
                {mostrarTutorial ? '▲ Ocultar tutorial' : '📖 Como obter minha API Key'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Estado 2 — chave já cadastrada */}
      {temChave && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900 font-semibold mb-1">
              ✅ Sua chave está ativa
            </p>
            <p className="text-sm text-green-800 font-mono">
              {status.chave_mascarada}
            </p>
            {status.data_cadastro && (
              <p className="text-xs text-green-700 mt-1">
                Cadastrada em{' '}
                {new Date(status.data_cadastro).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            <p>
              💡 <strong>Por segurança</strong>, não é possível remover a chave.
              Se precisar trocar, entre em contato com o suporte.
            </p>
          </div>

          {msg && (
            <div
              className={`text-sm rounded-lg p-3 border ${
                msg.tipo === 'sucesso'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TUTORIAL — espaços reservados para prints e vídeo           */}
      {/* ============================================================ */}
      {mostrarTutorial && !temChave && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            📖 Como obter sua API Key do Gemini (passo a passo)
          </h3>

          {TUTORIAL_VIDEO_URL ? (
            <div className="mb-4 aspect-video w-full max-w-2xl rounded-lg overflow-hidden border border-gray-200">
              <iframe
                src={TUTORIAL_VIDEO_URL}
                title="Tutorial: como obter sua API Key do Gemini"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          ) : (
            /* Espaço reservado — você substitui este bloco por um vídeo */
            <div className="mb-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-xs text-gray-500">
              {/* Print/Vídeo — insira aqui o embed do vídeo tutorial */}
              🎥 [Espaço reservado para o vídeo tutorial]
            </div>
          )}

          <ol className="space-y-3 text-sm text-gray-700">
            <li className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold mb-1">1) Acesse o Google AI Studio</p>
              <p>
                Abra o endereço{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono"
                >
                  aistudio.google.com/app/apikey
                </a>{' '}
                no navegador.
              </p>
              {/* Print 1 — Tela inicial do Google AI Studio com o botão "Get API Key" */}
              <div className="mt-2 bg-white border border-dashed border-gray-300 rounded p-3 text-center text-[11px] text-gray-500">
                📷 [Print 1 — Tela inicial do Google AI Studio]
              </div>
            </li>

            <li className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold mb-1">2) Faça login com sua conta Google</p>
              <p>Use a conta do Gmail que você mais utiliza.</p>
              {/* Print 2 — Tela de login Google */}
              <div className="mt-2 bg-white border border-dashed border-gray-300 rounded p-3 text-center text-[11px] text-gray-500">
                📷 [Print 2 — Login com conta Google]
              </div>
            </li>

            <li className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold mb-1">3) Clique em "Criar chave de API"</p>
              <p>
                Procure o botão <strong>"Create API Key"</strong> ou{' '}
                <strong>"Criar chave de API"</strong>. Aceite os termos de uso.
              </p>
              {/* Print 3 — Botão "Create API Key" destacado */}
              <div className="mt-2 bg-white border border-dashed border-gray-300 rounded p-3 text-center text-[11px] text-gray-500">
                📷 [Print 3 — Botão "Create API Key"]
              </div>
            </li>

            <li className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold mb-1">4) Escolha o projeto</p>
              <p>
                Você pode escolher um projeto existente ou criar um novo
                (ex: "SIMIDNAPE PRO"). Clique em <strong>Create</strong>.
              </p>
              {/* Print 4 — Seleção/criação de projeto */}
              <div className="mt-2 bg-white border border-dashed border-gray-300 rounded p-3 text-center text-[11px] text-gray-500">
                📷 [Print 4 — Criar novo projeto]
              </div>
            </li>

            <li className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold mb-1">5) Copie a chave gerada</p>
              <p>
                O Google vai mostrar uma chave começando com <strong>AIzaSy...</strong>.
                Clique em <strong>"Copy"</strong> para copiar.
              </p>
              {/* Print 5 — Chave gerada com botão "Copy" */}
              <div className="mt-2 bg-white border border-dashed border-gray-300 rounded p-3 text-center text-[11px] text-gray-500">
                📷 [Print 5 — Chave gerada + botão "Copy"]
              </div>
            </li>

            <li className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-semibold mb-1 text-blue-900">6) Cole aqui no SIMIDNAPE</p>
              <p className="text-blue-900">
                Volte para esta tela, cole a chave no campo abaixo do título
                "Cole sua API Key do Gemini" e clique em{' '}
                <strong>💾 Salvar chave</strong>. Pronto!
              </p>
            </li>
          </ol>

          {/* Botão WhatsApp — só aparece se o número estiver configurado */}
          {whatsappLink ? (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-green-900 text-sm">
                  Ainda com dúvidas?
                </p>
                <p className="text-xs text-green-800">
                  Fale com a equipe SIMIDNAPE PRO pelo WhatsApp.
                </p>
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition whitespace-nowrap"
              >
                💬 Falar no WhatsApp
              </a>
            </div>
          ) : (
            /* Espaço reservado — você preenche WHATSAPP_NUMERO no topo do arquivo */
            <div className="mt-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-500">
              💬 [Espaço reservado para o botão de WhatsApp — preencha WHATSAPP_NUMERO no topo do arquivo]
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CadastroApiKey;