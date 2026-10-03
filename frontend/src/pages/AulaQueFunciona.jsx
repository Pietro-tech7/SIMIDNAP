import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import FeedbackCard from '../components/FeedbackCard';

// ============================================================
// PALETA SIMIDNAPE (mesma do PDF do planejador)
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

const AulaQueFunciona = () => {
  const [form, setForm] = useState({
    title: '',
    subject: '',
    grade: '',
    content: '',
    objective: '',
    bncc_codigo: '',
    bncc_texto: '',
    duracao_minutos: 50,
    num_alunos: 25,
    dificuldades: '',
    conhecimentos_previos: '',
  });
  const [diferenciado, setDiferenciado] = useState(false);

  const [componentes, setComponentes] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [codigoComponente, setCodigoComponente] = useState('');
  const [anoNumero, setAnoNumero] = useState('');
  const [loadingHabilidades, setLoadingHabilidades] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gerandoPdf, setGerandoPdf] = useState(false);

  useEffect(() => {
    api.get('/bncc/componentes?etapa=EF')
      .then(res => setComponentes(res.data))
      .catch(() => setComponentes([]));
  }, []);

  useEffect(() => {
    if (!codigoComponente || !anoNumero) {
      setHabilidades([]);
      return;
    }
    setLoadingHabilidades(true);
    api.get(`/bncc/habilidades?etapa=EF&componente=${codigoComponente}&ano=${anoNumero}`)
      .then(res => setHabilidades(res.data || []))
      .catch(() => setHabilidades([]))
      .finally(() => setLoadingHabilidades(false));
  }, [codigoComponente, anoNumero]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelecionarHabilidade = (e) => {
    const codigo = e.target.value;
    const habilidade = habilidades.find(h => h.codigo === codigo);
    setForm({
      ...form,
      bncc_codigo: codigo,
      bncc_texto: habilidade ? habilidade.texto : '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post('/lesson-plans/generate', {
        plan_type: 'aula_que_funciona',
        diferenciado,
        ...form,
      });
      setResult(response.data);
    } catch (err) {
      if (err.response?.status === 402) {
        setError('Créditos insuficientes. Faça upgrade do seu plano.');
      } else {
        setError('Erro ao gerar a aula. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      const el = document.getElementById('aula-conteudo');
      if (!el) return;
      const sd = result?.structured_data || {};
      const cab = sd.cabecalho || {};
      const bncc = cab.bncc || {};
      const nome = (cab.titulo || 'aula_que_funciona').replace(/\s+/g, '_');

      const dadosCapa = [
        { label: 'Disciplina', valor: cab.disciplina },
        { label: 'Ano', valor: cab.ano },
        { label: 'Duração', valor: cab.duracao },
        { label: 'Alunos', valor: cab.num_alunos },
      ];
      if (bncc.codigo) {
        dadosCapa.push({ label: 'Habilidade BNCC', valor: bncc.codigo });
      }

      await gerarPDF(el, nome, {
        capa: {
          badge: 'Aula que Funciona · Script Cronometrado',
          titulo: cab.titulo,
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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="print:hidden">
        <Link to="/planejador" className="text-sm hover:underline" style={{ color: AZUL }}>
          ← Voltar ao Planejador
        </Link>

        <div className="mt-6 mb-8">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full mb-3"
            style={{ backgroundColor: VERDE_CLARO, color: AZUL }}
          >
            <span>🧠</span>
            <span>PLANEJADOR SIMIDNAPE · MODO AULA</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎯</span>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
                Aula que Funciona
              </h1>
              <p style={{ color: TEXTO_2 }}>
                Script prático de execução. Roteiro minuto a minuto, pronto para aplicar em sala.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 mb-8 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            ⚡ O que este módulo entrega
          </h2>
          <ul className="text-sm space-y-1" style={{ color: TEXTO_2 }}>
            <li>• Um <strong>roteiro cronometrado</strong> com falas, ações e perguntas exatas.</li>
            <li>• Um <strong>checklist de materiais</strong> antes de começar.</li>
            <li>• Adaptações inclusivas automáticas para alunos com necessidades específicas.</li>
            <li>• Opção de gerar <strong>aula diferenciada</strong> (versão principal + versão adaptada).</li>
            <li>• Foco total em <strong>execução</strong> — você pega e aplica.</li>
          </ul>
        </div>

        <div
          className="rounded-xl shadow-sm border p-6 mb-8"
          style={{ backgroundColor: CREME, borderColor: BORDA }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Título da aula *</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="Ex: Ciclo da água"
                className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition"
                style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Disciplina</label>
                <input
                  type="text" name="subject" value={form.subject} onChange={handleChange}
                  placeholder="Ex: Ciências"
                  className="w-full rounded-lg px-4 py-2 border"
                  style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Série/Ano</label>
                <input
                  type="text" name="grade" value={form.grade} onChange={handleChange}
                  placeholder="Ex: 4º ano"
                  className="w-full rounded-lg px-4 py-2 border"
                  style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Duração (min)</label>
                <input
                  type="number" name="duracao_minutos" value={form.duracao_minutos} onChange={handleChange}
                  className="w-full rounded-lg px-4 py-2 border"
                  style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Conteúdo *</label>
              <input
                type="text" name="content" value={form.content} onChange={handleChange} required
                placeholder="Ex: Ciclo da água"
                className="w-full rounded-lg px-4 py-2 border"
                style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Objetivo (opcional)</label>
              <textarea
                name="objective" value={form.objective} onChange={handleChange} rows="2"
                placeholder="Ex: Reconhecer as etapas do ciclo da água"
                className="w-full rounded-lg px-4 py-2 border"
                style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
              />
            </div>

            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>
                📖 Habilidade BNCC
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>
                  Código BNCC (digite se souber — ex: EF04CI04)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.bncc_codigo}
                    onChange={(e) => setForm({ ...form, bncc_codigo: e.target.value.toUpperCase(), bncc_texto: '' })}
                    placeholder="EF04CI04"
                    className="flex-1 rounded-lg px-4 py-2 border"
                    style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!form.bncc_codigo) return;
                      try {
                        const res = await api.get(`/bncc/habilidades/${form.bncc_codigo}`);
                        if (res.data?.texto) {
                          setForm(f => ({ ...f, bncc_texto: res.data.texto }));
                        } else {
                          setForm(f => ({ ...f, bncc_texto: 'Código não encontrado na BNCC.' }));
                        }
                      } catch {
                        setForm(f => ({ ...f, bncc_texto: 'Código não encontrado na BNCC.' }));
                      }
                    }}
                    className="text-sm font-medium px-4 py-2 rounded-lg border"
                    style={{ backgroundColor: BRANCO, color: TEXTO, borderColor: BORDA }}
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Componente</label>
                  <select
                    value={codigoComponente}
                    onChange={(e) => setCodigoComponente(e.target.value)}
                    className="w-full rounded-lg px-4 py-2 border"
                    style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                  >
                    <option value="">Selecione...</option>
                    {componentes.map(c => (
                      <option key={c.codigo} value={c.codigo}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Ano (1 a 9)</label>
                  <input
                    type="number" min="1" max="9"
                    value={anoNumero}
                    onChange={(e) => setAnoNumero(e.target.value)}
                    placeholder="Ex: 4"
                    className="w-full rounded-lg px-4 py-2 border"
                    style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Habilidade</label>
                  <select
                    value={form.bncc_codigo}
                    onChange={handleSelecionarHabilidade}
                    disabled={!habilidades.length}
                    className="w-full rounded-lg px-4 py-2 border disabled:bg-gray-100"
                    style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                  >
                    <option value="">
                      {loadingHabilidades ? 'Carregando...' : habilidades.length === 0 ? 'Nenhuma habilidade disponível' : 'Selecione...'}
                    </option>
                    {habilidades.map(h => (
                      <option key={h.codigo} value={h.codigo}>
                        {h.codigo} — {h.texto?.substring(0, 80)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.bncc_texto && (
                <p
                  className="mt-3 text-xs rounded p-2 border"
                  style={{ color: TEXTO_2, backgroundColor: AZUL_CLARO, borderColor: BORDA }}
                >
                  <strong>{form.bncc_codigo}:</strong> {form.bncc_texto}
                </p>
              )}
            </div>

            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>
                👥 Perfil da Turma
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Nº de alunos</label>
                  <input
                    type="number" name="num_alunos" value={form.num_alunos} onChange={handleChange}
                    className="w-full rounded-lg px-4 py-2 border"
                    style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Conhecimentos prévios da turma</label>
                  <input
                    type="text" name="conhecimentos_previos" value={form.conhecimentos_previos} onChange={handleChange}
                    placeholder="Ex: Já conhecem os estados físicos da água"
                    className="w-full rounded-lg px-4 py-2 border"
                    style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-lg p-4 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
                <label className="block text-sm font-semibold mb-1" style={{ color: AZUL }}>
                  🧩 Alunos com necessidades específicas (opcional)
                </label>
                <p className="text-xs mb-2" style={{ color: TEXTO_2 }}>
                  Informe apenas necessidades <strong>pedagógicas</strong>. Exemplos:
                  "2 alunos autistas", "1 aluno com TDAH", "1 aluno com dislexia".
                  O sistema <strong>não realiza diagnósticos</strong> — apenas adapta a aula pedagogicamente.
                </p>
                <textarea
                  name="dificuldades" value={form.dificuldades} onChange={handleChange} rows="2"
                  placeholder="Ex: 2 alunos autistas, 1 aluno com TDAH"
                  className="w-full rounded-lg px-4 py-2 border"
                  style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                />
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <label
                className="flex items-start gap-3 rounded-lg p-4 cursor-pointer border"
                style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}
              >
                <input
                  type="checkbox"
                  checked={diferenciado}
                  onChange={(e) => setDiferenciado(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded"
                  style={{ accentColor: AZUL }}
                />
                <div>
                  <div className="text-sm font-semibold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
                    📑 Aula diferenciada
                  </div>
                  <div className="text-xs mt-1" style={{ color: TEXTO_2 }}>
                    Gera <strong>dois scripts</strong>: um principal (para a turma toda) e um adaptado
                    (com blocos mais curtos, instruções simples, apoio visual).
                    <strong> Consome 2 créditos</strong> em vez de 1.
                  </div>
                </div>
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="font-semibold px-6 py-2.5 rounded-lg transition text-white disabled:opacity-60"
              style={{ backgroundColor: AZUL }}
            >
              {loading ? 'Preparando script...' : 'Gerar script de execução'}
            </button>
          </form>
        </div>

        {result && (
          <div className="print:hidden flex justify-end mb-4">
            <button
              onClick={baixarPdf}
              disabled={gerandoPdf}
              className="text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: AZUL }}
            >
              {gerandoPdf ? '⏳ Gerando PDF...' : '📥 Baixar PDF'}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div id="aula-conteudo" style={{ backgroundColor: CREME, padding: '24px' }}>
          <ScriptExecucao data={result} />
        </div>
      )}

      {result && (
        <FeedbackCard
          content_type="aula_que_funciona"
          content_id={result.id}
          initialFeedback={result.structured_data?.feedback || null}
        />
      )}
    </div>
  );
};

// ============================================================
// SCRIPT EXECUÇÃO (roteador)
// ============================================================
const ScriptExecucao = ({ data }) => {
  const sd = data.structured_data || {};
  const cab = sd.cabecalho || {};
  const isDiferenciado = !!(sd.versao_principal && sd.versao_adaptada);

  if (isDiferenciado) {
    return <ScriptDiferenciado cab={cab} sd={sd} />;
  }
  return <ScriptUnico cab={cab} sd={sd} />;
};

// ============================================================
// VERSÃO ÚNICA
// ============================================================
const ScriptUnico = ({ cab, sd }) => {
  const inc = sd.inclusao || {};

  return (
    <div className="space-y-6">
      <CabecalhoAula cab={cab} />

      {sd.checklist?.length > 0 && (
        <div className="rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            ✅ Checklist antes de começar
          </h3>
          <ul className="space-y-1.5">
            {sd.checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                <span style={{ color: VERDE }} className="mt-0.5">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RoteiroLista roteiro={sd.roteiro} />

      {sd.adaptacoes?.length > 0 && (
        <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            ♿ Adaptações gerais
          </h3>
          <ul className="space-y-1.5">
            {sd.adaptacoes.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                <span style={{ color: VERDE }} className="mt-0.5">•</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {inc.tem_necessidades && <InclusaoBloco inc={inc} />}

      {sd.intervencao && (
        <div className="rounded-lg p-4 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA, borderLeft: `4px solid ${OURO}` }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}>
            ⚠️ Sugestão de intervenção
          </h3>
          <p className="text-sm" style={{ color: TEXTO }}>{sd.intervencao}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// VERSÃO DIFERENCIADA
// ============================================================
const ScriptDiferenciado = ({ cab, sd }) => {
  const [aba, setAba] = useState('principal');
  const vp = sd.versao_principal || {};
  const va = sd.versao_adaptada || {};
  const inc = sd.inclusao || {};

  return (
    <div className="space-y-6">
      <CabecalhoAula cab={cab} />

      <div className="flex gap-2 print:hidden">
        <button
          onClick={() => setAba('principal')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{
            backgroundColor: aba === 'principal' ? AZUL : '#E5E7EB',
            color: aba === 'principal' ? 'white' : TEXTO,
          }}
        >
          Versão Principal
        </button>
        <button
          onClick={() => setAba('adaptada')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{
            backgroundColor: aba === 'adaptada' ? AZUL : '#E5E7EB',
            color: aba === 'adaptada' ? 'white' : TEXTO,
          }}
        >
          Versão Adaptada
        </button>
      </div>

      {aba === 'principal' ? (
        <>
          {vp.checklist?.length > 0 && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
                ✅ Checklist antes de começar
              </h3>
              <ul className="space-y-1.5">
                {vp.checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                    <span style={{ color: VERDE }} className="mt-0.5">☐</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <RoteiroLista roteiro={vp.roteiro} />
          {vp.adaptacoes?.length > 0 && (
            <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
                ♿ Adaptações gerais
              </h3>
              <ul className="space-y-1.5">
                {vp.adaptacoes.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                    <span style={{ color: VERDE }} className="mt-0.5">•</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {vp.intervencao && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA, borderLeft: `4px solid ${OURO}` }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}>
                ⚠️ Sugestão de intervenção
              </h3>
              <p className="text-sm" style={{ color: TEXTO }}>{vp.intervencao}</p>
            </div>
          )}
        </>
      ) : (
        <>
          {va.checklist_adaptado?.length > 0 && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
                ✅ Checklist adaptado
              </h3>
              <ul className="space-y-1.5">
                {va.checklist_adaptado.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
                    <span style={{ color: VERDE }} className="mt-0.5">☐</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RoteiroLista roteiro={va.roteiro_adaptado} adaptada />

          {va.adaptacoes_especificas?.length > 0 && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
                🧩 Adaptações específicas
              </h4>
              <ul className="space-y-1">
                {va.adaptacoes_especificas.map((a, i) => (
                  <li key={i} className="text-sm" style={{ color: TEXTO }}>• {a}</li>
                ))}
              </ul>
            </div>
          )}

          {va.intervencao_adaptada && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA, borderLeft: `4px solid ${OURO}` }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}>
                ⚠️ Sugestão de intervenção adaptada
              </h3>
              <p className="text-sm" style={{ color: TEXTO }}>{va.intervencao_adaptada}</p>
            </div>
          )}
        </>
      )}

      {inc.tem_necessidades && <InclusaoBloco inc={inc} />}
    </div>
  );
};

// ============================================================
// COMPONENTES AUXILIARES (com paleta SIMIDNAPE)
// ============================================================
const CabecalhoAula = ({ cab }) => (
  <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
    <div className="border-b pb-6 mb-6" style={{ borderColor: BORDA }}>
      <h2 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Lora', serif" }}>
        {cab.titulo}
      </h2>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {cab.disciplina && <Info label="Disciplina" value={cab.disciplina} />}
        {cab.ano && <Info label="Ano" value={cab.ano} />}
        {cab.duracao && <Info label="Duração" value={cab.duracao} />}
        {cab.num_alunos && <Info label="Alunos" value={cab.num_alunos} />}
      </div>
      {cab.objetivo && (
        <div className="mt-4">
          <p className="text-sm font-semibold mb-1" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>🎯 Objetivo</p>
          <p style={{ color: TEXTO_2 }}>{cab.objetivo}</p>
        </div>
      )}
      {cab.bncc?.codigo && (
        <div className="mt-4 rounded-lg p-3 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
          <p className="text-xs font-mono font-bold" style={{ color: AZUL }}>{cab.bncc.codigo}</p>
          <p className="text-sm mt-1" style={{ color: TEXTO }}>{cab.bncc.texto}</p>
        </div>
      )}
    </div>
  </div>
);

const RoteiroLista = ({ roteiro, adaptada = false }) => {
  const corPrincipal = adaptada ? CORAL : AZUL;
  return (
    <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
        ⏱️ {adaptada ? 'Roteiro adaptado' : 'Roteiro minuto a minuto'}
      </h3>
      <div className="space-y-4">
        {roteiro?.map((etapa, i) => (
          <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: BORDA }}>
            <div
              className="text-white px-4 py-2 flex justify-between items-center flex-wrap gap-2"
              style={{ backgroundColor: corPrincipal }}
            >
              <span className="font-semibold" style={{ fontFamily: "'Lora', serif" }}>{etapa.titulo}</span>
              <div className="flex items-center gap-2 flex-wrap">
                {etapa.principio_relacionado && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-medium"
                    style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                    title="Princípio cognitivo ou pedagógico que fundamenta este bloco"
                  >
                    🧠 {etapa.principio_relacionado}
                  </span>
                )}
                <span
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  {etapa.tempo}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3" style={{ backgroundColor: BRANCO }}>
              {etapa.faca && (
                <Bloco cor={AZUL} titulo="👨‍🏫 Faça">
                  {etapa.faca}
                </Bloco>
              )}
              {etapa.fale && (
                <Bloco cor={VERDE} titulo="💬 Fale">
                  "{etapa.fale}"
                </Bloco>
              )}
              {etapa.pergunte && (
                <Bloco cor={OURO} titulo="❓ Pergunte">
                  {etapa.pergunte}
                </Bloco>
              )}
              {etapa.alunos && (
                <Bloco cor={AZUL} titulo="👥 Alunos">
                  {etapa.alunos}
                </Bloco>
              )}
              {etapa.apoio_visual && (
                <div className="p-3 rounded-r" style={{ backgroundColor: PESSEGO_CLARO, borderLeft: `4px solid ${CORAL}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: CORAL, fontFamily: "'Quicksand', sans-serif" }}>
                    🖼️ Apoio visual
                  </p>
                  <p className="text-sm" style={{ color: TEXTO }}>{etapa.apoio_visual}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InclusaoBloco = ({ inc }) => (
  <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
    <h3 className="text-lg font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
      🧩 Adaptações para necessidades específicas
    </h3>
    <p className="text-sm mb-4" style={{ color: TEXTO_2 }}>{inc.mensagem}</p>
    {inc.condicoes?.map((c, i) => (
      <div key={i} className="border rounded-lg overflow-hidden mb-4" style={{ borderColor: BORDA }}>
        <div className="px-4 py-2" style={{ backgroundColor: AZUL_CLARO }}>
          <h4 className="font-semibold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>{c.nome}</h4>
        </div>
        <ul className="p-4 space-y-1.5" style={{ backgroundColor: BRANCO }}>
          {c.estrategias.map((e, j) => (
            <li key={j} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
              <span style={{ color: VERDE }} className="mt-0.5">✓</span><span>{e}</span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide" style={{ color: TEXTO_2 }}>{label}</p>
    <p className="font-medium" style={{ color: TEXTO }}>{value}</p>
  </div>
);

const Bloco = ({ cor, titulo, children }) => (
  <div style={{ borderLeft: `4px solid ${cor}`, paddingLeft: '12px' }}>
    <p className="text-xs font-semibold mb-0.5" style={{ color: TEXTO_2 }}>{titulo}</p>
    <p className="text-sm" style={{ color: TEXTO }}>{children}</p>
  </div>
);

export default AulaQueFunciona;