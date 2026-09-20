import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';

const PraticasExitosas = () => {
  // ============================================================
  // ESTADO DO WIZARD
  // ============================================================
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [pdfBaixado, setPdfBaixado] = useState(false);

  const [form, setForm] = useState({
    // Identificação
    title: '',
    perfil: '',               // 'professor' | 'coordenador'
    flow_type: '',            // 'ja_tenho' | 'criar'
    sub_flow: '',             // 'melhorar' | 'documento'

    // Categoria
    category: '',             // 'educacao_infantil' | 'ciclo_alfabetizacao' | 'gestao_escolar'

    // Contexto escolar
    school: '',
    city: '',
    gre: '',
    grade: '',
    subject: '',

    // Particularidades
    original_grade: '',
    target_grade: '',
    has_special_needs: false,
    duration: '',
    num_alunos: '',

    // Relato
    description: '',
  });

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ============================================================
  // AVANÇAR / VOLTAR ENTRE ETAPAS
  // ============================================================
  const podeAvancar = () => {
    if (step === 1) return form.perfil !== '';
    if (step === 2) {
      if (form.flow_type === '') return false;
      if (form.flow_type === 'ja_tenho' && form.sub_flow === '') return false;
      return true;
    }
    if (step === 3) return form.category !== '';
    if (step === 4) return true;
    if (step === 5) return form.title.trim() !== '' && form.description.trim().length >= 50;
    return true;
  };

  const avancar = () => {
    if (!podeAvancar()) return;
    setStep(s => s + 1);
  };

  const voltar = () => setStep(s => Math.max(1, s - 1));

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        ...form,
        num_alunos: form.num_alunos ? parseInt(form.num_alunos) : null,
        answers: form, // rede de segurança
      };
      const response = await api.post('/successful-practices/generate', payload);
      setResult(response.data);
      setPdfBaixado(false);
      setStep(6); // tela de resultado
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err?.response?.status === 402) {
        setError('Créditos insuficientes. Faça upgrade do seu plano para continuar.');
      } else if (err?.response?.status === 400) {
        setError(err?.response?.data?.detail || 'Verifique os dados e tente novamente.');
      } else {
        setError('Erro ao gerar a prática. Tente novamente em alguns instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarPDF = async () => {
    try {
      const elemento = document.getElementById('pratica-conteudo');
      if (!elemento) {
        alert('Conteúdo não encontrado.');
        return;
      }
      const nome = result?.title ? result.title.replace(/\s+/g, '_') : 'pratica_exitosa';
      await gerarPDF(elemento, nome);
      setPdfBaixado(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    }
  };

  const reiniciar = () => {
    setStep(1);
    setResult(null);
    setError('');
    setForm({
      title: '', perfil: '', flow_type: '', sub_flow: '',
      category: '', school: '', city: '', gre: '',
      grade: '', subject: '', original_grade: '', target_grade: '',
      has_special_needs: false, duration: '', num_alunos: '',
      description: '',
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="print:hidden">
        <Link to="/modulo/praticas_exitosas" className="text-teal-600 text-sm hover:underline">
          ← Voltar
        </Link>

        <div className="mt-6 mb-8 flex items-center gap-3">
          <span className="text-4xl">🏆</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Práticas Exitosas</h1>
            <p className="text-gray-600">
              Crie, melhore ou documente práticas pedagógicas que transformam.
            </p>
          </div>
        </div>

        {/* Barra de progresso */}
        {step <= 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Etapa {step} de 5</span>
              <span>{Math.round((step / 5) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 1 — PERFIL */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quem está usando?</h2>
            <p className="text-gray-600 mb-6">
              Escolha o perfil para que a IA adapte a prática ao seu papel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => update('perfil', 'professor')}
                className={`p-6 rounded-xl border-2 text-left transition ${
                  form.perfil === 'professor'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">👩‍🏫</div>
                <div className="font-semibold text-gray-900 text-lg">Professor(a)</div>
                <p className="text-sm text-gray-600 mt-1">
                  Prática de sala de aula, com foco nos alunos.
                </p>
              </button>

              <button
                onClick={() => update('perfil', 'coordenador')}
                className={`p-6 rounded-xl border-2 text-left transition ${
                  form.perfil === 'coordenador'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">🧑‍💼</div>
                <div className="font-semibold text-gray-900 text-lg">Coordenador(a)</div>
                <p className="text-sm text-gray-600 mt-1">
                  Gestão escolar, formação de professores, acompanhamento.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 2 — FLUXO */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Você já tem uma prática?</h2>
            <p className="text-gray-600 mb-6">Escolha o caminho que faz sentido para você.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => { update('flow_type', 'ja_tenho'); update('sub_flow', ''); }}
                className={`p-6 rounded-xl border-2 text-left transition ${
                  form.flow_type === 'ja_tenho'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">📚</div>
                <div className="font-semibold text-gray-900 text-lg">Já tenho uma prática</div>
                <p className="text-sm text-gray-600 mt-1">
                  Quero melhorar ou documentar uma prática que já realizei.
                </p>
              </button>

              <button
                onClick={() => { update('flow_type', 'criar'); update('sub_flow', ''); }}
                className={`p-6 rounded-xl border-2 text-left transition ${
                  form.flow_type === 'criar'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">✨</div>
                <div className="font-semibold text-gray-900 text-lg">Quero criar do zero</div>
                <p className="text-sm text-gray-600 mt-1">
                  Quero uma prática nova para executar durante o ano.
                </p>
              </button>
            </div>

            {/* Sub-fluxo (só quando já tem prática) */}
            {form.flow_type === 'ja_tenho' && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-800 mb-3">O que você quer fazer com essa prática?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => update('sub_flow', 'melhorar')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      form.sub_flow === 'melhorar'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">🔧 Modelar e melhorar</div>
                    <p className="text-xs text-gray-600 mt-1">
                      A IA analisa e propõe melhorias concretas.
                    </p>
                  </button>

                  <button
                    onClick={() => update('sub_flow', 'documento')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      form.sub_flow === 'documento'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">📄 Documento para seminário</div>
                    <p className="text-xs text-gray-600 mt-1">
                      Organiza em formato para apresentar/premiar.
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 3 — CATEGORIA + CONTEXTO */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sobre a prática e o contexto</h2>
            <p className="text-gray-600 mb-6">Essas informações adaptam a prática à sua realidade.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {form.perfil === 'professor' && (
                  <>
                    <button
                      onClick={() => update('category', 'educacao_infantil')}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        form.category === 'educacao_infantil'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">🧸 Educação Infantil</div>
                    </button>
                    <button
                      onClick={() => update('category', 'ciclo_alfabetizacao')}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        form.category === 'ciclo_alfabetizacao'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">📖 Ciclo de Alfabetização</div>
                    </button>
                  </>
                )}
                {form.perfil === 'coordenador' && (
                  <button
                    onClick={() => update('category', 'gestao_escolar')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      form.category === 'gestao_escolar'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">🏫 Gestão Escolar</div>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escola</label>
                <input
                  type="text"
                  value={form.school}
                  onChange={(e) => update('school', e.target.value)}
                  placeholder="Nome da escola"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="Cidade"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GRE (Gerência Regional)</label>
                <input
                  type="text"
                  value={form.gre}
                  onChange={(e) => update('gre', e.target.value)}
                  placeholder="Ex: 1ª GRE"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Série / Etapa</label>
                <input
                  type="text"
                  value={form.grade}
                  onChange={(e) => update('grade', e.target.value)}
                  placeholder="Ex: 3º ano"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área / Disciplina</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  placeholder="Ex: Matemática"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº de alunos</label>
                <input
                  type="number"
                  value={form.num_alunos}
                  onChange={(e) => update('num_alunos', e.target.value)}
                  placeholder="Ex: 25"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 4 — PARTICULARIDADES */}
        {/* ============================================================ */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Particularidades</h2>
            <p className="text-gray-600 mb-6">
              Detalhes que fazem toda a diferença na qualidade da prática.
            </p>

            {/* Mudança de turma (só quando já tem prática) */}
            {form.flow_type === 'ja_tenho' && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.original_grade !== '' || form.target_grade !== ''}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        update('original_grade', '');
                        update('target_grade', '');
                      } else {
                        update('original_grade', form.grade || '');
                      }
                    }}
                    className="mt-0.5 w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-amber-900">
                      Vou aplicar esta prática em uma turma diferente
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      Ex: a prática foi feita para o 2º ano, mas este ano vou aplicar no 5º ano.
                    </p>
                  </div>
                </label>

                {(form.original_grade !== '' || form.target_grade !== '') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">
                        Ano original
                      </label>
                      <input
                        type="text"
                        value={form.original_grade}
                        onChange={(e) => update('original_grade', e.target.value)}
                        placeholder="Ex: 2º ano"
                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">
                        Novo ano-alvo
                      </label>
                      <input
                        type="text"
                        value={form.target_grade}
                        onChange={(e) => update('target_grade', e.target.value)}
                        placeholder="Ex: 5º ano"
                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Duração (só quando criar) */}
            {form.flow_type === 'criar' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração desejada</label>
                <select
                  value={form.duration}
                  onChange={(e) => update('duration', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Selecione...</option>
                  <option value="uma semana">Uma semana</option>
                  <option value="um mês">Um mês</option>
                  <option value="um bimestre">Um bimestre</option>
                  <option value="um semestre">Um semestre</option>
                  <option value="o ano todo">O ano todo</option>
                </select>
              </div>
            )}

            {/* Alunos com necessidades específicas */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.has_special_needs}
                  onChange={(e) => update('has_special_needs', e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <div>
                  <div className="text-sm font-semibold text-blue-900">
                    Há alunos com laudo ou que precisam de atenção especial?
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Ex: autismo, TDAH, dislexia, altas habilidades, dificuldades de leitura.
                    A IA integrará adaptações concretas na prática. <strong>Não fazemos diagnóstico.</strong>
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 5 — RELATO */}
        {/* ============================================================ */}
        {step === 5 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {form.flow_type === 'ja_tenho' ? 'Conte a sua prática' : 'Descreva sua ideia'}
            </h2>
            <p className="text-gray-600 mb-6">
              {form.flow_type === 'ja_tenho'
                ? 'Descreva a prática com o máximo de detalhes: o que fez, como, desafios, o que funcionou.'
                : 'Diga o que você quer alcançar, com qual turma e em quanto tempo.'}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título provisório *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Ex: Viajante da Leitura"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relato / Ideia * <span className="text-xs text-gray-500">(mínimo 50 caracteres)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows="10"
                placeholder={
                  form.flow_type === 'ja_tenho'
                    ? 'Conte como foi: contexto, o que você fez, como os alunos reagiram, o que funcionou, o que não funcionou...'
                    : 'Ex: Quero uma prática de matemática para trabalhar o ano todo no 3º ano, com foco em resolução de problemas e jogos...'
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {form.description.length} caracteres
              </p>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !podeAvancar()}
              className="mt-6 w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-teal-300 disabled:to-cyan-300 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg"
            >
              {loading ? 'Gerando prática (pode levar 1-2 minutos)...' : 'Gerar minha prática'}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* RESULTADO */}
        {/* ============================================================ */}
        {step === 6 && result && (
          <div>
            <div className="print:hidden flex flex-wrap gap-3 justify-between items-center mb-4">
              <button
                onClick={reiniciar}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                ← Criar outra prática
              </button>
              <button
                onClick={handleBaixarPDF}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
              >
                📥 Baixar PDF
              </button>
            </div>

            <div id="pratica-conteudo">
              <PraticaResultado data={result} />
            </div>
          </div>
        )}
      </div>

      {/* Botões de navegação entre etapas */}
      {step >= 1 && step <= 5 && (
        <div className="print:hidden mt-6 flex justify-between">
          <button
            onClick={voltar}
            disabled={step === 1}
            className="text-gray-600 hover:text-gray-800 disabled:opacity-40 text-sm font-medium"
          >
            ← Voltar
          </button>
          {step < 5 && (
            <button
              onClick={avancar}
              disabled={!podeAvancar()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Continuar →
            </button>
          )}
        </div>
      )}

      {error && step < 5 && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

// ============================================================
// RENDERIZAÇÃO DO RESULTADO
// ============================================================
const PraticaResultado = ({ data }) => {
  const sd = data.structured_data?.output || data.structured_data || {};
  const cab = sd.cabecalho || {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      {/* Cabeçalho */}
      <div className="border-b border-gray-100 pb-6 mb-6">
        <div className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          🏆 Prática Exitosa
        </div>
        <h2 className="text-3xl font-bold text-gray-900">{cab.titulo || data.title}</h2>
        {cab.subtitulo && (
          <p className="text-lg text-gray-600 mt-2 italic">{cab.subtitulo}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          {cab.perfil && <span>👤 {cab.perfil}</span>}
          {cab.categoria && <span>📂 {cab.categoria}</span>}
          {cab.escola && <span>🏫 {cab.escola}</span>}
          {cab.municipio && <span>📍 {cab.municipio}</span>}
          {cab.gre && <span>🗺️ {cab.gre}</span>}
          {cab.serie_ou_etapa && <span>🎓 {cab.serie_ou_etapa}</span>}
          {cab.disciplina_ou_area && <span>📚 {cab.disciplina_ou_area}</span>}
          {cab.duracao && <span>⏱️ {cab.duracao}</span>}
          {cab.num_alunos ? <span>👥 {cab.num_alunos} alunos</span> : null}
        </div>
      </div>

      {/* Resumo Executivo */}
      {sd.resumo_executivo && (
        <Section title="📌 Resumo Executivo">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{sd.resumo_executivo}</p>
        </Section>
      )}

      {/* Justificativa */}
      {sd.justificativa && (
        <Section title="💡 Justificativa">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{sd.justificativa}</p>
        </Section>
      )}

      {/* Objetivos */}
      {sd.objetivos && (
        <Section title="🎯 Objetivos">
          {sd.objetivos.geral && (
            <p className="text-gray-700 mb-3">
              <strong>Geral:</strong> {sd.objetivos.geral}
            </p>
          )}
          {sd.objetivos.especificos?.length > 0 && (
            <>
              <p className="font-medium text-gray-800 mb-2">Específicos:</p>
              <ul className="space-y-1.5 ml-4">
                {sd.objetivos.especificos.map((o, i) => (
                  <li key={i} className="text-gray-700 flex gap-2">
                    <span className="text-teal-600">•</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}

      {/* Metodologia */}
      {sd.metodologia && (
        <Section title="⚙️ Metodologia">
          {sd.metodologia.descricao_geral && (
            <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-line">
              {sd.metodologia.descricao_geral}
            </p>
          )}
          {sd.metodologia.etapas?.length > 0 && (
            <div className="space-y-4">
              {sd.metodologia.etapas.map((etapa, i) => (
                <div key={i} className="border-l-4 border-teal-400 pl-4 py-2">
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {etapa.numero}. {etapa.titulo}
                    </h4>
                    {etapa.duracao && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {etapa.duracao}
                      </span>
                    )}
                  </div>
                  {etapa.descricao && (
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{etapa.descricao}</p>
                  )}
                  {etapa.acao_do_educador && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong className="text-teal-700">Educador:</strong> {etapa.acao_do_educador}
                    </p>
                  )}
                  {etapa.acao_dos_estudantes && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong className="text-teal-700">Estudantes:</strong> {etapa.acao_dos_estudantes}
                    </p>
                  )}
                  {etapa.recursos_necessarios?.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      <strong>Recursos:</strong> {etapa.recursos_necessarios.join(', ')}
                    </p>
                  )}
                  {etapa.como_avaliar && (
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Avaliação:</strong> {etapa.como_avaliar}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Cronograma */}
      {sd.cronograma?.length > 0 && (
        <Section title="📅 Cronograma">
          <div className="space-y-3">
            {sd.cronograma.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-baseline mb-1">
                  <strong className="text-gray-800">{c.periodo}</strong>
                  <span className="text-xs text-gray-600">{c.foco}</span>
                </div>
                {c.atividades_principais?.length > 0 && (
                  <ul className="mt-2 space-y-1 ml-4">
                    {c.atividades_principais.map((a, j) => (
                      <li key={j} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-teal-600">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Adaptações Inclusivas */}
      {sd.adaptacoes_inclusivas?.length > 0 && (
        <Section title="🧩 Adaptações Inclusivas">
          <div className="space-y-3">
            {sd.adaptacoes_inclusivas.map((ad, i) => (
              <div key={i} className="border border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2">
                  <h4 className="font-semibold text-blue-900 text-sm">{ad.necessidade}</h4>
                </div>
                <ul className="p-4 space-y-1.5">
                  {ad.estrategias?.map((e, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Avaliação */}
      {sd.avaliacao && (
        <Section title="📊 Avaliação">
          {sd.avaliacao.instrumentos?.length > 0 && (
            <div className="mb-3">
              <p className="font-medium text-gray-800 mb-1">Instrumentos:</p>
              <ul className="space-y-1 ml-4">
                {sd.avaliacao.instrumentos.map((it, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-teal-600">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sd.avaliacao.indicadores_de_sucesso?.length > 0 && (
            <div className="mb-3">
              <p className="font-medium text-gray-800 mb-1">Indicadores de sucesso:</p>
              <ul className="space-y-1 ml-4">
                {sd.avaliacao.indicadores_de_sucesso.map((it, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-teal-600">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sd.avaliacao.como_registrar_evidencias?.length > 0 && (
            <div>
              <p className="font-medium text-gray-800 mb-1">Como registrar evidências:</p>
              <ul className="space-y-1 ml-4">
                {sd.avaliacao.como_registrar_evidencias.map((it, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-teal-600">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Resultados Esperados */}
      {sd.resultados_esperados?.length > 0 && (
        <Section title="🌟 Resultados Esperados">
          <ul className="space-y-1.5 ml-4">
            {sd.resultados_esperados.map((r, i) => (
              <li key={i} className="text-gray-700 flex gap-2">
                <span className="text-teal-600">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Dicas de Aprimoramento */}
      {sd.dicas_de_aprimoramento?.length > 0 && (
        <Section title="💬 Dicas de Aprimoramento">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <ul className="space-y-1.5">
              {sd.dicas_de_aprimoramento.map((d, i) => (
                <li key={i} className="text-sm text-amber-900 flex gap-2">
                  <span className="text-amber-600">→</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* Referências Regionais */}
      {sd.referencias_regionais?.length > 0 && (
        <Section title="🗺️ Referências Regionais">
          <ul className="space-y-1.5 ml-4">
            {sd.referencias_regionais.map((r, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-teal-600">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
};

// ============================================================
// COMPONENTE DE SEÇÃO
// ============================================================
const Section = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    {children}
  </div>
);

export default PraticasExitosas;