import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

// ============================================================
// METADADOS DAS SEÇÕES (nome, ícone, título)
// ============================================================
const SECOES_INFO = {
  hero:          { icon: '🎯', label: 'Hero' },
  credibility:   { icon: '✅', label: 'Barra de Credibilidade' },
  problem:       { icon: '😩', label: 'Problema (Dor)' },
  solution:      { icon: '🧩', label: 'Solução (Motores)' },
  video:         { icon: '🎥', label: 'Vídeo Explicativo' },
  how_it_works:  { icon: '🪜', label: 'Como Funciona' },
  metrics:       { icon: '📊', label: 'Métricas' },
  testimonials:  { icon: '💬', label: 'Depoimentos' },
  comparison:    { icon: '⚖️', label: 'Comparativo' },
  plans:         { icon: '💰', label: 'Planos' },
  guarantee:     { icon: '🛡️', label: 'Garantia' },
  faq:           { icon: '❓', label: 'FAQ' },
  final_cta:     { icon: '🚀', label: 'CTA Final' },
  footer:        { icon: '📄', label: 'Footer' },
};

const AdminLanding = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [secaoAtiva, setSecaoAtiva] = useState('hero');

  // ============================================================
  // CARREGAR CONFIG
  // ============================================================
  useEffect(() => {
    api.get('/landing/admin/config')
      .then(res => setConfig(res.data?.config))
      .catch(() => setMsg({ tipo: 'erro', texto: 'Erro ao carregar configuração.' }))
      .finally(() => setLoading(false));
  }, []);

  // ============================================================
  // SALVAR SEÇÃO INTEIRA
  // ============================================================
  const salvarSecao = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const payload = {
        [secaoAtiva]: config[secaoAtiva],
      };
      const res = await api.put('/landing/admin/config', payload);
      setConfig(res.data.config);
      setMsg({ tipo: 'sucesso', texto: 'Seção salva com sucesso!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // RESETAR TUDO
  // ============================================================
  const resetarTudo = async () => {
    if (!window.confirm('Tem certeza? Isso vai reverter TODAS as seções para o padrão.')) return;
    if (!window.confirm('Última confirmação: resetar tudo?')) return;

    setSalvando(true);
    try {
      const res = await api.post('/landing/admin/config/reset', {});
      setConfig(res.data.config);
      setMsg({ tipo: 'sucesso', texto: 'Configuração resetada para o padrão.' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: 'Erro ao resetar.' });
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // ATUALIZAR CAMPO DA SEÇÃO ATIVA
  // ============================================================
  const updateField = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [secaoAtiva]: {
        ...prev[secaoAtiva],
        [field]: value,
      },
    }));
  };

  // ============================================================
  // TOGGLE ENABLED
  // ============================================================
  const toggleEnabled = (secao) => {
    setConfig(prev => ({
      ...prev,
      [secao]: {
        ...prev[secao],
        enabled: !prev[secao]?.enabled,
      },
    }));
  };

  // ============================================================
  // MOVER SEÇÃO (reordenar)
  // ============================================================
  const moverSecao = (secao, direcao) => {
    const ordem = [...config.sections_order];
    const idx = ordem.indexOf(secao);
    if (idx === -1) return;
    const novoIdx = direcao === 'up' ? idx - 1 : idx + 1;
    if (novoIdx < 0 || novoIdx >= ordem.length) return;

    [ordem[idx], ordem[novoIdx]] = [ordem[novoIdx], ordem[idx]];
    setConfig(prev => ({ ...prev, sections_order: ordem }));
  };

  // ============================================================
  // SALVAR ORDEM DAS SEÇÕES
  // ============================================================
  const salvarOrdem = async () => {
    setSalvando(true);
    try {
      const res = await api.put('/landing/admin/config', {
        sections_order: config.sections_order,
      });
      setConfig(res.data.config);
      setMsg({ tipo: 'sucesso', texto: 'Ordem salva!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar ordem.' });
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return <div className="text-gray-400 py-20 text-center">Carregando configuração...</div>;
  }
  if (!config) {
    return <div className="text-red-400 py-20 text-center">Erro: config não carregada.</div>;
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      {/* ============= TOP BAR ============= */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Editor da Landing Page</h1>
          <p className="text-gray-400 text-sm mt-1">
            Edite textos, seções e ordem. As mudanças aparecem em simidnape.com.br.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm border border-gray-700"
          >
            👁️ Ver landing
          </a>
          <button
            onClick={resetarTudo}
            disabled={salvando}
            className="bg-red-900/30 hover:bg-red-900/50 text-red-300 font-medium px-4 py-2 rounded-lg text-sm border border-red-800 disabled:opacity-50"
          >
            🔄 Resetar tudo
          </button>
          <button
            onClick={salvarSecao}
            disabled={salvando}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : '💾 Salvar seção'}
          </button>
        </div>
      </div>

      {/* ============= MENSAGEM ============= */}
      {msg && (
        <div className={`rounded-lg p-3 mb-6 text-sm ${
          msg.tipo === 'sucesso'
            ? 'bg-green-500/20 border border-green-500/30 text-green-300'
            : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
        </div>
      )}

      {/* ============= LAYOUT: MENU + EDITOR ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ========= MENU LATERAL ========= */}
        <div className="lg:col-span-1 bg-gray-800 border border-gray-700 rounded-xl p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-3 py-2">
            Seções
          </p>
          <div className="space-y-1">
            {config.sections_order.map((secao, idx) => {
              const info = SECOES_INFO[secao] || { icon: '📄', label: secao };
              const ativa = secaoAtiva === secao;
              const habilitada = config[secao]?.enabled !== false;

              return (
                <div
                  key={secao}
                  className={`flex items-center gap-1 rounded-lg transition ${
                    ativa ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-gray-700/50'
                  }`}
                >
                  {/* Botão de selecionar */}
                  <button
                    onClick={() => setSecaoAtiva(secao)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 text-left text-sm ${
                      ativa ? 'text-white font-medium' : 'text-gray-300'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span className="truncate">{info.label}</span>
                  </button>

                  {/* Toggle enabled */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleEnabled(secao); }}
                    title={habilitada ? 'Desativar' : 'Ativar'}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                      habilitada
                        ? 'bg-green-500/30 text-green-300'
                        : 'bg-gray-700 text-gray-500'
                    }`}
                  >
                    {habilitada ? '●' : '○'}
                  </button>

                  {/* Setas reordenar */}
                  <div className="flex flex-col">
                    <button
                      onClick={(e) => { e.stopPropagation(); moverSecao(secao, 'up'); }}
                      disabled={idx === 0}
                      className="text-gray-500 hover:text-white text-xs leading-none px-1 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moverSecao(secao, 'down'); }}
                      disabled={idx === config.sections_order.length - 1}
                      className="text-gray-500 hover:text-white text-xs leading-none px-1 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={salvarOrdem}
            disabled={salvando}
            className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2 rounded-lg disabled:opacity-50"
          >
            💾 Salvar ordem das seções
          </button>

          <div className="border-t border-gray-700 mt-3 pt-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-3 py-1">
              Global
            </p>
            <button
              onClick={() => setSecaoAtiva('_global')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left ${
                secaoAtiva === '_global'
                  ? 'bg-blue-600/20 border border-blue-500/50 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <span>⚙️</span>
              <span>Configurações Globais</span>
            </button>
            <button
              onClick={() => setSecaoAtiva('_popup')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left mt-1 ${
                secaoAtiva === '_popup'
                  ? 'bg-blue-600/20 border border-blue-500/50 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <span>📢</span>
              <span>Pop-up de Promoção</span>
              <span className={`ml-auto text-xs ${config.popup?.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                {config.popup?.enabled ? '● ON' : '○ OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* ========= EDITOR ========= */}
        <div className="lg:col-span-3 bg-gray-800 border border-gray-700 rounded-xl p-6">
          {secaoAtiva === '_global' && <EditorGlobal config={config} setConfig={setConfig} onSave={salvarSecao} salvando={salvando} />}
          {secaoAtiva === '_popup' && <EditorPopup config={config} setConfig={setConfig} onSave={salvarSecao} salvando={salvando} />}
          {secaoAtiva !== '_global' && secaoAtiva !== '_popup' && (
            <EditorSecao
              secao={secaoAtiva}
              data={config[secaoAtiva] || {}}
              onChange={updateField}
              onSave={salvarSecao}
              salvando={salvando}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR DE CADA SEÇÃO
// ============================================================
const EditorSecao = ({ secao, data, onChange, onSave, salvando }) => {
  const info = SECOES_INFO[secao] || { icon: '📄', label: secao };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
        <span className="text-3xl">{info.icon}</span>
        <div>
          <h2 className="text-xl font-bold text-white">{info.label}</h2>
          <p className="text-xs text-gray-400">
            {data.enabled !== false ? '● Ativa na landing' : '○ Desativada (não aparece)'}
          </p>
        </div>
      </div>

      {/* Campos específicos por seção */}
      {secao === 'hero' && <EditorHero data={data} onChange={onChange} />}
      {secao === 'credibility' && <EditorCredibility data={data} onChange={onChange} />}
      {secao === 'problem' && <EditorProblem data={data} onChange={onChange} />}
      {secao === 'solution' && <EditorSolution data={data} onChange={onChange} />}
      {secao === 'video' && <EditorVideo data={data} onChange={onChange} />}
      {secao === 'how_it_works' && <EditorHowItWorks data={data} onChange={onChange} />}
      {secao === 'metrics' && <EditorMetrics data={data} onChange={onChange} />}
      {secao === 'testimonials' && <EditorTestimonials data={data} onChange={onChange} />}
      {secao === 'comparison' && <EditorComparison data={data} onChange={onChange} />}
      {secao === 'plans' && <EditorPlans data={data} onChange={onChange} />}
      {secao === 'guarantee' && <EditorGuarantee data={data} onChange={onChange} />}
      {secao === 'faq' && <EditorFAQ data={data} onChange={onChange} />}
      {secao === 'final_cta' && <EditorFinalCTA data={data} onChange={onChange} />}
      {secao === 'footer' && <EditorFooter data={data} onChange={onChange} />}

      <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
        <button
          onClick={onSave}
          disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : `💾 Salvar "${info.label}"`}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// HELPERS DE INPUT
// ============================================================
const Input = ({ label, value, onChange, placeholder, type = 'text', help }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
    {help && <p className="text-xs text-gray-500 mb-1.5">{help}</p>}
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3, placeholder, help }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
    {help && <p className="text-xs text-gray-500 mb-1.5">{help}</p>}
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <label className="flex items-center gap-3 mb-4 cursor-pointer">
    <div className={`relative w-11 h-6 rounded-full transition ${value ? 'bg-blue-600' : 'bg-gray-700'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${value ? 'left-5.5' : 'left-0.5'}`} />
    </div>
    <span className="text-sm text-gray-300">{label}</span>
  </label>
);

// ============================================================
// EDITORES ESPECÍFICOS
// ============================================================
const EditorHero = ({ data, onChange }) => (
  <>
    <Toggle label="Hero ativado" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Badge (texto pequeno no topo)" value={data.badge} onChange={(v) => onChange('badge', v)} />
    <Textarea label="Headline principal" value={data.headline} onChange={(v) => onChange('headline', v)} rows={2} />
    <Textarea label="Subheadline" value={data.subheadline} onChange={(v) => onChange('subheadline', v)} rows={3} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Texto do CTA principal" value={data.cta_primary_text} onChange={(v) => onChange('cta_primary_text', v)} />
      <Input label="Link do CTA principal" value={data.cta_primary_link} onChange={(v) => onChange('cta_primary_link', v)} />
      <Input label="Texto do CTA secundário" value={data.cta_secondary_text} onChange={(v) => onChange('cta_secondary_text', v)} />
      <Input label="URL do vídeo do CTA secundário" value={data.cta_secondary_video_url} onChange={(v) => onChange('cta_secondary_video_url', v)} />
    </div>
    <Input
      label="URL do vídeo principal (hero)"
      value={data.video_url}
      onChange={(v) => onChange('video_url', v)}
      placeholder="https://www.youtube.com/watch?v=..."
      help="Cole a URL do YouTube, Vimeo ou arquivo .mp4"
    />
    <Toggle label="Mostrar vídeo principal" value={data.video_enabled} onChange={(v) => onChange('video_enabled', v)} />
  </>
);

const EditorCredibility = ({ data, onChange }) => (
  <>
    <Toggle label="Barra ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Textarea
      label="Itens (um por linha)"
      value={(data.items || []).join('\n')}
      onChange={(v) => onChange('items', v.split('\n').filter(Boolean))}
      rows={5}
      help="Cada linha vira um check na barra"
    />
  </>
);

const EditorProblem = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
    <Input label="Texto de transição" value={data.transition_text} onChange={(v) => onChange('transition_text', v)} />
    <p className="text-xs text-gray-500 mt-4 mb-2">Cards de dor:</p>
    {(data.cards || []).map((c, i) => (
      <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2">
        <Input label={`Ícone ${i + 1}`} value={c.icon} onChange={(v) => {
          const cards = [...(data.cards || [])]; cards[i] = { ...cards[i], icon: v }; onChange('cards', cards);
        }} />
        <Input label={`Título ${i + 1}`} value={c.title} onChange={(v) => {
          const cards = [...(data.cards || [])]; cards[i] = { ...cards[i], title: v }; onChange('cards', cards);
        }} />
        <Textarea label={`Descrição ${i + 1}`} value={c.description} onChange={(v) => {
          const cards = [...(data.cards || [])]; cards[i] = { ...cards[i], description: v }; onChange('cards', cards);
        }} rows={2} />
      </div>
    ))}
  </>
);

const EditorSolution = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Textarea label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} rows={2} />
    <p className="text-xs text-gray-500 mt-4 mb-2">Motores (7):</p>
    {(data.motors || []).map((m, i) => (
      <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label={`Ícone ${i + 1}`} value={m.icon} onChange={(v) => {
            const motors = [...(data.motors || [])]; motors[i] = { ...motors[i], icon: v }; onChange('motors', motors);
          }} />
          <Input label={`Nome ${i + 1}`} value={m.name} onChange={(v) => {
            const motors = [...(data.motors || [])]; motors[i] = { ...motors[i], name: v }; onChange('motors', motors);
          }} />
        </div>
        <Textarea label={`Descrição ${i + 1}`} value={m.description} onChange={(v) => {
          const motors = [...(data.motors || [])]; motors[i] = { ...motors[i], description: v }; onChange('motors', motors);
        }} rows={2} />
      </div>
    ))}
  </>
);

const EditorVideo = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
    <Input
      label="URL do vídeo"
      value={data.video_url}
      onChange={(v) => onChange('video_url', v)}
      placeholder="https://www.youtube.com/watch?v=..."
      help="Cole a URL do YouTube, Vimeo ou arquivo .mp4"
    />
  </>
);

const EditorHowItWorks = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
    <p className="text-xs text-gray-500 mt-4 mb-2">Passos:</p>
    {(data.steps || []).map((s, i) => (
      <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2">
        <Input label={`Número ${i + 1}`} value={s.number} onChange={(v) => {
          const steps = [...(data.steps || [])]; steps[i] = { ...steps[i], number: v }; onChange('steps', steps);
        }} />
        <Input label={`Título ${i + 1}`} value={s.title} onChange={(v) => {
          const steps = [...(data.steps || [])]; steps[i] = { ...steps[i], title: v }; onChange('steps', steps);
        }} />
        <Textarea label={`Descrição ${i + 1}`} value={s.description} onChange={(v) => {
          const steps = [...(data.steps || [])]; steps[i] = { ...steps[i], description: v }; onChange('steps', steps);
        }} rows={2} />
      </div>
    ))}
  </>
);

const EditorMetrics = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <p className="text-xs text-gray-500 mt-4 mb-2">Métricas:</p>
    {(data.metrics || []).map((m, i) => (
      <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2 grid grid-cols-2 gap-2">
        <Input label={`Valor ${i + 1}`} value={m.value} onChange={(v) => {
          const metrics = [...(data.metrics || [])]; metrics[i] = { ...metrics[i], value: v }; onChange('metrics', metrics);
        }} />
        <Input label={`Rótulo ${i + 1}`} value={m.label} onChange={(v) => {
          const metrics = [...(data.metrics || [])]; metrics[i] = { ...metrics[i], label: v }; onChange('metrics', metrics);
        }} />
      </div>
    ))}
  </>
);

const EditorTestimonials = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <p className="text-xs text-gray-500 mt-4 mb-2">
      Depoimentos (se deixar vazio, mostra placeholder "Em breve")
    </p>
    {(data.testimonials || []).map((t, i) => (
      <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label={`Nome ${i + 1}`} value={t.name} onChange={(v) => {
            const arr = [...(data.testimonials || [])]; arr[i] = { ...arr[i], name: v }; onChange('testimonials', arr);
          }} />
          <Input label={`Escola/Info ${i + 1}`} value={t.school} onChange={(v) => {
            const arr = [...(data.testimonials || [])]; arr[i] = { ...arr[i], school: v }; onChange('testimonials', arr);
          }} />
        </div>
        <Textarea label={`Depoimento ${i + 1}`} value={t.text} onChange={(v) => {
          const arr = [...(data.testimonials || [])]; arr[i] = { ...arr[i], text: v }; onChange('testimonials', arr);
        }} rows={3} />
        <button
          onClick={() => onChange('testimonials', (data.testimonials || []).filter((_, j) => j !== i))}
          className="text-red-400 hover:text-red-300 text-xs"
        >
          🗑️ Remover
        </button>
      </div>
    ))}
    <button
      onClick={() => onChange('testimonials', [...(data.testimonials || []), { name: '', school: '', text: '' }])}
      className="text-blue-400 hover:text-blue-300 text-sm"
    >
      + Adicionar depoimento
    </button>
  </>
);

const EditorComparison = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Textarea
      label="Colunas (uma por linha)"
      value={(data.columns || []).join('\n')}
      onChange={(v) => onChange('columns', v.split('\n').filter(Boolean))}
      rows={3}
    />
    <p className="text-xs text-gray-500 mt-4 mb-2">Linhas de comparação:</p>
    {(data.rows || []).map((r, i) => (
      <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2">
        <Input label={`Recurso ${i + 1}`} value={r.feature} onChange={(v) => {
          const arr = [...(data.rows || [])]; arr[i] = { ...arr[i], feature: v }; onChange('rows', arr);
        }} />
        <Input
          label={`Valores (separados por vírgula) — ${i + 1}`}
          value={(r.values || []).join(', ')}
          onChange={(v) => {
            const arr = [...(data.rows || [])]; arr[i] = { ...arr[i], values: v.split(',').map(s => s.trim()) }; onChange('rows', arr);
          }}
        />
      </div>
    ))}
  </>
);

const EditorPlans = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Textarea label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} rows={2} />
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200 mt-4">
      ℹ️ Os planos em si (preços, créditos) são gerenciados no sistema. Esta seção só edita os textos acima.
    </div>
  </>
);

const EditorGuarantee = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Textarea
      label="Itens (um por linha)"
      value={(data.items || []).join('\n')}
      onChange={(v) => onChange('items', v.split('\n').filter(Boolean))}
      rows={5}
    />
  </>
);

const EditorFAQ = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <p className="text-xs text-gray-500 mt-4 mb-2">Perguntas:</p>
    {(data.items || []).map((f, i) => (
      <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2">
        <Input label={`Pergunta ${i + 1}`} value={f.question} onChange={(v) => {
          const arr = [...(data.items || [])]; arr[i] = { ...arr[i], question: v }; onChange('items', arr);
        }} />
        <Textarea label={`Resposta ${i + 1}`} value={f.answer} onChange={(v) => {
          const arr = [...(data.items || [])]; arr[i] = { ...arr[i], answer: v }; onChange('items', arr);
        }} rows={3} />
        <button
          onClick={() => onChange('items', (data.items || []).filter((_, j) => j !== i))}
          className="text-red-400 hover:text-red-300 text-xs"
        >
          🗑️ Remover
        </button>
      </div>
    ))}
    <button
      onClick={() => onChange('items', [...(data.items || []), { question: '', answer: '' }])}
      className="text-blue-400 hover:text-blue-300 text-sm"
    >
      + Adicionar pergunta
    </button>
  </>
);

const EditorFinalCTA = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Textarea label="Headline" value={data.headline} onChange={(v) => onChange('headline', v)} rows={2} />
    <Textarea label="Subheadline" value={data.subheadline} onChange={(v) => onChange('subheadline', v)} rows={2} />
    <Input label="Texto do botão" value={data.cta_text} onChange={(v) => onChange('cta_text', v)} />
    <Input label="Link do botão" value={data.cta_link} onChange={(v) => onChange('cta_link', v)} />
  </>
);

const EditorFooter = ({ data, onChange }) => (
  <>
    <Toggle label="Footer ativado" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Texto de copyright" value={data.copyright_text} onChange={(v) => onChange('copyright_text', v)} />
    <p className="text-xs text-gray-500 mt-4 mb-2">Links do footer:</p>
    {(data.links || []).map((l, i) => (
      <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2 grid grid-cols-2 gap-2">
        <Input label={`Rótulo ${i + 1}`} value={l.label} onChange={(v) => {
          const arr = [...(data.links || [])]; arr[i] = { ...arr[i], label: v }; onChange('links', arr);
        }} />
        <Input label={`URL ${i + 1}`} value={l.href} onChange={(v) => {
          const arr = [...(data.links || [])]; arr[i] = { ...arr[i], href: v }; onChange('links', arr);
        }} />
      </div>
    ))}
  </>
);

// ============================================================
// EDITOR GLOBAL
// ============================================================
const EditorGlobal = ({ config, setConfig, onSave, salvando }) => {
  const update = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
        <span className="text-3xl">⚙️</span>
        <div>
          <h2 className="text-xl font-bold text-white">Configurações Globais</h2>
          <p className="text-xs text-gray-400">SEO, cores e informações gerais</p>
        </div>
      </div>

      <Input
        label="Título SEO (aparece no Google)"
        value={config.seo_title}
        onChange={(v) => update('seo_title', v)}
      />
      <Textarea
        label="Descrição SEO"
        value={config.seo_description}
        onChange={(v) => update('seo_description', v)}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cor primária (hex)"
          value={config.primary_color}
          onChange={(v) => update('primary_color', v)}
          placeholder="#2563eb"
        />
        <Input
          label="Cor de destaque (hex)"
          value={config.accent_color}
          onChange={(v) => update('accent_color', v)}
          placeholder="#7c3aed"
        />
      </div>

      <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
        <button
          onClick={async () => {
            setConfig(prev => prev);
            // Salva direto via API
            try {
              const res = await import('../api/api').then(m => m.default.put('/landing/admin/config', {
                seo_title: config.seo_title,
                seo_description: config.seo_description,
                primary_color: config.primary_color,
                accent_color: config.accent_color,
              }));
              setConfig(res.data.config);
            } catch {}
          }}
          disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : '💾 Salvar configurações'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR POPUP
// ============================================================
const EditorPopup = ({ config, setConfig, onSave, salvando }) => {
  const popup = config.popup || {};
  const update = (field, value) => {
    setConfig(prev => ({
      ...prev,
      popup: { ...prev.popup, [field]: value },
    }));
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
        <span className="text-3xl">📢</span>
        <div>
          <h2 className="text-xl font-bold text-white">Pop-up de Promoção</h2>
          <p className="text-xs text-gray-400">Aparece no canto da landing após alguns segundos</p>
        </div>
      </div>

      <Toggle label="Pop-up ativado" value={popup.enabled} onChange={(v) => update('enabled', v)} />
      <Input label="Título" value={popup.title} onChange={(v) => update('title', v)} />
      <Textarea label="Mensagem" value={popup.message} onChange={(v) => update('message', v)} rows={3} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Texto do botão" value={popup.cta_text} onChange={(v) => update('cta_text', v)} />
        <Input label="Link do botão" value={popup.cta_link} onChange={(v) => update('cta_link', v)} />
        <Input
          label="Delay em segundos"
          type="number"
          value={popup.delay_seconds}
          onChange={(v) => update('delay_seconds', parseInt(v) || 5)}
        />
      </div>
      <Toggle
        label="Mostrar apenas uma vez por sessão"
        value={popup.show_once_per_user}
        onChange={(v) => update('show_once_per_user', v)}
      />

      <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
        <button
          onClick={async () => {
            try {
              const res = await import('../api/api').then(m => m.default.put('/landing/admin/config', {
                popup: config.popup,
              }));
              setConfig(res.data.config);
            } catch {}
          }}
          disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : '💾 Salvar pop-up'}
        </button>
      </div>
    </div>
  );
};

export default AdminLanding;