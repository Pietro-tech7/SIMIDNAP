import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

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

    // Adiciona a mensagem do professor localmente (para feedback imediato)
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
      // Recarrega a reflection para remover a mensagem otimista
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
        <Link to="/modulo/professor_inteiro" className="text-blue-600 text-sm hover:underline">
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">❤️</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Terapia Pedagógica
            </h1>
            <p className="text-gray-600">
              O Professor Inesquecível — seu espaço de escuta e reflexão.
            </p>
          </div>
        </div>

        <div className="bg-pink-50 border border-pink-100 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-pink-900 mb-2">
            💗 Como funciona
          </h2>
          <ul className="text-sm text-pink-800 space-y-1">
            <li>• Escolha um tema que está te mobilizando.</li>
            <li>• Converse livremente, como com um terapeuta pedagógico.</li>
            <li>• O sistema te acompanha em etapas, sem atropelar, sem julgar.</li>
            <li>• Ao final, você sai com uma compreensão nova e uma ação possível.</li>
          </ul>
          <p className="text-xs text-pink-700 mt-3 italic">
            Este não é um espaço de diagnóstico clínico. Se você estiver em sofrimento intenso,
            procure apoio profissional especializado.
          </p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Sobre o que você quer conversar hoje?
          </h2>
          {historico.length > 0 && (
            <button
              onClick={() => setVerHistorico(!verHistorico)}
              className="text-sm text-blue-600 hover:underline"
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
                className="w-full text-left bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-4 shadow-sm hover:shadow transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.messages?.length || 0} mensagens • última atualização{' '}
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-gray-400">→</span>
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
                className="bg-white border border-gray-100 hover:border-pink-200 hover:shadow-lg rounded-xl p-5 text-left transition disabled:opacity-50"
              >
                <h3 className="font-semibold text-gray-800 mb-1">{tema.nome}</h3>
                <p className="text-xs text-gray-500">Toque para iniciar</p>
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">❤️</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{reflection.title}</h1>
            <p className="text-xs text-gray-500">Terapia Pedagógica — O Professor Inesquecível</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={novaConversa}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Nova conversa
          </button>
          <Link
            to="/modulo/professor_inteiro"
            className="text-sm text-blue-600 hover:underline"
          >
            Sair
          </Link>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {reflection.messages?.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <p className="text-xs font-semibold text-pink-600 mb-1">Terapeuta</p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {enviando && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                <p className="text-sm text-gray-400 italic">digitando...</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 md:px-8 py-4">
        <form onSubmit={enviarMensagem} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Escreva com liberdade..."
            disabled={enviando}
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={enviando || !mensagem.trim()}
            className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold px-6 py-3 rounded-full transition"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default TerapiaPedagogica;