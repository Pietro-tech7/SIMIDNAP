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

const NIVEIS_BLOOM = [
  { value: 'Lembrar', label: 'Lembrar' },
  { value: 'Compreender', label: 'Compreender' },
  { value: 'Aplicar', label: 'Aplicar' },
  { value: 'Analisar', label: 'Analisar' },
  { value: 'Avaliar', label: 'Avaliar' },
  { value: 'Criar', label: 'Criar' },
];

const ANOS_EF = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const DESCRITORES_MATEMATICA = [
  'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10',
  'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20',
  'D21', 'D22', 'D23', 'D24', 'D25', 'D26', 'D27', 'D28', 'D29', 'D30',
  'D31', 'D32', 'D33',
];

const DESCRITORES_LP = [
  'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10',
  'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21',
];


const BancoQuestoesIA = () => {
  const { user } = useAuth();

  // ============================================================
  // FORM
  // ============================================================
  const [titulo, setTitulo] = useState('');
  const [etapa, setEtapa] = useState('EF');
  const [ano, setAno] = useState(2);
  const [componente, setComponente] = useState('MA');
  const [referencial, setReferencial] = useState('bncc');
  const [incluirIlustracoes, setIncluirIlustracoes] = useState(true);
  const [compartilhar, setCompartilhar] = useState(false);

  // ============================================================
  // HABILIDADES (lista dinâmica)
  // ============================================================
  const [habilidades, setHabilidades] = useState([
    { codigo: '', texto: '', descritores: [], nivel_cognitivo: 'Aplicar', quantidade: 2 },
  ]);

  // ============================================================
  // LISTAS
  // ============================================================
  const [componentes, setComponentes] = useState([]);
  const [habilidadesDisponiveis, setHabilidadesDisponiveis] = useState([]);

  // ============================================================
  // ESTADOS
  // ============================================================
  const [gerando, setGerando] = useState(false);
  const [questoes, setQuestoes] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // ============================================================
  // CARREGAR COMPONENTES
  // ============================================================
  useEffect(() => {
    api.get(`/bncc/componentes?etapa=${etapa}`)
      .then(res => setComponentes(res.data || []))
      .catch(() => setComponentes([]));
  }, [etapa]);

  // ============================================================
  // CARREGAR HABILIDADES DISPONÍVEIS
  // ============================================================
  useEffect(() => {
    if (!componente) {
      setHabilidadesDisponiveis([]);
      return;
    }
    const params = { etapa, componente };
    if (etapa === 'EF' && ano) params.ano = ano;
    if (user?.estado) params.estado = user.estado;

    api.get('/bncc/habilidades', { params })
      .then(res => setHabilidadesDisponiveis(res.data || []))
      .catch(() => setHabilidadesDisponiveis([]));
  }, [etapa, ano, componente, user?.estado]);

  // ============================================================
  // CÁLCULO DE CUSTO
  // ============================================================
  const totalQuestoes = habilidades.reduce((s, h) => s + (Number(h.quantidade) || 0), 0);
  const custo = totalQuestoes <= 10 ? 1 : totalQuestoes <= 20 ? 2 : totalQuestoes <= 30 ? 3 : 4;

  // ============================================================
  // AÇÕES DAS HABILIDADES
  // ============================================================
  const adicionarHabilidade = () => {
    setHabilidades(prev => [
      ...prev,
      { codigo: '', texto: '', descritores: [], nivel_cognitivo: 'Aplicar', quantidade: 1 },
    ]);
  };

  const removerHabilidade = (index) => {
    if (habilidades.length === 1) {
      alert('Mantenha ao menos 1 habilidade.');
      return;
    }
    setHabilidades(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarHabilidade = (index, campo, valor) => {
    setHabilidades(prev => prev.map((h, i) => {
      if (i !== index) return h;
      const nova = { ...h, [campo]: valor };

      // Ao escolher código, preenche automaticamente o texto
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

  // ============================================================
  // DESCRITORES DISPONÍVEIS (por componente)
  // ============================================================
  const descritoresDisponiveis = () => {
    if (componente === 'MA') return DESCRITORES_MATEMATICA;
    if (componente === 'LP') return DESCRITORES_LP;
    return [];
  };

  // ============================================================
  // GERAR QUESTÕES
  // ============================================================
  const gerarQuestoes = async () => {
    setErro('');
    setSucesso('');

    // Validações
    if (!titulo.trim()) {
      setErro('Dê um título à prova.');
      return;
    }
    for (let i = 0; i < habilidades.length; i++) {
      const h = habilidades[i];
      if (!h.codigo) {
        setErro(`Habilidade ${i + 1}: selecione um código.`);
        return;
      }
      if (!h.quantidade || h.quantidade < 1) {
        setErro(`Habilidade ${i + 1}: quantidade inválida.`);
        return;
      }
    }
    if (totalQuestoes < 1) {
      setErro('Adicione ao menos 1 questão.');
      return;
    }

    setGerando(true);
    setQuestoes([]);

    try {
      const payload = {
        titulo: titulo.trim(),
        etapa,
        ano: etapa === 'EF' ? Number(ano) : null,
        componente,
        disciplina_nome: componentes.find(c => c.codigo === componente)?.nome || componente,
        referencial,
        estado: user?.estado || null,
        incluir_ilustracoes: incluirIlustracoes,
        compartilhar_curadoria: compartilhar,
        habilidades: habilidades.map(h => ({
          codigo: h.codigo,
          texto: h.texto,
          complemento_pi: h.complemento_pi || null,
          descritores: h.descritores || [],
          nivel_cognitivo: h.nivel_cognitivo,
          quantidade: Number(h.quantidade),
        })),
      };

      const res = await api.post('/question-ia/gerar', payload);

      if (res.data?.sucesso && res.data?.questoes?.length > 0) {
        setQuestoes(res.data.questoes);
        setSucesso(`${res.data.total_questoes} questão(ões) gerada(s) com sucesso!`);
        window.dispatchEvent(new CustomEvent('subscription-updated'));
      } else {
        setErro(res.data?.mensagem || 'A IA não retornou questões.');
      }
    } catch (err) {
      if (err?.response?.status === 402) {
        setErro('Créditos insuficientes. Faça upgrade do seu plano.');
      } else {
        setErro(err?.response?.data?.detail || 'Erro ao gerar questões. Tente novamente.');
      }
    } finally {
      setGerando(false);
    }
  };

  // ============================================================
  // EDITAR / EXCLUIR QUESTÃO GERADA
  // ============================================================
  const editarQuestao = (index, campo, valor) => {
    setQuestoes(prev => prev.map((q, i) => i === index ? { ...q, [campo]: valor } : q));
  };

  const editarAlternativa = (qIndex, aIndex, campo, valor) => {
    setQuestoes(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const novas = [...q.alternativas];
      novas[aIndex] = { ...novas[aIndex], [campo]: valor };
      return { ...q, alternativas: novas };
    }));
  };

  const excluirQuestao = (index) => {
    if (!window.confirm('Excluir esta questão?')) return;
    setQuestoes(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">
        ← Voltar
      </Link>

      <div className="mt-6 mb-8 flex items-center gap-3">
        <span className="text-4xl">✨</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões IA</h1>
          <p className="text-gray-600">
            Gere questões inéditas com IA — alinhadas à BNCC, Currículo do Piauí, SAEB e SAEPI.
          </p>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-6">
        <h3 className="text-purple-900 font-semibold mb-2">✨ Como funciona</h3>
        <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
          <li>Escolha <strong>etapa, ano, componente e habilidades</strong></li>
          <li>Selecione <strong>descritores</strong> e <strong>nível cognitivo</strong> (Bloom)</li>
          <li>A IA gera questões <strong>inéditas</strong> com sugestão de ilustrações</li>
          <li>Você <strong>revisa e ajusta</strong> antes de salvar</li>
          <li>Custo: <strong>1 a 4 créditos</strong> conforme quantidade</li>
        </ul>
      </div>

      {/* PASSO 1 — IDENTIFICAÇÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Passo 1 — Identificação</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título da prova *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Avaliação de Matemática — Maio/2026"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {ETAPAS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>

          {etapa === 'EF' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {ANOS_EF.map(a => <option key={a} value={a}>{a}º ano</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Componente</label>
            <select
              value={componente}
              onChange={(e) => setComponente(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
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
        </div>
      </div>

      {/* PASSO 2 — HABILIDADES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">📚 Passo 2 — Habilidades e Descritores</h2>
          <button
            type="button"
            onClick={adicionarHabilidade}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg"
          >
            ➕ Adicionar habilidade
          </button>
        </div>

        <div className="space-y-4">
          {habilidades.map((h, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">Habilidade {index + 1}</span>
                {habilidades.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerHabilidade(index)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    🗑️ Remover
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código da habilidade *</label>
                  <select
                    value={h.codigo}
                    onChange={(e) => atualizarHabilidade(index, 'codigo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Selecione...</option>
                    {habilidadesDisponiveis.map(hab => (
                      <option key={hab.codigo} value={hab.codigo}>
                        {hab.codigo} — {(hab.texto || '').slice(0, 60)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade de questões *</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={h.quantidade}
                    onChange={(e) => atualizarHabilidade(index, 'quantidade', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
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
                  <select
                    value={h.nivel_cognitivo}
                    onChange={(e) => atualizarHabilidade(index, 'nivel_cognitivo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {NIVEIS_BLOOM.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>

                {descritoresDisponiveis().length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Descritores ({h.descritores?.length || 0} selecionados)
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                      {descritoresDisponiveis().map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDescritor(index, d)}
                          className={`text-xs px-2 py-0.5 rounded font-mono ${
                            h.descritores?.includes(d)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PASSO 3 — OPÇÕES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🎨 Passo 3 — Opções</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={incluirIlustracoes}
              onChange={(e) => setIncluirIlustracoes(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            Incluir sugestões de ilustrações nas questões
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={compartilhar}
              onChange={(e) => setCompartilhar(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            Compartilhar questões aprovadas com outros professores (curadoria)
          </label>
        </div>
      </div>

      {/* RESUMO E BOTÃO GERAR */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-200">Resumo</p>
            <p className="text-2xl font-bold">{totalQuestoes} questão(ões)</p>
            <p className="text-sm text-purple-100 mt-1">
              Custo: <strong>{custo} crédito(s)</strong>
            </p>
          </div>
          <button
            onClick={gerarQuestoes}
            disabled={gerando || totalQuestoes < 1}
            className="bg-white text-purple-700 hover:bg-purple-50 disabled:bg-purple-300 disabled:text-white font-bold px-6 py-3 rounded-xl transition"
          >
            {gerando ? '✨ Gerando... (pode levar até 30s)' : '✨ Gerar Questões com IA'}
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">
          ⚠️ {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 text-sm">
          ✅ {sucesso}
        </div>
      )}

      {/* PREVIEW DAS QUESTÕES GERADAS */}
      {questoes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📝 Pré-visualização ({questoes.length} questões)
          </h2>
          <div className="space-y-4">
            {questoes.map((q, qi) => (
              <div key={qi} className="bg-white border-2 border-purple-200 rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">
                      Questão {qi + 1}
                    </span>
                    {q.habilidade_codigo && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                        {q.habilidade_codigo}
                      </span>
                    )}
                    {q.descritor && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                        {q.descritor}
                      </span>
                    )}
                    {q.nivel_cognitivo && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {q.nivel_cognitivo}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => excluirQuestao(qi)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    🗑️ Excluir
                  </button>
                </div>

                <div className="text-sm text-gray-800 mb-3 leading-relaxed">
                  <LatexText text={q.enunciado} />
                </div>

                {q.precisa_ilustracao && q.descricao_ilustracao && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3 text-xs text-amber-800">
                    🎨 <strong>Ilustração sugerida:</strong> {q.descricao_ilustracao}
                  </div>
                )}

                <div className="space-y-1 mb-3">
                  {(q.alternativas || []).map((a, ai) => (
                    <div key={ai} className="flex gap-2 text-sm text-gray-700">
                      <span className="font-bold text-purple-600 flex-shrink-0">({a.letra})</span>
                      <span className="flex-1">{a.texto}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-900">
                  <strong>Gabarito:</strong> {q.gabarito}
                  {q.explicacao_gabarito && (
                    <span className="block mt-1 text-green-800">{q.explicacao_gabarito}</span>
                  )}
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