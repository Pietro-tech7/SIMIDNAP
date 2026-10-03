import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

// ============================================================
// DEFINIÇÃO DAS ABAS
// ============================================================
const ABAS_PRINCIPAIS = [
  { value: 'materiais', label: 'Materiais', icon: '📄' },
  { value: 'questoes', label: 'Minhas Questões', icon: '✨' },
  { value: 'neuroaula', label: 'NeuroAula', icon: '🧠' },
  { value: 'aula_funciona', label: 'Aula que Funciona', icon: '🎯' },
  { value: 'aluno', label: 'Meu Aluno', icon: '👤' },
  { value: 'praticas', label: 'Práticas Exitosas', icon: '🏆' },
  { value: 'terapia', label: 'Terapia', icon: '💭' },
];

const SUB_ABAS_MATERIAIS = [
  { value: 'atividade_imprimivel', label: 'Atividades', icon: '📝' },
  { value: 'jogo_dinamica', label: 'Jogos', icon: '🎲' },
  { value: 'simulado', label: 'Simulados', icon: '📋' },
];

// ============================================================
// HELPERS
// ============================================================
const fmtData = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const ORDENS = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'antigos', label: 'Mais antigos' },
  { value: 'titulo', label: 'Título (A-Z)' },
];

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const MeuAcervo = () => {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('materiais');
  const [subAbaMateriais, setSubAbaMateriais] = useState('atividade_imprimivel');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('recentes');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Dados de cada motor
  const [materiais, setMateriais] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [neuroaulas, setNeuroaulas] = useState([]);
  const [aulasFunciona, setAulasFunciona] = useState([]);
  const [casos, setCasos] = useState([]);
  const [praticas, setPraticas] = useState([]);
  const [reflexoes, setReflexoes] = useState([]);

  // ============================================================
  // CARREGAMENTO EM PARALELO
  // ============================================================
  const carregarTudo = async () => {
    setLoading(true);
    setErro('');
    try {
      const [
        rMateriais, rQuestoes, rNeuro, rAulaFunciona,
        rCasos, rPraticas, rReflexoes,
      ] = await Promise.all([
        api.get('/materials').catch(() => ({ data: [] })),
        api.get('/question-ia/minhas').catch(() => ({ data: [] })),
        api.get('/lesson-plans?plan_type=neuroaula').catch(() => ({ data: [] })),
        api.get('/lesson-plans?plan_type=aula_que_funciona').catch(() => ({ data: [] })),
        api.get('/pedagogical-cases').catch(() => ({ data: [] })),
        api.get('/successful-practices').catch(() => ({ data: [] })),
        api.get('/reflections').catch(() => ({ data: [] })),
      ]);
      setMateriais(rMateriais.data || []);
      setQuestoes(rQuestoes.data || []);
      setNeuroaulas(rNeuro.data || []);
      setAulasFunciona(rAulaFunciona.data || []);
      setCasos(rCasos.data || []);
      setPraticas(rPraticas.data || []);
      setReflexoes(rReflexoes.data || []);
    } catch (e) {
      setErro('Erro ao carregar o acervo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarTudo(); }, []);

  // ============================================================
  // AÇÕES
  // ============================================================
  const excluirMaterial = async (id) => {
    if (!window.confirm('Excluir este material?')) return;
    try {
      await api.delete(`/materials/${id}`);
      setMateriais(prev => prev.filter(m => m.id !== id));
    } catch { alert('Erro ao excluir.'); }
  };

  const excluirCaso = async (id) => {
    if (!window.confirm('Excluir esta situação?')) return;
    try {
      await api.delete(`/pedagogical-cases/${id}`);
      setCasos(prev => prev.filter(c => c.id !== id));
    } catch { alert('Erro ao excluir.'); }
  };

  const excluirPratica = async (id) => {
    if (!window.confirm('Excluir esta prática?')) return;
    try {
      await api.delete(`/successful-practices/${id}`);
      setPraticas(prev => prev.filter(p => p.id !== id));
    } catch { alert('Erro ao excluir.'); }
  };

  const excluirReflexao = async (id) => {
    if (!window.confirm('Excluir esta conversa?')) return;
    try {
      await api.delete(`/reflections/${id}`);
      setReflexoes(prev => prev.filter(r => r.id !== id));
    } catch { alert('Erro ao excluir.'); }
  };

  const excluirPlano = async (id, tipo) => {
    if (!window.confirm('Excluir este plano?')) return;
    try {
      await api.delete(`/lesson-plans/${id}`);
      if (tipo === 'neuroaula') setNeuroaulas(prev => prev.filter(p => p.id !== id));
      if (tipo === 'aula_que_funciona') setAulasFunciona(prev => prev.filter(p => p.id !== id));
    } catch { alert('Erro ao excluir.'); }
  };

  // ============================================================
  // FILTROS NA MEMÓRIA
  // ============================================================
  const aplicarFiltros = (lista, campos) => {
    const termo = busca.toLowerCase().trim();
    return lista
      .filter(item => {
        if (!termo) return true;
        return campos.some(c => (item[c] || '').toString().toLowerCase().includes(termo));
      })
      .sort((a, b) => {
        if (ordem === 'recentes') return new Date(b.created_at) - new Date(a.created_at);
        if (ordem === 'antigos') return new Date(a.created_at) - new Date(b.created_at);
        if (ordem === 'titulo') {
          const ta = (a.title || a.enunciado || '').toLowerCase();
          const tb = (b.title || b.enunciado || '').toLowerCase();
          return ta.localeCompare(tb);
        }
        return 0;
      });
  };

  const materiaisFiltrados = aplicarFiltros(
    materiais.filter(m => m.material_type === subAbaMateriais),
    ['title', 'subject', 'grade']
  );
  const questoesFiltradas = aplicarFiltros(questoes, ['enunciado', 'disciplina', 'serie']);
  const neuroaulasFiltradas = aplicarFiltros(neuroaulas, ['title', 'subject', 'grade']);
  const aulasFuncionaFiltradas = aplicarFiltros(aulasFunciona, ['title', 'subject', 'grade']);
  const casosFiltrados = aplicarFiltros(casos, ['title', 'grade', 'subject']);
  const praticasFiltradas = aplicarFiltros(praticas, ['title', 'school', 'subject']);
  const reflexoesFiltradas = aplicarFiltros(reflexoes, ['title', 'theme']);

  // Contadores (badges)
  const contMateriais = (tipo) => materiais.filter(m => m.material_type === tipo).length;
  const contQuestoes = questoes.length;
  const contNeuroaulas = neuroaulas.length;
  const contAulasFunciona = aulasFunciona.length;
  const contCasos = casos.length;
  const contPraticas = praticas.length;
  const contReflexoes = reflexoes.length;

  // ============================================================
  // COMPONENTE — CARD GENÉRICO
  // ============================================================
  const Card = ({ icone, badge, titulo, subtitulo, data, botoes }) => (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition p-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {badge && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {icone} {badge}
              </span>
            )}
            <span className="text-xs text-gray-500">{fmtData(data)}</span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{titulo}</h3>
          {subtitulo && (
            <p className="text-sm text-gray-600 mt-0.5 truncate">{subtitulo}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 items-start">
          {botoes}
        </div>
      </div>
    </div>
  );

  const Btn = ({ onClick, variacao = 'primary', children }) => {
    const styles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
      danger: 'bg-white hover:bg-red-50 text-red-600 border border-red-200',
    };
    return (
      <button
        onClick={onClick}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${styles[variacao]}`}
      >
        {children}
      </button>
    );
  };

  // ============================================================
  // EMPTY STATE
  // ============================================================
  const EmptyState = ({ icone, titulo, ctaTexto, ctaRota }) => (
    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
      <p className="text-5xl mb-3">{icone}</p>
      <p className="text-gray-700 font-medium">{titulo}</p>
      {ctaRota && (
        <Link
          to={ctaRota}
          className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition"
        >
          {ctaTexto}
        </Link>
      )}
    </div>
  );

  // ============================================================
  // RENDER — CONTEÚDO DE CADA ABA
  // ============================================================
  const renderMateriais = () => (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 flex flex-wrap gap-2">
        {SUB_ABAS_MATERIAIS.map(sa => (
          <button
            key={sa.value}
            onClick={() => setSubAbaMateriais(sa.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              subAbaMateriais === sa.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {sa.icon} {sa.label} ({contMateriais(sa.value)})
          </button>
        ))}
      </div>

      {materiaisFiltrados.length === 0 ? (
        <EmptyState
          icone="📭"
          titulo={busca ? 'Nenhum material corresponde à busca.' : 'Você ainda não criou materiais deste tipo.'}
          ctaTexto="✨ Criar material"
          ctaRota="/gerador-materiais"
        />
      ) : (
        <div className="space-y-3">
          {materiaisFiltrados.map(m => (
            <Card
              key={m.id}
              icone="📄"
              badge={m.material_type === 'atividade_imprimivel' ? 'Atividade'
                : m.material_type === 'jogo_dinamica' ? 'Jogo'
                : 'Simulado'}
              titulo={m.title}
              subtitulo={[m.subject, m.grade].filter(Boolean).join(' · ') || '—'}
              data={m.created_at}
              botoes={
                <>
                  <Btn onClick={() => navigate('/gerador-materiais')}>👁️ Reabrir</Btn>
                  <Btn onClick={() => excluirMaterial(m.id)} variacao="danger">🗑️ Excluir</Btn>
                </>
              }
            />
          ))}
        </div>
      )}
    </>
  );

  const renderQuestoes = () => (
    questoesFiltradas.length === 0 ? (
      <EmptyState
        icone="📭"
        titulo={busca ? 'Nenhuma questão corresponde à busca.' : 'Você ainda não gerou questões.'}
        ctaTexto="✨ Gerar questões"
        ctaRota="/banco-questoes-ia"
      />
    ) : (
      <div className="space-y-3">
        {questoesFiltradas.map(q => (
          <Card
            key={q.id}
            icone="✨"
            badge={q.aprovada === false ? 'Em curadoria' : 'Questão IA'}
            titulo={q.enunciado?.slice(0, 140) + (q.enunciado?.length > 140 ? '...' : '')}
            subtitulo={[q.disciplina, q.serie, q.dificuldade].filter(Boolean).join(' · ') || '—'}
            data={q.created_at}
            botoes={
              <Btn onClick={() => navigate('/banco-questoes-ia')}>👁️ Reabrir</Btn>
            }
          />
        ))}
      </div>
    )
  );

  const renderNeuroAula = () => (
    neuroaulasFiltradas.length === 0 ? (
      <EmptyState
        icone="🧠"
        titulo={busca ? 'Nenhuma NeuroAula corresponde à busca.' : 'Você ainda não gerou nenhuma NeuroAula.'}
        ctaTexto="🧠 Criar NeuroAula"
        ctaRota="/neuroaula"
      />
    ) : (
      <div className="space-y-3">
        {neuroaulasFiltradas.map(n => (
          <Card
            key={n.id}
            icone="🧠"
            badge="NeuroAula"
            titulo={n.title}
            subtitulo={[n.subject, n.grade].filter(Boolean).join(' · ') || '—'}
            data={n.created_at}
            botoes={
              <>
                <Btn onClick={() => navigate('/neuroaula')}>👁️ Reabrir</Btn>
                <Btn onClick={() => excluirPlano(n.id, 'neuroaula')} variacao="danger">🗑️ Excluir</Btn>
              </>
            }
          />
        ))}
      </div>
    )
  );

  const renderAulaQueFunciona = () => (
    aulasFuncionaFiltradas.length === 0 ? (
      <EmptyState
        icone="🎯"
        titulo={busca ? 'Nenhuma Aula que Funciona corresponde à busca.' : 'Você ainda não criou Aula que Funciona.'}
        ctaTexto="🎯 Criar Aula que Funciona"
        ctaRota="/aula-que-funciona"
      />
    ) : (
      <div className="space-y-3">
        {aulasFuncionaFiltradas.map(a => (
          <Card
            key={a.id}
            icone="🎯"
            badge="Aula que Funciona"
            titulo={a.title}
            subtitulo={[a.subject, a.grade].filter(Boolean).join(' · ') || '—'}
            data={a.created_at}
            botoes={
              <>
                <Btn onClick={() => navigate('/aula-que-funciona')}>👁️ Reabrir</Btn>
                <Btn onClick={() => excluirPlano(a.id, 'aula_que_funciona')} variacao="danger">🗑️ Excluir</Btn>
              </>
            }
          />
        ))}
      </div>
    )
  );

  const renderCasos = () => (
    casosFiltrados.length === 0 ? (
      <EmptyState
        icone="📭"
        titulo={busca ? 'Nenhuma situação corresponde à busca.' : 'Você ainda não criou situações.'}
        ctaTexto="📊 Analisar situação"
        ctaRota="/meu-aluno"
      />
    ) : (
      <div className="space-y-3">
        {casosFiltrados.map(c => (
          <Card
            key={c.id}
            icone="👤"
            badge="Meu Aluno"
            titulo={c.title}
            subtitulo={[c.subject, c.grade].filter(Boolean).join(' · ') || '—'}
            data={c.created_at}
            botoes={
              <>
                <Btn onClick={() => navigate('/meu-aluno')}>👁️ Reabrir</Btn>
                <Btn onClick={() => excluirCaso(c.id)} variacao="danger">🗑️ Excluir</Btn>
              </>
            }
          />
        ))}
      </div>
    )
  );

  const renderPraticas = () => (
    praticasFiltradas.length === 0 ? (
      <EmptyState
        icone="📭"
        titulo={busca ? 'Nenhuma prática corresponde à busca.' : 'Você ainda não documentou práticas.'}
        ctaTexto="🏆 Documentar prática"
        ctaRota="/praticas-exitosas"
      />
    ) : (
      <div className="space-y-3">
        {praticasFiltradas.map(p => (
          <Card
            key={p.id}
            icone="🏆"
            badge={p.perfil === 'coordenador' ? 'Coordenação' : 'Professor'}
            titulo={p.title}
            subtitulo={[p.school, p.subject].filter(Boolean).join(' · ') || '—'}
            data={p.created_at}
            botoes={
              <>
                <Btn onClick={() => navigate('/praticas-exitosas')}>👁️ Reabrir</Btn>
                <Btn onClick={() => excluirPratica(p.id)} variacao="danger">🗑️ Excluir</Btn>
              </>
            }
          />
        ))}
      </div>
    )
  );

  const renderTerapia = () => (
    reflexoesFiltradas.length === 0 ? (
      <EmptyState
        icone="📭"
        titulo={busca ? 'Nenhuma conversa corresponde à busca.' : 'Você ainda não iniciou conversas.'}
        ctaTexto="💭 Iniciar conversa"
        ctaRota="/terapia-pedagogica"
      />
    ) : (
      <div className="space-y-3">
        {reflexoesFiltradas.map(r => (
          <Card
            key={r.id}
            icone="💭"
            badge="Terapia"
            titulo={r.title || 'Conversa'}
            subtitulo={r.theme ? `Tema: ${r.theme}` : ''}
            data={r.updated_at || r.created_at}
            botoes={
              <>
                <Btn onClick={() => navigate('/terapia-pedagogica')}>💬 Continuar</Btn>
                <Btn onClick={() => excluirReflexao(r.id)} variacao="danger">🗑️ Excluir</Btn>
              </>
            }
          />
        ))}
      </div>
    )
  );

  const renderConteudoAba = () => {
    if (abaAtiva === 'materiais') return renderMateriais();
    if (abaAtiva === 'questoes') return renderQuestoes();
    if (abaAtiva === 'neuroaula') return renderNeuroAula();
    if (abaAtiva === 'aula_funciona') return renderAulaQueFunciona();
    if (abaAtiva === 'aluno') return renderCasos();
    if (abaAtiva === 'praticas') return renderPraticas();
    if (abaAtiva === 'terapia') return renderTerapia();
    return null;
  };

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 text-sm hover:underline">
        ← Voltar ao Início
      </Link>

      <div className="mt-6 mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
          <span>🗂️</span>
          <span>MEU ACERVO</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🗂️</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Acervo</h1>
              <p className="text-gray-600">
                Tudo o que você já produziu nos motores do SIMIDNAPE.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas principais */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {ABAS_PRINCIPAIS.map(a => {
            const contadores = {
              materiais: materiais.length,
              questoes: contQuestoes,
              neuroaula: contNeuroaulas,
              aula_funciona: contAulasFunciona,
              aluno: contCasos,
              praticas: contPraticas,
              terapia: contReflexoes,
            };
            const cont = contadores[a.value] || 0;
            return (
              <button
                key={a.value}
                onClick={() => setAbaAtiva(a.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  abaAtiva === a.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {a.icon} {a.label} ({cont})
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de busca + ordenação */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="🔍 Buscar por título, componente ou tema..."
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {ORDENS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">
          ⚠️ {erro}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Carregando seu acervo...</div>
      ) : (
        renderConteudoAba()
      )}
    </div>
  );
};

export default MeuAcervo;