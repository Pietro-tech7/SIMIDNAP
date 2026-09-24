import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import LatexText from '../components/LatexText';

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
const REFERENCIAIS = [
  { value: '', label: 'Todos' },
  { value: 'bncc', label: 'BNCC' },
  { value: 'curriculo_piaui', label: 'Currículo do Piauí' },
  { value: 'saeb', label: 'SAEB' },
  { value: 'saepi', label: 'SAEPI' },
  { value: 'ppaic', label: 'PPAIC' },
];

const ORIGENS = [
  { value: '', label: 'Todas' },
  { value: 'importada', label: 'Oficial' },
  { value: 'gerada_ia', label: 'Gerada por IA' },
  { value: 'colaborador', label: 'Colaborador' },
];

const ETAPAS = [
  { value: '', label: 'Todas' },
  { value: 'EI', label: 'Educação Infantil' },
  { value: 'EF', label: 'Ensino Fundamental' },
];

const ANOS_EF = [1,2,3,4,5,6,7,8,9];


// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
const BancoQuestoesFundamental = () => {
  const [etapa, setEtapa] = useState('');
  const [ano, setAno] = useState('');
  const [componente, setComponente] = useState('');
  const [referencial, setReferencial] = useState('');
  const [habilidadeCodigo, setHabilidadeCodigo] = useState('');
  const [origem, setOrigem] = useState('');
  const [busca, setBusca] = useState('');

  const [componentes, setComponentes] = useState([]);
  const [habilidadesDisponiveis, setHabilidadesDisponiveis] = useState([]);

  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [selecionadas, setSelecionadas] = useState([]);
  const [questaoAberta, setQuestaoAberta] = useState(null);
  const [loadingQuestao, setLoadingQuestao] = useState(false);
  const [modalMontar, setModalMontar] = useState(false);

  // Carrega componentes
  useEffect(() => {
    const etapaEscolhida = etapa || 'EF';
    api.get(`/bncc/componentes?etapa=${etapaEscolhida}`)
      .then(res => setComponentes(res.data || []))
      .catch(() => setComponentes([]));
  }, [etapa]);

  // Carrega habilidades disponíveis
  useEffect(() => {
    if (!etapa && !componente && !ano) {
      setHabilidadesDisponiveis([]);
      return;
    }
    const params = {};
    if (etapa) params.etapa = etapa;
    if (componente) params.componente = componente;
    if (ano) params.ano = ano;

    api.get('/question-bank/habilidades-disponiveis', { params })
      .then(res => setHabilidadesDisponiveis(res.data.items || []))
      .catch(() => setHabilidadesDisponiveis([]));
  }, [etapa, componente, ano]);

  // Busca
  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const buscar = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 20, aprovadas_apenas: true };
      if (etapa) params.etapa = etapa;
      if (ano) params.ano = ano;
      if (componente) params.componente = componente;
      if (referencial) params.referencial = referencial;
      if (habilidadeCodigo) params.habilidade_codigo = habilidadeCodigo;
      if (origem) params.origem = origem;
      if (busca.trim()) params.busca = busca.trim();

      const res = await api.get('/question-bank/search', { params });
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
    setEtapa(''); setAno(''); setComponente(''); setReferencial('');
    setHabilidadeCodigo(''); setOrigem(''); setBusca('');
    setPage(1);
    setTimeout(buscar, 50);
  };

  const abrirQuestao = async (id) => {
    setLoadingQuestao(true);
    setQuestaoAberta(null);
    try {
      const res = await api.get(`/questions/${id}`);
      setQuestaoAberta(res.data);
    } catch {
      alert('Erro ao carregar questão.');
    } finally {
      setLoadingQuestao(false);
    }
  };

  const toggleSelecionada = (id) => {
    setSelecionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const limparSelecao = () => setSelecionadas([]);

  const handleMontarProva = () => {
    if (selecionadas.length === 0) {
      alert('Selecione ao menos 1 questão.');
      return;
    }
    setModalMontar(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">
        ← Voltar
      </Link>

      <div className="mt-6 mb-8 flex items-center gap-3">
        <span className="text-4xl">📚</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
          <p className="text-gray-600">
            Questões para Educação Infantil e Ensino Fundamental — alinhadas à BNCC, ao Currículo do Piauí, ao SAEB e ao SAEPI.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
        <h3 className="text-blue-900 font-semibold mb-2">📚 O que você encontra aqui</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Questões para <strong>Educação Infantil e Ensino Fundamental</strong></li>
          <li>Alinhadas à <strong>BNCC</strong> e ao <strong>Currículo do Piauí</strong></li>
          <li>Referenciais <strong>SAEB</strong>, <strong>SAEPI</strong> e <strong>PPAIC</strong></li>
          <li>Monte a prova escolhendo as questões — o sistema organiza o PDF</li>
          <li>Cabeçalho personalizável (escola, GRE, logos, dados do aluno)</li>
        </ul>
      </div>

      <form onSubmit={handleBuscar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <select
              value={etapa}
              onChange={(e) => { setEtapa(e.target.value); setAno(''); setComponente(''); setHabilidadeCodigo(''); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {ETAPAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          {etapa === 'EF' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select
                value={ano}
                onChange={(e) => { setAno(e.target.value); setHabilidadeCodigo(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {ANOS_EF.map(a => <option key={a} value={a}>{a}º ano</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Componente</label>
            <select
              value={componente}
              onChange={(e) => { setComponente(e.target.value); setHabilidadeCodigo(''); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {componentes.map(c => <option key={c.codigo} value={c.codigo}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencial</label>
            <select
              value={referencial}
              onChange={(e) => setReferencial(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {REFERENCIAIS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {ORIGENS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {habilidadesDisponiveis.length > 0 && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Habilidade ({habilidadesDisponiveis.length} disponíveis)
              </label>
              <select
                value={habilidadeCodigo}
                onChange={(e) => setHabilidadeCodigo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                {habilidadesDisponiveis.map(h => (
                  <option key={h.codigo} value={h.codigo}>
                    {h.codigo} — {h.total_questoes} questão(ões)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Busca textual</label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex: 'frações', 'animais', 'família'..."
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

      {selecionadas.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-teal-900">
            <strong>{selecionadas.length}</strong> questão(ões) selecionada(s)
          </div>
          <div className="flex gap-2">
            <button onClick={limparSelecao} className="text-teal-700 hover:text-teal-900 text-sm font-medium">
              Limpar seleção
            </button>
            <button onClick={handleMontarProva} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition">
              📄 Montar Prova
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {resultados && (
        <>
          <div className="text-sm text-gray-600 mb-4">
            <strong>{resultados.total}</strong> questão(ões) encontrada(s)
            {resultados.total_pages > 1 && ` • Página ${resultados.page} de ${resultados.total_pages}`}
          </div>

          {resultados.items.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
              Nenhuma questão encontrada. Tente ajustar os filtros.
            </div>
          ) : (
            <div className="space-y-3">
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
                        {q.etapa && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {q.etapa === 'EF' ? 'Fund. ' + (q.ano ? q.ano + 'º ano' : '') : q.etapa === 'EI' ? 'Educação Infantil' : q.etapa}
                          </span>
                        )}
                        {q.disciplina && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                            {q.disciplina}
                          </span>
                        )}
                        {q.referencial && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                            {q.referencial.toUpperCase()}
                          </span>
                        )}
                        {q.origem && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            {q.origem === 'gerada_ia' ? 'IA' : q.origem === 'colaborador' ? 'Colaborador' : 'Oficial'}
                          </span>
                        )}
                        {q.habilidade_codigo && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-mono">
                            {q.habilidade_codigo}
                          </span>
                        )}
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

          {resultados.total_pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
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

      {(questaoAberta || loadingQuestao) && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">
          <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-end mb-4">
                <button onClick={() => setQuestaoAberta(null)} className="text-white hover:text-gray-300 text-3xl leading-none">×</button>
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
                      {questaoAberta.disciplina && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                          {questaoAberta.disciplina}
                        </span>
                      )}
                      {questaoAberta.numero && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Questão {questaoAberta.numero}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-gray-800 mb-6 leading-relaxed">
                    <LatexText text={questaoAberta.enunciado} />
                  </div>

                  {questaoAberta.imagem_url && (
                    <div className="mb-4">
                      <img src={questaoAberta.imagem_url} alt="Imagem da questão" className="max-w-full rounded border border-gray-200" />
                    </div>
                  )}

                  {questaoAberta.alternativas?.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {questaoAberta.alternativas.map((a, i) => (
                        <div key={i} className="flex gap-3 text-gray-700">
                          <span className="font-bold text-blue-600 flex-shrink-0">({a.letra})</span>
                          <div className="flex-1"><LatexText text={a.texto} /></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {questaoAberta.gabarito && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-900"><strong>Gabarito:</strong> {questaoAberta.gabarito}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalMontar && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">
          <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Montar Prova</h2>
              <p className="text-sm text-gray-600 mb-6">
                <strong>{selecionadas.length}</strong> questão(ões) selecionada(s).
              </p>
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4 text-sm mb-6">
                ⚙️ <strong>Editor de cabeçalho e geração de PDF</strong> chegam nos próximos blocos.
              </div>
              <button
                onClick={() => setModalMontar(false)}
                className="w-full border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BancoQuestoesFundamental;