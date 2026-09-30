import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import ModalPlano from '../components/ModalPlano';

const MODOS = [
  { value: 'todos', label: 'Todos', icon: '📋' },
  { value: 'aula', label: 'Aula', icon: '🎯' },
  { value: 'planejamento', label: 'Planejamento', icon: '📅' },
  { value: 'coordenacao', label: 'Coordenação', icon: '🎓' },
];

const MeusPlanejamentos = () => {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroModo, setFiltroModo] = useState('todos');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('recentes');
  const [planoAberto, setPlanoAberto] = useState(null); // modal de visualização
  const [planoEditando, setPlanoEditando] = useState(null); // modal de edição de título
  const [novoTitulo, setNovoTitulo] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // ============================================================
  // Carregar planos
  // ============================================================
  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await api.get('/lesson-plans');
      setPlanos(res.data || []);
    } catch (e) {
      setErro('Erro ao carregar seus planejamentos.');
      setPlanos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  // ============================================================
  // Ações
  // ============================================================
  const excluir = async (id) => {
    if (!window.confirm('Excluir este planejamento? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/lesson-plans/${id}`);
      setPlanos(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Erro ao excluir.');
    }
  };

  const abrirEdicao = (plano) => {
    setPlanoEditando(plano);
    setNovoTitulo(plano.title);
  };

  const salvarEdicaoCompleta = async ({ title, structured_data, comoNovo }) => {
    if (!planoAberto) return;

    if (comoNovo) {
      // Salva como novo: cria uma cópia editada, preserva o original
      const copia = await api.post('/lesson-plans/save-complete', {
        title,
        subject: planoAberto.subject,
        grade: planoAberto.grade,
        content: planoAberto.content,
        objective: planoAberto.objective,
        structured_data,
        extra: {
          plan_type: planoAberto.plan_type,
          modo: planoAberto.modo,
          periodo_tipo: planoAberto.periodo_tipo,
          periodo_inicio: planoAberto.periodo_inicio,
          periodo_fim: planoAberto.periodo_fim,
          total_aulas: planoAberto.total_aulas,
        },
      });
      setPlanos(prev => [copia.data, ...prev]);
      setPlanoAberto(copia.data);
    } else {
      // Salva no original
      const res = await api.patch(`/lesson-plans/${planoAberto.id}`, {
        title,
        structured_data,
      });
      setPlanos(prev => prev.map(p => p.id === planoAberto.id ? res.data : p));
      setPlanoAberto(res.data);
    }
  };

  const duplicar = async (id) => {
    if (!window.confirm('Criar uma cópia deste planejamento?')) return;
    try {
      const res = await api.post(`/lesson-plans/${id}/duplicate`);
      setPlanos(prev => [res.data, ...prev]);
    } catch {
      alert('Erro ao duplicar.');
    }
  };

  // ============================================================
  // Filtro e ordenação
  // ============================================================
  const planosFiltrados = planos
    .filter(p => filtroModo === 'todos' || p.modo === filtroModo)
    .filter(p => {
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(termo) ||
        (p.subject || '').toLowerCase().includes(termo) ||
        (p.grade || '').toLowerCase().includes(termo)
      );
    })
    .sort((a, b) => {
      if (ordem === 'recentes') return new Date(b.created_at) - new Date(a.created_at);
      if (ordem === 'antigos') return new Date(a.created_at) - new Date(b.created_at);
      if (ordem === 'titulo') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

  const fmtData = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return '—'; }
  };

  const infoModo = (m) => MODOS.find(x => x.value === m) || MODOS[0];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/planejador" className="text-blue-600 text-sm hover:underline">
        ← Voltar ao Planejador
      </Link>

      <div className="mt-6 mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
          <span>📚</span>
          <span>PLANEJADOR SIMIDNAPE</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📚</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meus Planejamentos</h1>
              <p className="text-gray-600">
                Tudo o que você já criou. Reabra, edite, duplique ou exclua.
              </p>
            </div>
          </div>
          <Link
            to="/planejador"
            className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
          >
            ✨ Criar novo
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1.5 flex-wrap">
            {MODOS.map(m => (
              <button
                key={m.value} type="button"
                onClick={() => setFiltroModo(m.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filtroModo === m.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="🔍 Buscar por título, componente ou ano..."
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <select
            value={ordem} onChange={(e) => setOrdem(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="titulo">Título (A-Z)</option>
          </select>
        </div>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">⚠️ {erro}</div>}

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Carregando...</div>
      ) : planosFiltrados.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-gray-700 font-medium">
            {planos.length === 0
              ? 'Você ainda não criou nenhum planejamento.'
              : 'Nenhum planejamento corresponde ao filtro.'}
          </p>
          {planos.length === 0 && (
            <Link
              to="/planejador"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition"
            >
              🚀 Criar meu primeiro
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {planosFiltrados.map(p => {
            const m = infoModo(p.modo);
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {m.icon} {m.label}
                      </span>
                      {p.publico && (
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          🌐 Público
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {fmtData(p.created_at)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {[p.subject, p.grade, p.periodo_tipo && `${p.total_aulas || '?'} aulas`]
                        .filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-start">
                    <button
                      onClick={() => setPlanoAberto(p)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      👁️ Reabrir
                    </button>
                    <button
                      onClick={() => abrirEdicao(p)}
                      className="text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => duplicar(p.id)}
                      className="text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      📄 Duplicar
                    </button>
                    <button
                      onClick={() => excluir(p.id)}
                      className="text-xs bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      🗑️ Excluir
                    </button>
                    <button
                      disabled
                      title="Disponível em breve"
                      className="text-xs bg-gray-100 text-gray-400 border border-gray-200 font-medium px-3 py-1.5 rounded-lg cursor-not-allowed"
                    >
                      📥 PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL — Ver e Editar */}
      {planoAberto && (
        <ModalPlano
          plano={planoAberto}
          onFechar={() => setPlanoAberto(null)}
          onSalvar={salvarEdicaoCompleta}
        />
      )}
    </div>
  );
};

// ============================================================
// MODAL — Visualizador do plano
// ============================================================
const ModalVisualizar = ({ plano, onFechar }) => {
  const sd = plano.structured_data || {};
  const modo = plano.modo || 'aula';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              {modo === 'aula' && '🎯 Aula'}
              {modo === 'planejamento' && '📅 Planejamento'}
              {modo === 'coordenacao' && '🎓 Coordenação'}
            </p>
            <h2 className="text-lg font-bold text-gray-900 truncate">{plano.title}</h2>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-500 hover:text-gray-900 text-2xl w-8 h-8 flex items-center justify-center"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <Meta plano={plano} />

          {/* AULA */}
          {modo === 'aula' && sd.roteiro?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">⏱️ Roteiro</h3>
              <div className="space-y-3">
                {sd.roteiro.map((b, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                      <span className="font-semibold text-sm text-gray-900">{b.titulo}</span>
                      <div className="flex items-center gap-1.5">
                        {b.principio_relacionado && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                            🧠 {b.principio_relacionado}
                          </span>
                        )}
                        {b.tempo && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                            {b.tempo}
                          </span>
                        )}
                      </div>
                    </div>
                    {b.faca && <p className="text-xs text-gray-700 mb-1"><strong>Faça:</strong> {b.faca}</p>}
                    {b.fale && <p className="text-xs text-gray-700 mb-1"><strong>Fale:</strong> {b.fale}</p>}
                    {b.pergunte && <p className="text-xs text-gray-700 mb-1"><strong>Pergunte:</strong> {b.pergunte}</p>}
                    {b.alunos && <p className="text-xs text-gray-700"><strong>Alunos:</strong> {b.alunos}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PLANEJAMENTO */}
          {modo === 'planejamento' && sd.sequencia_didatica?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                ⏱️ Sequência didática ({sd.sequencia_didatica.length} aulas)
              </h3>
              <div className="space-y-3">
                {sd.sequencia_didatica.map((a, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        Aula {a.numero_aula || i + 1} — {a.titulo}
                      </span>
                      {a.principio_cognitivo && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                          🧠 {a.principio_cognitivo}
                        </span>
                      )}
                    </div>
                    {a.objetivo_da_aula && <p className="text-xs text-gray-700 mb-1"><strong>Objetivo:</strong> {a.objetivo_da_aula}</p>}
                    {a.conteudo && <p className="text-xs text-gray-700 mb-1"><strong>Conteúdo:</strong> {a.conteudo}</p>}
                    {a.metodologia && <p className="text-xs text-gray-700 mb-1"><strong>Metodologia:</strong> {a.metodologia}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COORDENAÇÃO */}
          {modo === 'coordenacao' && sd.acoes?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                📋 Ações ({sd.acoes.length})
              </h3>
              <div className="space-y-3">
                {sd.acoes.map((a, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        Ação {a.numero || i + 1} — {a.titulo}
                      </span>
                      {a.prazo && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                          {a.prazo}
                        </span>
                      )}
                    </div>
                    {a.descricao && <p className="text-xs text-gray-700 mb-1">{a.descricao}</p>}
                    {a.responsavel && <p className="text-xs text-gray-700"><strong>Responsável:</strong> {a.responsavel}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback para modo não reconhecido */}
          {modo === 'aula' && !sd.roteiro && !sd.etapas && (
            <div className="text-gray-500 text-sm italic">
              Não foi possível exibir o conteúdo deste plano.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 flex justify-end rounded-b-xl">
          <button
            onClick={onFechar}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-5 py-2 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const Meta = ({ plano }) => (
  <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
    {plano.subject && (
      <div>
        <p className="text-gray-500 uppercase tracking-wide">Componente</p>
        <p className="font-semibold text-gray-800">{plano.subject}</p>
      </div>
    )}
    {plano.grade && (
      <div>
        <p className="text-gray-500 uppercase tracking-wide">Ano</p>
        <p className="font-semibold text-gray-800">{plano.grade}</p>
      </div>
    )}
    {plano.periodo_tipo && (
      <div>
        <p className="text-gray-500 uppercase tracking-wide">Período</p>
        <p className="font-semibold text-gray-800">{plano.periodo_tipo}</p>
      </div>
    )}
    {plano.total_aulas && (
      <div>
        <p className="text-gray-500 uppercase tracking-wide">Total de aulas</p>
        <p className="font-semibold text-gray-800">{plano.total_aulas}</p>
      </div>
    )}
  </div>
);

export default MeusPlanejamentos;