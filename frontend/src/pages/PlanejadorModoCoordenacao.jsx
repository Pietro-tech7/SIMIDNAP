import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { gerarPdfCoordenacao } from '../utils/gerarPdfCoordenacao';

// ============================================================
// HELPERS — extração robusta
// ============================================================
function stringificar(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (Array.isArray(valor)) {
    return valor.map(v => stringificar(v)).filter(Boolean).join(' · ');
  }
  if (typeof valor === 'object') {
    if ('texto' in valor) return valor.texto || '';
    if ('nome' in valor) return valor.nome || '';
    if ('codigo' in valor) return valor.codigo || '';
    return '';
  }
  return String(valor);
}

function separarRecurso(valor) {
  const str = stringificar(valor).trim();
  if (!str) return { nome: '', uso: '' };
  if (str.includes(' — ')) {
    const [nome, ...resto] = str.split(' — ');
    return { nome: nome.trim(), uso: resto.join(' — ').trim() };
  }
  if (str.includes(' - ')) {
    const [nome, ...resto] = str.split(' - ');
    return { nome: nome.trim(), uso: resto.join(' - ').trim() };
  }
  return { nome: str, uso: '' };
}

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

// ============================================================
// POPUP DE VALIDAÇÃO
// ============================================================
const PopupValidacao = ({ mensagem, onFechar }) => {
  useEffect(() => {
    const timer = setTimeout(onFechar, 8000);
    return () => clearTimeout(timer);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onFechar}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-l-4 border-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Falta preencher
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {mensagem}
            </p>
          </div>
        </div>
        <button
          onClick={onFechar}
          className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN
// ============================================================
const PlanejadorModoCoordenacao = () => {
  const { user } = useAuth();

  const [nomeProfessor, setNomeProfessor] = useState(user?.full_name || '');
  const [nomeEscola, setNomeEscola] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('PI');

  const [titulo, setTitulo] = useState('');
  const [tipoAcao, setTipoAcao] = useState('formacao');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [objetivoPedagogico, setObjetivoPedagogico] = useState('');

  const [periodoTipo, setPeriodoTipo] = useState('mes');
  const [numeroEncontros, setNumeroEncontros] = useState(4);

  const [contextoAdicional, setContextoAdicional] = useState('');

  const [gerando, setGerando] = useState(false);
  const [popupErro, setPopupErro] = useState(null);
  const [sucesso, setSucesso] = useState('');
  const [resultado, setResultado] = useState(null);

  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);

  useEffect(() => {
    if (user?.full_name && !nomeProfessor) {
      setNomeProfessor(user.full_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const gerar = async () => {
    setPopupErro(null); setSucesso(''); setResultado(null);

    if (!nomeProfessor.trim()) { setPopupErro('Informe seu nome.'); return; }
    if (!titulo.trim()) { setPopupErro('Dê um título ao plano.'); return; }
    if (!publicoAlvo.trim()) { setPopupErro('Informe o público-alvo.'); return; }
    if (!objetivoPedagogico.trim()) { setPopupErro('Descreva o objetivo pedagógico.'); return; }

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
      if (err?.response?.status === 402) setPopupErro('Créditos insuficientes. Faça upgrade do seu plano.');
      else setPopupErro(err?.response?.data?.detail || 'Erro ao gerar o plano. Tente novamente.');
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
    setResultado(null); setPopupErro(null); setSucesso('');
  };

  const tipoAtual = TIPOS_ACAO.find(t => t.value === tipoAcao) || TIPOS_ACAO[0];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {popupErro && <PopupValidacao mensagem={popupErro} onFechar={() => setPopupErro(null)} />}

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

      {/* PASSO 2 — IDENTIFICAÇÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Passo 2 — Identificação</h2>

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

      {/* PASSO 3 — PERÍODO */}
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

      {/* PASSO 4 — CONTEXTO */}
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

      {sucesso && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 text-sm">✅ {sucesso}</div>}

      {/* RESULTADO */}
      {resultado && <ResultadoCoordenacao resultado={resultado} tituloFallback={titulo} tipoAtual={tipoAtual} />}
    </div>
  );
};

// ============================================================
// RESULTADO
// ============================================================
const ResultadoCoordenacao = ({ resultado, tituloFallback, tipoAtual }) => {
  const sd = resultado.structured_data || {};
  const cab = sd.cabecalho || {};
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      await gerarPdfCoordenacao(resultado);
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* BOTÃO PDF */}
      <div className="flex justify-end">
        <button
          onClick={baixarPdf}
          disabled={gerandoPdf}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition shadow-sm"
        >
          {gerandoPdf ? '⏳ Gerando PDF...' : '📥 Baixar PDF'}
        </button>
      </div>

      {/* CABEÇALHO */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2 border-b border-emerald-400/40 pb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-200 font-bold">
              COORDENAÇÃO SIMIDNAPE
            </p>
            <p className="text-[10px] text-emerald-100">O Professor Inesquecível</p>
          </div>
          <p className="text-[10px] text-emerald-200 font-mono">simidnape.com.br</p>
        </div>

        <h2 className="text-xl font-bold">🎓 {cab.titulo || tituloFallback}</h2>
        <p className="text-sm text-emerald-100 mt-1">
          {cab.tipo_acao_nome || tipoAtual.nome}
        </p>

        {(cab.nome_professor || cab.nome_escola || cab.municipio) && (
          <div className="mt-2 mb-3 text-xs text-emerald-100">
            {cab.nome_professor && <span><strong className="text-white">Coordenador(a):</strong> {cab.nome_professor}</span>}
            {cab.nome_escola && <span> · <strong className="text-white">Escola:</strong> {cab.nome_escola}</span>}
            {cab.municipio && <span> · <strong className="text-white">Município:</strong> {cab.municipio}</span>}
            {cab.estado && <span> - {cab.estado}</span>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
          <div>
            <p className="text-xs text-emerald-200 uppercase">Público-alvo</p>
            <p className="font-semibold">{cab.publico_alvo || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-200 uppercase">Período</p>
            <p className="font-semibold">{cab.periodo_texto || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-200 uppercase">Objetivo</p>
            <p className="font-semibold text-xs">{cab.objetivo_pedagogico || '—'}</p>
          </div>
        </div>
      </div>

      {/* CONTEXTO */}
      {sd.contexto && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-2">🔎 Contexto (diagnóstico)</h3>
          <p className="text-sm text-blue-800 leading-relaxed">{sd.contexto}</p>
        </div>
      )}

      {/* OBJETIVOS */}
      {sd.objetivos && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">🎯 Objetivos</h3>
          {sd.objetivos.geral && (
            <p className="text-sm text-gray-700 mb-3">
              <strong>Geral:</strong> {sd.objetivos.geral}
            </p>
          )}
          {sd.objetivos.especificos?.length > 0 && (
            <ul className="space-y-1.5">
              {sd.objetivos.especificos.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-500 mt-0.5">✓</span><span>{o}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* AÇÕES */}
      {sd.acoes?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Ações — {sd.acoes.length} ação(ões)
          </h3>
          <div className="space-y-5">
            {sd.acoes.map((acao, i) => (
              <AcaoCard key={i} acao={acao} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* CRONOGRAMA */}
      {sd.cronograma?.length > 0 && (
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
                {sd.cronograma.map((c, i) => (
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
      {sd.avaliacao && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Avaliação da ação</h3>
          {sd.avaliacao.instrumentos?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Instrumentos</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {sd.avaliacao.instrumentos.map((x, i) => <li key={i}>• {x}</li>)}
              </ul>
            </div>
          )}
          {sd.avaliacao.indicadores?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Indicadores</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {sd.avaliacao.indicadores.map((x, i) => <li key={i}>• {x}</li>)}
              </ul>
            </div>
          )}
          {sd.avaliacao.como_registrar_evidencias?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Como registrar evidências</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {sd.avaliacao.como_registrar_evidencias.map((x, i) => <li key={i}>• {x}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CONSIDERAÇÕES FINAIS */}
      {sd.consideracoes_finais && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-900 mb-2">📌 Considerações finais</h3>
          <p className="text-sm text-amber-900 leading-relaxed">{sd.consideracoes_finais}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// CARD DE AÇÃO — 8 seções
// ============================================================
const AcaoCard = ({ acao, index }) => {
  const [expandido, setExpandido] = useState(false);

  const titulo = stringificar(acao.titulo) || `Ação ${index + 1}`;
  const tema = stringificar(acao.tema);
  const recursos = (acao.recursos || []).map(separarRecurso).filter(r => r.nome);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* HEADER */}
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full text-left bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 hover:opacity-95 transition"
      >
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wide">
              Ação {acao.numero || index + 1}
            </p>
            <p className="font-semibold truncate">{titulo}</p>
            {tema && (
              <p className="text-[11px] text-emerald-200 italic truncate mt-0.5">
                Tema: {tema}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {acao.prazo && (
              <span className="text-xs bg-white/30 text-white px-2 py-0.5 rounded font-mono font-semibold border border-white/40">
                {stringificar(acao.prazo)}
              </span>
            )}
            <span className="text-lg">{expandido ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {/* BODY */}
      {expandido && (
        <div className="p-4 space-y-3 text-sm bg-white">

          {/* Descrição */}
          {acao.descricao && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-3">
              <p className="text-xs font-bold text-blue-900 uppercase mb-1">
                📝 Descrição
              </p>
              <p className="text-gray-800 leading-relaxed text-xs">
                {stringificar(acao.descricao)}
              </p>
            </div>
          )}

          {/* Responsável */}
          {acao.responsavel && (
            <div className="text-xs">
              <span className="font-bold text-gray-500 uppercase">Responsável:</span>{' '}
              <span className="text-gray-800">{stringificar(acao.responsavel)}</span>
            </div>
          )}

          {/* Recursos */}
          {recursos.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-600 uppercase mb-2">📦 Recursos</p>
              <div className="space-y-1.5">
                {recursos.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs bg-white text-gray-800 px-2 py-0.5 rounded font-bold border border-gray-200 flex-shrink-0">
                      {r.nome}
                    </span>
                    {r.uso && (
                      <span className="text-xs text-gray-600 leading-relaxed pt-0.5">
                        {r.uso}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fundamento + Como avaliar */}
          {(acao.principio_pedagogico || acao.como_avaliar) && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-3">
              {acao.principio_pedagogico && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase mb-0.5">Fundamento pedagógico</p>
                  <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                    {stringificar(acao.principio_pedagogico)}
                  </p>
                </div>
              )}
              {acao.como_avaliar && (
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase mb-0.5">Como avaliar</p>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {stringificar(acao.como_avaliar)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Onde pode resistir */}
          {acao.onde_pode_resistir && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Onde pode resistir</p>
              <p className="text-xs text-yellow-900 leading-relaxed">
                {stringificar(acao.onde_pode_resistir)}
              </p>
            </div>
          )}

          {/* Momento de encantamento */}
          {acao.momento_de_encantamento && (
            <div className="bg-pink-50 border border-pink-200 rounded p-3">
              <p className="text-xs font-bold text-pink-800 uppercase mb-1">Momento de encantamento</p>
              <p className="text-xs text-pink-900 italic leading-relaxed">
                {stringificar(acao.momento_de_encantamento)}
              </p>
            </div>
          )}

          {/* Resultado visível */}
          {acao.resultado_visivel && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-xs font-bold text-green-800 uppercase mb-1">Resultado visível</p>
              <p className="text-xs text-green-900 leading-relaxed">
                {stringificar(acao.resultado_visivel)}
              </p>
            </div>
          )}

          {/* Nota pedagógica */}
          {acao.leitura_relacional && (
            <div className="border-l-4 border-gray-300 bg-gray-50 rounded-r-lg p-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Nota pedagógica</p>
              <p className="text-xs text-gray-600 italic leading-relaxed">
                {stringificar(acao.leitura_relacional)}
              </p>
            </div>
          )}

          {/* Reflexão pós-encontro */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">📝 Reflexão pós-encontro</p>
            <p className="text-[11px] text-gray-500 italic mb-2">
              Espaço reservado para o coordenador registrar, após o encontro, o que funcionou bem e o que precisa ser ajustado.
            </p>
            {acao.reflexao_pos_encontro ? (
              <p className="text-xs text-gray-800 leading-relaxed">
                {stringificar(acao.reflexao_pos_encontro)}
              </p>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="h-3 border-b border-gray-200"></div>
                <div className="h-3 border-b border-gray-200"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanejadorModoCoordenacao;