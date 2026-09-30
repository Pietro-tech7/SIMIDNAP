import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'simidnape_rascunho_coordenacao_v2';

const UFS = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
];

const TIPOS_ACAO = [
  { value: 'formacao', icon: '🎓', nome: 'Plano de Formação Continuada',
    descricao: 'Pauta de encontro, oficina ou HTPC para desenvolver competências docentes.',
    cor: 'from-blue-500 to-indigo-600' },
  { value: 'acompanhamento', icon: '👁️', nome: 'Plano de Acompanhamento Docente',
    descricao: 'Observação de aula, devolutiva formativa e ciclos de acompanhamento.',
    cor: 'from-purple-500 to-pink-600' },
  { value: 'intervencao', icon: '🎯', nome: 'Plano de Intervenção Pedagógica',
    descricao: 'Ações para reverter dificuldades de aprendizagem de alunos ou turmas.',
    cor: 'from-orange-500 to-red-600' },
  { value: 'acao_pedagogica', icon: '📋', nome: 'Plano de Ação Pedagógica',
    descricao: 'Metas e ações para o semestre ou ano letivo, com indicadores claros.',
    cor: 'from-emerald-500 to-teal-600' },
  { value: 'indicadores', icon: '📊', nome: 'Análise de Indicadores',
    descricao: 'Leitura de IDEB, SAEB, SAEPI e avaliações internas para decisão pedagógica.',
    cor: 'from-cyan-500 to-blue-600' },
  { value: 'reuniao', icon: '🤝', nome: 'Reunião / Conselho de Classe',
    descricao: 'Pauta, dinâmica e encaminhamentos para alinhar a equipe ou as famílias.',
    cor: 'from-amber-500 to-orange-600' },
];

const PERIODOS = [
  { value: 'semana', label: '1 semana' },
  { value: 'mes', label: '1 mês' },
  { value: 'bimestre', label: '1 bimestre' },
  { value: 'semestre', label: '1 semestre' },
];

const PlanejadorModoCoordenacao = () => {
  const { user } = useAuth();

  // ============================================================
  // CABEÇALHO INSTITUCIONAL (D9-REBUILD-5)
  // ============================================================
  const [nomeProfessor, setNomeProfessor] = useState(user?.full_name || '');
  const [nomeEscola, setNomeEscola] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('PI');

  // ============================================================
  // IDENTIFICAÇÃO
  // ============================================================
  const [titulo, setTitulo] = useState('');
  const [tipoAcao, setTipoAcao] = useState('formacao');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [objetivoPedagogico, setObjetivoPedagogico] = useState('');

  // ============================================================
  // PERÍODO (sem datas)
  // ============================================================
  const [periodoTipo, setPeriodoTipo] = useState('mes');
  const [numeroEncontros, setNumeroEncontros] = useState(4);

  // ============================================================
  // CONTEXTO
  // ============================================================
  const [contextoAdicional, setContextoAdicional] = useState('');

  // ============================================================
  // ESTADO DE GERAÇÃO
  // ============================================================
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [resultado, setResultado] = useState(null);

  // ============================================================
  // RASCUNHO
  // ============================================================
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);

  // Preenche nome do professor quando o usuário carrega
  useEffect(() => {
    if (user?.full_name && !nomeProfessor) {
      setNomeProfessor(user.full_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ============================================================
  // CARREGAR RASCUNHO
  // ============================================================
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const d = JSON.parse(salvo);
        const temConteudo = d.titulo?.trim() || d.publicoAlvo?.trim();
        if (temConteudo) {
          const continuar = window.confirm(
            `📋 Você tem um plano de coordenação em andamento:\n\n"${d.titulo || 'Sem título'}"\n\nDeseja continuar de onde parou?`
          );
          if (continuar) {
            if (d.nomeProfessor !== undefined) setNomeProfessor(d.nomeProfessor);
            if (d.nomeEscola !== undefined) setNomeEscola(d.nomeEscola);
            if (d.municipio !== undefined) setMunicipio(d.municipio);
            if (d.estado !== undefined) setEstado(d.estado);
            if (d.titulo !== undefined) setTitulo(d.titulo);
            if (d.tipoAcao !== undefined) setTipoAcao(d.tipoAcao);
            if (d.publicoAlvo !== undefined) setPublicoAlvo(d.publicoAlvo);
            if (d.objetivoPedagogico !== undefined) setObjetivoPedagogico(d.objetivoPedagogico);
            if (d.periodoTipo !== undefined) setPeriodoTipo(d.periodoTipo);
            if (d.numeroEncontros !== undefined) setNumeroEncontros(d.numeroEncontros);
            if (d.contextoAdicional !== undefined) setContextoAdicional(d.contextoAdicional);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar rascunho:', e);
    }
    setRascunhoCarregado(true);
  }, []);

  // ============================================================
  // SALVAR RASCUNHO
  // ============================================================
  useEffect(() => {
    if (!rascunhoCarregado) return;
    try {
      const dados = {
        nomeProfessor, nomeEscola, municipio, estado,
        titulo, tipoAcao, publicoAlvo, objetivoPedagogico,
        periodoTipo, numeroEncontros,
        contextoAdicional,
        _salvo_em: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
      setRascunhoSalvo(true);
      const timer = setTimeout(() => setRascunhoSalvo(false), 1200);
      return () => clearTimeout(timer);
    } catch (e) {
      console.warn('Erro ao salvar rascunho:', e);
    }
  }, [
    rascunhoCarregado,
    nomeProfessor, nomeEscola, municipio, estado,
    titulo, tipoAcao, publicoAlvo, objetivoPedagogico,
    periodoTipo, numeroEncontros,
    contextoAdicional,
  ]);

  // ============================================================
  // GERAR PLANO
  // ============================================================
  const gerar = async () => {
    setErro(''); setSucesso(''); setResultado(null);

    if (!nomeProfessor.trim()) { setErro('Informe seu nome.'); return; }
    if (!titulo.trim()) { setErro('Dê um título ao plano.'); return; }
    if (!publicoAlvo.trim()) { setErro('Informe o público-alvo.'); return; }
    if (!objetivoPedagogico.trim()) { setErro('Descreva o objetivo pedagógico.'); return; }

    const payload = {
      plan_type: 'coordenacao',
      modo: 'coordenacao',
      title: titulo.trim(),
      tipo_acao: tipoAcao,
      publico_alvo: publicoAlvo.trim(),
      objetivo_pedagogico: objetivoPedagogico.trim(),
      periodo_tipo: periodoTipo,
      total_aulas: Number(numeroEncontros),
      subject: null,
      grade: null,
      content: null,
      objetivo: objetivoPedagogico.trim(),
      extra: {
        nome_professor: nomeProfessor.trim() || null,
        nome_escola: nomeEscola.trim() || null,
        municipio: municipio.trim() || null,
        estado: estado || null,
        tipo_acao: tipoAcao,
        publico_alvo: publicoAlvo.trim(),
        objetivo_pedagogico: objetivoPedagogico.trim(),
        periodo_tipo: periodoTipo,
        total_aulas: Number(numeroEncontros),
        contexto_adicional: contextoAdicional || null,
      },
    };

    setGerando(true);
    try {
      const res = await api.post('/lesson-plans/generate', payload);
      setResultado(res.data);
      const qtd = res.data?.structured_data?.acoes?.length || 0;
      setSucesso(`Plano de coordenação gerado com ${qtd} ação(ões).`);
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (err) {
      if (err?.response?.status === 402) setErro('Créditos insuficientes. Faça upgrade do seu plano.');
      else setErro(err?.response?.data?.detail || 'Erro ao gerar o plano. Tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  const limparTudo = () => {
    if (!window.confirm('Limpar tudo e começar de novo?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setNomeProfessor(user?.full_name || '');
    setNomeEscola(''); setMunicipio(''); setEstado('PI');
    setTitulo(''); setTipoAcao('formacao'); setPublicoAlvo('');
    setObjetivoPedagogico('');
    setPeriodoTipo('mes'); setNumeroEncontros(4);
    setContextoAdicional('');
    setResultado(null); setErro(''); setSucesso('');
  };

  const tipoAtual = TIPOS_ACAO.find(t => t.value === tipoAcao) || TIPOS_ACAO[0];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/planejador" className="text-blue-600 text-sm hover:underline">
        ← Voltar ao Planejador
      </Link>

      <div className="mt-6 mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
          <span>🧠</span>
          <span>PLANEJADOR SIMIDNAPE · MODO COORDENAÇÃO</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎓</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plano de coordenação</h1>
              <p className="text-gray-600">
                Para o coordenador que lidera a aprendizagem na escola. 6 tipos de ação pedagógica.
              </p>
            </div>
          </div>
          <button
            onClick={limparTudo}
            className="text-xs text-amber-800 hover:text-amber-900 font-medium border border-amber-300 hover:border-amber-500 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition"
          >
            🔄 Limpar tudo
          </button>
        </div>
      </div>

      {rascunhoSalvo && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-semibold z-50">
          💾 Rascunho salvo
        </div>
      )}

      {/* PASSO 1 — TIPO DE AÇÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🎯 Passo 1 — Tipo de ação</h2>
        <p className="text-sm text-gray-600 mb-4">
          Escolha o tipo de plano que você quer gerar. Cada tipo tem uma finalidade pedagógica diferente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIPOS_ACAO.map((t) => {
            const ativo = tipoAcao === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipoAcao(t.value)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  ativo
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${t.cor} text-white text-lg mb-2`}>
                  {t.icon}
                </div>
                <p className={`font-bold text-sm leading-tight ${ativo ? 'text-emerald-900' : 'text-gray-900'}`}>
                  {t.nome}
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-snug">{t.descricao}</p>
                {ativo && (
                  <p className="text-[10px] font-bold text-emerald-700 mt-2">✓ SELECIONADO</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PASSO 2 — IDENTIFICAÇÃO + CABEÇALHO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Passo 2 — Identificação</h2>

        {/* Cabeçalho institucional */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4">
          <p className="text-xs font-semibold text-emerald-900 mb-3">
            🎓 Quem está planejando — esses dados aparecem no cabeçalho do plano
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome *</label>
              <input
                type="text" value={nomeProfessor} onChange={(e) => setNomeProfessor(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da escola *</label>
              <input
                type="text" value={nomeEscola} onChange={(e) => setNomeEscola(e.target.value)}
                placeholder="Ex: EMEF João Paulo II"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Município *</label>
              <input
                type="text" value={municipio} onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Ex: Teresina"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
              <select
                value={estado} onChange={(e) => setEstado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {UFS.map(([uf, nome]) => (
                  <option key={uf} value={uf}>{uf} — {nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título do plano *</label>
            <input
              type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Formação sobre descritores SAEPI de LP — Outubro/2026"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Público-alvo *</label>
            <input
              type="text" value={publicoAlvo} onChange={(e) => setPublicoAlvo(e.target.value)}
              placeholder="Ex: professores de LP do 5º ano, ou toda a equipe docente"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo pedagógico *</label>
            <textarea
              value={objetivoPedagogico} onChange={(e) => setObjetivoPedagogico(e.target.value)}
              rows={3}
              placeholder="O que você espera transformar com esta ação? Ex: capacitar os professores a usar os descritores do SAEPI no planejamento semanal."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* PASSO 3 — PERÍODO (sem datas) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📅 Passo 3 — Período de execução</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
            <select
              value={periodoTipo} onChange={(e) => setPeriodoTipo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº de encontros / ações
            </label>
            <input
              type="number" min="1" max="30" value={numeroEncontros}
              onChange={(e) => setNumeroEncontros(Number(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Quantos encontros ou ações de coordenação você vai realizar neste período?
            </p>
          </div>
        </div>

        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-900">
          <strong>Resumo:</strong> {tipoAtual.nome} · {PERIODOS.find(p => p.value === periodoTipo)?.label} · {numeroEncontros} ação(ões).
        </div>
      </div>

      {/* PASSO 4 — CONTEXTO ADICIONAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">💬 Passo 4 — Contexto adicional (opcional)</h2>
        <p className="text-sm text-gray-600 mb-3">
          Se você tiver dados de avaliações, observações da equipe, indicadores ou qualquer outro contexto que ajude a IA, cole aqui. A IA usa o que você fornecer — nunca inventa estatísticas.
        </p>
        <textarea
          value={contextoAdicional} onChange={(e) => setContextoAdicional(e.target.value)}
          rows={4}
          placeholder="Ex: No último SAEPI, os alunos do 5º ano tiveram dificuldade nos descritores D01 e D05 de LP. A equipe relatou falta de tempo para planejar com foco nos descritores."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* BOTÃO GERAR */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-100">Gerar plano</p>
            <p className="text-2xl font-bold">{tipoAtual.nome}</p>
            <p className="text-sm text-emerald-50 mt-1">
              {publicoAlvo ? `Público: ${publicoAlvo}` : 'Informe o público-alvo'}
            </p>
          </div>
          <button
            onClick={gerar} disabled={gerando}
            className="bg-white text-emerald-700 hover:bg-emerald-50 disabled:bg-emerald-300 disabled:text-white font-bold px-6 py-3 rounded-xl transition"
          >
            {gerando ? '✨ Gerando plano...' : '✨ Gerar plano de coordenação'}
          </button>
        </div>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">⚠️ {erro}</div>}
      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 text-sm">✅ {sucesso}</div>}

      {/* RESULTADO */}
      {resultado && (
        <div className="space-y-5">
          {/* CABEÇALHO INSTITUCIONAL */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2 border-b border-emerald-400/40 pb-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-200 font-bold">
                  PLANEJADOR SIMIDNAPE
                </p>
                <p className="text-[10px] text-emerald-100">O Professor Inesquecível</p>
              </div>
              <p className="text-[10px] text-emerald-200 font-mono">simidnape.com.br</p>
            </div>

            <h2 className="text-xl font-bold">
              🎓 {resultado.structured_data?.cabecalho?.titulo || titulo}
            </h2>
            <p className="text-sm text-emerald-100 mt-1">
              {resultado.structured_data?.cabecalho?.tipo_acao_nome || tipoAtual.nome}
            </p>

            {(resultado.structured_data?.cabecalho?.nome_professor ||
              resultado.structured_data?.cabecalho?.nome_escola ||
              resultado.structured_data?.cabecalho?.municipio ||
              nomeProfessor || nomeEscola || municipio) && (
              <div className="mt-2 mb-3 text-xs text-emerald-100">
                {(resultado.structured_data?.cabecalho?.nome_professor || nomeProfessor) && (
                  <span>
                    <strong className="text-white">Coordenador(a):</strong>{' '}
                    {resultado.structured_data?.cabecalho?.nome_professor || nomeProfessor}
                  </span>
                )}
                {(resultado.structured_data?.cabecalho?.nome_escola || nomeEscola) && (
                  <span> · <strong className="text-white">Escola:</strong> {resultado.structured_data?.cabecalho?.nome_escola || nomeEscola}</span>
                )}
                {(resultado.structured_data?.cabecalho?.municipio || municipio) && (
                  <span> · <strong className="text-white">Município:</strong> {resultado.structured_data?.cabecalho?.municipio || municipio}</span>
                )}
                {(resultado.structured_data?.cabecalho?.estado || estado) && (
                  <span> - {resultado.structured_data?.cabecalho?.estado || estado}</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
              <div>
                <p className="text-xs text-emerald-200 uppercase">Público-alvo</p>
                <p className="font-semibold">{resultado.structured_data?.cabecalho?.publico_alvo || publicoAlvo}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200 uppercase">Período</p>
                <p className="font-semibold">{resultado.structured_data?.cabecalho?.periodo_texto || (PERIODOS.find(p => p.value === periodoTipo)?.label || '—')}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200 uppercase">Objetivo</p>
                <p className="font-semibold text-xs">{resultado.structured_data?.cabecalho?.objetivo_pedagogico || objetivoPedagogico}</p>
              </div>
            </div>
          </div>

          {resultado.structured_data?.contexto && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 mb-2">🔎 Contexto (diagnóstico)</h3>
              <p className="text-sm text-blue-800 leading-relaxed">{resultado.structured_data.contexto}</p>
            </div>
          )}

          {resultado.structured_data?.objetivos && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">🎯 Objetivos</h3>
              {resultado.structured_data.objetivos.geral && (
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Geral:</strong> {resultado.structured_data.objetivos.geral}
                </p>
              )}
              {resultado.structured_data.objetivos.especificos?.length > 0 && (
                <ul className="space-y-1.5">
                  {resultado.structured_data.objetivos.especificos.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-emerald-500 mt-0.5">✓</span><span>{o}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* AÇÕES com os 5 campos novos */}
          {resultado.structured_data?.acoes?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Ações — {resultado.structured_data.acoes.length} ação(ões)
              </h3>
              <div className="space-y-4">
                {resultado.structured_data.acoes.map((acao, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 flex justify-between items-center flex-wrap gap-2">
                      <span className="font-semibold">
                        Ação {acao.numero || i + 1} — {acao.titulo}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {acao.principio_pedagogico && (
                          <span className="text-[10px] bg-white/30 text-white px-2 py-0.5 rounded font-semibold border border-white/40">
                            🧠 {acao.principio_pedagogico}
                          </span>
                        )}
                        {acao.prazo && (
                          <span className="text-xs bg-white/30 text-white px-2 py-0.5 rounded font-mono font-semibold border border-white/40">
                            {acao.prazo}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                      {acao.descricao && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">📝 Descrição</p>
                          <p className="text-gray-800 leading-relaxed">{acao.descricao}</p>
                        </div>
                      )}
                      {acao.responsavel && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">👤 Responsável</p>
                          <p className="text-gray-800">{acao.responsavel}</p>
                        </div>
                      )}
                      {acao.recursos?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">📦 Recursos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {acao.recursos.map((r, j) => (
                              <span key={j} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {acao.como_avaliar && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded p-2">
                          <p className="text-xs font-semibold text-emerald-900 uppercase mb-0.5">✅ Como avaliar</p>
                          <p className="text-emerald-800 text-xs">{acao.como_avaliar}</p>
                        </div>
                      )}

                      {acao.onde_pode_resistir && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-3">
                          <p className="text-xs font-semibold text-amber-900 uppercase mb-1">⚠️ Onde pode resistir</p>
                          <p className="text-amber-900 text-xs leading-relaxed">{acao.onde_pode_resistir}</p>
                        </div>
                      )}

                      {acao.momento_de_encantamento && (
                        <div className="bg-pink-50 border border-pink-200 rounded p-3">
                          <p className="text-xs font-semibold text-pink-900 uppercase mb-1">✨ Momento de encantamento</p>
                          <p className="text-pink-900 text-xs leading-relaxed">{acao.momento_de_encantamento}</p>
                        </div>
                      )}

                      {acao.leitura_relacional && (
                        <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg p-3">
                          <p className="text-xs font-semibold text-indigo-900 uppercase mb-1">💭 Leitura relacional (vínculo)</p>
                          <p className="text-indigo-900 text-xs leading-relaxed italic">{acao.leitura_relacional}</p>
                        </div>
                      )}

                      {acao.resultado_visivel && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-xs font-semibold text-green-900 uppercase mb-1">🎯 Resultado visível</p>
                          <p className="text-green-900 text-xs leading-relaxed">{acao.resultado_visivel}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRONOGRAMA */}
          {resultado.structured_data?.cronograma?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">📅 Cronograma</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Período</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ação</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {resultado.structured_data.cronograma.map((c, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-700">{c.periodo}</td>
                        <td className="px-3 py-2 text-gray-800">{c.acao}</td>
                        <td className="px-3 py-2 text-gray-700">{c.responsavel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AVALIAÇÃO */}
          {resultado.structured_data?.avaliacao && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">📊 Avaliação da ação</h3>
              {resultado.structured_data.avaliacao.instrumentos?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Instrumentos</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {resultado.structured_data.avaliacao.instrumentos.map((x, i) => <li key={i}>• {x}</li>)}
                  </ul>
                </div>
              )}
              {resultado.structured_data.avaliacao.indicadores?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Indicadores</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {resultado.structured_data.avaliacao.indicadores.map((x, i) => <li key={i}>• {x}</li>)}
                  </ul>
                </div>
              )}
              {resultado.structured_data.avaliacao.como_registrar_evidencias?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Como registrar evidências</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {resultado.structured_data.avaliacao.como_registrar_evidencias.map((x, i) => <li key={i}>• {x}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {resultado.structured_data?.consideracoes_finais && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-semibold text-amber-900 mb-2">📌 Considerações finais</h3>
              <p className="text-sm text-amber-900 leading-relaxed">{resultado.structured_data.consideracoes_finais}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanejadorModoCoordenacao;