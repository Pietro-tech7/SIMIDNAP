import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import FeedbackCard from '../components/FeedbackCard';

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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="print:hidden">
        <Link to="/modulo/aula_que_funciona" className="text-blue-600 text-sm hover:underline">
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">🎯</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aula que Funciona</h1>
            <p className="text-gray-600">
              Script prático de execução. Roteiro minuto a minuto, pronto para aplicar em sala.
            </p>
          </div>
        </div>

        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-cyan-900 mb-2">
            ⚡ O que este módulo entrega
          </h2>
          <ul className="text-sm text-cyan-800 space-y-1">
            <li>• Um <strong>roteiro cronometrado</strong> com falas, ações e perguntas exatas.</li>
            <li>• Um <strong>checklist de materiais</strong> antes de começar.</li>
            <li>• Adaptações inclusivas automáticas para alunos com necessidades específicas.</li>
            <li>• Opção de gerar <strong>aula diferenciada</strong> (versão principal + versão adaptada).</li>
            <li>• Foco total em <strong>execução</strong> — você pega e aplica.</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título da aula *</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="Ex: Ciclo da água"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                <input
                  type="text" name="subject" value={form.subject} onChange={handleChange}
                  placeholder="Ex: Ciências"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Série/Ano</label>
                <input
                  type="text" name="grade" value={form.grade} onChange={handleChange}
                  placeholder="Ex: 4º ano"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                <input
                  type="number" name="duracao_minutos" value={form.duracao_minutos} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
              <input
                type="text" name="content" value={form.content} onChange={handleChange} required
                placeholder="Ex: Ciclo da água"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo (opcional)</label>
              <textarea
                name="objective" value={form.objective} onChange={handleChange} rows="2"
                placeholder="Ex: Reconhecer as etapas do ciclo da água"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">📖 Habilidade BNCC</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código BNCC (digite se souber — ex: EF04CI04)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.bncc_codigo}
                    onChange={(e) => setForm({ ...form, bncc_codigo: e.target.value.toUpperCase(), bncc_texto: '' })}
                    placeholder="EF04CI04"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 transition"
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
                    placeholder="Ex: 4"
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
                <p className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded p-2">
                  <strong>{form.bncc_codigo}:</strong> {form.bncc_texto}
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">👥 Perfil da Turma</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº de alunos</label>
                  <input
                    type="number" name="num_alunos" value={form.num_alunos} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conhecimentos prévios da turma</label>
                  <input
                    type="text" name="conhecimentos_previos" value={form.conhecimentos_previos} onChange={handleChange}
                    placeholder="Ex: Já conhecem os estados físicos da água"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <label className="block text-sm font-semibold text-blue-900 mb-1">
                  🧩 Alunos com necessidades específicas (opcional)
                </label>
                <p className="text-xs text-blue-700 mb-2">
                  Informe apenas necessidades <strong>pedagógicas</strong>. Exemplos:
                  "2 alunos autistas", "1 aluno com TDAH", "1 aluno com dislexia".
                  O sistema <strong>não realiza diagnósticos</strong> — apenas adapta a aula pedagogicamente.
                </p>
                <textarea
                  name="dificuldades" value={form.dificuldades} onChange={handleChange} rows="2"
                  placeholder="Ex: 2 alunos autistas, 1 aluno com TDAH"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 bg-white"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-start gap-3 bg-cyan-50 border border-cyan-100 rounded-lg p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diferenciado}
                  onChange={(e) => setDiferenciado(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <div>
                  <div className="text-sm font-semibold text-cyan-900">
                    📑 Aula diferenciada
                  </div>
                  <div className="text-xs text-cyan-700 mt-1">
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
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              {loading ? 'Preparando script...' : 'Gerar script de execução'}
            </button>
          </form>
        </div>
      </div>

      {result && (
        <div id="aula-conteudo">
          <ScriptExecucao data={result} />
        </div>
      )}

      {/* Feedback (fora do PDF) */}
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
// COMPONENTE PRINCIPAL
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
        <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-cyan-900 mb-2">
            ✅ Checklist antes de começar
          </h3>
          <ul className="space-y-1.5">
            {sd.checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-cyan-800">
                <span className="text-cyan-600 mt-0.5">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RoteiroLista roteiro={sd.roteiro} />

      {sd.adaptacoes?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">♿ Adaptações gerais</h3>
          <ul className="space-y-1.5">
            {sd.adaptacoes.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                <span className="text-cyan-500 mt-0.5">•</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {inc.tem_necessidades && <InclusaoBloco inc={inc} />}

      {sd.intervencao && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Sugestão de intervenção</h3>
          <p className="text-sm text-yellow-800">{sd.intervencao}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// VERSÃO DIFERENCIADA (abas)
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
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            aba === 'principal' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Versão Principal
        </button>
        <button
          onClick={() => setAba('adaptada')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            aba === 'adaptada' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Versão Adaptada
        </button>
      </div>

      {aba === 'principal' ? (
        <>
          {vp.checklist?.length > 0 && (
            <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-cyan-900 mb-2">✅ Checklist antes de começar</h3>
              <ul className="space-y-1.5">
                {vp.checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-cyan-800">
                    <span className="text-cyan-600 mt-0.5">☐</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <RoteiroLista roteiro={vp.roteiro} />
          {vp.adaptacoes?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">♿ Adaptações gerais</h3>
              <ul className="space-y-1.5">
                {vp.adaptacoes.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-cyan-500 mt-0.5">•</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {vp.intervencao && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Sugestão de intervenção</h3>
              <p className="text-sm text-yellow-800">{vp.intervencao}</p>
            </div>
          )}
        </>
      ) : (
        <>
          {va.checklist_adaptado?.length > 0 && (
            <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-cyan-900 mb-2">✅ Checklist adaptado</h3>
              <ul className="space-y-1.5">
                {va.checklist_adaptado.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-cyan-800">
                    <span className="text-cyan-600 mt-0.5">☐</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RoteiroLista roteiro={va.roteiro_adaptado} adaptada />

          {va.adaptacoes_especificas?.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">🧩 Adaptações específicas</h4>
              <ul className="space-y-1">
                {va.adaptacoes_especificas.map((a, i) => (
                  <li key={i} className="text-sm text-blue-800">• {a}</li>
                ))}
              </ul>
            </div>
          )}

          {va.intervencao_adaptada && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Sugestão de intervenção adaptada</h3>
              <p className="text-sm text-yellow-800">{va.intervencao_adaptada}</p>
            </div>
          )}
        </>
      )}

      {inc.tem_necessidades && <InclusaoBloco inc={inc} />}
    </div>
  );
};

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
const CabecalhoAula = ({ cab }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
    <div className="border-b border-gray-100 pb-6 mb-6">
      <h2 className="text-3xl font-bold text-gray-900">{cab.titulo}</h2>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {cab.disciplina && <Info label="Disciplina" value={cab.disciplina} />}
        {cab.ano && <Info label="Ano" value={cab.ano} />}
        {cab.duracao && <Info label="Duração" value={cab.duracao} />}
        {cab.num_alunos && <Info label="Alunos" value={cab.num_alunos} />}
      </div>
      {cab.objetivo && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">🎯 Objetivo</p>
          <p className="text-gray-700">{cab.objetivo}</p>
        </div>
      )}
      {cab.bncc?.codigo && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900">{cab.bncc.codigo}</p>
          <p className="text-sm text-blue-800 mt-1">{cab.bncc.texto}</p>
        </div>
      )}
    </div>
  </div>
);

const RoteiroLista = ({ roteiro, adaptada = false }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      ⏱️ {adaptada ? 'Roteiro adaptado' : 'Roteiro minuto a minuto'}
    </h3>
    <div className="space-y-4">
      {roteiro?.map((etapa, i) => (
        <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 flex justify-between items-center">
            <span className="font-semibold">{etapa.titulo}</span>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded font-mono">
              {etapa.tempo}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {etapa.faca && (
              <Bloco cor="border-gray-400" titulo="👨‍🏫 Faça">
                {etapa.faca}
              </Bloco>
            )}
            {etapa.fale && (
              <Bloco cor="border-green-400" titulo="💬 Fale">
                "{etapa.fale}"
              </Bloco>
            )}
            {etapa.pergunte && (
              <Bloco cor="border-yellow-400" titulo="❓ Pergunte">
                {etapa.pergunte}
              </Bloco>
            )}
            {etapa.alunos && (
              <Bloco cor="border-blue-400" titulo="👥 Alunos">
                {etapa.alunos}
              </Bloco>
            )}
            {etapa.apoio_visual && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                <p className="text-xs font-semibold text-blue-900 mb-1">🖼️ Apoio visual</p>
                <p className="text-sm text-blue-800">{etapa.apoio_visual}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const InclusaoBloco = ({ inc }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
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
              <span className="text-blue-500 mt-0.5">✓</span><span>{e}</span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-gray-800 font-medium">{value}</p>
  </div>
);

const Bloco = ({ cor, titulo, children }) => (
  <div className={`border-l-4 ${cor} pl-3`}>
    <p className="text-xs font-semibold text-gray-600 mb-0.5">{titulo}</p>
    <p className="text-sm text-gray-800">{children}</p>
  </div>
);

export default AulaQueFunciona;