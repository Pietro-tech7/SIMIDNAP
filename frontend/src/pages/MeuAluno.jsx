import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import FeedbackCard from '../components/FeedbackCard';

// ============================================================
// PALETA SIMIDNAPE (mesma dos demais motores)
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

const MeuAluno = () => {
  const [view, setView] = useState('lista'); // 'lista', 'form', 'resultado'
  const [casos, setCasos] = useState([]);
  const [casoAtual, setCasoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analisando, setAnalisando] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [gerandoPdf, setGerandoPdf] = useState(false);

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
      const baseUrl = api.defaults.baseURL || 'http://localhost:8000/api/v1';
      const url = `${baseUrl}/pedagogical-cases/${id}/analyze/stream`;

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

  // ============================================================
  // PDF
  // ============================================================
  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      const el = document.getElementById('analise-conteudo');
      if (!el) {
        alert('Conteúdo não encontrado.');
        return;
      }
      const nome = (casoAtual?.title || 'meu_aluno').replace(/\s+/g, '_');

      const dadosCapa = [];
      if (casoAtual?.grade) dadosCapa.push({ label: 'Ano/Série', valor: casoAtual.grade });
      if (casoAtual?.subject) dadosCapa.push({ label: 'Disciplina / Área', valor: casoAtual.subject });

      await gerarPDF(el, nome, {
        capa: {
          badge: 'Meu Aluno · Análise Pedagógica',
          titulo: casoAtual?.title,
          dados: dadosCapa,
        },
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  // ========================================================
  // TELA 1 — LISTA DE SITUAÇÕES
  // ========================================================
  if (view === 'lista') {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <Link to="/modulo/meu_aluno" className="text-sm hover:underline" style={{ color: AZUL }}>
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📊</span>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
                Meu Aluno
              </h1>
              <p style={{ color: TEXTO_2 }}>
                Descreva uma situação e receba apoio pedagógico especializado.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setCasoAtual(null); setView('form'); }}
            className="font-semibold px-5 py-2.5 rounded-lg transition text-white"
            style={{ backgroundColor: VERDE }}
          >
            + Nova situação
          </button>
        </div>

        <div className="rounded-xl p-5 mb-8 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            💡 Como funciona
          </h2>
          <ul className="text-sm space-y-1" style={{ color: TEXTO }}>
            <li>• Você descreve uma situação concreta com um aluno (sem nome completo, sem dado clínico).</li>
            <li>• Quanto mais detalhes você fornecer, mais precisa será a análise.</li>
            <li>• O sistema atua como pedagogo especialista — <strong>não faz diagnóstico clínico</strong>.</li>
            <li>• Cada análise consome <strong>0,5 crédito</strong>.</li>
          </ul>
        </div>

        {loading ? (
          <p style={{ color: TEXTO_2 }}>Carregando...</p>
        ) : casos.length === 0 ? (
          <div className="rounded-xl shadow-sm border p-8 text-center" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
            <p className="mb-4" style={{ color: TEXTO_2 }}>Você ainda não tem situações registradas.</p>
            <button
              onClick={() => { setCasoAtual(null); setView('form'); }}
              className="font-semibold px-5 py-2 rounded-lg text-white"
              style={{ backgroundColor: VERDE }}
            >
              Criar primeira situação
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {casos.map(c => (
              <div
                key={c.id}
                className="rounded-xl shadow-sm border p-5 hover:shadow-md transition"
                style={{ backgroundColor: BRANCO, borderColor: BORDA }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 cursor-pointer" onClick={() => {
                    setCasoAtual(c);
                    setView(c.analysis ? 'resultado' : 'form');
                  }}>
                    <h3 className="text-lg font-semibold" style={{ color: TEXTO }}>{c.title}</h3>
                    <p className="text-sm mt-1" style={{ color: TEXTO_2 }}>
                      {c.grade && <span>{c.grade}</span>}
                      {c.grade && c.subject && <span> • </span>}
                      {c.subject && <span>{c.subject}</span>}
                    </p>
                    {c.analysis && (
                      <span
                        className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: VERDE_CLARO, color: VERDE }}
                      >
                        ✓ Analisada
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExcluir(c.id)}
                      className="text-sm px-2"
                      style={{ color: CORAL }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 flex-wrap">
                  {!c.analysis && (
                    <button
                      onClick={() => handleAnalisar(c.id)}
                      disabled={analisando}
                      className="text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-60"
                      style={{ backgroundColor: VERDE }}
                    >
                      {analisando ? 'Analisando...' : '🤖 Analisar com IA'}
                    </button>
                  )}
                  {c.analysis && (
                    <button
                      onClick={() => handleAnalisar(c.id)}
                      disabled={analisando}
                      className="text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
                      style={{ backgroundColor: AZUL_CLARO, color: AZUL }}
                    >
                      🔄 Reanalisar
                    </button>
                  )}
                  <button
                    onClick={() => { setCasoAtual(c); setView('form'); }}
                    className="text-sm font-medium px-4 py-2 rounded-lg"
                    style={{ backgroundColor: CREME, color: TEXTO, border: `1px solid ${BORDA}` }}
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" style={{ backgroundColor: BRANCO }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: VERDE_CLARO }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: VERDE }}></div>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>
                Analisando sua situação pedagógica...
              </h3>
              <p className="text-sm mb-6" style={{ color: TEXTO_2 }}>
                O pedagogo especialista está lendo e preparando as orientações.
              </p>

              <div className="rounded-full h-2 overflow-hidden mb-2" style={{ backgroundColor: CREME }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${streamProgress}%`, backgroundColor: VERDE }}
                />
              </div>
              <p className="text-xs h-4" style={{ color: TEXTO_2 }}>
                {streamProgress < 30 ? '📖 Compreendendo a situação...' :
                 streamProgress < 60 ? '🔍 Formulando hipóteses pedagógicas...' :
                 streamProgress < 90 ? '✅ Sugerindo intervenções...' :
                 '✨ Finalizando a análise...'}
              </p>

              <p className="text-xs mt-3 italic" style={{ color: TEXTO_2 }}>
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
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="print:hidden flex items-center justify-between mb-4 flex-wrap gap-3">
          <button
            onClick={() => { setView('lista'); carregar(); }}
            className="text-sm hover:underline"
            style={{ color: AZUL }}
          >
            ← Voltar
          </button>
          <button
            onClick={baixarPdf}
            disabled={gerandoPdf}
            className="font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 text-white disabled:opacity-60"
            style={{ backgroundColor: AZUL }}
          >
            {gerandoPdf ? '⏳ Gerando PDF...' : '📥 Baixar PDF'}
          </button>
        </div>

        <div id="analise-conteudo" style={{ backgroundColor: CREME, padding: '24px', borderRadius: '12px' }}>
          <ResultadoAnalise caso={casoAtual} />
        </div>

        <div className="mt-6">
          <FeedbackCard
            content_type="pedagogical_case"
            content_id={casoAtual.id}
            initialFeedback={casoAtual.analysis?.feedback || null}
          />
        </div>
      </div>
    );
  }
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

  const inputStyle = { borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO };
  const labelStyle = { color: TEXTO };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <button onClick={onVoltar} className="text-sm hover:underline" style={{ color: AZUL }}>
        ← Voltar
      </button>

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
          {caso?.id ? 'Editar situação' : 'Nova situação pedagógica'}
        </h1>
        <p className="mt-1" style={{ color: TEXTO_2 }}>
          Descreva a situação com detalhes. <strong>Não inclua nome completo do aluno nem dados clínicos.</strong>
        </p>
      </div>

      <form onSubmit={handleSalvar} className="rounded-xl shadow-sm border p-6 space-y-4" style={{ backgroundColor: CREME, borderColor: BORDA }}>
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Título da situação *</label>
          <input
            type="text" name="title" value={form.title} onChange={handleChange} required
            placeholder="Ex: Aluno com dificuldade de leitura"
            className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition"
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>Ano/Série</label>
            <input
              type="text" name="grade" value={form.grade} onChange={handleChange}
              placeholder="Ex: 5º ano"
              className="w-full rounded-lg px-4 py-2 border"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>Disciplina / Área</label>
            <input
              type="text" name="subject" value={form.subject} onChange={handleChange}
              placeholder="Ex: Leitura, Matemática, Comportamento"
              className="w-full rounded-lg px-4 py-2 border"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Descrição da situação *</label>
          <textarea
            name="description" value={form.description} onChange={handleChange} required rows="5"
            placeholder="Descreva o que você observa: o que o aluno faz, em que momentos, o que você já tentou, o que funciona e o que não funciona..."
            className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition"
            style={inputStyle}
          />
        </div>

        {/* INVESTIGAÇÃO ESTRUTURADA (OPCIONAL) */}
        <div className="border-t pt-4" style={{ borderColor: BORDA }}>
          <button
            type="button"
            onClick={() => setMostrarInvestigacao(!mostrarInvestigacao)}
            className="flex items-center gap-2 text-sm font-semibold transition"
            style={{ color: VERDE, fontFamily: "'Quicksand', sans-serif" }}
          >
            <span>{mostrarInvestigacao ? '▼' : '▶'}</span>
            <span>🔍 Detalhes que enriquecem a análise (opcional)</span>
          </button>

          {mostrarInvestigacao && (
            <div className="mt-4 space-y-4 rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
              <p className="text-xs mb-2" style={{ color: TEXTO_2 }}>
                Quanto mais detalhes você fornecer, mais precisa será a análise. Todos os campos são <strong>opcionais</strong>.
              </p>

              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Com que frequência acontece?</label>
                <select
                  name="frequencia" value={form.frequencia} onChange={handleChange}
                  className="w-full rounded-lg px-4 py-2 border"
                  style={inputStyle}
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
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Em quais situações acontece?</label>
                <textarea
                  name="situacoes" value={form.situacoes} onChange={handleChange} rows="2"
                  placeholder="Ex: Durante atividades em grupo, na hora da leitura, quando é chamado para responder..."
                  className="w-full rounded-lg px-4 py-2 border"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Como o aluno reage?</label>
                <textarea
                  name="reacao_aluno" value={form.reacao_aluno} onChange={handleChange} rows="2"
                  placeholder="Ex: Fica quieto, desvia o olhar, sai do lugar, chora, briga..."
                  className="w-full rounded-lg px-4 py-2 border"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>O que você já tentou?</label>
                <textarea
                  name="ja_tentou" value={form.ja_tentou} onChange={handleChange} rows="2"
                  placeholder="Ex: Conversa individual, mudança de lugar, contato com a família..."
                  className="w-full rounded-lg px-4 py-2 border"
                  style={inputStyle}
                />
                <p className="text-xs mt-1" style={{ color: TEXTO_2 }}>
                  💡 A IA vai considerar o que já foi tentado e sugerir algo <strong>diferente</strong>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Outras informações relevantes</label>
                <textarea
                  name="contexto_adicional" value={form.contexto_adicional} onChange={handleChange} rows="2"
                  placeholder="Ex: Mudança recente de turma, situação familiar, algo que você percebeu..."
                  className="w-full rounded-lg px-4 py-2 border"
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg p-3 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}>
          <p className="text-xs" style={{ color: TEXTO }}>
            ⚠️ <strong>Importante:</strong> o sistema <strong>não faz diagnóstico clínico</strong>. Ele atua como pedagogo especialista.
            Não escreva nome completo do aluno nem dados de saúde.
          </p>
        </div>

        {erro && <p className="text-sm" style={{ color: CORAL }}>{erro}</p>}

        <div className="flex gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={onVoltar}
            className="font-semibold px-5 py-2.5 rounded-lg transition"
            style={{ backgroundColor: CREME, color: TEXTO, border: `1px solid ${BORDA}` }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="font-semibold px-5 py-2.5 rounded-lg transition text-white disabled:opacity-60"
            style={{ backgroundColor: VERDE }}
          >
            {salvando ? 'Salvando...' : '💾 Salvar situação'}
          </button>
        </div>

        <p className="text-xs text-center pt-2" style={{ color: TEXTO_2 }}>
          Após salvar, clique em <strong>"Analisar com IA"</strong> na lista para gerar a análise pedagógica.
        </p>
      </form>
    </div>
  );
};

// ============================================================
// RESULTADO DA ANÁLISE
// ============================================================
const ResultadoAnalise = ({ caso }) => {
  const analise = caso.analysis || {};

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📊</span>
          <h1 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Lora', serif" }}>
            {caso.title}
          </h1>
        </div>
        <p style={{ color: TEXTO_2 }}>
          {caso.grade && <span>{caso.grade}</span>}
          {caso.grade && caso.subject && <span> • </span>}
          {caso.subject && <span>{caso.subject}</span>}
        </p>
      </div>

      {/* Situação original + campos de investigação */}
      <div className="rounded-xl p-5 mb-6 border" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>
          📝 Situação descrita
        </h3>
        <p className="text-sm whitespace-pre-line" style={{ color: TEXTO }}>{caso.description}</p>

        {(caso.frequencia || caso.situacoes || caso.reacao_aluno || caso.ja_tentou || caso.contexto_adicional) && (
          <div className="mt-4 pt-4 space-y-2 border-t" style={{ borderColor: BORDA }}>
            {caso.frequencia && (
              <p className="text-xs" style={{ color: TEXTO_2 }}><strong>Frequência:</strong> {caso.frequencia}</p>
            )}
            {caso.situacoes && (
              <p className="text-xs" style={{ color: TEXTO_2 }}><strong>Situações:</strong> {caso.situacoes}</p>
            )}
            {caso.reacao_aluno && (
              <p className="text-xs" style={{ color: TEXTO_2 }}><strong>Reação do aluno:</strong> {caso.reacao_aluno}</p>
            )}
            {caso.ja_tentou && (
              <p className="text-xs" style={{ color: TEXTO_2 }}><strong>Já tentou:</strong> {caso.ja_tentou}</p>
            )}
            {caso.contexto_adicional && (
              <p className="text-xs" style={{ color: TEXTO_2 }}><strong>Contexto adicional:</strong> {caso.contexto_adicional}</p>
            )}
          </div>
        )}
      </div>

      {analise.compreensao && (
        <div className="rounded-xl shadow-sm border p-6 mb-6" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            🧭 Compreensão pedagógica
          </h3>
          <p className="leading-relaxed" style={{ color: TEXTO }}>{analise.compreensao}</p>
        </div>
      )}

      {analise.hipoteses_pedagogicas?.length > 0 && (
        <div className="rounded-xl shadow-sm border p-6 mb-6" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            🔍 Hipóteses a investigar
          </h3>
          <ul className="space-y-2">
            {analise.hipoteses_pedagogicas.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                <span className="mt-0.5" style={{ color: PESSEGO }}>•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analise.intervencoes_sugeridas?.length > 0 && (
        <div className="rounded-xl p-6 mb-6 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            ✅ Intervenções sugeridas
          </h3>
          <ul className="space-y-2">
            {analise.intervencoes_sugeridas.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                <span className="mt-0.5" style={{ color: VERDE }}>→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analise.como_acompanhar?.length > 0 && (
        <div className="rounded-xl p-6 mb-6 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            👀 Como acompanhar
          </h3>
          <ul className="space-y-2">
            {analise.como_acompanhar.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                <span className="mt-0.5" style={{ color: AZUL }}>✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analise.encaminhamento && (
        <div className="rounded-xl p-5 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA, borderLeft: `4px solid ${OURO}` }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}>
            ⚠️ Encaminhamento
          </h3>
          <p className="text-sm" style={{ color: TEXTO }}>{analise.encaminhamento}</p>
        </div>
      )}
    </div>
  );
};

export default MeuAluno;