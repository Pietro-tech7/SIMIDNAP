import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

// ============================================================
// PALETA SIMIDNAPE
// ============================================================
const AZUL          = '#2C5F7C';
const AZUL_CLARO    = '#E8F0F5';
const VERDE         = '#5FA68D';
const VERDE_CLARO   = '#EAF4F0';
const PESSEGO       = '#E8A87C';
const PESSEGO_CLARO = '#FDF1E7';
const CORAL         = '#E07856';
const OURO          = '#D4A843';
const OURO_CLARO    = '#FBF3E0';
const CREME         = '#FDFBF7';
const BRANCO        = '#FFFFFF';
const TEXTO         = '#2D2D2D';
const TEXTO_2       = '#6B6B6B';
const BORDA         = '#E5E0D8';

const TerapiaPedagogica = () => {
  const [temas, setTemas] = useState([]);
  const [temaSelecionado, setTemaSelecionado] = useState(null);
  const [reflection, setReflection] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [verHistorico, setVerHistorico] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get('/reflections/themes')
      .then(res => setTemas(res.data))
      .catch(() => setTemas([]));
    carregarHistorico();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reflection?.messages]);

  const carregarHistorico = () => {
    api.get('/reflections')
      .then(res => setHistorico(res.data))
      .catch(() => setHistorico([]));
  };

  const iniciarConversa = async (tema) => {
    setCarregando(true);
    try {
      const res = await api.post('/reflections/start', { theme: tema });
      setReflection(res.data);
      setTemaSelecionado(tema);
    } catch (err) {
      alert('Erro ao iniciar a conversa.');
    } finally {
      setCarregando(false);
    }
  };

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!mensagem.trim() || enviando) return;

    const textoParaEnviar = mensagem.trim();
    setMensagem('');
    setEnviando(true);

    setReflection(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: textoParaEnviar }]
    }));

    try {
      const res = await api.post(`/reflections/${reflection.id}/message`, {
        content: textoParaEnviar,
      });
      setReflection(res.data.reflection);
    } catch (err) {
      alert('Erro ao enviar mensagem. Tente novamente.');
      try {
        const res = await api.get(`/reflections/${reflection.id}`);
        setReflection(res.data);
      } catch {}
    } finally {
      setEnviando(false);
      carregarHistorico();
    }
  };

  const abrirReflection = async (id) => {
    try {
      const res = await api.get(`/reflections/${id}`);
      setReflection(res.data);
      setTemaSelecionado(res.data.theme);
      setVerHistorico(false);
    } catch {
      alert('Erro ao abrir a conversa.');
    }
  };

  const novaConversa = () => {
    setReflection(null);
    setTemaSelecionado(null);
    setMensagem('');
  };

  // ============================================================
  // TELA 1 — Escolher tema
  // ============================================================
  if (!reflection) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <Link to="/modulo/professor_inteiro" className="text-sm hover:underline" style={{ color: AZUL }}>
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">❤️</span>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
              Terapia Pedagógica
            </h1>
            <p style={{ color: TEXTO_2 }}>
              O Professor Inesquecível — seu espaço de escuta e reflexão.
            </p>
          </div>
        </div>

        <div className="rounded-xl p-5 mb-8 border" style={{ backgroundColor: PESSEGO_CLARO, borderColor: BORDA }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: CORAL, fontFamily: "'Quicksand', sans-serif" }}>
            💗 Como funciona
          </h2>
          <ul className="text-sm space-y-1" style={{ color: TEXTO }}>
            <li>• Escolha um tema que está te mobilizando.</li>
            <li>• Converse livremente, como com um terapeuta pedagógico.</li>
            <li>• O sistema te acompanha em etapas, sem atropelar, sem julgar.</li>
            <li>• Ao final, você sai com uma compreensão nova e uma ação possível.</li>
          </ul>
          <p className="text-xs mt-3 italic" style={{ color: TEXTO_2 }}>
            Este não é um espaço de diagnóstico clínico. Se você estiver em sofrimento intenso,
            procure apoio profissional especializado.
          </p>
        </div>

        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>
            Sobre o que você quer conversar hoje?
          </h2>
          {historico.length > 0 && (
            <button
              onClick={() => setVerHistorico(!verHistorico)}
              className="text-sm hover:underline"
              style={{ color: AZUL }}
            >
              {verHistorico ? 'Ver temas' : `Ver histórico (${historico.length})`}
            </button>
          )}
        </div>

        {verHistorico ? (
          <div className="space-y-3">
            {historico.map(item => (
              <button
                key={item.id}
                onClick={() => abrirReflection(item.id)}
                className="w-full text-left rounded-xl p-4 shadow-sm hover:shadow transition border"
                style={{ backgroundColor: BRANCO, borderColor: BORDA }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold" style={{ color: TEXTO }}>{item.title}</h3>
                    <p className="text-xs mt-1" style={{ color: TEXTO_2 }}>
                      {item.messages?.length || 0} mensagens • última atualização{' '}
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span style={{ color: TEXTO_2 }}>→</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {temas.map(tema => (
              <button
                key={tema.codigo}
                onClick={() => iniciarConversa(tema.codigo)}
                disabled={carregando}
                className="rounded-xl p-5 text-left transition disabled:opacity-50 hover:shadow-lg border"
                style={{ backgroundColor: BRANCO, borderColor: BORDA }}
              >
                <h3 className="font-semibold mb-1" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>
                  {tema.nome}
                </h3>
                <p className="text-xs" style={{ color: TEXTO_2 }}>Toque para iniciar</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // TELA 2 — Chat terapêutico
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: CREME }}>
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">❤️</span>
          <div>
            <h1 className="text-lg font-bold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
              {reflection.title}
            </h1>
            <p className="text-xs" style={{ color: TEXTO_2 }}>Terapia Pedagógica — O Professor Inesquecível</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={novaConversa}
            className="text-sm transition"
            style={{ color: TEXTO_2 }}
          >
            Nova conversa
          </button>
          <Link
            to="/modulo/professor_inteiro"
            className="text-sm hover:underline"
            style={{ color: AZUL }}
          >
            Sair
          </Link>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {reflection.messages?.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 whitespace-pre-line ${
                  msg.role === 'user' ? 'rounded-br-md text-white' : 'rounded-bl-md shadow-sm border'
                }`}
                style={
                  msg.role === 'user'
                    ? { backgroundColor: AZUL }
                    : { backgroundColor: BRANCO, borderColor: BORDA, color: TEXTO }
                }
              >
                {msg.role === 'assistant' && (
                  <p className="text-xs font-semibold mb-1" style={{ color: CORAL, fontFamily: "'Quicksand', sans-serif" }}>
                    Terapeuta
                  </p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {enviando && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-5 py-3 shadow-sm border" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
                <p className="text-sm italic" style={{ color: TEXTO_2 }}>digitando...</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 md:px-8 py-4 border-t" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
        <form onSubmit={enviarMensagem} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Escreva com liberdade..."
            disabled={enviando}
            className="flex-1 rounded-full px-5 py-3 border focus:outline-none focus:ring-2 transition disabled:opacity-60"
            style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
          />
          <button
            type="submit"
            disabled={enviando || !mensagem.trim()}
            className="font-semibold px-6 py-3 rounded-full transition text-white disabled:opacity-60"
            style={{ backgroundColor: AZUL }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default TerapiaPedagogica;