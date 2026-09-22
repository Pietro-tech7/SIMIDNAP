import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import FeedbackCard from '../components/FeedbackCard';

const NeuroAula = () => {
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
        plan_type: 'neuroaula',
        diferenciado,
        ...form,
      });
      setResult(response.data);
    } catch (err) {
      if (err.response?.status === 402) {
        setError('Créditos insuficientes. Faça upgrade do seu plano.');
      } else {
        setError('Erro ao gerar o design da aula. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="print:hidden">
        <Link to="/modulo/neuroaula" className="text-blue-600 text-sm hover:underline">
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">🧠</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">NeuroAula</h1>
            <p className="text-gray-600">
              Design de aprendizagem com base em neuroeducação. Você não recebe apenas um plano —
              você entende <strong>por que</strong> cada etapa funciona.
            </p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-purple-900 mb-2">
            🎓 O que este módulo entrega
          </h2>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Um design de aula estruturado em princípios cognitivos (atenção, memória, carga cognitiva, transferência).</li>
            <li>• Cada etapa explica <strong>por que funciona</strong> — para você crescer como professor.</li>
            <li>• Adaptações inclusivas automáticas para alunos com necessidades específicas.</li>
            <li>• Opção de gerar <strong>aula diferenciada</strong> (versão principal + versão adaptada).</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título da aula *</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="Ex: Introdução ao dobro e triplo"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                <input
                  type="text" name="subject" value={form.subject} onChange={handleChange}
                  placeholder="Ex: Matemática"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Série/Ano</label>
                <input
                  type="text" name="grade" value={form.grade} onChange={handleChange}
                  placeholder="Ex: 2º ano"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                <input
                  type="number" name="duracao_minutos" value={form.duracao_minutos} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
              <input
                type="text" name="content" value={form.content} onChange={handleChange} required
                placeholder="Ex: Dobro e triplo"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo (opcional)</label>
              <textarea
                name="objective" value={form.objective} onChange={handleChange} rows="2"
                placeholder="Ex: Compreender o conceito de dobro e triplo"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">📖 Habilidade BNCC</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código BNCC (digite se souber — ex: EF02MA08)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.bncc_codigo}
                    onChange={(e) => setForm({ ...form, bncc_codigo: e.target.value.toUpperCase(), bncc_texto: '' })}
                    placeholder="EF02MA08"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    placeholder="Ex: 2"
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
                    placeholder="Ex: Contagem até 100"
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
              <label className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-lg p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diferenciado}
                  onChange={(e) => setDiferenciado(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <div className="text-sm font-semibold text-purple-900">
                    📑 Aula diferenciada
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    Gera <strong>duas versões</strong>: uma principal (para a turma toda) e uma adaptada
                    (com ritmo mais lento, instruções curtas, apoio visual reforçado).
                    <strong> Consome 2 créditos</strong> em vez de 1.
                  </div>
                </div>
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              {loading ? 'Construindo design da aula...' : 'Gerar design de aprendizagem'}
            </button>
          </form>
        </div>

        {result && (
          <div className="print:hidden flex justify-end mb-4">
            <button
              onClick={async () => {
                try {
                  const el = document.getElementById('neuroaula-conteudo');
                  if (!el) return;
                  const nome = result?.title ? result.title.replace(/\s+/g, '_') : 'neuroaula';
                  await gerarPDF(el, nome);
                } catch (err) {
                  console.error(err);
                  alert('Erro ao gerar PDF.');
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
            >
              📥 Baixar PDF
            </button>
          </div>
        )}
      </div>

      {result && (
        <div id="neuroaula-conteudo">
          <DesignAprendizagem data={result} />
        </div>
      )}

      {/* Feedback (fora do PDF) */}
      {result && (
        <FeedbackCard
          content_type="neuroaula"
          content_id={result.id}
          initialFeedback={result.structured_data?.feedback || null}
        />
      )}
    </div>
  );
};

// ============================================================
// COMPONENTE: DESIGN DE APRENDIZAGEM
// ============================================================
const DesignAprendizagem = ({ data }) => {
  const sd = data.structured_data || {};
  const cab = sd.cabecalho || {};
  const isDiferenciado = !!(sd.versao_principal && sd.versao_adaptada);

  if (isDiferenciado) {
    return <DesignDiferenciado cab={cab} sd={sd} />;
  }

  const prof = sd.para_o_professor || {};
  const inc = sd.inclusao || {};

  return (
    <div className="space-y-6">
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
              <p className="text-sm font-semibold text-gray-700 mb-1">🎯 Objetivo de aprendizagem</p>
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

        {sd.principios_cognitivos?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🧠 Princípios cognitivos aplicados nesta aula
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sd.principios_cognitivos.map((p, i) => (
                <div key={i} className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-1">{p.nome}</h4>
                  <p className="text-sm text-purple-800 mb-2">{p.explicacao}</p>
                  <p className="text-xs text-purple-700 italic">
                    <strong>Nesta aula:</strong> {p.aplicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Sequência da aula — com fundamentação</h3>
        <EtapasLista etapas={sd.etapas} />
      </div>

      {inc.tem_necessidades && <InclusaoBloco inc={inc} />}

      {(prof.por_que_esta_aula_funciona || prof.o_que_voce_vai_desenvolver) && (
        <CrescimentoProfissional prof={prof} />
      )}
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
              <p className="text-sm font-semibold text-gray-700 mb-1">🎯 Objetivo de aprendizagem</p>
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

        <div className="flex gap-2 mb-6 print:hidden">
          <button
            onClick={() => setAba('principal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              aba === 'principal' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Versão Principal
          </button>
          <button
            onClick={() => setAba('adaptada')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              aba === 'adaptada' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Versão Adaptada
          </button>
        </div>

        {aba === 'principal' ? (
          <>
            {vp.principios_cognitivos?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🧠 Princípios cognitivos aplicados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vp.principios_cognitivos.map((p, i) => (
                    <div key={i} className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-1">{p.nome}</h4>
                      <p className="text-sm text-purple-800 mb-2">{p.explicacao}</p>
                      <p className="text-xs text-purple-700 italic">
                        <strong>Nesta aula:</strong> {p.aplicacao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Sequência da aula</h3>
            <EtapasLista etapas={vp.etapas} />
          </>
        ) : (
          <>
            {va.instrucoes_para_o_professor && (
              <div className="mb-4 bg-purple-50 border border-purple-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-purple-900 mb-1">📌 Como conduzir esta versão</p>
                <p className="text-sm text-purple-800">{va.instrucoes_para_o_professor}</p>
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Sequência adaptada</h3>
            <EtapasLista etapas={va.etapas_adaptadas} adaptada />

            {va.adaptacoes_especificas?.length > 0 && (
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">🧩 Adaptações específicas</h4>
                <ul className="space-y-1">
                  {va.adaptacoes_especificas.map((a, i) => (
                    <li key={i} className="text-sm text-blue-800">• {a}</li>
                  ))}
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

const EtapasLista = ({ etapas, adaptada = false }) => (
  <div className="space-y-4">
    {etapas?.map((etapa) => (
      <div key={etapa.numero} className="border border-gray-100 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 flex justify-between items-center">
          <span className="font-semibold">
            Etapa {etapa.numero} — {etapa.titulo}
          </span>
          <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
            {etapa.tempo}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {etapa.professor_faca && (
            <Bloco cor="border-gray-400" titulo="👨‍🏫 Professor faça">
              {etapa.professor_faca}
            </Bloco>
          )}
          {etapa.diga && (
            <Bloco cor="border-green-400" titulo="💬 Diga">
              "{etapa.diga}"
            </Bloco>
          )}
          {etapa.pergunte && (
            <Bloco cor="border-yellow-400" titulo="❓ Pergunte">
              {etapa.pergunte}
            </Bloco>
          )}
          {etapa.alunos_deverao && (
            <Bloco cor="border-blue-400" titulo="👥 Alunos deverão">
              {etapa.alunos_deverao}
            </Bloco>
          )}
          {etapa.apoio_visual && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-xs font-semibold text-blue-900 mb-1">🖼️ Apoio visual</p>
              <p className="text-sm text-blue-800">{etapa.apoio_visual}</p>
            </div>
          )}
          {etapa.porque_funciona && (
            <div className="mt-3 bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r">
              <p className="text-xs font-semibold text-purple-900 mb-1">
                🧠 Por que esta etapa funciona
              </p>
              <p className="text-sm text-purple-800">{etapa.porque_funciona}</p>
              {etapa.principio_relacionado && (
                <p className="text-xs text-purple-700 mt-1 italic">
                  Princípio: {etapa.principio_relacionado}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

const CrescimentoProfissional = ({ prof }) => (
  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 md:p-8">
    <h3 className="text-xl font-bold text-indigo-900 mb-4">
      🎓 Para o seu crescimento profissional
    </h3>

    {prof.por_que_esta_aula_funciona && (
      <div className="mb-6">
        <h4 className="font-semibold text-indigo-800 mb-2">Por que esta aula funciona</h4>
        <p className="text-sm text-indigo-900 leading-relaxed">{prof.por_que_esta_aula_funciona}</p>
      </div>
    )}

    {prof.o_que_voce_vai_desenvolver?.length > 0 && (
      <div className="mb-6">
        <h4 className="font-semibold text-indigo-800 mb-2">O que você vai desenvolver</h4>
        <ul className="space-y-1.5">
          {prof.o_que_voce_vai_desenvolver.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
              <span className="text-indigo-500 mt-0.5">✓</span><span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {prof.reflexao_apos_a_aula?.length > 0 && (
      <div className="mb-6">
        <h4 className="font-semibold text-indigo-800 mb-2">Reflexão após a aula</h4>
        <ul className="space-y-1.5">
          {prof.reflexao_apos_a_aula.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
              <span className="text-indigo-500 mt-0.5">?</span><span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {prof.se_alunos_dificuldade && (
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Se os alunos tiverem dificuldade</h4>
        <p className="text-sm text-yellow-800 whitespace-pre-line">{prof.se_alunos_dificuldade}</p>
      </div>
    )}
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

export default NeuroAula;