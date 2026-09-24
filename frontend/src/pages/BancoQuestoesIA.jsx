import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import LatexText from '../components/LatexText';

const ETAPAS = [
  { value: 'EF', label: 'Ensino Fundamental' },
  { value: 'EI', label: 'Educação Infantil' },
];

const REFERENCIAIS = [
  { value: 'bncc', label: 'BNCC' },
  { value: 'curriculo_piaui', label: 'Currículo do Piauí' },
  { value: 'saeb', label: 'SAEB' },
  { value: 'saepi', label: 'SAEPI' },
  { value: 'ppaic', label: 'PPAIC' },
];

const NIVEIS_BLOOM = ['Lembrar', 'Compreender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'];
const ANOS_EF = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const DESCRITORES_MATEMATICA = ['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D14','D15','D16','D17','D18','D19','D20','D21','D22','D23','D24','D25','D26','D27','D28','D29','D30','D31','D32','D33'];
const DESCRITORES_LP = ['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D14','D15','D16','D17','D18','D19','D20','D21'];

const BATCH_SIZE = 4; // Deve ser igual ao backend


const BancoQuestoesIA = () => {
  const { user } = useAuth();

  // FORM
  const [titulo, setTitulo] = useState('');
  const [etapa, setEtapa] = useState('EF');
  const [ano, setAno] = useState(2);
  const [componente, setComponente] = useState('MA');
  const [referencial, setReferencial] = useState('bncc');
  const [incluirIlustracoes, setIncluirIlustracoes] = useState(true);

  // HABILIDADES
  const [habilidades, setHabilidades] = useState([
    { codigo: '', texto: '', descritores: [], nivel_cognitivo: 'Aplicar', quantidade: 2, busca: '' },
  ]);

  // LISTAS
  const [componentes, setComponentes] = useState([]);
  const [habilidadesDisponiveis, setHabilidadesDisponiveis] = useState([]);

  // WORKFLOW
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [pool, setPool] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [minhasQuestoes, setMinhasQuestoes] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // CARREGAR COMPONENTES
  useEffect(() => {
    api.get(`/bncc/componentes?etapa=${etapa}`)
      .then(res => setComponentes(res.data || []))
      .catch(() => setComponentes([]));
  }, [etapa]);

  // CARREGAR HABILIDADES
  useEffect(() => {
    if (!componente) { setHabilidadesDisponiveis([]); return; }
    const params = { etapa, componente };
    if (etapa === 'EF' && ano) params.ano = ano;
    if (user?.estado) params.estado = user.estado;

    api.get('/bncc/habilidades', { params })
      .then(res => setHabilidadesDisponiveis(res.data || []))
      .catch(() => setHabilidadesDisponiveis([]));
  }, [etapa, ano, componente, user?.estado]);

  // CUSTO
  const totalQuestoes = habilidades.reduce((s, h) => s + (Number(h.quantidade) || 0), 0);
  const custo = totalQuestoes <= 10 ? 1 : totalQuestoes <= 20 ? 2 : totalQuestoes <= 30 ? 3 : totalQuestoes <= 45 ? 4 : 5;

  // FILTRAR HABILIDADES
  const filtrarHabilidades = (busca) => {
    if (!busca || !busca.trim()) return habilidadesDisponiveis;
    const termo = busca.toLowerCase().trim();
    return habilidadesDisponiveis.filter(h =>
      (h.codigo || '').toLowerCase().includes(termo) ||
      (h.texto || '').toLowerCase().includes(termo)
    );
  };

  // AÇÕES DAS HABILIDADES
  const adicionarHabilidade = () => {
    setHabilidades(prev => [
      ...prev,
      { codigo: '', texto: '', descritores: [], nivel_cognitivo: 'Aplicar', quantidade: 1, busca: '' },
    ]);
  };

  const removerHabilidade = (index) => {
    if (habilidades.length === 1) { alert('Mantenha ao menos 1 habilidade.'); return; }
    setHabilidades(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarHabilidade = (index, campo, valor) => {
    setHabilidades(prev => prev.map((h, i) => {
      if (i !== index) return h;
      const nova = { ...h, [campo]: valor };
      if (campo === 'codigo') {
        const hab = habilidadesDisponiveis.find(x => x.codigo === valor);
        if (hab) {
          nova.texto = hab.texto || '';
          nova.complemento_pi = (hab.complementos_pi && hab.complementos_pi[0]?.texto) || null;
        }
      }
      return nova;
    }));
  };

  const toggleDescritor = (index, descritor) => {
    setHabilidades(prev => prev.map((h, i) => {
      if (i !== index) return h;
      const lista = h.descritores || [];
      return {
        ...h,
        descritores: lista.includes(descritor)
          ? lista.filter(d => d !== descritor)
          : [...lista, descritor],
      };
    }));
  };

  const descritoresDisponiveis = () => {
    if (componente === 'MA') return DESCRITORES_MATEMATICA;
    if (componente === 'LP') return DESCRITORES_LP;
    return [];
  };

  // ============================================================
  // GERAR EM LOTES SEQUENCIAIS (NOVO)
  // ============================================================
  const gerarQuestoes = async () => {
    setErro(''); setSucesso('');
    if (!titulo.trim()) { setErro('Dê um título à prova.'); return; }
    for (let i = 0; i < habilidades.length; i++) {
      const h = habilidades[i];
      if (!h.codigo) { setErro(`Habilidade ${i + 1}: selecione um código.`); return; }
      if (!h.quantidade || h.quantidade < 1) { setErro(`Habilidade ${i + 1}: quantidade inválida.`); return; }
    }
    if (totalQuestoes < 1) { setErro('Adicione ao menos 1 questão.'); return; }
    if (totalQuestoes > 60) { setErro('Máximo de 60 questões por geração.'); return; }

    setGerando(true);
    setProgresso({ atual: 0, total: totalQuestoes });

    const payload = {
      titulo: titulo.trim(),
      etapa,
      ano: etapa === 'EF' ? Number(ano) : null,
      componente,
      disciplina_nome: componentes.find(c => c.codigo === componente)?.nome || componente,
      referencial,
      estado: user?.estado || null,
      incluir_ilustracoes: incluirIlustracoes,
      compartilhar_curadoria: true,
      habilidades: habilidades.map(h => ({
        codigo: h.codigo,
        texto: h.texto,
        complemento_pi: h.complemento_pi || null,
        descritores: h.descritores || [],
        nivel_cognitivo: h.nivel_cognitivo,
        quantidade: Number(h.quantidade),
      })),
    };

    const questoesAcumuladas = [];

    try {
      // Loop de lotes sequenciais
      let batchStart = 1;
      while (batchStart <= totalQuestoes) {
        const res = await api.post(
          `/question-ia/gerar?batch_start=${batchStart}`,
          payload,
        );

        if (res.data?.sucesso && res.data?.questoes?.length > 0) {
          const novas = res.data.questoes.map((q, i) => ({
            ...q,
            _localId: `pool-${Date.now()}-${batchStart + i}`,
          }));
          questoesAcumuladas.push(...novas);
          setProgresso({ atual: questoesAcumuladas.length, total: totalQuestoes });

          // Adiciona ao pool incrementalmente (feedback visual)
          setPool(prev => [...prev, ...novas]);
        } else {
          throw new Error(res.data?.mensagem || 'A IA não retornou questões.');
        }

        batchStart += BATCH_SIZE;
      }

      setSucesso(`${questoesAcumuladas.length} questão(ões) gerada(s). Selecione as que deseja manter abaixo.`);
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (err) {
      if (err?.response?.status === 402) {
        setErro('Créditos insuficientes. Faça upgrade do seu plano.');
      } else {
        setErro(err?.response?.data?.detail || err?.message || 'Erro ao gerar questões. Tente novamente.');
      }
    } finally {
      setGerando(false);
      setProgresso({ atual: 0, total: 0 });
    }
  };

  // SELEÇÃO DO POOL
  const togglePool = (localId) => {
    setSelecionadas(prev =>
      prev.includes(localId) ? prev.filter(x => x !== localId) : [...prev, localId]
    );
  };

  const selecionarTodas = () => setSelecionadas(pool.map(q => q._localId));
  const limparSelecao = () => setSelecionadas([]);

  const adicionarSelecionadas = () => {
    if (selecionadas.length === 0) { alert('Selecione ao menos 1 questão.'); return; }
    const novas = pool.filter(q => selecionadas.includes(q._localId));
    setMinhasQuestoes(prev => [...prev, ...novas]);
    setPool(prev => prev.filter(q => !selecionadas.includes(q._localId)));
    setSelecionadas([]);
  };

  const descartarSelecionadas = () => {
    if (selecionadas.length === 0) { alert('Selecione ao menos 1 questão.'); return; }
    if (!window.confirm(`Descartar ${selecionadas.length} questão(ões)?`)) return;
    setPool(prev => prev.filter(q => !selecionadas.includes(q._localId)));
    setSelecionadas([]);
  };

  const descartarPool = () => {
    if (!window.confirm('Descartar TODAS as questões do pool?')) return;
    setPool([]);
    setSelecionadas([]);
  };

  const removerDaMinhas = (localId) => {
    setMinhasQuestoes(prev => prev.filter(q => q._localId !== localId));
  };

  const gerarPDF = async () => {
    if (minhasQuestoes.length === 0) { alert('Você ainda não selecionou questões.'); return; }
    setSucesso('Funcionalidade de PDF será implementada no próximo bloco.');
  };

  // PROGRESSO (%)
  const pctProgresso = progresso.total > 0
    ? Math.round((progresso.atual / progresso.total) * 100)
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">← Voltar</Link>

      <div className="mt-6 mb-8 flex items-center gap-3">
        <span className="text-4xl">✨</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões IA</h1>
          <p className="text-gray-600">Gere questões inéditas com IA — BNCC, Currículo do Piauí, SAEB e SAEPI.</p>
        </div>
      </div>

      {/* PASSO 1 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Passo 1 — Identificação</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título da prova *</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Avaliação de Matemática — Maio/2026"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <select value={etapa} onChange={(e) => setEtapa(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {ETAPAS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          {etapa === 'EF' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ANOS_EF.map(a => <option key={a} value={a}>{a}º ano</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Componente</label>
            <select value={componente} onChange={(e) => setComponente(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecione...</option>
              {componentes.map(c => <option key={c.codigo} value={c.codigo}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencial</label>
            <select value={referencial} onChange={(e) => setReferencial(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {REFERENCIAIS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* PASSO 2 — HABILIDADES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📚 Passo 2 — Habilidades e Descritores</h2>

        <div className="space-y-4">
          {habilidades.map((h, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">Habilidade {index + 1}</span>
                {habilidades.length > 1 && (
                  <button type="button" onClick={() => removerHabilidade(index)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium">🗑️ Remover</button>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  🔍 Busque por código (EF02MA01) ou por texto ("números")
                </label>
                <input type="text" value={h.busca || ''}
                  onChange={(e) => atualizarHabilidade(index, 'busca', e.target.value)}
                  placeholder="Digite para filtrar as habilidades..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Código da habilidade * ({filtrarHabilidades(h.busca).length} disponíveis)
                  </label>
                  <select value={h.codigo}
                    onChange={(e) => atualizarHabilidade(index, 'codigo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Selecione...</option>
                    {filtrarHabilidades(h.busca).map(hab => (
                      <option key={hab.codigo} value={hab.codigo}>
                        {hab.codigo} — {(hab.texto || '').slice(0, 60)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade *</label>
                  <input type="number" min="1" max="20" value={h.quantidade}
                    onChange={(e) => atualizarHabilidade(index, 'quantidade', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {h.texto && (
                <div className="text-xs text-gray-600 bg-white rounded p-2 mb-3 border border-gray-100">
                  <strong>Texto:</strong> {h.texto}
                </div>
              )}
              {h.complemento_pi && (
                <div className="text-xs text-amber-800 bg-amber-50 rounded p-2 mb-3 border border-amber-100">
                  <strong>📌 Complemento Piauí:</strong> {h.complemento_pi}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nível cognitivo (Bloom)</label>
                  <select value={h.nivel_cognitivo}
                    onChange={(e) => atualizarHabilidade(index, 'nivel_cognitivo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    {NIVEIS_BLOOM.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {descritoresDisponiveis().length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Descritores ({h.descritores?.length || 0} selecionados)
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                      {descritoresDisponiveis().map(d => (
                        <button key={d} type="button" onClick={() => toggleDescritor(index, d)}
                          className={`text-xs px-2 py-0.5 rounded font-mono ${
                            h.descritores?.includes(d)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}>{d}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button type="button" onClick={adicionarHabilidade}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm">
            ➕ Adicionar outra habilidade
          </button>
        </div>
      </div>

      {/* PASSO 3 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🎨 Passo 3 — Opções</h2>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={incluirIlustracoes}
            onChange={(e) => setIncluirIlustracoes(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded" />
          Incluir sugestões de ilustrações nas questões
        </label>
      </div>

      {/* RESUMO E BOTÃO */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-200">Resumo</p>
            <p className="text-2xl font-bold">{totalQuestoes} questão(ões)</p>
            <p className="text-sm text-purple-100 mt-1">Custo: <strong>{custo} crédito(s)</strong></p>
            <p className="text-xs text-purple-200 mt-1">
              Gerado em lotes de {BATCH_SIZE} para maior confiabilidade
            </p>
          </div>
          <button onClick={gerarQuestoes} disabled={gerando || totalQuestoes < 1}
            className="bg-white text-purple-700 hover:bg-purple-50 disabled:bg-purple-300 disabled:text-white font-bold px-6 py-3 rounded-xl transition">
            {gerando ? `✨ Gerando... (${progresso.atual}/${progresso.total})` : '✨ Gerar Questões com IA'}
          </button>
        </div>

        {gerando && progresso.total > 0 && (
          <div className="mt-4">
            <div className="w-full bg-purple-900 bg-opacity-40 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${pctProgresso}%` }}
              />
            </div>
            <p className="text-xs text-purple-100 mt-1">
              {progresso.atual} de {progresso.total} questões geradas ({pctProgresso}%)
            </p>
          </div>
        )}
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">⚠️ {erro}</div>}
      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 text-sm">✅ {sucesso}</div>}

      {/* POOL */}
      {pool.length > 0 && (
        <div className="mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="font-bold text-amber-900">🎯 Pool de Questões ({pool.length})</h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Selecione as que deseja manter em "Minhas Questões".
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={selecionarTodas} className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded">
                Selecionar todas
              </button>
              <button onClick={limparSelecao} className="text-xs bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium px-3 py-1.5 rounded">
                Limpar seleção
              </button>
              <button onClick={descartarPool} className="text-xs text-red-700 hover:text-red-900 font-medium px-3 py-1.5">
                🗑️ Descartar tudo
              </button>
            </div>
          </div>

          {selecionadas.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 flex flex-wrap justify-between items-center gap-3">
              <span className="text-sm text-teal-900 font-semibold">{selecionadas.length} selecionada(s)</span>
              <div className="flex gap-2">
                <button onClick={adicionarSelecionadas}
                  className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-1.5 rounded">
                  ✅ Adicionar a Minhas Questões
                </button>
                <button onClick={descartarSelecionadas}
                  className="text-xs bg-white hover:bg-red-50 text-red-700 border border-red-300 font-medium px-4 py-1.5 rounded">
                  🗑️ Descartar selecionadas
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {pool.map((q) => (
              <div key={q._localId}
                className={`bg-white border-2 rounded-xl p-4 transition ${
                  selecionadas.includes(q._localId) ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                }`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selecionadas.includes(q._localId)}
                    onChange={() => togglePool(q._localId)}
                    className="mt-1 w-5 h-5 text-teal-600 rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                      {q.habilidade_codigo && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">{q.habilidade_codigo}</span>}
                      {q.descritor && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">{q.descritor}</span>}
                      {q.nivel_cognitivo && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{q.nivel_cognitivo}</span>}
                    </div>
                    <div className="text-sm text-gray-800 mb-2"><LatexText text={q.enunciado} /></div>
                    {q.precisa_ilustracao && q.descricao_ilustracao && (
                      <div className="text-xs text-amber-700 bg-amber-50 rounded p-2 mb-2">
                        🎨 <strong>Ilustração:</strong> {q.descricao_ilustracao}
                      </div>
                    )}
                    <div className="space-y-0.5 mb-2">
                      {(q.alternativas || []).map((a, ai) => (
                        <div key={ai} className="text-xs text-gray-700">
                          <strong>({a.letra})</strong> {a.texto}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-green-900 bg-green-50 rounded p-1.5">
                      <strong>Gabarito:</strong> {q.gabarito}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MINHAS QUESTÕES */}
      {minhasQuestoes.length > 0 && (
        <div className="mb-8">
          <div className="bg-teal-600 rounded-xl p-4 mb-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="font-bold text-white">✅ Minhas Questões ({minhasQuestoes.length})</h2>
              <p className="text-xs text-teal-100 mt-0.5">Revise e organize. Quando estiver pronto, gere o PDF.</p>
            </div>
            <button onClick={gerarPDF}
              className="bg-white text-teal-700 hover:bg-teal-50 font-bold px-5 py-2 rounded-lg text-sm">
              📄 Gerar PDF da Prova
            </button>
          </div>

          <div className="space-y-3">
            {minhasQuestoes.map((q, qi) => (
              <div key={q._localId} className="bg-white border-2 border-teal-500 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-semibold">Questão {qi + 1}</span>
                    {q.habilidade_codigo && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">{q.habilidade_codigo}</span>}
                    {q.descritor && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">{q.descritor}</span>}
                  </div>
                  <button onClick={() => removerDaMinhas(q._localId)}
                    className="text-xs text-red-600 hover:text-red-800">🗑️ Remover</button>
                </div>
                <div className="text-sm text-gray-800 mb-3"><LatexText text={q.enunciado} /></div>
                {q.precisa_ilustracao && q.descricao_ilustracao && (
                  <div className="text-xs text-amber-700 bg-amber-50 rounded p-2 mb-3">
                    🎨 <strong>Ilustração:</strong> {q.descricao_ilustracao}
                  </div>
                )}
                <div className="space-y-1 mb-3">
                  {(q.alternativas || []).map((a, ai) => (
                    <div key={ai} className="text-sm text-gray-700">
                      <strong className="text-purple-600">({a.letra})</strong> {a.texto}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-green-900 bg-green-50 rounded p-2">
                  <strong>Gabarito:</strong> {q.gabarito}
                  {q.explicacao_gabarito && <span className="block mt-1 text-green-800">{q.explicacao_gabarito}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BancoQuestoesIA;