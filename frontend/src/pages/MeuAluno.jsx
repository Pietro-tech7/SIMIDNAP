import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const MeuAluno = () => {
  const [view, setView] = useState('lista'); // 'lista', 'form', 'resultado'
  const [casos, setCasos] = useState([]);
  const [casoAtual, setCasoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analisando, setAnalisando] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);

  const carregar = () => {
    setLoading(true);
    api.get('/pedagogical-cases')
      .then(res => setCasos(res.data))
      .catch(() => setCasos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir esta situação? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/pedagogical-cases/${id}`);
      carregar();
    } catch {
      alert('Erro ao excluir.');
    }
  };

  // ============================================================
  // ANÁLISE COM STREAMING
  // ============================================================
  const handleAnalisar = async (id) => {
    setAnalisando(true);
    setStreamProgress(0);

    try {
      const token = localStorage.getItem('access_token');
      const url = `http://localhost:8000/api/v1/pedagogical-cases/${id}/analyze/stream`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (response.status === 402) {
        alert('Créditos insuficientes. Faça upgrade do seu plano.');
        setAnalisando(false);
        return;
      }

      if (!response.ok) {
        alert('Erro ao analisar. Tente novamente.');
        setAnalisando(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalChars = 0;
      let analiseConcluida = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const eventBlocks = buffer.split('\n\n');
        buffer = eventBlocks.pop() || '';

        for (const block of eventBlocks) {
          const lines = block.split('\n');
          let eventType = null;
          let eventData = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            if (line.startsWith('data: ')) eventData = line.slice(6);
          }

          if (!eventType || !eventData) continue;

          try {
            const parsed = JSON.parse(eventData);

            if (eventType === 'chunk' && parsed.texto) {
              totalChars += parsed.texto.length;
              setStreamProgress(Math.min(95, (totalChars / 4000) * 100));
            } else if (eventType === 'completo') {
              setStreamProgress(100);
              analiseConcluida = true;
            } else if (eventType === 'erro') {
              alert('Erro: ' + (parsed.detail || 'Tente novamente.'));
              setAnalisando(false);
              return;
            }
          } catch (e) {
            // ignora erros de parse parcial
          }
        }
      }

      if (analiseConcluida) {
        const casoRes = await api.get(`/pedagogical-cases/${id}`);
        setCasoAtual(casoRes.data);
        setView('resultado');
        carregar();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao analisar. Tente novamente.');
    } finally {
      setTimeout(() => {
        setAnalisando(false);
        setStreamProgress(0);
      }, 600);
    }
  };

  // ========================================================
  // TELA 1 — LISTA DE SITUAÇÕES
  // ========================================================
  if (view === 'lista') {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <Link to="/modulo/meu_aluno" className="text-blue-600 text-sm hover:underline">
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📊</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Aluno</h1>
              <p className="text-gray-600">
                Descreva uma situação e receba apoio pedagógico especializado.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setCasoAtual(null); setView('form'); }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
          >
            + Nova situação
          </button>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-green-900 mb-2">
            💡 Como funciona
          </h2>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Você descreve uma situação concreta com um aluno (sem nome completo, sem dado clínico).</li>
            <li>• Quanto mais detalhes você fornecer, mais precisa será a análise.</li>
            <li>• O sistema atua como pedagogo especialista — <strong>não faz diagnóstico clínico</strong>.</li>
            <li>• Cada análise consome <strong>0,5 crédito</strong>.</li>
          </ul>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : casos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 mb-4">Você ainda não tem situações registradas.</p>
            <button
              onClick={() => { setCasoAtual(null); setView('form'); }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg"
            >
              Criar primeira situação
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {casos.map(c => (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 cursor-pointer" onClick={() => {
                    setCasoAtual(c);
                    setView(c.analysis ? 'resultado' : 'form');
                  }}>
                    <h3 className="text-lg font-semibold text-gray-800">{c.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {c.grade && <span>{c.grade}</span>}
                      {c.grade && c.subject && <span> • </span>}
                      {c.subject && <span>{c.subject}</span>}
                    </p>
                    {c.analysis && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                        ✓ Analisada
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExcluir(c.id)}
                      className="text-red-400 hover:text-red-600 text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  {!c.analysis && (
                    <button
                      onClick={() => handleAnalisar(c.id)}
                      disabled={analisando}
                      className="text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium px-4 py-2 rounded-lg"
                    >
                      {analisando ? 'Analisando...' : '🤖 Analisar com IA'}
                    </button>
                  )}
                  {c.analysis && (
                    <button
                      onClick={() => handleAnalisar(c.id)}
                      disabled={analisando}
                      className="text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg"
                    >
                      🔄 Reanalisar
                    </button>
                  )}
                  <button
                    onClick={() => { setCasoAtual(c); setView('form'); }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE ANÁLISE EM STREAMING */}
        {analisando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Analisando sua situação pedagógica...
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                O pedagogo especialista está lendo e preparando as orientações.
              </p>

              <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-green-600 h-full transition-all duration-300"
                  style={{ width: `${streamProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 h-4">
                {streamProgress < 30 ? '📖 Compreendendo a situação...' :
                 streamProgress < 60 ? '🔍 Formulando hipóteses pedagógicas...' :
                 streamProgress < 90 ? '✅ Sugerindo intervenções...' :
                 '✨ Finalizando a análise...'}
              </p>

              <p className="text-xs text-gray-400 mt-3 italic">
                Isso pode levar entre 30 e 60 segundos.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================================
  // TELA 2 — FORMULÁRIO (criar/editar)
  // ========================================================
  if (view === 'form') {
    return (
      <FormularioCaso
        caso={casoAtual}
        onVoltar={() => { setView('lista'); carregar(); }}
        onCriado={async (novo) => {
          await carregar();
          setCasoAtual(novo);
          setView('lista');
        }}
      />
    );
  }

  // ========================================================
  // TELA 3 — RESULTADO DA ANÁLISE
  // ========================================================
  if (view === 'resultado' && casoAtual) {
    return (
      <ResultadoAnalise
        caso={casoAtual}
        onVoltar={() => { setView('lista'); carregar(); }}
      />
    );
  }

  return null;
};

// ============================================================
// FORMULÁRIO COM INVESTIGAÇÃO ESTRUTURADA
// ============================================================
const FormularioCaso = ({ caso, onVoltar, onCriado }) => {
  const [form, setForm] = useState({
    title: caso?.title || '',
    grade: caso?.grade || '',
    subject: caso?.subject || '',
    description: caso?.description || '',
    frequencia: caso?.frequencia || '',
    situacoes: caso?.situacoes || '',
    reacao_aluno: caso?.reacao_aluno || '',
    ja_tentou: caso?.ja_tentou || '',
    contexto_adicional: caso?.contexto_adicional || '',
  });
  const [mostrarInvestigacao, setMostrarInvestigacao] = useState(
    !!(caso?.frequencia || caso?.situacoes || caso?.reacao_aluno || caso?.ja_tentou || caso?.contexto_adicional)
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      let res;
      if (caso?.id) {
        res = await api.put(`/pedagogical-cases/${caso.id}`, form);
      } else {
        res = await api.post('/pedagogical-cases', form);
      }
      onCriado(res.data);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <button onClick={onVoltar} className="text-blue-600 text-sm hover:underline">
        ← Voltar
      </button>

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {caso?.id ? 'Editar situação' : 'Nova situação pedagógica'}
        </h1>
        <p className="text-gray-600 mt-1">
          Descreva a situação com detalhes. <strong>Não inclua nome completo do aluno nem dados clínicos.</strong>
        </p>
      </div>

      <form onSubmit={handleSalvar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título da situação *</label>
          <input
            type="text" name="title" value={form.title} onChange={handleChange} required
            placeholder="Ex: Aluno com dificuldade de leitura"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano/Série</label>
            <input
              type="text" name="grade" value={form.grade} onChange={handleChange}
              placeholder="Ex: 5º ano"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina / Área</label>
            <input
              type="text" name="subject" value={form.subject} onChange={handleChange}
              placeholder="Ex: Leitura, Matemática, Comportamento"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da situação *</label>
          <textarea
            name="description" value={form.description} onChange={handleChange} required rows="5"
            placeholder="Descreva o que você observa: o que o aluno faz, em que momentos, o que você já tentou, o que funciona e o que não funciona..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* INVESTIGAÇÃO ESTRUTURADA (OPCIONAL) */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setMostrarInvestigacao(!mostrarInvestigacao)}
            className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 transition"
          >
            <span>{mostrarInvestigacao ? '▼' : '▶'}</span>
            <span>🔍 Detalhes que enriquecem a análise (opcional)</span>
          </button>

          {mostrarInvestigacao && (
            <div className="mt-4 space-y-4 bg-green-50 border border-green-100 rounded-lg p-4">
              <p className="text-xs text-green-800 mb-2">
                Quanto mais detalhes você fornecer, mais precisa será a análise. Todos os campos são <strong>opcionais</strong>.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Com que frequência acontece?</label>
                <select
                  name="frequencia" value={form.frequencia} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                >
                  <option value="">Prefiro não informar</option>
                  <option value="sempre">Sempre</option>
                  <option value="frequentemente">Frequentemente</option>
                  <option value="às vezes">Às vezes</option>
                  <option value="raramente">Raramente</option>
                  <option value="só em situações específicas">Só em situações específicas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Em quais situações acontece?</label>
                <textarea
                  name="situacoes" value={form.situacoes} onChange={handleChange} rows="2"
                  placeholder="Ex: Durante atividades em grupo, na hora da leitura, quando é chamado para responder..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Como o aluno reage?</label>
                <textarea
                  name="reacao_aluno" value={form.reacao_aluno} onChange={handleChange} rows="2"
                  placeholder="Ex: Fica quieto, desvia o olhar, sai do lugar, chora, briga..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">O que você já tentou?</label>
                <textarea
                  name="ja_tentou" value={form.ja_tentou} onChange={handleChange} rows="2"
                  placeholder="Ex: Conversa individual, mudança de lugar, contato com a família..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 A IA vai considerar o que já foi tentado e sugerir algo <strong>diferente</strong>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outras informações relevantes</label>
                <textarea
                  name="contexto_adicional" value={form.contexto_adicional} onChange={handleChange} rows="2"
                  placeholder="Ex: Mudança recente de turma, situação familiar, algo que você percebeu..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Importante:</strong> o sistema <strong>não faz diagnóstico clínico</strong>. Ele atua como pedagogo especialista.
            Não escreva nome completo do aluno nem dados de saúde.
          </p>
        </div>

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onVoltar}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-5 py-2.5 rounded-lg transition"
          >
            {salvando ? 'Salvando...' : '💾 Salvar situação'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center pt-2">
          Após salvar, clique em <strong>"Analisar com IA"</strong> na lista para gerar a análise pedagógica.
        </p>
      </form>
    </div>
  );
};

// ============================================================
// RESULTADO DA ANÁLISE
// ============================================================
const ResultadoAnalise = ({ caso, onVoltar }) => {
  const analise = caso.analysis || {};

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <button onClick={onVoltar} className="text-blue-600 text-sm hover:underline">
        ← Voltar
      </button>

      <div className="mt-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📊</span>
          <h1 className="text-3xl font-bold text-gray-900">{caso.title}</h1>
        </div>
        <p className="text-gray-600">
          {caso.grade && <span>{caso.grade}</span>}
          {caso.grade && caso.subject && <span> • </span>}
          {caso.subject && <span>{caso.subject}</span>}
        </p>
      </div>

      {/* Situação original + campos de investigação */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 Situação descrita</h3>
        <p className="text-sm text-gray-700 whitespace-pre-line">{caso.description}</p>

        {(caso.frequencia || caso.situacoes || caso.reacao_aluno || caso.ja_tentou || caso.contexto_adicional) && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            {caso.frequencia && (
              <p className="text-xs text-gray-600"><strong>Frequência:</strong> {caso.frequencia}</p>
            )}
            {caso.situacoes && (
              <p className="text-xs text-gray-600"><strong>Situações:</strong> {caso.situacoes}</p>
            )}
            {caso.reacao_aluno && (
              <p className="text-xs text-gray-600"><strong>Reação do aluno:</strong> {caso.reacao_aluno}</p>
            )}
            {caso.ja_tentou && (
              <p className="text-xs text-gray-600"><strong>Já tentou:</strong> {caso.ja_tentou}</p>
            )}
            {caso.contexto_adicional && (
              <p className="text-xs text-gray-600"><strong>Contexto adicional:</strong> {caso.contexto_adicional}</p>
            )}
          </div>
        )}
      </div>

      {analise.compreensao && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🧭 Compreensão pedagógica</h3>
          <p className="text-gray-700 leading-relaxed">{analise.compreensao}</p>
        </div>
      )}

      {analise.hipoteses_pedagogicas?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Hipóteses a investigar</h3>
          <ul className="space-y-2">
            {analise.hipoteses_pedagogicas.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-purple-500 mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analise.intervencoes_sugeridas?.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">✅ Intervenções sugeridas</h3>
          <ul className="space-y-2">
            {analise.intervencoes_sugeridas.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                <span className="text-green-500 mt-0.5">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analise.como_acompanhar?.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">👀 Como acompanhar</h3>
          <ul className="space-y-2">
            {analise.como_acompanhar.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analise.encaminhamento && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Encaminhamento</h3>
          <p className="text-sm text-yellow-800">{analise.encaminhamento}</p>
        </div>
      )}
    </div>
  );
};

export default MeuAluno;