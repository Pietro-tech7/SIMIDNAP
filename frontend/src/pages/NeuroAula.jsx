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

const NeuroAula = () => {
  const [form, setForm] = useState({
    title: '', subject: '', grade: '', content: '', objective: '',
    bncc_codigo: '', bncc_texto: '',
    duracao_minutos: 50, num_alunos: 25,
    dificuldades: '', conhecimentos_previos: '',
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
    if (!codigoComponente || !anoNumero) { setHabilidades([]); return; }
    setLoadingHabilidades(true);
    api.get(`/bncc/habilidades?etapa=EF&componente=${codigoComponente}&ano=${anoNumero}`)
      .then(res => setHabilidades(res.data || []))
      .catch(() => setHabilidades([]))
      .finally(() => setLoadingHabilidades(false));
  }, [codigoComponente, anoNumero]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelecionarHabilidade = (e) => {
    const codigo = e.target.value;
    const habilidade = habilidades.find(h => h.codigo === codigo);
    setForm({ ...form, bncc_codigo: codigo, bncc_texto: habilidade ? habilidade.texto : '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await api.post('/lesson-plans/generate', {
        plan_type: 'neuroaula', diferenciado, ...form,
      });
      setResult(response.data);
    } catch (err) {
      if (err.response?.status === 402) setError('Créditos insuficientes. Faça upgrade do seu plano.');
      else setError('Erro ao gerar o design da aula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      const el = document.getElementById('neuroaula-conteudo');
      if (!el) return;
      const sd = result?.structured_data || {};
      const cab = sd.cabecalho || {};
      const bncc = cab.bncc || {};

      const nome = (cab.titulo || 'neuroaula').replace(/\s+/g, '_');

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
          badge: 'NeuroAula · Design de Aprendizagem',
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
        <Link to="/modulo/neuroaula" className="text-sm hover:underline" style={{ color: AZUL }}>
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">🧠</span>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
              NeuroAula
            </h1>
            <p style={{ color: TEXTO_2 }}>
              Design de aprendizagem com base em neuroeducação. Você não recebe apenas um plano —
              você entende <strong>por que</strong> cada etapa funciona.
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-5 mb-8 border"
          style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}
        >
          <h2 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
            🎓 O que este módulo entrega
          </h2>
          <ul className="text-sm space-y-1" style={{ color: TEXTO_2 }}>
            <li>• Um design de aula estruturado em princípios cognitivos (atenção, memória, carga cognitiva, transferência).</li>
            <li>• Cada etapa explica <strong>por que funciona</strong> — para você crescer como professor.</li>
            <li>• Adaptações inclusivas automáticas para alunos com necessidades específicas.</li>
            <li>• Opção de gerar <strong>aula diferenciada</strong> (versão principal + versão adaptada).</li>
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
                placeholder="Ex: Introdução ao dobro e triplo"
                className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition"
                style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Disciplina</label>
                <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="Ex: Matemática"
                  className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Série/Ano</label>
                <input type="text" name="grade" value={form.grade} onChange={handleChange} placeholder="Ex: 2º ano"
                  className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Duração (min)</label>
                <input type="number" name="duracao_minutos" value={form.duracao_minutos} onChange={handleChange}
                  className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Conteúdo *</label>
              <input type="text" name="content" value={form.content} onChange={handleChange} required placeholder="Ex: Dobro e triplo"
                className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Objetivo (opcional)</label>
              <textarea name="objective" value={form.objective} onChange={handleChange} rows="2" placeholder="Ex: Compreender o conceito de dobro e triplo"
                className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
            </div>

            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>📖 Habilidade BNCC</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Código BNCC (digite se souber — ex: EF02MA08)</label>
                <div className="flex gap-2">
                  <input type="text" value={form.bncc_codigo}
                    onChange={(e) => setForm({ ...form, bncc_codigo: e.target.value.toUpperCase(), bncc_texto: '' })}
                    placeholder="EF02MA08"
                    className="flex-1 rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
                  <button type="button"
                    onClick={async () => {
                      if (!form.bncc_codigo) return;
                      try {
                        const res = await api.get(`/bncc/habilidades/${form.bncc_codigo}`);
                        if (res.data?.texto) setForm(f => ({ ...f, bncc_texto: res.data.texto }));
                        else setForm(f => ({ ...f, bncc_texto: 'Código não encontrado na BNCC.' }));
                      } catch { setForm(f => ({ ...f, bncc_texto: 'Código não encontrado na BNCC.' })); }
                    }}
                    className="text-sm font-medium px-4 py-2 rounded-lg border"
                    style={{ backgroundColor: BRANCO, color: TEXTO, borderColor: BORDA }}
                  >Buscar</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Componente</label>
                  <select value={codigoComponente} onChange={(e) => setCodigoComponente(e.target.value)}
                    className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}>
                    <option value="">Selecione...</option>
                    {componentes.map(c => <option key={c.codigo} value={c.codigo}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Ano (1 a 9)</label>
                  <input type="number" min="1" max="9" value={anoNumero} onChange={(e) => setAnoNumero(e.target.value)} placeholder="Ex: 2"
                    className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Habilidade</label>
                  <select value={form.bncc_codigo} onChange={handleSelecionarHabilidade} disabled={!habilidades.length}
                    className="w-full rounded-lg px-4 py-2 border disabled:bg-gray-100" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}>
                    <option value="">{loadingHabilidades ? 'Carregando...' : habilidades.length === 0 ? 'Nenhuma habilidade disponível' : 'Selecione...'}</option>
                    {habilidades.map(h => <option key={h.codigo} value={h.codigo}>{h.codigo} — {h.texto?.substring(0, 80)}...</option>)}
                  </select>
                </div>
              </div>

              {form.bncc_texto && (
                <p className="mt-3 text-xs rounded p-2 border" style={{ color: TEXTO_2, backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
                  <strong>{form.bncc_codigo}:</strong> {form.bncc_texto}
                </p>
              )}
            </div>

            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>👥 Perfil da Turma</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Nº de alunos</label>
                  <input type="number" name="num_alunos" value={form.num_alunos} onChange={handleChange}
                    className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>Conhecimentos prévios da turma</label>
                  <input type="text" name="conhecimentos_previos" value={form.conhecimentos_previos} onChange={handleChange} placeholder="Ex: Contagem até 100"
                    className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
                </div>
              </div>
              <div className="mt-4 rounded-lg p-4 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
                <label className="block text-sm font-semibold mb-1" style={{ color: AZUL }}>🧩 Alunos com necessidades específicas (opcional)</label>
                <p className="text-xs mb-2" style={{ color: TEXTO_2 }}>
                  Informe apenas necessidades <strong>pedagógicas</strong>. Exemplos: "2 alunos autistas", "1 aluno com TDAH". O sistema <strong>não realiza diagnósticos</strong> — apenas adapta a aula pedagogicamente.
                </p>
                <textarea name="dificuldades" value={form.dificuldades} onChange={handleChange} rows="2" placeholder="Ex: 2 alunos autistas, 1 aluno com TDAH"
                  className="w-full rounded-lg px-4 py-2 border" style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }} />
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <label className="flex items-start gap-3 rounded-lg p-4 cursor-pointer border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}>
                <input type="checkbox" checked={diferenciado} onChange={(e) => setDiferenciado(e.target.checked)} className="mt-0.5 w-5 h-5 rounded" style={{ accentColor: AZUL }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>📑 Aula diferenciada</div>
                  <div className="text-xs mt-1" style={{ color: TEXTO_2 }}>
                    Gera <strong>duas versões</strong>: uma principal e uma adaptada. <strong>Consome 2 créditos</strong> em vez de 1.
                  </div>
                </div>
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading}
              className="font-semibold px-6 py-2.5 rounded-lg transition text-white disabled:opacity-60"
              style={{ backgroundColor: AZUL }}>
              {loading ? 'Construindo design da aula...' : 'Gerar design de aprendizagem'}
            </button>
          </form>
        </div>

        {result && (
          <div className="print:hidden flex justify-end mb-4">
            <button onClick={baixarPdf} disabled={gerandoPdf}
              className="text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: AZUL }}>
              {gerandoPdf ? '⏳ Gerando PDF...' : '📥 Baixar PDF'}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div id="neuroaula-conteudo" style={{ backgroundColor: CREME, padding: '24px' }}>
          <DesignAprendizagem data={result} />
        </div>
      )}

      {result && (
        <FeedbackCard content_type="neuroaula" content_id={result.id} initialFeedback={result.structured_data?.feedback || null} />
      )}
    </div>
  );
};

// ============================================================
// DESIGN (visualização na tela + captura de PDF)
// ============================================================
const DesignAprendizagem = ({ data }) => {
  const sd = data.structured_data || {};
  const cab = sd.cabecalho || {};
  const isDiferenciado = !!(sd.versao_principal && sd.versao_adaptada);
  if (isDiferenciado) return <DesignDiferenciado cab={cab} sd={sd} />;

  const prof = sd.para_o_professor || {};
  const inc = sd.inclusao || {};

  return (
    <div className="space-y-6">
      <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
        <div className="border-b pb-6 mb-6" style={{ borderColor: BORDA }}>
          <h2 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Lora', serif" }}>{cab.titulo}</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {cab.disciplina && <Info label="Disciplina" value={cab.disciplina} />}
            {cab.ano && <Info label="Ano" value={cab.ano} />}
            {cab.duracao && <Info label="Duração" value={cab.duracao} />}
            {cab.num_alunos && <Info label="Alunos" value={cab.num_alunos} />}
          </div>
          {cab.objetivo && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-1" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>🎯 Objetivo de aprendizagem</p>
              <p style={{ color: TEXTO_2 }}>{cab.objetivo}</p>
            </div>
          )}
          {cab.bncc?.codigo && (
            <div className="mt-4 rounded-lg p-3 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
              <p className="text-xs font-mono font-bold" style={{ color: AZUL }}>{cab.bncc.codigo}</p>
              <p className="text-sm mt-1" style={{ color: TEXTO_2 }}>{cab.bncc.texto}</p>
            </div>
          )}
        </div>

        {sd.principios_cognitivos?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: VERDE, fontFamily: "'Quicksand', sans-serif" }}>🧠 Princípios cognitivos aplicados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sd.principios_cognitivos.map((p, i) => (
                <div key={i} className="rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA, borderLeft: `4px solid ${VERDE}` }}>
                  <h4 className="font-semibold mb-1" style={{ color: VERDE, fontFamily: "'Quicksand', sans-serif" }}>{p.nome}</h4>
                  <p className="text-sm mb-2" style={{ color: TEXTO }}>{p.explicacao}</p>
                  <p className="text-xs italic" style={{ color: TEXTO_2 }}><strong>Nesta aula:</strong> {p.aplicacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>📋 Sequência da aula — com fundamentação</h3>
        <EtapasLista etapas={sd.etapas} />
      </div>

      {inc.tem_necessidades && <InclusaoBloco inc={inc} />}
      {(prof.por_que_esta_aula_funciona || prof.o_que_voce_vai_desenvolver) && <CrescimentoProfissional prof={prof} />}
    </div>
  );
};

const DesignDiferenciado = ({ cab, sd }) => {
  const [aba, setAba] = useState('principal');
  const vp = sd.versao_principal || {};
  const va = sd.versao_adaptada || {};
  const inc = sd.inclusao || {};
  const prof = vp.para_o_professor || {};

  return (
    <div className="space-y-6">
      <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
        <div className="border-b pb-6 mb-6" style={{ borderColor: BORDA }}>
          <h2 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Lora', serif" }}>{cab.titulo}</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {cab.disciplina && <Info label="Disciplina" value={cab.disciplina} />}
            {cab.ano && <Info label="Ano" value={cab.ano} />}
            {cab.duracao && <Info label="Duração" value={cab.duracao} />}
            {cab.num_alunos && <Info label="Alunos" value={cab.num_alunos} />}
          </div>
          {cab.objetivo && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-1" style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}>🎯 Objetivo de aprendizagem</p>
              <p style={{ color: TEXTO_2 }}>{cab.objetivo}</p>
            </div>
          )}
          {cab.bncc?.codigo && (
            <div className="mt-4 rounded-lg p-3 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
              <p className="text-xs font-mono font-bold" style={{ color: AZUL }}>{cab.bncc.codigo}</p>
              <p className="text-sm mt-1" style={{ color: TEXTO_2 }}>{cab.bncc.texto}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6 print:hidden">
          <button onClick={() => setAba('principal')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ backgroundColor: aba === 'principal' ? AZUL : '#E5E7EB', color: aba === 'principal' ? 'white' : TEXTO }}>
            Versão Principal
          </button>
          <button onClick={() => setAba('adaptada')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ backgroundColor: aba === 'adaptada' ? AZUL : '#E5E7EB', color: aba === 'adaptada' ? 'white' : TEXTO }}>
            Versão Adaptada
          </button>
        </div>

        {aba === 'principal' ? (
          <>
            {vp.principios_cognitivos?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: VERDE, fontFamily: "'Quicksand', sans-serif" }}>🧠 Princípios cognitivos aplicados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vp.principios_cognitivos.map((p, i) => (
                    <div key={i} className="rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA, borderLeft: `4px solid ${VERDE}` }}>
                      <h4 className="font-semibold mb-1" style={{ color: VERDE }}>{p.nome}</h4>
                      <p className="text-sm mb-2" style={{ color: TEXTO }}>{p.explicacao}</p>
                      <p className="text-xs italic" style={{ color: TEXTO_2 }}><strong>Nesta aula:</strong> {p.aplicacao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h3 className="text-lg font-semibold mb-4" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>📋 Sequência da aula</h3>
            <EtapasLista etapas={vp.etapas} />
          </>
        ) : (
          <>
            {va.instrucoes_para_o_professor && (
              <div className="mb-4 rounded-lg p-4 border" style={{ backgroundColor: PESSEGO_CLARO, borderColor: BORDA, borderLeft: `4px solid ${CORAL}` }}>
                <p className="text-sm font-semibold mb-1" style={{ color: CORAL, fontFamily: "'Quicksand', sans-serif" }}>📌 Como conduzir esta versão</p>
                <p className="text-sm" style={{ color: TEXTO }}>{va.instrucoes_para_o_professor}</p>
              </div>
            )}
            <h3 className="text-lg font-semibold mb-4" style={{ color: CORAL, fontFamily: "'Quicksand', sans-serif" }}>📋 Sequência adaptada</h3>
            <EtapasLista etapas={va.etapas_adaptadas} adaptada />
            {va.adaptacoes_especificas?.length > 0 && (
              <div className="mt-6 rounded-lg p-4 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>🧩 Adaptações específicas</h4>
                <ul className="space-y-1">
                  {va.adaptacoes_especificas.map((a, i) => <li key={i} className="text-sm" style={{ color: TEXTO_2 }}>• {a}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {inc.tem_necessidades && <InclusaoBloco inc={inc} />}
      {prof.por_que_esta_aula_funciona && <CrescimentoProfissional prof={prof} />}
    </div>
  );
};

const EtapasLista = ({ etapas, adaptada = false }) => {
  const corPrincipal = adaptada ? CORAL : AZUL;
  return (
    <div className="space-y-4">
      {etapas?.map((etapa) => (
        <div key={etapa.numero} className="border rounded-lg overflow-hidden" style={{ borderColor: BORDA }}>
          <div className="text-white px-4 py-2 flex justify-between items-center" style={{ backgroundColor: corPrincipal }}>
            <span className="font-semibold" style={{ fontFamily: "'Lora', serif" }}>Etapa {etapa.numero} — {etapa.titulo}</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{etapa.tempo}</span>
          </div>
          <div className="p-4 space-y-3" style={{ backgroundColor: BRANCO }}>
            {etapa.professor_faca && <Bloco cor={AZUL} titulo="👨‍🏫 Professor faça">{etapa.professor_faca}</Bloco>}
            {etapa.diga && <Bloco cor={VERDE} titulo="💬 Diga">"{etapa.diga}"</Bloco>}
            {etapa.pergunte && <Bloco cor={OURO} titulo="❓ Pergunte">{etapa.pergunte}</Bloco>}
            {etapa.alunos_deverao && <Bloco cor={AZUL} titulo="👥 Alunos deverão">{etapa.alunos_deverao}</Bloco>}
            {etapa.apoio_visual && (
              <div className="p-3 rounded-r" style={{ backgroundColor: PESSEGO_CLARO, borderLeft: `4px solid ${CORAL}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: CORAL, fontFamily: "'Quicksand', sans-serif" }}>🖼️ Apoio visual</p>
                <p className="text-sm" style={{ color: TEXTO }}>{etapa.apoio_visual}</p>
              </div>
            )}
            {etapa.porque_funciona && (
              <div className="mt-3 p-3 rounded-r" style={{ backgroundColor: VERDE_CLARO, borderLeft: `4px solid ${VERDE}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: VERDE, fontFamily: "'Quicksand', sans-serif" }}>🧠 Por que esta etapa funciona</p>
                <p className="text-sm" style={{ color: TEXTO }}>{etapa.porque_funciona}</p>
                {etapa.principio_relacionado && (
                  <p className="text-xs mt-1 italic" style={{ color: TEXTO_2 }}>Princípio: {etapa.principio_relacionado}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const CrescimentoProfissional = ({ prof }) => (
  <div className="rounded-xl p-6 md:p-8 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}>
    <h3 className="text-xl font-bold mb-4" style={{ color: OURO, fontFamily: "'Lora', serif" }}>🎓 Para o seu crescimento profissional</h3>
    {prof.por_que_esta_aula_funciona && (
      <div className="mb-6">
        <h4 className="font-semibold mb-2" style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}>Por que esta aula funciona</h4>
        <p className="text-sm leading-relaxed" style={{ color: TEXTO }}>{prof.por_que_esta_aula_funciona}</p>
      </div>
    )}
    {prof.o_que_voce_vai_desenvolver?.length > 0 && (
      <div className="mb-6">
        <h4 className="font-semibold mb-2" style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}>O que você vai desenvolver</h4>
        <ul className="space-y-1.5">
          {prof.o_que_voce_vai_desenvolver.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
              <span style={{ color: OURO }} className="mt-0.5">✓</span><span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
    {prof.reflexao_apos_a_aula?.length > 0 && (
      <div className="mb-6">
        <h4 className="font-semibold mb-2" style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}>Reflexão após a aula</h4>
        <ul className="space-y-1.5">
          {prof.reflexao_apos_a_aula.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
              <span style={{ color: OURO }} className="mt-0.5">?</span><span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
    {prof.se_alunos_dificuldade && (
      <div className="rounded-lg p-4 border" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
        <h4 className="text-sm font-semibold mb-1" style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}>⚠️ Se os alunos tiverem dificuldade</h4>
        <p className="text-sm whitespace-pre-line" style={{ color: TEXTO }}>{prof.se_alunos_dificuldade}</p>
      </div>
    )}
  </div>
);

const InclusaoBloco = ({ inc }) => (
  <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
    <h3 className="text-lg font-semibold mb-2" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>🧩 Adaptações para necessidades específicas</h3>
    <p className="text-sm mb-4" style={{ color: TEXTO_2 }}>{inc.mensagem}</p>
    {inc.condicoes?.map((c, i) => (
      <div key={i} className="border rounded-lg overflow-hidden mb-4" style={{ borderColor: BORDA, backgroundColor: BRANCO }}>
        <div className="px-4 py-2" style={{ backgroundColor: AZUL }}>
          <h4 className="font-semibold text-white" style={{ fontFamily: "'Quicksand', sans-serif" }}>{c.nome}</h4>
        </div>
        <ul className="p-4 space-y-1.5">
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

export default NeuroAula;