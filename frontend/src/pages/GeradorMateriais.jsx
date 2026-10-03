import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import LatexText from '../components/LatexText';
import FeedbackCard from '../components/FeedbackCard';

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

const GeradorMateriais = () => {
  const [tipo, setTipo] = useState('atividade_imprimivel');
  const [diferenciado, setDiferenciado] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    grade: '',
    content: '',
    objective: '',
    bncc_codigo: '',
    bncc_texto: '',
    num_questoes: 5,
    duracao_minutos: 30,
    num_alunos: 25,
    dificuldades: '',
  });

  const [componentes, setComponentes] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [codigoComponente, setCodigoComponente] = useState('');
  const [anoNumero, setAnoNumero] = useState('');
  const [loadingHabilidades, setLoadingHabilidades] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [materialBaixado, setMaterialBaixado] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Aviso antes de fechar a aba
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (result && !materialBaixado) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [result, materialBaixado]);

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

  const handleTrocarTipo = (novoTipo) => {
    if (result && !materialBaixado) {
      if (!window.confirm('Você gerou um material e ainda não baixou. Deseja realmente trocar o tipo? O material atual será descartado.')) {
        return;
      }
    }
    setTipo(novoTipo);
    setResult(null);
    setMaterialBaixado(false);
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
    if (result && !materialBaixado) {
      if (!window.confirm('Você já gerou um material. Deseja gerar um novo? O anterior será substituído.')) {
        return;
      }
    }
    setLoading(true);
    setError('');
    setResult(null);
    setMaterialBaixado(false);

    try {
      const response = await api.post('/materials/generate', {
        material_type: tipo,
        diferenciado,
        ...form,
      });
      setResult(response.data);
    } catch (err) {
      setError('Erro ao gerar o material. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarPDF = async () => {
    setGerandoPdf(true);
    try {
      const elemento = document.getElementById('material-conteudo');
      if (!elemento) {
        alert('Conteúdo não encontrado.');
        return;
      }
      const nome = result?.title ? result.title.replace(/\s+/g, '_') : 'material';
      const sd = result?.structured_data || {};
      const cab = sd.cabecalho || {};
      const bncc = cab.bncc || {};

      const badgesPorTipo = {
        atividade_imprimivel: 'Atividade Imprimível',
        jogo_dinamica: 'Jogo / Dinâmica',
        simulado: 'Simulado',
      };

      const dadosCapa = [
        { label: 'Disciplina', valor: cab.disciplina || result.subject },
        { label: 'Ano', valor: cab.ano || result.grade },
      ];
      if (cab.num_questoes) dadosCapa.push({ label: 'Questões', valor: cab.num_questoes });
      if (cab.duracao) dadosCapa.push({ label: 'Duração', valor: cab.duracao });
      if (bncc.codigo) dadosCapa.push({ label: 'Habilidade BNCC', valor: bncc.codigo });

      await gerarPDF(elemento, nome, {
        capa: {
          badge: badgesPorTipo[result?.material_type] || 'Material Pedagógico',
          titulo: cab.titulo || result?.title,
          dados: dadosCapa,
        },
      });
      setMaterialBaixado(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const tipos = [
    { id: 'atividade_imprimivel', nome: '📝 Atividade', desc: 'Lista de exercícios para imprimir' },
    { id: 'jogo_dinamica', nome: '🎲 Jogo / Dinâmica', desc: 'Brincadeira pedagógica' },
    { id: 'simulado', nome: '📊 Simulado', desc: 'Avaliação com gabarito' },
  ];

  const inputStyle = { borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO };
  const labelStyle = { color: TEXTO };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="print:hidden">
        <Link to="/modulo/ia_para_professor" className="text-sm hover:underline" style={{ color: AZUL }}>
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">📄</span>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}>
              Gerador de Materiais
            </h1>
            <p style={{ color: TEXTO_2 }}>
              Crie atividades, jogos e simulados prontos para usar em sala.
            </p>
          </div>
        </div>

        {/* Seletor de tipo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {tipos.map(t => (
            <button
              key={t.id}
              onClick={() => handleTrocarTipo(t.id)}
              className="p-4 rounded-xl border-2 text-left transition"
              style={{
                backgroundColor: tipo === t.id ? OURO_CLARO : BRANCO,
                borderColor: tipo === t.id ? OURO : BORDA,
              }}
            >
              <div className="font-semibold font-heading" style={{ color: TEXTO }}>{t.nome}</div>
              <div className="text-xs mt-1" style={{ color: TEXTO_2 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="rounded-xl shadow-sm border p-6 mb-8" style={{ backgroundColor: CREME, borderColor: BORDA }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Título *</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="Ex: Simulado de Frações"
                className="w-full rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Disciplina</label>
                <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="Ex: Matemática"
                  className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Série/Ano</label>
                <input type="text" name="grade" value={form.grade} onChange={handleChange} placeholder="Ex: 5º ano"
                  className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Conteúdo *</label>
                <input type="text" name="content" value={form.content} onChange={handleChange} required placeholder="Ex: Frações"
                  className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Objetivo (opcional)</label>
              <textarea name="objective" value={form.objective} onChange={handleChange} rows="2"
                placeholder="Ex: Avaliar compreensão de frações"
                className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
            </div>

            {tipo === 'simulado' && (
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Nº de questões</label>
                <input type="number" name="num_questoes" value={form.num_questoes} onChange={handleChange} min="3" max="20"
                  className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
              </div>
            )}

            {tipo === 'jogo_dinamica' && (
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Duração (min)</label>
                <input type="number" name="duracao_minutos" value={form.duracao_minutos} onChange={handleChange}
                  className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
              </div>
            )}

            {/* BNCC */}
            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <h3 className="text-sm font-semibold mb-3 font-heading" style={labelStyle}>📖 Habilidade BNCC</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Código BNCC (digite se souber)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.bncc_codigo}
                    onChange={(e) => setForm({ ...form, bncc_codigo: e.target.value.toUpperCase(), bncc_texto: '' })}
                    placeholder="EF05MA03"
                    className="flex-1 rounded-lg px-4 py-2 border" style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!form.bncc_codigo) return;
                      try {
                        const res = await api.get(`/bncc/habilidades/${form.bncc_codigo}`);
                        if (res.data?.texto) setForm(f => ({ ...f, bncc_texto: res.data.texto }));
                        else setForm(f => ({ ...f, bncc_texto: 'Código não encontrado.' }));
                      } catch {
                        setForm(f => ({ ...f, bncc_texto: 'Código não encontrado.' }));
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
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>Componente</label>
                  <select value={codigoComponente} onChange={(e) => setCodigoComponente(e.target.value)}
                    className="w-full rounded-lg px-4 py-2 border" style={inputStyle}>
                    <option value="">Selecione...</option>
                    {componentes.map(c => <option key={c.codigo} value={c.codigo}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>Ano (1 a 9)</label>
                  <input type="number" min="1" max="9" value={anoNumero} onChange={(e) => setAnoNumero(e.target.value)}
                    className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>Habilidade</label>
                  <select value={form.bncc_codigo} onChange={handleSelecionarHabilidade} disabled={!habilidades.length}
                    className="w-full rounded-lg px-4 py-2 border disabled:bg-gray-100" style={inputStyle}>
                    <option value="">
                      {loadingHabilidades ? 'Carregando...' : habilidades.length === 0 ? 'Selecione componente e ano' : 'Selecione...'}
                    </option>
                    {habilidades.map(h => (
                      <option key={h.codigo} value={h.codigo}>{h.codigo} — {h.texto?.substring(0, 60)}...</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.bncc_texto && (
                <p className="mt-3 text-xs rounded p-2 border" style={{ color: TEXTO_2, backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
                  <strong>{form.bncc_codigo}:</strong> {form.bncc_texto}
                </p>
              )}
            </div>

            {/* Necessidades específicas */}
            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <div className="rounded-lg p-4 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
                <label className="block text-sm font-semibold mb-1" style={{ color: AZUL }}>
                  🧩 Alunos com necessidades específicas (opcional)
                </label>
                <p className="text-xs mb-2" style={{ color: TEXTO_2 }}>
                  Informe apenas necessidades <strong>pedagógicas</strong>. Ex: "2 alunos autistas", "1 aluno com TDAH".
                  O sistema <strong>não realiza diagnósticos</strong>.
                </p>
                <textarea name="dificuldades" value={form.dificuldades} onChange={handleChange} rows="2"
                  placeholder="Ex: 2 alunos autistas, 1 com dislexia"
                  className="w-full rounded-lg px-4 py-2 border" style={inputStyle} />
              </div>
            </div>

            {/* Diferenciado */}
            <div className="border-t pt-4" style={{ borderColor: BORDA }}>
              <label className="flex items-start gap-3 rounded-lg p-4 cursor-pointer border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}>
                <input type="checkbox" checked={diferenciado} onChange={(e) => setDiferenciado(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded" style={{ accentColor: OURO }} />
                <div>
                  <div className="text-sm font-semibold font-heading" style={{ color: OURO }}>📑 Material diferenciado</div>
                  <div className="text-xs mt-1" style={{ color: TEXTO_2 }}>
                    Gera <strong>duas versões</strong>: uma principal (para a turma) e uma adaptada
                    (simplificada, com apoio visual, para alunos com necessidades específicas).
                  </div>
                </div>
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="font-semibold px-6 py-2.5 rounded-lg transition text-white disabled:opacity-60"
              style={{ backgroundColor: OURO }}
            >
              {loading ? 'Gerando material (pode levar 1-2 minutos)...' : 'Gerar material'}
            </button>
          </form>
        </div>

        {result && (
          <div className="print:hidden flex justify-end mb-4">
            <button
              onClick={handleBaixarPDF}
              disabled={gerandoPdf}
              className="font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 text-white disabled:opacity-60"
              style={{ backgroundColor: AZUL }}
            >
              {gerandoPdf ? '⏳ Gerando PDF...' : '📥 Baixar PDF'}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div id="material-conteudo" className="print:max-w-full" style={{ backgroundColor: CREME, padding: '24px' }}>
          <MaterialResultado data={result} />
        </div>
      )}

      {result && (
        <FeedbackCard
          content_type="material"
          content_id={result.id}
          initialFeedback={result.structured_data?.feedback || null}
        />
      )}
    </div>
  );
};

// ============================================================
// ROTEADOR POR TIPO
// ============================================================
const MaterialResultado = ({ data }) => {
  const sd = data.structured_data || {};
  const cab = sd.cabecalho || {};
  const isDiferenciado = data.diferenciado && sd.versao_principal && sd.versao_adaptada;

  if (data.material_type === 'simulado') {
    return isDiferenciado
      ? <SimuladoDiferenciado cab={cab} sd={sd} data={data} />
      : <SimuladoView cab={cab} sd={sd} data={data} />;
  }
  if (data.material_type === 'jogo_dinamica') {
    return isDiferenciado
      ? <JogoDiferenciado cab={cab} sd={sd} />
      : <JogoView cab={cab} sd={sd} />;
  }
  if (data.material_type === 'atividade_imprimivel') {
    return isDiferenciado
      ? <AtividadeDiferenciada cab={cab} sd={sd} />
      : <AtividadeView cab={cab} sd={sd} />;
  }
  return <pre>{JSON.stringify(sd, null, 2)}</pre>;
};

// ============================================================
// COMPONENTES AUXILIARES DE COR
// ============================================================
const CardBase = ({ children }) => (
  <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{ backgroundColor: BRANCO, borderColor: BORDA }}>
    {children}
  </div>
);

const CabecalhoMaterial = ({ titulo, meta = [], badgeDiferenciado = false, extra }) => (
  <div className="border-b pb-4 mb-6" style={{ borderColor: BORDA }}>
    <h2 className="text-3xl font-bold" style={{ color: AZUL, fontFamily: "'Lora', serif" }}>{titulo}</h2>
    <div className="mt-2 flex flex-wrap gap-4 text-sm" style={{ color: TEXTO_2 }}>
      {meta.filter(Boolean).map((m, i) => <span key={i}>{m}</span>)}
    </div>
    {badgeDiferenciado && (
      <div className="mt-3 inline-block text-xs font-semibold px-3 py-1 rounded-full print:hidden" style={{ backgroundColor: OURO_CLARO, color: OURO }}>
        📑 Material Diferenciado (2 versões)
      </div>
    )}
    {extra}
  </div>
);

const AbaTabs = ({ aba, setAba, labelA, labelB }) => (
  <div className="flex gap-2 mb-6 print:hidden">
    <button onClick={() => setAba('principal')}
      className="px-4 py-2 rounded-lg text-sm font-medium transition"
      style={{ backgroundColor: aba === 'principal' ? AZUL : '#E5E7EB', color: aba === 'principal' ? 'white' : TEXTO }}>
      {labelA}
    </button>
    <button onClick={() => setAba('adaptada')}
      className="px-4 py-2 rounded-lg text-sm font-medium transition"
      style={{ backgroundColor: aba === 'adaptada' ? AZUL : '#E5E7EB', color: aba === 'adaptada' ? 'white' : TEXTO }}>
      {labelB}
    </button>
  </div>
);

// ============================================================
// SIMULADO — DIFERENCIADO
// ============================================================
const SimuladoDiferenciado = ({ cab, sd, data }) => {
  const [aba, setAba] = useState('principal');
  const versao = aba === 'principal' ? sd.versao_principal : sd.versao_adaptada;

  return (
    <CardBase>
      <CabecalhoMaterial
        titulo={cab.titulo || data.title}
        meta={[
          cab.disciplina && `📚 ${cab.disciplina}`,
          cab.ano && `🎓 ${cab.ano}`,
        ]}
        badgeDiferenciado
      />

      <AbaTabs
        aba={aba} setAba={setAba}
        labelA={`Versão Principal (${sd.versao_principal.num_questoes} questões)`}
        labelB={`Versão Adaptada (${sd.versao_adaptada.num_questoes} questões)`}
      />

      <div className="hidden print:block mb-4">
        <p className="text-lg font-bold" style={{ color: AZUL }}>
          {aba === 'principal' ? 'VERSÃO PRINCIPAL' : 'VERSÃO ADAPTADA'}
        </p>
      </div>

      {versao.instrucoes && (
        <p className="mb-4 text-sm italic p-3 rounded" style={{ color: TEXTO, backgroundColor: CREME }}>
          {versao.instrucoes}
        </p>
      )}

      <div className="space-y-6">
        {versao.questoes?.map((q) => (
          <div key={q.numero} className="pl-4 py-2" style={{ borderLeft: `4px solid ${PESSEGO}` }}>
            <div className="flex justify-between mb-1">
              <span className="font-semibold" style={{ color: TEXTO }}>Questão {q.numero}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: CREME, color: TEXTO_2 }}>{q.tipo}</span>
            </div>
            <div className="mb-3" style={{ color: TEXTO }}>
              <LatexText text={q.enunciado} />
            </div>
            {q.apoio_visual && (
              <p className="text-xs p-2 rounded mb-2" style={{ backgroundColor: AZUL_CLARO, color: AZUL }}>
                🖼️ <strong>Apoio visual:</strong> {q.apoio_visual}
              </p>
            )}
            {q.alternativas?.length > 0 && (
              <ul className="space-y-1 ml-4">
                {q.alternativas.map((alt, i) => (
                  <li key={i} className="text-sm" style={{ color: TEXTO }}>
                    <LatexText text={alt} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {versao.gabarito?.length > 0 && (
        <details className="mt-8 rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
          <summary className="cursor-pointer font-semibold text-sm" style={{ color: VERDE }}>✅ Gabarito</summary>
          <ul className="mt-3 space-y-1 text-sm" style={{ color: TEXTO }}>
            {versao.gabarito.map((g, i) => <li key={i}><LatexText text={g} /></li>)}
          </ul>
        </details>
      )}

      {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
    </CardBase>
  );
};

// ============================================================
// JOGO — DIFERENCIADO
// ============================================================
const JogoDiferenciado = ({ cab, sd }) => {
  const [aba, setAba] = useState('principal');
  const vp = sd.versao_principal || {};
  const va = sd.versao_adaptada || {};

  return (
    <CardBase>
      <CabecalhoMaterial
        titulo={cab.titulo}
        meta={[
          cab.disciplina && `📚 ${cab.disciplina}`,
          cab.ano && `🎓 ${cab.ano}`,
          cab.duracao && `⏱️ ${cab.duracao}`,
        ]}
        badgeDiferenciado
      />

      <AbaTabs aba={aba} setAba={setAba} labelA="Versão Principal" labelB="Versão Adaptada" />

      {sd.materiais?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>🧰 Materiais</h3>
          <ul className="space-y-1">
            {sd.materiais.map((m, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• {m}</li>)}
          </ul>
        </div>
      )}

      {aba === 'principal' ? (
        <>
          {vp.como_jogar?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>🎯 Como jogar</h3>
              <ol className="space-y-2">
                {vp.como_jogar.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm" style={{ color: TEXTO }}>
                    <span className="font-bold" style={{ color: PESSEGO }}>{p.passo || i + 1}.</span>
                    <span><LatexText text={p.descricao || p} /></span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {vp.regras?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>📋 Regras</h3>
              <ul className="space-y-1">
                {vp.regras.map((r, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• <LatexText text={r} /></li>)}
              </ul>
            </div>
          )}
          {vp.variacoes?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>🔄 Variações</h3>
              <ul className="space-y-1">
                {vp.variacoes.map((v, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• <LatexText text={v} /></li>)}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {va.adaptacoes?.length > 0 && (
            <div className="mb-6 rounded-lg p-4 border" style={{ backgroundColor: AZUL_CLARO, borderColor: BORDA }}>
              <h3 className="font-semibold text-sm mb-1 font-heading" style={{ color: AZUL }}>🧩 Adaptações</h3>
              <ul className="space-y-1">
                {va.adaptacoes.map((a, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• <LatexText text={a} /></li>)}
              </ul>
            </div>
          )}
          {va.como_jogar_adaptado?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>🎯 Como jogar (adaptado)</h3>
              <ol className="space-y-2">
                {va.como_jogar_adaptado.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm" style={{ color: TEXTO }}>
                    <span className="font-bold" style={{ color: PESSEGO }}>{p.passo || i + 1}.</span>
                    <span><LatexText text={p.descricao || p} /></span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {va.regras_adaptadas?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>📋 Regras adaptadas</h3>
              <ul className="space-y-1">
                {va.regras_adaptadas.map((r, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• <LatexText text={r} /></li>)}
              </ul>
            </div>
          )}
          {va.papel_do_colega_apoio && (
            <div className="mb-6 rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
              <h3 className="font-semibold text-sm mb-1 font-heading" style={{ color: VERDE }}>🤝 Papel do colega de apoio</h3>
              <p className="text-sm" style={{ color: TEXTO }}><LatexText text={va.papel_do_colega_apoio} /></p>
            </div>
          )}
        </>
      )}

      {sd.dicas_professor?.length > 0 && (
        <div className="rounded-lg p-4 mb-6 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}>
          <h3 className="font-semibold text-sm mb-1 font-heading" style={{ color: OURO }}>💡 Dicas para o professor</h3>
          <ul className="space-y-1">
            {sd.dicas_professor.map((d, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• <LatexText text={d} /></li>)}
          </ul>
        </div>
      )}

      {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
    </CardBase>
  );
};

// ============================================================
// ATIVIDADE — DIFERENCIADA
// ============================================================
const AtividadeDiferenciada = ({ cab, sd }) => {
  const [aba, setAba] = useState('principal');
  const vp = sd.versao_principal || {};
  const va = sd.versao_adaptada || {};
  const versao = aba === 'principal' ? vp : va;

  return (
    <CardBase>
      <CabecalhoMaterial
        titulo={cab.titulo}
        meta={[
          cab.disciplina && `📚 ${cab.disciplina}`,
          cab.ano && `🎓 ${cab.ano}`,
        ]}
        badgeDiferenciado
      />

      <AbaTabs aba={aba} setAba={setAba} labelA="Versão Principal" labelB="Versão Adaptada" />

      {versao.instrucoes_gerais && (
        <p className="mb-4 text-sm italic p-3 rounded" style={{ color: TEXTO, backgroundColor: CREME }}>
          {versao.instrucoes_gerais}
        </p>
      )}

      <div className="space-y-6">
        {versao.atividades?.map((a) => (
          <div key={a.numero} className="pl-4" style={{ borderLeft: `4px solid ${PESSEGO}` }}>
            <div className="flex justify-between mb-1">
              <span className="font-semibold" style={{ color: TEXTO }}>Questão {a.numero}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: CREME, color: TEXTO_2 }}>{a.tipo}</span>
            </div>
            <div className="mb-2" style={{ color: TEXTO }}>
              <LatexText text={a.enunciado} />
            </div>
            {a.apoio_visual && (
              <p className="text-xs p-2 rounded mb-2" style={{ backgroundColor: AZUL_CLARO, color: AZUL }}>
                🖼️ <strong>Apoio visual:</strong> {a.apoio_visual}
              </p>
            )}
            {a.alternativas?.length > 0 && (
              <ul className="space-y-1 ml-4">
                {a.alternativas.map((alt, i) => (
                  <li key={i} className="text-sm" style={{ color: TEXTO }}><LatexText text={alt} /></li>
                ))}
              </ul>
            )}
            {a.espaco_resposta && (
              <p className="text-xs mt-2 italic" style={{ color: TEXTO_2 }}>Espaço para resposta: {a.espaco_resposta}</p>
            )}
          </div>
        ))}
      </div>

      {versao.gabarito_professor?.length > 0 && (
        <details className="mt-8 rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
          <summary className="cursor-pointer font-semibold text-sm" style={{ color: VERDE }}>✅ Gabarito do professor</summary>
          <ul className="mt-3 space-y-1 text-sm" style={{ color: TEXTO }}>
            {versao.gabarito_professor.map((g, i) => <li key={i}><LatexText text={g} /></li>)}
          </ul>
        </details>
      )}

      {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
    </CardBase>
  );
};

// ============================================================
// SIMULADO (versão única)
// ============================================================
const SimuladoView = ({ cab, sd, data }) => (
  <CardBase>
    <CabecalhoMaterial
      titulo={cab.titulo || data.title}
      meta={[
        cab.disciplina && `📚 ${cab.disciplina}`,
        cab.ano && `🎓 ${cab.ano}`,
        cab.num_questoes && `📝 ${cab.num_questoes} questões`,
      ]}
      extra={cab.instrucoes && (
        <p className="mt-3 text-sm italic p-3 rounded" style={{ color: TEXTO, backgroundColor: CREME }}>
          {cab.instrucoes}
        </p>
      )}
    />

    <div className="space-y-6">
      {sd.questoes?.map((q) => (
        <div key={q.numero} className="pl-4 py-2" style={{ borderLeft: `4px solid ${PESSEGO}` }}>
          <div className="flex justify-between mb-1">
            <span className="font-semibold" style={{ color: TEXTO }}>Questão {q.numero}</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: CREME, color: TEXTO_2 }}>{q.tipo}</span>
          </div>
          <div className="mb-3" style={{ color: TEXTO }}>
            <LatexText text={q.enunciado} />
          </div>
          {q.alternativas?.length > 0 && (
            <ul className="space-y-1 ml-4">
              {q.alternativas.map((alt, i) => (
                <li key={i} className="text-sm" style={{ color: TEXTO }}><LatexText text={alt} /></li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>

    {sd.gabarito?.length > 0 && (
      <details className="mt-8 rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
        <summary className="cursor-pointer font-semibold text-sm" style={{ color: VERDE }}>✅ Gabarito</summary>
        <ul className="mt-3 space-y-1 text-sm" style={{ color: TEXTO }}>
          {sd.gabarito.map((g, i) => <li key={i}><LatexText text={g} /></li>)}
        </ul>
      </details>
    )}

    {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
  </CardBase>
);

// ============================================================
// JOGO (versão única)
// ============================================================
const JogoView = ({ cab, sd }) => (
  <CardBase>
    <CabecalhoMaterial
      titulo={cab.titulo}
      meta={[
        cab.disciplina && `📚 ${cab.disciplina}`,
        cab.ano && `🎓 ${cab.ano}`,
        cab.duracao && `⏱️ ${cab.duracao}`,
        cab.num_participantes && `👥 ${cab.num_participantes}`,
      ]}
      extra={cab.objetivo && (
        <p className="mt-3" style={{ color: TEXTO }}><strong>Objetivo:</strong> {cab.objetivo}</p>
      )}
    />

    {sd.materiais?.length > 0 && (
      <div className="mb-6">
        <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>🧰 Materiais</h3>
        <ul className="space-y-1">
          {sd.materiais.map((m, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• {m}</li>)}
        </ul>
      </div>
    )}

    {sd.como_jogar?.length > 0 && (
      <div className="mb-6">
        <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>🎯 Como jogar</h3>
        <ol className="space-y-2">
          {sd.como_jogar.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm" style={{ color: TEXTO }}>
              <span className="font-bold" style={{ color: PESSEGO }}>{p.passo || i + 1}.</span>
              <span><LatexText text={p.descricao || p} /></span>
            </li>
          ))}
        </ol>
      </div>
    )}

    {sd.regras?.length > 0 && (
      <div className="mb-6">
        <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>📋 Regras</h3>
        <ul className="space-y-1">
          {sd.regras.map((r, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• <LatexText text={r} /></li>)}
        </ul>
      </div>
    )}

    {sd.variacoes?.length > 0 && (
      <div className="mb-6">
        <h3 className="font-semibold mb-2 font-heading" style={{ color: TEXTO }}>🔄 Variações</h3>
        <ul className="space-y-1">
          {sd.variacoes.map((v, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• <LatexText text={v} /></li>)}
        </ul>
      </div>
    )}

    {sd.dicas_professor?.length > 0 && (
      <div className="rounded-lg p-4 mb-6 border" style={{ backgroundColor: OURO_CLARO, borderColor: BORDA }}>
        <h3 className="font-semibold text-sm mb-1 font-heading" style={{ color: OURO }}>💡 Dicas para o professor</h3>
        <ul className="space-y-1">
          {sd.dicas_professor.map((d, i) => <li key={i} className="text-sm" style={{ color: TEXTO }}>• <LatexText text={d} /></li>)}
        </ul>
      </div>
    )}

    {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
  </CardBase>
);

// ============================================================
// ATIVIDADE (versão única)
// ============================================================
const AtividadeView = ({ cab, sd }) => (
  <CardBase>
    <CabecalhoMaterial
      titulo={cab.titulo}
      meta={[
        cab.disciplina && `📚 ${cab.disciplina}`,
        cab.ano && `🎓 ${cab.ano}`,
      ]}
      extra={cab.instrucoes_gerais && (
        <p className="mt-3 text-sm italic p-3 rounded" style={{ color: TEXTO, backgroundColor: CREME }}>
          {cab.instrucoes_gerais}
        </p>
      )}
    />

    <div className="space-y-6">
      {sd.atividades?.map((a) => (
        <div key={a.numero} className="pl-4" style={{ borderLeft: `4px solid ${PESSEGO}` }}>
          <div className="flex justify-between mb-1">
            <span className="font-semibold" style={{ color: TEXTO }}>Questão {a.numero}</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: CREME, color: TEXTO_2 }}>{a.tipo}</span>
          </div>
          <div className="mb-2" style={{ color: TEXTO }}>
            <LatexText text={a.enunciado} />
          </div>
          {a.alternativas?.length > 0 && (
            <ul className="space-y-1 ml-4">
              {a.alternativas.map((alt, i) => (
                <li key={i} className="text-sm" style={{ color: TEXTO }}><LatexText text={alt} /></li>
              ))}
            </ul>
          )}
          {a.espaco_resposta && (
            <p className="text-xs mt-2 italic" style={{ color: TEXTO_2 }}>Espaço para resposta: {a.espaco_resposta}</p>
          )}
        </div>
      ))}
    </div>

    {sd.gabarito_professor?.length > 0 && (
      <details className="mt-8 rounded-lg p-4 border" style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}>
        <summary className="cursor-pointer font-semibold text-sm" style={{ color: VERDE }}>✅ Gabarito do professor</summary>
        <ul className="mt-3 space-y-1 text-sm" style={{ color: TEXTO }}>
          {sd.gabarito_professor.map((g, i) => <li key={i}><LatexText text={g} /></li>)}
        </ul>
      </details>
    )}

    {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
  </CardBase>
);

// ============================================================
// INCLUSÃO
// ============================================================
const InclusaoBloco = ({ inc }) => (
  <div className="mt-6 border-t pt-6" style={{ borderColor: BORDA }}>
    <h3 className="text-lg font-semibold mb-2 font-heading" style={{ color: AZUL }}>🧩 Adaptações para necessidades específicas</h3>
    <p className="text-sm mb-4" style={{ color: TEXTO_2 }}>{inc.mensagem}</p>
    {inc.condicoes?.map((c, i) => (
      <div key={i} className="rounded-lg overflow-hidden mb-4 border" style={{ borderColor: BORDA, backgroundColor: BRANCO }}>
        <div className="px-4 py-2" style={{ backgroundColor: AZUL_CLARO }}>
          <h4 className="font-semibold font-heading" style={{ color: AZUL }}>{c.nome}</h4>
        </div>
        <ul className="p-4 space-y-1.5">
          {c.estrategias.map((e, j) => (
            <li key={j} className="flex items-start gap-2 text-sm" style={{ color: TEXTO }}>
              <span style={{ color: VERDE }} className="mt-0.5">✓</span>
              <span><LatexText text={e} /></span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

export default GeradorMateriais;