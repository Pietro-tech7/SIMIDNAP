import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import ModalPlano from '../components/ModalPlano';
import { gerarPdfPlanejamento } from '../utils/gerarPdfPlanejamento';
import { gerarPdfCoordenacao } from '../utils/gerarPdfCoordenacao';

// Abas de filtro — só o que pertence ao Planejador
const MODOS = [
  { value: 'todos', label: 'Todos', icon: '📋' },
  { value: 'planejamento', label: 'Planejamento', icon: '📅' },
  { value: 'coordenacao', label: 'Coordenação', icon: '🎓' },
];

// Tipos que pertencem ao Planejador (aparecem aqui)
const TIPOS_PLANEJADOR = ['planejamento', 'coordenacao'];

// Detecta o tipo real do plano (plan_type tem prioridade; fallback para modo)
const tipoDoPlano = (p) => p.plan_type || p.modo || 'aula';

const MeusPlanejamentos = () => {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroModo, setFiltroModo] = useState('todos');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('recentes');
  const [planoAberto, setPlanoAberto] = useState(null);
  const [modoInicial, setModoInicial] = useState('ver');
  const [gerandoPdfId, setGerandoPdfId] = useState(null);

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

  const salvarEdicaoCompleta = async ({ title, structured_data, comoNovo }) => {
    if (!planoAberto) return;

    if (comoNovo) {
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
  // BAIXAR PDF DIRETO (a partir da lista)
  // ============================================================
  const baixarPdfDireto = async (p) => {
    setGerandoPdfId(p.id);
    try {
      const tp = tipoDoPlano(p);
      if (tp === 'coordenacao') {
        await gerarPdfCoordenacao(p);
      } else {
        await gerarPdfPlanejamento(p);
      }
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  // ============================================================
  // Abrir modal (ver ou editar)
  // ============================================================
  const abrirModal = (p, modoInic) => {
    setPlanoAberto(p);
    setModoInicial(modoInic);
  };

  // ============================================================
  // Filtro e ordenação — SÓ planos do Planejador
  // ============================================================
  const planosPlanejador = planos.filter(p => TIPOS_PLANEJADOR.includes(tipoDoPlano(p)));

  const planosFiltrados = planosPlanejador
    .filter(p => filtroModo === 'todos' || tipoDoPlano(p) === filtroModo)
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

  const infoModo = (p) => {
    const tp = tipoDoPlano(p);
    return MODOS.find(x => x.value === tp) || MODOS[0];
  };

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
                Seus planejamentos de aula (Modo Planejamento e Modo Coordenação). Reabra, edite, duplique ou exclua.
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
            {planosPlanejador.length === 0
              ? 'Você ainda não criou nenhum planejamento.'
              : 'Nenhum planejamento corresponde ao filtro.'}
          </p>
          {planosPlanejador.length === 0 && (
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
            const m = infoModo(p);
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
                      onClick={() => abrirModal(p, 'ver')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      👁️ Reabrir
                    </button>
                    <button
                      onClick={() => abrirModal(p, 'editar')}
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
                      onClick={() => baixarPdfDireto(p)}
                      disabled={gerandoPdfId === p.id}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      {gerandoPdfId === p.id ? '⏳ Gerando...' : '📥 PDF'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {planoAberto && (
        <ModalPlano
          plano={planoAberto}
          modoInicial={modoInicial}
          onFechar={() => setPlanoAberto(null)}
          onSalvar={salvarEdicaoCompleta}
        />
      )}

    </div>
  );
};

export default MeusPlanejamentos;