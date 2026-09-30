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
  const [planoAberto, setPlanoAberto] = useState(null); // modal de ver/editar

  // Estado do modal "Publicar na Comunidade"
  const [planoPublicando, setPlanoPublicando] = useState(null);
  const [privacidade, setPrivacidade] = useState({
    mostrar_nome: true,
    mostrar_escola: true,
    mostrar_municipio: true,
    mostrar_titulo: true,
  });
  const [publicando, setPublicando] = useState(false);
  const [msgPublicar, setMsgPublicar] = useState(null);

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

// (função removida no D11b-fix — a edição agora é feita dentro do ModalPlano)

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
  // COMUNIDADE — Publicar / Despublicar (D12d)
  // ============================================================
  const abrirPublicar = (plano) => {
    if (plano.publico) {
      // Já está público — pergunta se quer tirar do ar
      if (!window.confirm('Este plano JÁ está na Comunidade. Deseja removê-lo do banco público?')) return;
      despublicar(plano.id);
      return;
    }
    // Reset padrão dos checkboxes
    setPrivacidade({
      mostrar_nome: true,
      mostrar_escola: true,
      mostrar_municipio: true,
      mostrar_titulo: true,
    });
    setMsgPublicar(null);
    setPlanoPublicando(plano);
  };

  const publicarPlano = async () => {
    if (!planoPublicando) return;
    setPublicando(true);
    setMsgPublicar(null);
    try {
      const res = await api.post(
        `/lesson-plans/${planoPublicando.id}/publish`,
        privacidade,
      );
      // Atualiza o plano na lista
      setPlanos(prev => prev.map(p => p.id === planoPublicando.id ? res.data : p));
      setMsgPublicar({
        tipo: 'sucesso',
        texto: '✅ Plano publicado na Comunidade! Agora qualquer professor autorizado pode consultar e baixar em PDF.',
      });
      // Fecha o modal depois de 2s
      setTimeout(() => {
        setPlanoPublicando(null);
        setMsgPublicar(null);
      }, 2200);
    } catch (err) {
      setMsgPublicar({
        tipo: 'erro',
        texto: err?.response?.data?.detail || 'Erro ao publicar. Tente novamente.',
      });
    } finally {
      setPublicando(false);
    }
  };

  const despublicar = async (id) => {
    try {
      const res = await api.post(`/lesson-plans/${id}/unpublish`);
      setPlanos(prev => prev.map(p => p.id === id ? res.data : p));
    } catch {
      alert('Erro ao remover do banco público.');
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
                      onClick={() => setPlanoAberto(p)}
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
                      onClick={() => abrirPublicar(p)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                        p.publico
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                      }`}
                    >
                      {p.publico ? '🌐 No ar' : '🌐 Publicar'}
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

      {/* MODAL — Publicar na Comunidade */}
      {planoPublicando && (
        <ModalPublicar
          plano={planoPublicando}
          privacidade={privacidade}
          setPrivacidade={setPrivacidade}
          publicando={publicando}
          msg={msgPublicar}
          onPublicar={publicarPlano}
          onFechar={() => { setPlanoPublicando(null); setMsgPublicar(null); }}
        />
      )}
    </div>
  );
};

// ============================================================
// MODAL — Publicar na Comunidade de Planejamentos SIMIDNAPE (D12d)
// ============================================================
const ModalPublicar = ({ plano, privacidade, setPrivacidade, publicando, msg, onPublicar, onFechar }) => {
  const toggle = (campo) => {
    setPrivacidade(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const CheckItem = ({ campo, label, descricao, disabled = false }) => (
    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 transition cursor-pointer ${
      disabled
        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-70'
        : privacidade[campo]
          ? 'bg-emerald-50 border-emerald-500'
          : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <input
        type="checkbox"
        checked={disabled ? false : privacidade[campo]}
        disabled={disabled}
        onChange={() => !disabled && toggle(campo)}
        className="mt-0.5 w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${privacidade[campo] && !disabled ? 'text-emerald-900' : 'text-gray-800'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{descricao}</p>
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 rounded-t-xl text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            🌐 Publicar na Comunidade de Planejamentos SIMIDNAPE
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Aqui ficam planejamentos prontos que outros professores autorizados podem consultar e baixar em PDF.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Atenção:</strong> este planejamento será salvo na sua conta e <strong>também</strong> ficará
              disponível no banco público do SIMIDNAPE — onde outros professores autorizados podem consultar e baixar.
              Você escolhe o que aparece no banco público:
            </p>
          </div>

          <div className="space-y-2">
            <CheckItem
              campo="mostrar_nome"
              label="Mostrar meu nome"
              descricao="Seu nome completo aparece no plano no banco público."
            />
            <CheckItem
              campo="mostrar_escola"
              label="Mostrar o nome da minha escola"
              descricao="O nome da escola que você preencheu no cabeçalho."
            />
            <CheckItem
              campo="mostrar_municipio"
              label="Mostrar meu município/estado"
              descricao="Município e UF informados no cabeçalho."
            />
            <CheckItem
              campo="mostrar_titulo"
              label="Mostrar o nome do planejamento (título)"
              descricao="Se desmarcar, o título será substituído por 'Plano de [Componente] · [Ano]'."
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-xs text-emerald-900 leading-relaxed">
              🔒 Sua chave de API e seus dados pessoais <strong>nunca</strong> vão para o banco público. Apenas
              o conteúdo pedagógico e o que você marcar acima.
            </p>
          </div>

          {msg && (
            <div className={`rounded-lg p-3 text-sm ${
              msg.tipo === 'sucesso'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {msg.texto}
            </div>
          )}

          <p className="text-xs text-gray-500 italic">
            Este plano é: <strong className="text-gray-700">{plano.title}</strong>
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-xl">
          <button
            onClick={onFechar}
            disabled={publicando}
            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium text-sm px-5 py-2 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={onPublicar}
            disabled={publicando}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm px-5 py-2 rounded-lg transition"
          >
            {publicando ? '⏳ Publicando...' : '🌐 Publicar na Comunidade'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeusPlanejamentos;