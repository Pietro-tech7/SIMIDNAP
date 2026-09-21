import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { gerarPDF } from '../utils/pdf';
import LatexText from '../components/LatexText';

const BancoQuestoes = () => {
  // ============================================================
  // FILTROS DISPONÍVEIS (para os selects)
  // ============================================================
  const [filtros, setFiltros] = useState({
    fontes: [],
    anos: [],
    etapas: [],
    areas: [],
    disciplinas: [],
  });

  // ============================================================
  // FILTROS APLICADOS
  // ============================================================
  const [filtroFonte, setFiltroFonte] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [busca, setBusca] = useState('');

  // ============================================================
  // RESULTADOS DA BUSCA
  // ============================================================
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // ============================================================
  // SELEÇÃO DE QUESTÕES
  // ============================================================
  const [selecionadas, setSelecionadas] = useState([]); // IDs

  // ============================================================
  // MODAL DE VISUALIZAÇÃO
  // ============================================================
  const [questaoAberta, setQuestaoAberta] = useState(null);
  const [loadingQuestao, setLoadingQuestao] = useState(false);

  // ============================================================
  // GERAÇÃO DE SIMULADO
  // ============================================================
  const [modalGerar, setModalGerar] = useState(false);
  const [tituloSimulado, setTituloSimulado] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [incluirCabecalho, setIncluirCabecalho] = useState(true);
  const [gerando, setGerando] = useState(false);

  // ============================================================
  // CARREGAR FILTROS NA ENTRADA
  // ============================================================
  useEffect(() => {
    api.get('/questions/filters')
      .then(res => setFiltros(res.data))
      .catch(() => {});
  }, []);

  // ============================================================
  // BUSCAR QUANDO FILTROS MUDAM
  // ============================================================
  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const buscar = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 20 };
      if (filtroFonte) params.fonte = filtroFonte;
      if (filtroAno) params.ano = filtroAno;
      if (filtroEtapa) params.etapa = filtroEtapa;
      if (filtroArea) params.area = filtroArea;
      if (filtroDisciplina) params.disciplina = filtroDisciplina;
      if (busca.trim()) params.busca = busca.trim();

      const res = await api.get('/questions', { params });
      setResultados(res.data);
    } catch (err) {
      setError('Erro ao buscar questões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e?.preventDefault();
    setPage(1);
    buscar();
  };

  const limparFiltros = () => {
    setFiltroFonte('');
    setFiltroAno('');
    setFiltroEtapa('');
    setFiltroArea('');
    setFiltroDisciplina('');
    setBusca('');
    setPage(1);
    setTimeout(buscar, 50);
  };

  // ============================================================
  // ABRIR QUESTÃO COMPLETA
  // ============================================================
  const abrirQuestao = async (id) => {
    setLoadingQuestao(true);
    setQuestaoAberta(null);
    try {
      const res = await api.get(`/questions/${id}`);
      setQuestaoAberta(res.data);
    } catch (err) {
      alert('Erro ao carregar questão.');
    } finally {
      setLoadingQuestao(false);
    }
  };

  // ============================================================
  // SELEÇÃO
  // ============================================================
  const toggleSelecionada = (id) => {
    setSelecionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const limparSelecao = () => setSelecionadas([]);

  // ============================================================
  // GERAR SIMULADO
  // ============================================================
  const handleGerarSimulado = async () => {
    if (!tituloSimulado.trim()) {
      alert('Dê um título ao simulado.');
      return;
    }
    setGerando(true);
    try {
      const res = await api.post('/questions/generate-simulado', {
        title: tituloSimulado,
        question_ids: selecionadas,
        show_gabarito: incluirGabarito,
        include_header: incluirCabecalho,
        instructions: instrucoes.trim() || null,
      });
      setModalGerar(false);
      // Aguarda render do DOM
      setTimeout(() => gerarPdfDoSimulado(res.data), 100);
    } catch (err) {
      if (err?.response?.status === 402) {
        alert('Créditos insuficientes. Faça upgrade do seu plano.');
      } else {
        alert('Erro ao gerar simulado. Tente novamente.');
      }
    } finally {
      setGerando(false);
    }
  };

  const gerarPdfDoSimulado = async (data) => {
    // Cria um container temporário fora da tela com o simulado
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.background = '#ffffff';
    container.style.padding = '40px';
    container.innerHTML = montarHtmlSimulado(data);
    document.body.appendChild(container);

    try {
      await gerarPDF(container, data.title.replace(/\s+/g, '_'));
    } catch (err) {
      alert('Erro ao gerar PDF do simulado.');
    } finally {
      document.body.removeChild(container);
    }
  };

  const montarHtmlSimulado = (data) => {
    const qs = data.questions.map(q => {
      const alternativas = (q.alternativas || [])
        .map(a => `<div style="margin-left: 20px;">(${a.letra}) ${a.texto || ''}</div>`)
        .join('');
      return `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="font-weight: bold; margin-bottom: 6px;">Questão ${q.numero} (${q.fonte} ${q.ano})</div>
          <div style="margin-bottom: 10px;">${q.enunciado}</div>
          ${alternativas}
        </div>
      `;
    }).join('');

    const gabarito = data.show_gabarito ? `
      <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 16px;">
        <h3 style="margin-bottom: 12px;">GABARITO</h3>
        ${data.questions.map(q => `<div>Questão ${q.numero}: <strong>${q.gabarito || '—'}</strong></div>`).join('')}
      </div>
    ` : '';

    const cabecalho = data.include_header ? `
      <div style="border-bottom: 2px solid #009; padding-bottom: 12px; margin-bottom: 20px;">
        <div style="font-size: 24px; font-weight: bold; color: #009;">SIMIDNAPE PRO</div>
        <div style="font-size: 14px; color: #666;">O Professor Inesquecível</div>
      </div>
      <div style="margin-bottom: 24px;">
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${data.title}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 16px;">${data.total_questoes} questões</div>
        <div style="border: 1px solid #ccc; padding: 12px; font-size: 12px;">
          <div>Nome: _________________________________________________</div>
          <div style="margin-top: 8px;">Turma: ____________  Data: ____/____/______</div>
        </div>
      </div>
      ${data.instructions ? `<div style="background: #f5f5f5; padding: 12px; margin-bottom: 20px; font-size: 12px;">${data.instructions}</div>` : ''}
    ` : '';

    return `${cabecalho}${qs}${gabarito}`;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/modulo/banco_questoes" className="text-blue-600 text-sm hover:underline print:hidden">
        ← Voltar
      </Link>

      <div className="mt-6 mb-8 flex items-center gap-3 print:hidden">
        <span className="text-4xl">📚</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
          <p className="text-gray-600">
            Busque questões oficiais do ENEM e monte seus simulados.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FILTROS */}
      {/* ============================================================ */}
      <form onSubmit={handleBuscar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fonte</label>
            <select
              value={filtroFonte}
              onChange={(e) => setFiltroFonte(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {filtros.fontes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {filtros.anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <select
              value={filtroEtapa}
              onChange={(e) => setFiltroEtapa(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {filtros.etapas.map(e => (
                <option key={e} value={e}>
                  {e === 'EM' ? 'Ensino Médio' : e === 'EF' ? 'Ensino Fundamental' : e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {filtros.areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
            <select
              value={filtroDisciplina}
              onChange={(e) => setFiltroDisciplina(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {filtros.disciplinas.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Busca textual</label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex: 'fotossíntese', 'revolução francesa', 'equação de 2º grau'..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            {loading ? 'Buscando...' : '🔍 Buscar'}
          </button>
          <button
            type="button"
            onClick={limparFiltros}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-2 rounded-lg border border-gray-300 transition"
          >
            Limpar
          </button>
        </div>
      </form>

      {/* ============================================================ */}
      {/* BARRA DE SELEÇÃO */}
      {/* ============================================================ */}
      {selecionadas.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-teal-900">
            <strong>{selecionadas.length}</strong> questão(ões) selecionada(s)
          </div>
          <div className="flex gap-2">
            <button
              onClick={limparSelecao}
              className="text-teal-700 hover:text-teal-900 text-sm font-medium"
            >
              Limpar seleção
            </button>
            <button
              onClick={() => {
                setTituloSimulado('');
                setInstrucoes('');
                setModalGerar(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              📄 Gerar Simulado
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* RESULTADOS */}
      {/* ============================================================ */}
      {error && <p className="text-red-500 text-sm mb-4 print:hidden">{error}</p>}

      {resultados && (
        <>
          <div className="text-sm text-gray-600 mb-4 print:hidden">
            <strong>{resultados.total}</strong> questão(ões) encontrada(s)
            {resultados.total_pages > 1 && ` • Página ${resultados.page} de ${resultados.total_pages}`}
          </div>

          {resultados.items.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 print:hidden">
              Nenhuma questão encontrada. Tente ajustar os filtros.
            </div>
          ) : (
            <div className="space-y-3 print:hidden">
              {resultados.items.map(q => (
                <div
                  key={q.id}
                  className={`bg-white border-2 rounded-lg p-4 transition ${
                    selecionadas.includes(q.id)
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selecionadas.includes(q.id)}
                      onChange={() => toggleSelecionada(q.id)}
                      className="mt-1 w-5 h-5 text-teal-600 rounded focus:ring-teal-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                          {q.fonte} {q.ano}
                        </span>
                        {q.disciplina && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                            {q.disciplina}
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          Q{q.numero}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line mb-2">
                        {q.preview}
                      </p>
                      <button
                        onClick={() => abrirQuestao(q.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver completa →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {resultados.total_pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6 print:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {resultados.page} de {resultados.total_pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(resultados.total_pages, p + 1))}
                disabled={page === resultados.total_pages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* MODAL: QUESTÃO COMPLETA */}
      {/* ============================================================ */}
      {(questaoAberta || loadingQuestao) && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto print:hidden">
          <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setQuestaoAberta(null)}
                  className="text-white hover:text-gray-300 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              {loadingQuestao && (
                <div className="bg-white rounded-xl p-12 text-center">
                  <p className="text-gray-500">Carregando questão...</p>
                </div>
              )}

              {questaoAberta && (
                <div className="bg-white rounded-xl p-6 md:p-8">
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                        {questaoAberta.fonte} {questaoAberta.ano}
                      </span>
                      {questaoAberta.disciplina && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                          {questaoAberta.disciplina}
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Questão {questaoAberta.numero}
                      </span>
                    </div>
                  </div>

                  <div className="text-gray-800 mb-6 leading-relaxed">
                    <LatexText text={questaoAberta.enunciado} />
                  </div>

                  {questaoAberta.imagem_url && (
                    <div className="mb-4">
                      <img
                        src={questaoAberta.imagem_url}
                        alt="Imagem da questão"
                        className="max-w-full rounded border border-gray-200"
                      />
                    </div>
                  )}

                  {questaoAberta.alternativas?.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {questaoAberta.alternativas.map((a, i) => (
                        <div key={i} className="flex gap-3 text-gray-700">
                          <span className="font-bold text-blue-600 flex-shrink-0">
                            ({a.letra})
                          </span>
                          <div className="flex-1">
                            <LatexText text={a.texto} />
                            {a.imagem_url && (
                              <img
                                src={a.imagem_url}
                                alt={`Alternativa ${a.letra}`}
                                className="mt-2 max-w-full rounded border border-gray-200"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {questaoAberta.gabarito && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-900">
                        <strong>Gabarito:</strong> {questaoAberta.gabarito}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: GERAR SIMULADO */}
      {/* ============================================================ */}
      {modalGerar && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto print:hidden">
          <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerar Simulado</h2>
              <p className="text-sm text-gray-600 mb-6">
                {selecionadas.length} questões selecionadas. Custo: <strong>1 crédito</strong>.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={tituloSimulado}
                  onChange={(e) => setTituloSimulado(e.target.value)}
                  placeholder="Ex: Simulado ENEM — Matemática 2023"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instruções para os alunos (opcional)
                </label>
                <textarea
                  value={instrucoes}
                  onChange={(e) => setInstrucoes(e.target.value)}
                  rows="2"
                  placeholder="Ex: Leia com atenção. Marque apenas uma alternativa."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="mb-6 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={incluirCabecalho}
                    onChange={(e) => setIncluirCabecalho(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Incluir cabeçalho com logo SIMIDNAPE PRO + campos para nome/turma/data
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={incluirGabarito}
                    onChange={(e) => setIncluirGabarito(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Incluir gabarito no final
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setModalGerar(false)}
                  disabled={gerando}
                  className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGerarSimulado}
                  disabled={gerando || !tituloSimulado.trim()}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  {gerando ? 'Gerando...' : 'Gerar PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BancoQuestoes;