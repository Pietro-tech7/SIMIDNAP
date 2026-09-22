import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import LatexText from '../components/LatexText';
import FeedbackCard from '../components/FeedbackCard';

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

  // Aviso antes de fechar a aba se houver material não baixado
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
    try {
      const elemento = document.getElementById('material-conteudo');
      if (!elemento) {
        alert('Conteúdo não encontrado.');
        return;
      }
      const nome = result?.title ? result.title.replace(/\s+/g, '_') : 'material';
      await gerarPDF(elemento, nome);
      setMaterialBaixado(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    }
  };

  const tipos = [
    { id: 'atividade_imprimivel', nome: '📝 Atividade', desc: 'Lista de exercícios para imprimir' },
    { id: 'jogo_dinamica', nome: '🎲 Jogo / Dinâmica', desc: 'Brincadeira pedagógica' },
    { id: 'simulado', nome: '📊 Simulado', desc: 'Avaliação com gabarito' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="print:hidden">
        <Link to="/modulo/ia_para_professor" className="text-blue-600 text-sm hover:underline">
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">📄</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerador de Materiais</h1>
            <p className="text-gray-600">
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
              className={`p-4 rounded-xl border-2 text-left transition ${
                tipo === t.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800">{t.nome}</div>
              <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="Ex: Simulado de Frações"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                <input
                  type="text" name="subject" value={form.subject} onChange={handleChange}
                  placeholder="Ex: Matemática"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Série/Ano</label>
                <input
                  type="text" name="grade" value={form.grade} onChange={handleChange}
                  placeholder="Ex: 5º ano"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
                <input
                  type="text" name="content" value={form.content} onChange={handleChange} required
                  placeholder="Ex: Frações"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo (opcional)</label>
              <textarea
                name="objective" value={form.objective} onChange={handleChange} rows="2"
                placeholder="Ex: Avaliar compreensão de frações"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {tipo === 'simulado' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº de questões</label>
                <input
                  type="number" name="num_questoes" value={form.num_questoes} onChange={handleChange}
                  min="3" max="20"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {tipo === 'jogo_dinamica' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                <input
                  type="number" name="duracao_minutos" value={form.duracao_minutos} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {/* BNCC */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">📖 Habilidade BNCC</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código BNCC (digite se souber)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.bncc_codigo}
                    onChange={(e) => setForm({ ...form, bncc_codigo: e.target.value.toUpperCase(), bncc_texto: '' })}
                    placeholder="EF05MA03"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          setForm(f => ({ ...f, bncc_texto: 'Código não encontrado.' }));
                        }
                      } catch {
                        setForm(f => ({ ...f, bncc_texto: 'Código não encontrado.' }));
                      }
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Componente</label>
                  <select
                    value={codigoComponente}
                    onChange={(e) => setCodigoComponente(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="">Selecione...</option>
                    {componentes.map(c => (
                      <option key={c.codigo} value={c.codigo}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano (1 a 9)</label>
                  <input
                    type="number" min="1" max="9"
                    value={anoNumero}
                    onChange={(e) => setAnoNumero(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Habilidade</label>
                  <select
                    value={form.bncc_codigo}
                    onChange={handleSelecionarHabilidade}
                    disabled={!habilidades.length}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingHabilidades ? 'Carregando...' : habilidades.length === 0 ? 'Selecione componente e ano' : 'Selecione...'}
                    </option>
                    {habilidades.map(h => (
                      <option key={h.codigo} value={h.codigo}>
                        {h.codigo} — {h.texto?.substring(0, 60)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.bncc_texto && (
                <p className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded p-2">
                  <strong>{form.bncc_codigo}:</strong> {form.bncc_texto}
                </p>
              )}
            </div>

            {/* Necessidades específicas */}
            <div className="border-t border-gray-100 pt-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <label className="block text-sm font-semibold text-blue-900 mb-1">
                  🧩 Alunos com necessidades específicas (opcional)
                </label>
                <p className="text-xs text-blue-700 mb-2">
                  Informe apenas necessidades <strong>pedagógicas</strong>. Ex: "2 alunos autistas", "1 aluno com TDAH".
                  O sistema <strong>não realiza diagnósticos</strong>.
                </p>
                <textarea
                  name="dificuldades" value={form.dificuldades} onChange={handleChange} rows="2"
                  placeholder="Ex: 2 alunos autistas, 1 com dislexia"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 bg-white"
                />
              </div>
            </div>

            {/* Material Diferenciado */}
            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-lg p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diferenciado}
                  onChange={(e) => setDiferenciado(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <div>
                  <div className="text-sm font-semibold text-orange-900">
                    📑 Material diferenciado
                  </div>
                  <div className="text-xs text-orange-700 mt-1">
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
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              {loading ? 'Gerando material (pode levar 1-2 minutos)...' : 'Gerar material'}
            </button>
          </form>
        </div>

        {result && (
          <div className="print:hidden flex justify-end mb-4">
            <button
              onClick={handleBaixarPDF}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
            >
              📥 Baixar PDF
            </button>
          </div>
        )}
      </div>

        {result && (
        <div id="material-conteudo" className="print:max-w-full">
          <MaterialResultado data={result} />
        </div>
      )}

      {/* Feedback (fora do PDF) */}
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
// RENDERIZAÇÃO POR TIPO DE MATERIAL
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
// SIMULADO — DIFERENCIADO
// ============================================================
const SimuladoDiferenciado = ({ cab, sd, data }) => {
  const [aba, setAba] = useState('principal');
  const versao = aba === 'principal' ? sd.versao_principal : sd.versao_adaptada;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{cab.titulo || data.title}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
          {cab.disciplina && <span>📚 {cab.disciplina}</span>}
          {cab.ano && <span>🎓 {cab.ano}</span>}
        </div>
        <div className="mt-3 inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full print:hidden">
          📑 Material Diferenciado (2 versões)
        </div>
      </div>

      <div className="flex gap-2 mb-6 print:hidden">
        <button
          onClick={() => setAba('principal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            aba === 'principal' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Versão Principal ({sd.versao_principal.num_questoes} questões)
        </button>
        <button
          onClick={() => setAba('adaptada')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            aba === 'adaptada' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Versão Adaptada ({sd.versao_adaptada.num_questoes} questões)
        </button>
      </div>

      <div className="hidden print:block mb-4">
        <p className="text-lg font-bold">
          {aba === 'principal' ? 'VERSÃO PRINCIPAL' : 'VERSÃO ADAPTADA'}
        </p>
      </div>

      {versao.instrucoes && (
        <p className="mb-4 text-sm text-gray-700 italic bg-gray-50 p-3 rounded">
          {versao.instrucoes}
        </p>
      )}

      <div className="space-y-6">
        {versao.questoes?.map((q) => (
          <div key={q.numero} className="border-l-4 border-orange-400 pl-4 py-2">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-800">Questão {q.numero}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{q.tipo}</span>
            </div>
            <div className="text-gray-800 mb-3">
              <LatexText text={q.enunciado} />
            </div>
            {q.apoio_visual && (
              <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded mb-2">
                🖼️ <strong>Apoio visual:</strong> {q.apoio_visual}
              </p>
            )}
            {q.alternativas?.length > 0 && (
              <ul className="space-y-1 ml-4">
                {q.alternativas.map((alt, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    <LatexText text={alt} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {versao.gabarito?.length > 0 && (
        <details className="mt-8 bg-green-50 border border-green-100 rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-green-900 text-sm">✅ Gabarito</summary>
          <ul className="mt-3 space-y-1 text-sm text-green-800">
            {versao.gabarito.map((g, i) => <li key={i}><LatexText text={g} /></li>)}
          </ul>
        </details>
      )}

      {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
    </div>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{cab.titulo}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
          {cab.disciplina && <span>📚 {cab.disciplina}</span>}
          {cab.ano && <span>🎓 {cab.ano}</span>}
          {cab.duracao && <span>⏱️ {cab.duracao}</span>}
        </div>
        <div className="mt-3 inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full print:hidden">
          📑 Material Diferenciado (2 versões)
        </div>
      </div>

      <div className="flex gap-2 mb-6 print:hidden">
        <button
          onClick={() => setAba('principal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            aba === 'principal' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Versão Principal
        </button>
        <button
          onClick={() => setAba('adaptada')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            aba === 'adaptada' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Versão Adaptada
        </button>
      </div>

      {sd.materiais?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">🧰 Materiais</h3>
          <ul className="space-y-1">
            {sd.materiais.map((m, i) => <li key={i} className="text-sm text-gray-700">• {m}</li>)}
          </ul>
        </div>
      )}

      {aba === 'principal' ? (
        <>
          {vp.como_jogar?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">🎯 Como jogar</h3>
              <ol className="space-y-2">
                {vp.como_jogar.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="font-bold text-orange-600">{p.passo || i + 1}.</span>
                    <span><LatexText text={p.descricao || p} /></span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {vp.regras?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">📋 Regras</h3>
              <ul className="space-y-1">
                {vp.regras.map((r, i) => <li key={i} className="text-sm text-gray-700">• <LatexText text={r} /></li>)}
              </ul>
            </div>
          )}
          {vp.variacoes?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">🔄 Variações</h3>
              <ul className="space-y-1">
                {vp.variacoes.map((v, i) => <li key={i} className="text-sm text-gray-700">• <LatexText text={v} /></li>)}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {va.adaptacoes?.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-1">🧩 Adaptações</h3>
              <ul className="space-y-1">
                {va.adaptacoes.map((a, i) => <li key={i} className="text-sm text-blue-800">• <LatexText text={a} /></li>)}
              </ul>
            </div>
          )}
          {va.como_jogar_adaptado?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">🎯 Como jogar (adaptado)</h3>
              <ol className="space-y-2">
                {va.como_jogar_adaptado.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="font-bold text-orange-600">{p.passo || i + 1}.</span>
                    <span><LatexText text={p.descricao || p} /></span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {va.regras_adaptadas?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">📋 Regras adaptadas</h3>
              <ul className="space-y-1">
                {va.regras_adaptadas.map((r, i) => <li key={i} className="text-sm text-gray-700">• <LatexText text={r} /></li>)}
              </ul>
            </div>
          )}
          {va.papel_do_colega_apoio && (
            <div className="mb-6 bg-green-50 border border-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 text-sm mb-1">🤝 Papel do colega de apoio</h3>
              <p className="text-sm text-green-800"><LatexText text={va.papel_do_colega_apoio} /></p>
            </div>
          )}
        </>
      )}

      {sd.dicas_professor?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 text-sm mb-1">💡 Dicas para o professor</h3>
          <ul className="space-y-1">
            {sd.dicas_professor.map((d, i) => <li key={i} className="text-sm text-yellow-800">• <LatexText text={d} /></li>)}
          </ul>
        </div>
      )}

      {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
    </div>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{cab.titulo}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
          {cab.disciplina && <span>📚 {cab.disciplina}</span>}
          {cab.ano && <span>🎓 {cab.ano}</span>}
        </div>
        <div className="mt-3 inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full print:hidden">
          📑 Material Diferenciado (2 versões)
        </div>
      </div>

      <div className="flex gap-2 mb-6 print:hidden">
        <button
          onClick={() => setAba('principal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            aba === 'principal' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Versão Principal
        </button>
        <button
          onClick={() => setAba('adaptada')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            aba === 'adaptada' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Versão Adaptada
        </button>
      </div>

      {versao.instrucoes_gerais && (
        <p className="mb-4 text-sm text-gray-700 italic bg-gray-50 p-3 rounded">
          {versao.instrucoes_gerais}
        </p>
      )}

      <div className="space-y-6">
        {versao.atividades?.map((a) => (
          <div key={a.numero} className="border-l-4 border-orange-400 pl-4">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-800">Questão {a.numero}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{a.tipo}</span>
            </div>
            <div className="text-gray-800 mb-2">
              <LatexText text={a.enunciado} />
            </div>
            {a.apoio_visual && (
              <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded mb-2">
                🖼️ <strong>Apoio visual:</strong> {a.apoio_visual}
              </p>
            )}
            {a.alternativas?.length > 0 && (
              <ul className="space-y-1 ml-4">
                {a.alternativas.map((alt, i) => (
                  <li key={i} className="text-sm text-gray-700"><LatexText text={alt} /></li>
                ))}
              </ul>
            )}
            {a.espaco_resposta && (
              <p className="text-xs text-gray-500 mt-2 italic">Espaço para resposta: {a.espaco_resposta}</p>
            )}
          </div>
        ))}
      </div>

      {versao.gabarito_professor?.length > 0 && (
        <details className="mt-8 bg-green-50 border border-green-100 rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-green-900 text-sm">✅ Gabarito do professor</summary>
          <ul className="mt-3 space-y-1 text-sm text-green-800">
            {versao.gabarito_professor.map((g, i) => <li key={i}><LatexText text={g} /></li>)}
          </ul>
        </details>
      )}

      {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
    </div>
  );
};

// ============================================================
// SIMULADO (versão única)
// ============================================================
const SimuladoView = ({ cab, sd, data }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
    <div className="border-b border-gray-100 pb-4 mb-6">
      <h2 className="text-3xl font-bold text-gray-900">{cab.titulo || data.title}</h2>
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
        {cab.disciplina && <span>📚 {cab.disciplina}</span>}
        {cab.ano && <span>🎓 {cab.ano}</span>}
        {cab.num_questoes && <span>📝 {cab.num_questoes} questões</span>}
      </div>
      {cab.instrucoes && (
        <p className="mt-3 text-sm text-gray-700 italic bg-gray-50 p-3 rounded">{cab.instrucoes}</p>
      )}
    </div>

    <div className="space-y-6">
      {sd.questoes?.map((q) => (
        <div key={q.numero} className="border-l-4 border-orange-400 pl-4 py-2">
          <div className="flex justify-between mb-1">
            <span className="font-semibold text-gray-800">Questão {q.numero}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{q.tipo}</span>
          </div>
          <div className="text-gray-800 mb-3">
            <LatexText text={q.enunciado} />
          </div>
          {q.alternativas?.length > 0 && (
            <ul className="space-y-1 ml-4">
              {q.alternativas.map((alt, i) => (
                <li key={i} className="text-sm text-gray-700"><LatexText text={alt} /></li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>

    {sd.gabarito?.length > 0 && (
      <details className="mt-8 bg-green-50 border border-green-100 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-green-900 text-sm">✅ Gabarito</summary>
        <ul className="mt-3 space-y-1 text-sm text-green-800">
          {sd.gabarito.map((g, i) => <li key={i}><LatexText text={g} /></li>)}
        </ul>
      </details>
    )}

    {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
  </div>
);

// ============================================================
// JOGO (versão única)
// ============================================================
const JogoView = ({ cab, sd }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
    <div className="border-b border-gray-100 pb-4 mb-6">
      <h2 className="text-3xl font-bold text-gray-900">{cab.titulo}</h2>
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
        {cab.disciplina && <span>📚 {cab.disciplina}</span>}
        {cab.ano && <span>🎓 {cab.ano}</span>}
        {cab.duracao && <span>⏱️ {cab.duracao}</span>}
        {cab.num_participantes && <span>👥 {cab.num_participantes}</span>}
      </div>
      {cab.objetivo && <p className="mt-3 text-gray-700"><strong>Objetivo:</strong> {cab.objetivo}</p>}
    </div>

    {sd.materiais?.length > 0 && (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">🧰 Materiais</h3>
        <ul className="space-y-1">
          {sd.materiais.map((m, i) => <li key={i} className="text-sm text-gray-700">• {m}</li>)}
        </ul>
      </div>
    )}

    {sd.como_jogar?.length > 0 && (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">🎯 Como jogar</h3>
        <ol className="space-y-2">
          {sd.como_jogar.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <span className="font-bold text-orange-600">{p.passo || i + 1}.</span>
              <span><LatexText text={p.descricao || p} /></span>
            </li>
          ))}
        </ol>
      </div>
    )}

    {sd.regras?.length > 0 && (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">📋 Regras</h3>
        <ul className="space-y-1">
          {sd.regras.map((r, i) => <li key={i} className="text-sm text-gray-700">• <LatexText text={r} /></li>)}
        </ul>
      </div>
    )}

    {sd.variacoes?.length > 0 && (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">🔄 Variações</h3>
        <ul className="space-y-1">
          {sd.variacoes.map((v, i) => <li key={i} className="text-sm text-gray-700">• <LatexText text={v} /></li>)}
        </ul>
      </div>
    )}

    {sd.dicas_professor?.length > 0 && (
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-yellow-900 text-sm mb-1">💡 Dicas para o professor</h3>
        <ul className="space-y-1">
          {sd.dicas_professor.map((d, i) => <li key={i} className="text-sm text-yellow-800">• <LatexText text={d} /></li>)}
        </ul>
      </div>
    )}

    {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
  </div>
);

// ============================================================
// ATIVIDADE (versão única)
// ============================================================
const AtividadeView = ({ cab, sd }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
    <div className="border-b border-gray-100 pb-4 mb-6">
      <h2 className="text-3xl font-bold text-gray-900">{cab.titulo}</h2>
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
        {cab.disciplina && <span>📚 {cab.disciplina}</span>}
        {cab.ano && <span>🎓 {cab.ano}</span>}
      </div>
      {cab.instrucoes_gerais && (
        <p className="mt-3 text-sm text-gray-700 italic bg-gray-50 p-3 rounded">
          {cab.instrucoes_gerais}
        </p>
      )}
    </div>

    <div className="space-y-6">
      {sd.atividades?.map((a) => (
        <div key={a.numero} className="border-l-4 border-orange-400 pl-4">
          <div className="flex justify-between mb-1">
            <span className="font-semibold text-gray-800">Questão {a.numero}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{a.tipo}</span>
          </div>
          <div className="text-gray-800 mb-2">
            <LatexText text={a.enunciado} />
          </div>
          {a.alternativas?.length > 0 && (
            <ul className="space-y-1 ml-4">
              {a.alternativas.map((alt, i) => (
                <li key={i} className="text-sm text-gray-700"><LatexText text={alt} /></li>
              ))}
            </ul>
          )}
          {a.espaco_resposta && (
            <p className="text-xs text-gray-500 mt-2 italic">Espaço para resposta: {a.espaco_resposta}</p>
          )}
        </div>
      ))}
    </div>

    {sd.gabarito_professor?.length > 0 && (
      <details className="mt-8 bg-green-50 border border-green-100 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-green-900 text-sm">✅ Gabarito do professor</summary>
        <ul className="mt-3 space-y-1 text-sm text-green-800">
          {sd.gabarito_professor.map((g, i) => <li key={i}><LatexText text={g} /></li>)}
        </ul>
      </details>
    )}

    {sd.inclusao?.tem_necessidades && <InclusaoBloco inc={sd.inclusao} />}
  </div>
);

// ============================================================
// INCLUSÃO
// ============================================================
const InclusaoBloco = ({ inc }) => (
  <div className="mt-6 border-t border-gray-100 pt-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">🧩 Adaptações para necessidades específicas</h3>
    <p className="text-sm text-gray-600 mb-4">{inc.mensagem}</p>
    {inc.condicoes?.map((c, i) => (
      <div key={i} className="border border-blue-100 rounded-lg overflow-hidden mb-4">
        <div className="bg-blue-50 px-4 py-2">
          <h4 className="font-semibold text-blue-900">{c.nome}</h4>
        </div>
        <ul className="p-4 space-y-1.5">
          {c.estrategias.map((e, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span><LatexText text={e} /></span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

export default GeradorMateriais;