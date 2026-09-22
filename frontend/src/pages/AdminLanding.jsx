import React, { useState, useEffect } from 'react';
import api from '../api/api';
import UploadImage from '../components/UploadImage';

// ============================================================
// METADADOS DAS SEÇÕES
// ============================================================
const SECOES_INFO = {
  hero:          { icon: '🎯', label: 'Hero' },
  credibility:   { icon: '✅', label: 'Barra de Credibilidade' },
  problem:       { icon: '😩', label: 'Problema (Dor)' },
  solution:      { icon: '🧩', label: 'Solução (Motores)' },
  founder:       { icon: '👤', label: 'Criador (Founder)' },
  video:         { icon: '🎥', label: 'Vídeo Explicativo' },
  how_it_works:  { icon: '🪜', label: 'Como Funciona' },
  metrics:       { icon: '📊', label: 'Métricas' },
  testimonials:  { icon: '💬', label: 'Depoimentos' },
  comparison:    { icon: '⚖️', label: 'Comparativo' },
  founder_offer: { icon: '🎁', label: 'Oferta de Fundador' },
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

  useEffect(() => {
    api.get('/landing/admin/config')
      .then(res => setConfig(res.data?.config))
      .catch(() => setMsg({ tipo: 'erro', texto: 'Erro ao carregar configuração.' }))
      .finally(() => setLoading(false));
  }, []);

  const salvarSecao = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const payload = { [secaoAtiva]: config[secaoAtiva] };
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

  const resetarTudo = async () => {
    if (!window.confirm('Tem certeza? Isso vai reverter TODAS as seções para o padrão. As imagens enviadas serão mantidas no banco, mas os campos serão limpos.')) return;
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

  const updateField = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [secaoAtiva]: { ...prev[secaoAtiva], [field]: value },
    }));
  };

  const toggleEnabled = (secao) => {
    setConfig(prev => ({
      ...prev,
      [secao]: { ...prev[secao], enabled: !prev[secao]?.enabled },
    }));
  };

  const moverSecao = (secao, direcao) => {
    const ordem = [...config.sections_order];
    const idx = ordem.indexOf(secao);
    if (idx === -1) return;
    const novoIdx = direcao === 'up' ? idx - 1 : idx + 1;
    if (novoIdx < 0 || novoIdx >= ordem.length) return;
    [ordem[idx], ordem[novoIdx]] = [ordem[novoIdx], ordem[idx]];
    setConfig(prev => ({ ...prev, sections_order: ordem }));
  };

  const salvarOrdem = async () => {
    setSalvando(true);
    try {
      const res = await api.put('/landing/admin/config', { sections_order: config.sections_order });
      setConfig(res.data.config);
      setMsg({ tipo: 'sucesso', texto: 'Ordem salva!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar ordem.' });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="text-gray-400 py-20 text-center">Carregando configuração...</div>;
  if (!config) return <div className="text-red-400 py-20 text-center">Erro: config não carregada.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      {/* TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Editor da Landing Page</h1>
          <p className="text-gray-400 text-sm mt-1">
            Edite textos, seções, imagens e ordem. As mudanças aparecem em simidnape.com.br após salvar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/" target="_blank" rel="noreferrer"
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm border border-gray-700">
            👁️ Ver landing
          </a>
          <button onClick={resetarTudo} disabled={salvando}
            className="bg-red-900/30 hover:bg-red-900/50 text-red-300 font-medium px-4 py-2 rounded-lg text-sm border border-red-800 disabled:opacity-50">
            🔄 Resetar tudo
          </button>
          <button onClick={salvarSecao} disabled={salvando}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50">
            {salvando ? 'Salvando...' : '💾 Salvar seção'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg p-3 mb-6 text-sm ${
          msg.tipo === 'sucesso'
            ? 'bg-green-500/20 border border-green-500/30 text-green-300'
            : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* MENU LATERAL */}
        <div className="lg:col-span-1 bg-gray-800 border border-gray-700 rounded-xl p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-3 py-2">Seções</p>
          <div className="space-y-1">
            {config.sections_order.map((secao, idx) => {
              const info = SECOES_INFO[secao] || { icon: '📄', label: secao };
              const ativa = secaoAtiva === secao;
              const habilitada = config[secao]?.enabled !== false;
              return (
                <div key={secao}
                  className={`flex items-center gap-1 rounded-lg transition ${
                    ativa ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-gray-700/50'
                  }`}>
                  <button onClick={() => setSecaoAtiva(secao)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 text-left text-sm ${
                      ativa ? 'text-white font-medium' : 'text-gray-300'
                    }`}>
                    <span>{info.icon}</span>
                    <span className="truncate">{info.label}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleEnabled(secao); }}
                    title={habilitada ? 'Desativar' : 'Ativar'}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                      habilitada ? 'bg-green-500/30 text-green-300' : 'bg-gray-700 text-gray-500'
                    }`}>
                    {habilitada ? '●' : '○'}
                  </button>
                  <div className="flex flex-col">
                    <button onClick={(e) => { e.stopPropagation(); moverSecao(secao, 'up'); }}
                      disabled={idx === 0}
                      className="text-gray-500 hover:text-white text-xs leading-none px-1 disabled:opacity-30">▲</button>
                    <button onClick={(e) => { e.stopPropagation(); moverSecao(secao, 'down'); }}
                      disabled={idx === config.sections_order.length - 1}
                      className="text-gray-500 hover:text-white text-xs leading-none px-1 disabled:opacity-30">▼</button>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={salvarOrdem} disabled={salvando}
            className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2 rounded-lg disabled:opacity-50">
            💾 Salvar ordem das seções
          </button>

          <div className="border-t border-gray-700 mt-3 pt-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-3 py-1">Global</p>
            <button onClick={() => setSecaoAtiva('_global')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left ${
                secaoAtiva === '_global'
                  ? 'bg-blue-600/20 border border-blue-500/50 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}>
              <span>⚙️</span><span>Configurações Globais</span>
            </button>
            <button onClick={() => setSecaoAtiva('_popup')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left mt-1 ${
                secaoAtiva === '_popup'
                  ? 'bg-blue-600/20 border border-blue-500/50 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}>
              <span>📢</span><span>Pop-up de Promoção</span>
              <span className={`ml-auto text-xs ${config.popup?.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                {config.popup?.enabled ? '● ON' : '○ OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* EDITOR */}
        <div className="lg:col-span-3 bg-gray-800 border border-gray-700 rounded-xl p-6">
          {secaoAtiva === '_global' && <EditorGlobal config={config} setConfig={setConfig} salvando={salvando} />}
          {secaoAtiva === '_popup' && <EditorPopup config={config} setConfig={setConfig} salvando={salvando} />}
          {secaoAtiva !== '_global' && secaoAtiva !== '_popup' && (
            <EditorSecao secao={secaoAtiva} data={config[secaoAtiva] || {}}
              onChange={updateField} onSave={salvarSecao} salvando={salvando} />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HELPERS
// ============================================================
const Input = ({ label, value, onChange, placeholder, type = 'text', help }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
    {help && <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{help}</p>}
    <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3, placeholder, help }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
    {help && <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{help}</p>}
    <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <label className="flex items-center gap-3 mb-4 cursor-pointer">
    <div className={`relative w-11 h-6 rounded-full transition ${value ? 'bg-blue-600' : 'bg-gray-700'}`}>
      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition"
        style={{ left: value ? '22px' : '2px' }} />
    </div>
    <span className="text-sm text-gray-300">{label}</span>
  </label>
);

const ListHeader = ({ label, onAdd, addLabel = '+ Adicionar' }) => (
  <div className="flex items-center justify-between mt-6 mb-2">
    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
    {onAdd && (
      <button onClick={onAdd} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
        {addLabel}
      </button>
    )}
  </div>
);

const ItemBox = ({ index, onRemove, children, label = 'Item' }) => (
  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-400 font-medium">{label} {index + 1}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 text-xs">🗑️ Remover</button>
      )}
    </div>
    {children}
  </div>
);

// ============================================================
// DISPATCHER
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

      {secao === 'hero' && <EditorHero data={data} onChange={onChange} />}
      {secao === 'credibility' && <EditorCredibility data={data} onChange={onChange} />}
      {secao === 'problem' && <EditorProblem data={data} onChange={onChange} />}
      {secao === 'solution' && <EditorSolution data={data} onChange={onChange} />}
      {secao === 'founder' && <EditorFounder data={data} onChange={onChange} />}
      {secao === 'video' && <EditorVideo data={data} onChange={onChange} />}
      {secao === 'how_it_works' && <EditorHowItWorks data={data} onChange={onChange} />}
      {secao === 'metrics' && <EditorMetrics data={data} onChange={onChange} />}
      {secao === 'testimonials' && <EditorTestimonials data={data} onChange={onChange} />}
      {secao === 'comparison' && <EditorComparison data={data} onChange={onChange} />}
      {secao === 'founder_offer' && <EditorFounderOffer data={data} onChange={onChange} />}
      {secao === 'plans' && <EditorPlans data={data} onChange={onChange} />}
      {secao === 'guarantee' && <EditorGuarantee data={data} onChange={onChange} />}
      {secao === 'faq' && <EditorFAQ data={data} onChange={onChange} />}
      {secao === 'final_cta' && <EditorFinalCTA data={data} onChange={onChange} />}
      {secao === 'footer' && <EditorFooter data={data} onChange={onChange} />}

      <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
        <button onClick={onSave} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50">
          {salvando ? 'Salvando...' : `💾 Salvar "${info.label}"`}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR HERO
// ============================================================
const EditorHero = ({ data, onChange }) => {
  const setArr = (field, index, key, value) => {
    const arr = [...(data[field] || [])];
    arr[index] = { ...arr[index], [key]: value };
    onChange(field, arr);
  };
  const addArr = (field, item) => onChange(field, [...(data[field] || []), item]);
  const removeArr = (field, index) => onChange(field, (data[field] || []).filter((_, i) => i !== index));

  return (
    <>
      <Toggle label="Hero ativado" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Badge (linha pequena no topo)" value={data.badge} onChange={(v) => onChange('badge', v)}
        help="Ex: 🇧🇷 Feito por quem conhece sala de aula" />
      <Input label="Linha da marca (acima da headline)" value={data.brand_line}
        onChange={(v) => onChange('brand_line', v)}
        help="Ex: SIMIDNAPE PRO · O Professor Inesquecível" />
      <Textarea label="Headline principal" value={data.headline}
        onChange={(v) => onChange('headline', v)} rows={2} />
      <Textarea label="Subheadline" value={data.subheadline}
        onChange={(v) => onChange('subheadline', v)} rows={3} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Texto do CTA principal" value={data.cta_primary_text}
          onChange={(v) => onChange('cta_primary_text', v)} />
        <Input label="Link do CTA principal" value={data.cta_primary_link}
          onChange={(v) => onChange('cta_primary_link', v)} />
        <Input label="Texto do CTA secundário" value={data.cta_secondary_text}
          onChange={(v) => onChange('cta_secondary_text', v)} />
        <Input label="URL do vídeo do CTA secundário" value={data.cta_secondary_video_url}
          onChange={(v) => onChange('cta_secondary_video_url', v)}
          help="YouTube, Vimeo ou .mp4. Deixe vazio para ocultar o botão." />
      </div>

      <UploadImage
        slot="hero_image"
        label="Foto principal do Hero (lado direito)"
        value={data.hero_image}
        onChange={(v) => onChange('hero_image', v)}
        help="Foto de professor(a). Se vazio, mostra placeholder cinza."
      />

      <ListHeader
        label="Badges flutuantes sobre a foto"
        onAdd={() => addArr('float_badges', { icon: '⭐', title: '', subtitle: '' })} />
      {(data.float_badges || []).map((b, i) => (
        <ItemBox key={i} index={i} label="Badge" onRemove={() => removeArr('float_badges', i)}>
          <div className="grid grid-cols-3 gap-2">
            <Input label="Ícone" value={b.icon} onChange={(v) => setArr('float_badges', i, 'icon', v)} placeholder="⚡" />
            <div className="col-span-2">
              <Input label="Título" value={b.title} onChange={(v) => setArr('float_badges', i, 'title', v)} />
            </div>
          </div>
          <Input label="Subtítulo" value={b.subtitle} onChange={(v) => setArr('float_badges', i, 'subtitle', v)} />
        </ItemBox>
      ))}

      <ListHeader
        label="Métricas abaixo do CTA"
        onAdd={() => addArr('metrics', { value: '', label: '' })} />
      {(data.metrics || []).map((m, i) => (
        <ItemBox key={i} index={i} label="Métrica" onRemove={() => removeArr('metrics', i)}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Valor" value={m.value} onChange={(v) => setArr('metrics', i, 'value', v)} placeholder="7" />
            <Input label="Rótulo" value={m.label} onChange={(v) => setArr('metrics', i, 'label', v)} placeholder="motores de IA" />
          </div>
        </ItemBox>
      ))}

      <div className="mt-6 pt-4 border-t border-gray-700">
        <Input label="URL do vídeo principal do Hero" value={data.video_url}
          onChange={(v) => onChange('video_url', v)}
          placeholder="https://www.youtube.com/watch?v=..." />
        <Toggle label="Mostrar vídeo principal" value={data.video_enabled}
          onChange={(v) => onChange('video_enabled', v)} />
      </div>
    </>
  );
};

// ============================================================
// EDITOR CREDIBILITY (novo formato: icon + title + description)
// ============================================================
const EditorCredibility = ({ data, onChange }) => {
  const setArr = (i, key, value) => {
    const arr = [...(data.items || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('items', arr);
  };

  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />

      <ListHeader
        label="Itens de credibilidade"
        onAdd={() => onChange('items', [...(data.items || []), { icon: '⭐', title: '', description: '' }])} />
      {(data.items || []).map((item, i) => (
        <ItemBox key={i} index={i} label="Item"
          onRemove={() => onChange('items', (data.items || []).filter((_, j) => j !== i))}>
          <Input label="Ícone" value={item.icon} onChange={(v) => setArr(i, 'icon', v)} placeholder="🎯" />
          <Input label="Título" value={item.title} onChange={(v) => setArr(i, 'title', v)} />
          <Textarea label="Descrição" value={item.description}
            onChange={(v) => setArr(i, 'description', v)} rows={2} />
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR PROBLEM
// ============================================================
const EditorProblem = ({ data, onChange }) => {
  const setCard = (i, key, value) => {
    const arr = [...(data.cards || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('cards', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
      <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
      <UploadImage slot="problem_image" label="Imagem lateral (opcional)"
        value={data.image} onChange={(v) => onChange('image', v)}
        help="Foto de professor(a). Se vazio, os cards ficam centralizados." />
      <Input label="Texto de transição" value={data.transition_text}
        onChange={(v) => onChange('transition_text', v)} />

      <ListHeader label="Cards de dor"
        onAdd={() => onChange('cards', [...(data.cards || []), { icon: '😩', title: '', description: '' }])} />
      {(data.cards || []).map((c, i) => (
        <ItemBox key={i} index={i} label="Card"
          onRemove={() => onChange('cards', (data.cards || []).filter((_, j) => j !== i))}>
          <Input label="Ícone" value={c.icon} onChange={(v) => setCard(i, 'icon', v)} />
          <Input label="Título" value={c.title} onChange={(v) => setCard(i, 'title', v)} />
          <Textarea label="Descrição" value={c.description}
            onChange={(v) => setCard(i, 'description', v)} rows={2} />
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR SOLUTION
// ============================================================
const EditorSolution = ({ data, onChange }) => {
  const setMotor = (i, key, value) => {
    const arr = [...(data.motors || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('motors', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
      <Textarea label="Subtítulo" value={data.subtitle}
        onChange={(v) => onChange('subtitle', v)} rows={2} />
      <UploadImage slot="solution_image" label="Print/ilustração do sistema (opcional)"
        value={data.image} onChange={(v) => onChange('image', v)} />

      <ListHeader label="Motores de IA (7)"
        onAdd={() => onChange('motors', [...(data.motors || []), {
          icon: '⭐', name: '', description: '',
          gradient: 'from-blue-500 to-indigo-500', features: []
        }])} />
      {(data.motors || []).map((m, i) => (
        <ItemBox key={i} index={i} label="Motor"
          onRemove={() => onChange('motors', (data.motors || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-3 gap-2">
            <Input label="Ícone" value={m.icon} onChange={(v) => setMotor(i, 'icon', v)} />
            <div className="col-span-2">
              <Input label="Nome" value={m.name} onChange={(v) => setMotor(i, 'name', v)} />
            </div>
          </div>
          <Textarea label="Descrição" value={m.description}
            onChange={(v) => setMotor(i, 'description', v)} rows={2} />
          <Textarea label="Features (uma por linha)" value={(m.features || []).join('\n')}
            onChange={(v) => setMotor(i, 'features', v.split('\n').filter(Boolean))} rows={3} />
          <Input label="Gradiente (Tailwind)" value={m.gradient}
            onChange={(v) => setMotor(i, 'gradient', v)}
            placeholder="from-blue-500 to-indigo-500" />
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR FOUNDER
// ============================================================
const EditorFounder = ({ data, onChange }) => {
  const setStat = (i, key, value) => {
    const arr = [...(data.highlight_stats || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('highlight_stats', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Sobretítulo (kicker)" value={data.title} onChange={(v) => onChange('title', v)} />
      <Input label="Nome do criador" value={data.name} onChange={(v) => onChange('name', v)} />
      <Input label="Subtítulo (cargo)" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
      <UploadImage slot="founder_photo" label="Foto do criador"
        value={data.photo} onChange={(v) => onChange('photo', v)}
        help="Foto profissional do Darilson. Se vazio, mostra as iniciais." />
      <Textarea label="Citação (quote)" value={data.quote}
        onChange={(v) => onChange('quote', v)} rows={2} />
      <Textarea label="Bio (parágrafos separados por linha em branco)"
        value={data.bio} onChange={(v) => onChange('bio', v)} rows={10}
        help="Separe cada parágrafo com uma linha em branco. Ficará formatado automaticamente." />
      <Textarea label="Explicação do significado SIMIDNAPE"
        value={data.brand_explanation} onChange={(v) => onChange('brand_explanation', v)} rows={4} />
      <Input label="URL do vídeo do criador (opcional)" value={data.video_url}
        onChange={(v) => onChange('video_url', v)}
        placeholder="https://www.youtube.com/watch?v=..." />

      <ListHeader label="Stats de destaque (3 números)"
        onAdd={() => onChange('highlight_stats', [...(data.highlight_stats || []), { value: '', label: '' }])} />
      {(data.highlight_stats || []).map((s, i) => (
        <ItemBox key={i} index={i} label="Stat"
          onRemove={() => onChange('highlight_stats', (data.highlight_stats || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Valor" value={s.value} onChange={(v) => setStat(i, 'value', v)} placeholder="18+" />
            <Input label="Rótulo" value={s.label} onChange={(v) => setStat(i, 'label', v)} placeholder="anos em educação" />
          </div>
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR VIDEO
// ============================================================
const EditorVideo = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
    <Input label="URL do vídeo" value={data.video_url} onChange={(v) => onChange('video_url', v)}
      placeholder="https://www.youtube.com/watch?v=..." />
  </>
);

// ============================================================
// EDITOR HOW IT WORKS
// ============================================================
const EditorHowItWorks = ({ data, onChange }) => {
  const setStep = (i, key, value) => {
    const arr = [...(data.steps || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('steps', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
      <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />

      <ListHeader label="Passos"
        onAdd={() => onChange('steps', [...(data.steps || []), { number: '', title: '', description: '' }])} />
      {(data.steps || []).map((s, i) => (
        <ItemBox key={i} index={i} label="Passo"
          onRemove={() => onChange('steps', (data.steps || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-3 gap-2">
            <Input label="Número" value={s.number} onChange={(v) => setStep(i, 'number', v)} />
            <div className="col-span-2">
              <Input label="Título" value={s.title} onChange={(v) => setStep(i, 'title', v)} />
            </div>
          </div>
          <Textarea label="Descrição" value={s.description}
            onChange={(v) => setStep(i, 'description', v)} rows={2} />
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR METRICS
// ============================================================
const EditorMetrics = ({ data, onChange }) => {
  const setMetric = (i, key, value) => {
    const arr = [...(data.metrics || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('metrics', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />

      <ListHeader label="Métricas"
        onAdd={() => onChange('metrics', [...(data.metrics || []), { value: '', label: '' }])} />
      {(data.metrics || []).map((m, i) => (
        <ItemBox key={i} index={i} label="Métrica"
          onRemove={() => onChange('metrics', (data.metrics || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Valor" value={m.value} onChange={(v) => setMetric(i, 'value', v)} />
            <Input label="Rótulo" value={m.label} onChange={(v) => setMetric(i, 'label', v)} />
          </div>
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR TESTIMONIALS
// ============================================================
const EditorTestimonials = ({ data, onChange }) => {
  const setItem = (i, key, value) => {
    const arr = [...(data.testimonials || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('testimonials', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
      <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
      <UploadImage slot="testimonials_image" label="Foto do depoimento destaque"
        value={data.image} onChange={(v) => onChange('image', v)}
        help="Foto grande que aparece à esquerda do depoimento principal." />
      <Input label="URL do vídeo do depoimento destaque" value={data.video_url}
        onChange={(v) => onChange('video_url', v)}
        help="Se preenchido, mostra botão de play na foto." />

      <ListHeader label="Depoimentos em texto"
        onAdd={() => onChange('testimonials', [...(data.testimonials || []), { name: '', school: '', text: '' }])} />
      {(data.testimonials || []).map((t, i) => (
        <ItemBox key={i} index={i} label="Depoimento"
          onRemove={() => onChange('testimonials', (data.testimonials || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Nome" value={t.name} onChange={(v) => setItem(i, 'name', v)} />
            <Input label="Escola/Info" value={t.school} onChange={(v) => setItem(i, 'school', v)} />
          </div>
          <Textarea label="Depoimento" value={t.text}
            onChange={(v) => setItem(i, 'text', v)} rows={3} />
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR COMPARISON
// ============================================================
const EditorComparison = ({ data, onChange }) => {
  const setRow = (i, key, value) => {
    const arr = [...(data.rows || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('rows', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
      <Textarea label="Colunas (uma por linha)" value={(data.columns || []).join('\n')}
        onChange={(v) => onChange('columns', v.split('\n').filter(Boolean))} rows={3} />

      <ListHeader label="Linhas de comparação"
        onAdd={() => onChange('rows', [...(data.rows || []), { feature: '', values: [] }])} />
      {(data.rows || []).map((r, i) => (
        <ItemBox key={i} index={i} label="Linha"
          onRemove={() => onChange('rows', (data.rows || []).filter((_, j) => j !== i))}>
          <Input label="Recurso" value={r.feature} onChange={(v) => setRow(i, 'feature', v)} />
          <Input label="Valores (separados por vírgula)"
            value={(r.values || []).join(', ')}
            onChange={(v) => setRow(i, 'values', v.split(',').map(s => s.trim()))}
            help="Ex: ✅, ⚠️, ❌" />
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR FOUNDER OFFER (NOVA SEÇÃO)
// ============================================================
const EditorFounderOffer = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Badge (selo do topo)" value={data.badge} onChange={(v) => onChange('badge', v)}
      help="Ex: 🎁 Oferta de Fundador" />
    <Textarea label="Título" value={data.title} onChange={(v) => onChange('title', v)} rows={2} />
    <Textarea label="Descrição" value={data.description}
      onChange={(v) => onChange('description', v)} rows={4} />

    <div className="grid grid-cols-2 gap-4">
      <Input label="Preço normal (riscado)" value={data.price_normal}
        onChange={(v) => onChange('price_normal', v)} placeholder="R$ 19,90" />
      <Input label="Preço de fundador (destaque)" value={data.price_founder}
        onChange={(v) => onChange('price_founder', v)} placeholder="R$ 14,90" />
      <Input label="Total de vagas" type="number" value={data.spots_total}
        onChange={(v) => onChange('spots_total', parseInt(v) || 0)} />
      <Input label="Vagas restantes" type="number" value={data.spots_remaining}
        onChange={(v) => onChange('spots_remaining', parseInt(v) || 0)}
        help="Diminua conforme as vendas acontecerem" />
    </div>

    <Input label="Texto do botão" value={data.cta_text} onChange={(v) => onChange('cta_text', v)} />
    <Input label="Link do botão" value={data.cta_link} onChange={(v) => onChange('cta_link', v)} />
  </>
);

// ============================================================
// EDITOR PLANS
// ============================================================
const EditorPlans = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Textarea label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} rows={2} />
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200 mt-4">
      ℹ️ Os planos (preços e créditos) são gerenciados em <code>subscription_service.py</code>. Esta seção só edita os textos acima.
    </div>
  </>
);

// ============================================================
// EDITOR GUARANTEE
// ============================================================
const EditorGuarantee = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
    <Textarea label="Itens (um por linha)" value={(data.items || []).join('\n')}
      onChange={(v) => onChange('items', v.split('\n').filter(Boolean))} rows={5} />
  </>
);

// ============================================================
// EDITOR FAQ
// ============================================================
const EditorFAQ = ({ data, onChange }) => {
  const setItem = (i, key, value) => {
    const arr = [...(data.items || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('items', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
      <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
      <UploadImage slot="faq_image" label="Foto lateral"
        value={data.image} onChange={(v) => onChange('image', v)}
        help="Foto de professora que aparece à esquerda das perguntas." />

      <ListHeader label="Perguntas frequentes"
        onAdd={() => onChange('items', [...(data.items || []), { question: '', answer: '' }])} />
      {(data.items || []).map((f, i) => (
        <ItemBox key={i} index={i} label="Pergunta"
          onRemove={() => onChange('items', (data.items || []).filter((_, j) => j !== i))}>
          <Input label="Pergunta" value={f.question} onChange={(v) => setItem(i, 'question', v)} />
          <Textarea label="Resposta" value={f.answer}
            onChange={(v) => setItem(i, 'answer', v)} rows={3} />
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR FINAL CTA
// ============================================================
const EditorFinalCTA = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Textarea label="Headline" value={data.headline} onChange={(v) => onChange('headline', v)} rows={2} />
    <Textarea label="Subheadline" value={data.subheadline}
      onChange={(v) => onChange('subheadline', v)} rows={2} />
    <Input label="Texto do botão" value={data.cta_text} onChange={(v) => onChange('cta_text', v)} />
    <Input label="Link do botão" value={data.cta_link} onChange={(v) => onChange('cta_link', v)} />
  </>
);

// ============================================================
// EDITOR FOOTER
// ============================================================
const EditorFooter = ({ data, onChange }) => {
  const setLink = (i, key, value) => {
    const arr = [...(data.links || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('links', arr);
  };
  return (
    <>
      <Toggle label="Footer ativado" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Input label="Texto de copyright" value={data.copyright_text}
        onChange={(v) => onChange('copyright_text', v)} />
      <Textarea label="Explicação da marca SIMIDNAPE"
        value={data.brand_explanation} onChange={(v) => onChange('brand_explanation', v)} rows={3} />

      <ListHeader label="Links do footer"
        onAdd={() => onChange('links', [...(data.links || []), { label: '', href: '' }])} />
      {(data.links || []).map((l, i) => (
        <ItemBox key={i} index={i} label="Link"
          onRemove={() => onChange('links', (data.links || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Rótulo" value={l.label} onChange={(v) => setLink(i, 'label', v)} />
            <Input label="URL" value={l.href} onChange={(v) => setLink(i, 'href', v)} />
          </div>
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR GLOBAL
// ============================================================
const EditorGlobal = ({ config, setConfig, salvando }) => {
  const update = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));
  const salvar = async () => {
    try {
      const res = await api.put('/landing/admin/config', {
        seo_title: config.seo_title,
        seo_description: config.seo_description,
      });
      setConfig(res.data.config);
    } catch {}
  };
  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
        <span className="text-3xl">⚙️</span>
        <div>
          <h2 className="text-xl font-bold text-white">Configurações Globais</h2>
          <p className="text-xs text-gray-400">SEO e informações gerais</p>
        </div>
      </div>
      <Input label="Título SEO (aparece no Google)" value={config.seo_title}
        onChange={(v) => update('seo_title', v)} />
      <Textarea label="Descrição SEO" value={config.seo_description}
        onChange={(v) => update('seo_description', v)} rows={3} />
      <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50">
          {salvando ? 'Salvando...' : '💾 Salvar configurações'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR POPUP
// ============================================================
const EditorPopup = ({ config, setConfig, salvando }) => {
  const popup = config.popup || {};
  const update = (field, value) => setConfig(prev => ({ ...prev, popup: { ...prev.popup, [field]: value } }));
  const salvar = async () => {
    try {
      const res = await api.put('/landing/admin/config', { popup: config.popup });
      setConfig(res.data.config);
    } catch {}
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
        <Input label="Delay em segundos" type="number" value={popup.delay_seconds}
          onChange={(v) => update('delay_seconds', parseInt(v) || 5)} />
      </div>
      <Toggle label="Mostrar apenas uma vez por sessão" value={popup.show_once_per_user}
        onChange={(v) => update('show_once_per_user', v)} />
      <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50">
          {salvando ? 'Salvando...' : '💾 Salvar pop-up'}
        </button>
      </div>
    </div>
  );
};

export default AdminLanding;