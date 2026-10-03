import React, { useState, useEffect } from 'react';
import api from '../api/api';
import UploadImage from '../components/UploadImage';

// ============================================================
// SEÇÕES (nomes bonitos)
// ============================================================
const SECOES_INFO = {
  hero:          { icon: '🎯', label: 'Banner principal rotativo' },
  credibility:   { icon: '✅', label: 'Barra de Credibilidade' },
  problem:       { icon: '😩', label: 'Problema (Dor)' },
  before_after:  { icon: '🔄', label: 'Antes vs Depois' },
  solution:      { icon: '🧩', label: 'Solução (7 Motores)' },
  founder:       { icon: '👤', label: 'Criador (Founder)' },
  video:         { icon: '🎥', label: 'Vídeo Explicativo' },
  how_it_works:  { icon: '🪜', label: 'Como Funciona' },
  metrics:       { icon: '📊', label: 'Métricas' },
  testimonials:  { icon: '💬', label: 'Depoimentos' },
  comparison:    { icon: '⚖️', label: 'Comparativo' },
  founder_offer: { icon: '🎁', label: 'Oferta de Fundador' },
  plans:         { icon: '💰', label: 'Planos' },
  guarantee:     { icon: '🛡️', label: 'Garantia' },
  faq:           { icon: '❓', label: 'Perguntas Frequentes' },
  final_cta:     { icon: '🚀', label: 'CTA Final' },
  footer:        { icon: '📄', label: 'Rodapé' },
};

// ============================================================
// GRADIENTES DISPONÍVEIS PARA OS SLIDES
// ============================================================
const GRADIENTES_SLIDES = [
  { value: 'from-cream via-cream-soft to-cream',              label: '☀️ Claro · Creme SIMIDNAPE',    preview: 'bg-gradient-to-br from-cream via-cream-soft to-cream' },
  { value: 'from-cream via-badge-cream to-cream',             label: '🌟 Claro · Creme Dourado',       preview: 'bg-gradient-to-br from-cream via-badge-cream to-cream' },
  { value: 'from-cream via-cream-soft to-petrol/5',           label: '🌊 Claro · Creme Azulado',       preview: 'bg-gradient-to-br from-cream via-cream-soft to-petrol/20' },
  { value: 'from-petrol-deep via-petrol to-petrol-deep',      label: '🌙 Escuro · Petróleo',           preview: 'bg-gradient-to-br from-petrol-deep via-petrol to-petrol-deep' },
  { value: 'from-petrol-deep via-petrol-deep to-petrol',      label: '🌌 Escuro · Petróleo Profundo',  preview: 'bg-gradient-to-br from-petrol-deep via-petrol-deep to-petrol' },
];

// ============================================================
// MAIN
// ============================================================
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

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando configuração...</div>;
  if (!config) return <div className="p-12 text-center text-red-500">Erro: config não carregada.</div>;

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8">
      {/* ============= TOP BAR ============= */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Editor da Landing Page</h1>
          <p className="text-slate-500 text-sm mt-1">
            Edite textos, imagens, slides e ordem das seções. As mudanças aparecem em simidnape.com.br após salvar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/" target="_blank" rel="noreferrer"
            className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm border border-slate-200 shadow-sm">
            👁️ Ver landing
          </a>
          <button onClick={resetarTudo} disabled={salvando}
            className="bg-white hover:bg-red-50 text-red-600 font-medium px-4 py-2 rounded-lg text-sm border border-red-200 disabled:opacity-50 shadow-sm">
            🔄 Resetar tudo
          </button>
          <button onClick={salvarSecao} disabled={salvando}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm disabled:opacity-50 shadow-sm">
            {salvando ? 'Salvando...' : '💾 Salvar seção'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg p-3 mb-6 text-sm ${
          msg.tipo === 'sucesso'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ============= SIDEBAR ============= */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-2">
            Seções
          </p>
          <div className="space-y-0.5">
            {config.sections_order.map((secao, idx) => {
              const info = SECOES_INFO[secao] || { icon: '📄', label: secao };
              const ativa = secaoAtiva === secao;
              const habilitada = config[secao]?.enabled !== false;
              return (
                <div key={secao}
                  className={`flex items-center gap-1 rounded-lg transition ${
                    ativa ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                  }`}>
                  <button onClick={() => setSecaoAtiva(secao)}
                    className={`flex-1 flex items-center gap-2 px-2.5 py-2 text-left text-sm ${
                      ativa ? 'text-blue-700 font-semibold' : 'text-slate-600'
                    }`}>
                    <span>{info.icon}</span>
                    <span className="truncate">{info.label}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleEnabled(secao); }}
                    title={habilitada ? 'Desativar' : 'Ativar'}
                    className={`w-5 h-5 rounded text-[8px] flex items-center justify-center transition ${
                      habilitada ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {habilitada ? '●' : '○'}
                  </button>
                  <div className="flex flex-col">
                    <button onClick={(e) => { e.stopPropagation(); moverSecao(secao, 'up'); }}
                      disabled={idx === 0}
                      className="text-slate-300 hover:text-slate-600 text-[10px] leading-none px-1 disabled:opacity-30">▲</button>
                    <button onClick={(e) => { e.stopPropagation(); moverSecao(secao, 'down'); }}
                      disabled={idx === config.sections_order.length - 1}
                      className="text-slate-300 hover:text-slate-600 text-[10px] leading-none px-1 disabled:opacity-30">▼</button>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={salvarOrdem} disabled={salvando}
            className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-2 rounded-lg disabled:opacity-50 transition">
            💾 Salvar ordem
          </button>

          <div className="border-t border-slate-200 mt-3 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-1">Aparência</p>
            <button onClick={() => setSecaoAtiva('_theme')}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left ${
                secaoAtiva === '_theme'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span>🎨</span><span>Tema (Cores e Fontes)</span>
            </button>

            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-1 mt-3">Acesso</p>
            <button onClick={() => setSecaoAtiva('_login')}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left ${
                secaoAtiva === '_login'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span>🔐</span><span>Login e Cadastro</span>
            </button>

            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-1 mt-3">Página</p>
            <button onClick={() => setSecaoAtiva('_header')}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left ${
                secaoAtiva === '_header'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span>🎯</span><span>Header (topo)</span>
            </button>
            <button onClick={() => setSecaoAtiva('_error_page')}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left mt-0.5 ${
                secaoAtiva === '_error_page'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span>⚠️</span><span>Página de Erro</span>
            </button>

            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-1 mt-3">Global</p>
            <button onClick={() => setSecaoAtiva('_global')}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left ${
                secaoAtiva === '_global'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span>⚙️</span><span>SEO e Meta Tags</span>
            </button>
            <button onClick={() => setSecaoAtiva('_popup')}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left mt-0.5 ${
                secaoAtiva === '_popup'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span>📢</span><span className="flex-1">Pop-up</span>
              <span className={`text-[10px] ${config.popup?.enabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                {config.popup?.enabled ? '● ON' : '○ OFF'}
              </span>
            </button>
            <button onClick={() => setSecaoAtiva('_sistema')}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left mt-0.5 ${
                secaoAtiva === '_sistema'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span>🧩</span><span className="flex-1">Sistema</span>
            </button>
          </div>
        </div>

        {/* ============= EDITOR ============= */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          {secaoAtiva === '_theme' && <EditorTheme />}
          {secaoAtiva === '_login' && <EditorLogin config={config} setConfig={setConfig} salvando={salvando} setMsg={setMsg} />}
          {secaoAtiva === '_header' && <EditorHeader config={config} setConfig={setConfig} salvando={salvando} setMsg={setMsg} />}
          {secaoAtiva === '_error_page' && <EditorErrorPage config={config} setConfig={setConfig} salvando={salvando} setMsg={setMsg} />}
          {secaoAtiva === '_global' && <EditorGlobal config={config} setConfig={setConfig} salvando={salvando} setMsg={setMsg} />}
          {secaoAtiva === '_popup' && <EditorPopup config={config} setConfig={setConfig} salvando={salvando} setMsg={setMsg} />}
          {secaoAtiva === '_sistema' && <EditorSistema />}
          {secaoAtiva !== '_theme' && secaoAtiva !== '_login' && secaoAtiva !== '_header' && secaoAtiva !== '_error_page' && secaoAtiva !== '_global' && secaoAtiva !== '_popup' && secaoAtiva !== '_sistema' && (
            <EditorSecao secao={secaoAtiva} data={config[secaoAtiva] || {}}
              onChange={updateField} onSave={salvarSecao} salvando={salvando} />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HELPERS DE INPUT (tema claro)
// ============================================================
const Input = ({ label, value, onChange, placeholder, type = 'text', help }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    {help && <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">{help}</p>}
    <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3, placeholder, help }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    {help && <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">{help}</p>}
    <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <label
    className="flex items-center gap-3 mb-4 cursor-pointer select-none"
    onClick={(e) => {
      e.preventDefault();
      if (onChange) onChange(!value);
    }}
  >
    <div className={`relative w-11 h-6 rounded-full transition ${value ? 'bg-blue-600' : 'bg-slate-300'}`}>
      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition shadow-sm"
        style={{ left: value ? '22px' : '2px' }} />
    </div>
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </label>
);

const ListHeader = ({ label, onAdd, addLabel = '+ Adicionar' }) => (
  <div className="flex items-center justify-between mt-6 mb-2 pb-2 border-b border-slate-200">
    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
    {onAdd && (
      <button onClick={onAdd} className="text-blue-600 hover:text-blue-700 text-xs font-semibold">
        {addLabel}
      </button>
    )}
  </div>
);

const ItemBox = ({ index, onRemove, children, label = 'Item' }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-slate-600 font-semibold">{label} {index + 1}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-xs">🗑️ Remover</button>
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
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <span className="text-3xl">{info.icon}</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{info.label}</h2>
          <p className="text-xs text-slate-500">
            {data.enabled !== false ? '● Visível na landing' : '○ Oculta na landing'}
          </p>
        </div>
      </div>

      {secao === 'hero' && <EditorHero data={data} onChange={onChange} />}
      {secao === 'credibility' && <EditorCredibility data={data} onChange={onChange} />}
      {secao === 'problem' && <EditorProblem data={data} onChange={onChange} />}
      {secao === 'before_after' && <EditorBeforeAfter data={data} onChange={onChange} />}
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

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
        <button onClick={onSave} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-sm">
          {salvando ? 'Salvando...' : `💾 Salvar "${info.label}"`}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR HERO — com carrossel de slides + preview
// ============================================================
const EditorHero = ({ data, onChange }) => {
  const slides = data.slides || [];
  const [slideAtivo, setSlideAtivo] = useState(0);

  const updateSlide = (i, key, value) => {
    const arr = [...slides];
    arr[i] = { ...arr[i], [key]: value };
    onChange('slides', arr);
  };

  const addSlide = () => {
    onChange('slides', [...slides, {
      badge: '',
      brand_line: '',
      headline: 'Novo slide',
      subheadline: '',
      cta_primary_text: '',
      cta_primary_link: '/register',
      cta_secondary_text: '',
      cta_secondary_video_url: '',
      image: '',
      gradient: 'from-blue-50 via-white to-purple-50',
    }]);
    setSlideAtivo(slides.length);
  };

  const removeSlide = (i) => {
    const arr = slides.filter((_, j) => j !== i);
    onChange('slides', arr);
    setSlideAtivo(Math.max(0, Math.min(i, arr.length - 1)));
  };

  const slide = slides[slideAtivo] || {};
  const isDark = slide.gradient?.includes('gray-900') || slide.gradient?.includes('blue-9');

  return (
    <>
      <Toggle label="Hero ativado" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <Toggle label="Carrossel ativado (recomendado)" value={data.carousel_enabled !== false}
        onChange={(v) => onChange('carousel_enabled', v)} />

      <Input label="Texto do placeholder de imagem (quando não há foto)"
        value={data.image_placeholder}
        onChange={(v) => onChange('image_placeholder', v)}
        placeholder="Foto do slide"
        help="Aparece no espaço da imagem quando nenhum slide tem foto. Ex: 'Foto do slide'." />

      {/* =========================================== */}
      {/* EDITOR DE SLIDES */}
      {/* =========================================== */}
      <ListHeader label={`Slides (${slides.length})`} onAdd={addSlide} addLabel="+ Adicionar slide" />

      {/* Abas de slides */}
      <div className="flex flex-wrap gap-2 mb-4">
        {slides.map((s, i) => (
          <button key={i} onClick={() => setSlideAtivo(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              slideAtivo === i
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            Slide {i + 1}
          </button>
        ))}
      </div>

      {slides.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 mb-4">
          <p className="text-slate-500 text-sm mb-3">Nenhum slide ainda</p>
          <button onClick={addSlide}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm">
            + Criar primeiro slide
          </button>
        </div>
      )}

      {slides.length > 0 && slide && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Coluna de edição */}
          <div className="lg:col-span-3">
            <ItemBox index={slideAtivo} label="Slide" onRemove={() => removeSlide(slideAtivo)}>
              <Input label="Badge (linha pequena no topo)" value={slide.badge}
                onChange={(v) => updateSlide(slideAtivo, 'badge', v)} />
              <Input label="Brand line (acima da headline)" value={slide.brand_line}
                onChange={(v) => updateSlide(slideAtivo, 'brand_line', v)} />
              <Textarea label="Headline principal" value={slide.headline}
                onChange={(v) => updateSlide(slideAtivo, 'headline', v)} rows={2} />
              <Textarea label="Subheadline" value={slide.subheadline}
                onChange={(v) => updateSlide(slideAtivo, 'subheadline', v)} rows={3} />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Texto botão principal" value={slide.cta_primary_text}
                  onChange={(v) => updateSlide(slideAtivo, 'cta_primary_text', v)} />
                <Input label="Link botão principal" value={slide.cta_primary_link}
                  onChange={(v) => updateSlide(slideAtivo, 'cta_primary_link', v)} />
                <Input label="Texto botão secundário" value={slide.cta_secondary_text}
                  onChange={(v) => updateSlide(slideAtivo, 'cta_secondary_text', v)} />
                <Input label="URL vídeo do botão secundário" value={slide.cta_secondary_video_url}
                  onChange={(v) => updateSlide(slideAtivo, 'cta_secondary_video_url', v)} />
              </div>

              <UploadImage
                slot={`hero_slide_${slideAtivo}`}
                label="Imagem deste slide"
                value={slide.image}
                onChange={(v) => updateSlide(slideAtivo, 'image', v)}
                help="A imagem aparece à direita do slide (coluna 2)."
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Fundo do slide</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GRADIENTES_SLIDES.map((g) => (
                    <button key={g.value} type="button"
                      onClick={() => updateSlide(slideAtivo, 'gradient', g.value)}
                      className={`flex items-center gap-3 p-2 rounded-lg border-2 transition text-left ${
                        slide.gradient === g.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <div className={`w-10 h-10 rounded-lg ${g.preview} border border-slate-200`} />
                      <span className="text-xs font-medium text-slate-700">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </ItemBox>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Prévia do slide
            </p>
            <div className={`rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm ${slide.gradient?.startsWith('from-') ? 'bg-gradient-to-br ' + slide.gradient : 'bg-white'}`}>
              <div className="p-4 min-h-[280px] flex flex-col justify-between">
                <div>
                  {slide.badge && (
                    <div className={`inline-block rounded-full px-2.5 py-1 mb-3 ${
                      isDark ? 'bg-white/10 text-white' : 'bg-white text-blue-700 border border-blue-200'
                    }`}>
                      <span className="text-[10px] font-semibold">{slide.badge}</span>
                    </div>
                  )}
                  {slide.brand_line && (
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      {slide.brand_line}
                    </p>
                  )}
                  <h3 className={`text-base font-bold leading-tight mb-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {slide.headline || 'Headline do slide'}
                  </h3>
                  <p className={`text-[11px] leading-snug mb-3 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {slide.subheadline || 'Subheadline do slide'}
                  </p>
                </div>

                {slide.image && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img src={slide.image} alt="" className="w-full h-24 object-cover" />
                  </div>
                )}

                {slide.cta_primary_text && (
                  <div className={`inline-block text-[10px] font-bold px-3 py-1.5 rounded-md mt-3 ${
                    isDark ? 'bg-white text-slate-900' : 'bg-blue-600 text-white'
                  }`}>
                    {slide.cta_primary_text}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Prévia aproximada — o resultado final pode variar
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================
// EDITOR CREDIBILITY
// ============================================================
const EditorCredibility = ({ data, onChange }) => {
  const setItem = (i, key, value) => {
    const arr = [...(data.items || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('items', arr);
  };
  return (
    <>
      <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
      <ListHeader label="Números de destaque"
        onAdd={() => onChange('items', [...(data.items || []), { title: '', description: '', icon: '' }])} />
      {(data.items || []).map((item, i) => (
        <ItemBox key={i} index={i} label="Número"
          onRemove={() => onChange('items', (data.items || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Número grande" value={item.title} onChange={(v) => setItem(i, 'title', v)} placeholder="3.500+" />
            <Input label="Rótulo" value={item.description} onChange={(v) => setItem(i, 'description', v)} placeholder="Professores impactados" />
          </div>
          <Input label="Detalhe (linha cinza abaixo)" value={item.icon} onChange={(v) => setItem(i, 'icon', v)} />
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
      <Input label="Texto de transição (frase em negrito)" value={data.transition_text} onChange={(v) => onChange('transition_text', v)} />
      <ListHeader label="Cards de dor"
        onAdd={() => onChange('cards', [...(data.cards || []), { icon: '😩', title: '', description: '' }])} />
      {(data.cards || []).map((c, i) => (
        <ItemBox key={i} index={i} label="Card" onRemove={() => onChange('cards', (data.cards || []).filter((_, j) => j !== i))}>
          <Input label="Ícone (emoji)" value={c.icon} onChange={(v) => setCard(i, 'icon', v)} />
          <Input label="Título" value={c.title} onChange={(v) => setCard(i, 'title', v)} />
          <Textarea label="Descrição" value={c.description} onChange={(v) => setCard(i, 'description', v)} rows={2} />
        </ItemBox>
      ))}
    </>
  );
};

// ============================================================
// EDITOR BEFORE / AFTER
// ============================================================
const EditorBeforeAfter = ({ data, onChange }) => {
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
      <div className="grid grid-cols-2 gap-3">
        <Input label="Rótulo ANTES" value={data.before_label} onChange={(v) => onChange('before_label', v)} placeholder="Antes" />
        <Input label="Rótulo DEPOIS" value={data.after_label} onChange={(v) => onChange('after_label', v)} placeholder="Depois" />
      </div>
      <ListHeader label="Linhas de comparação"
        onAdd={() => onChange('items', [...(data.items || []), { before: '', after: '' }])} />
      {(data.items || []).map((item, i) => (
        <ItemBox key={i} index={i} label="Linha" onRemove={() => onChange('items', (data.items || []).filter((_, j) => j !== i))}>
          <Textarea label="🔴 Antes" value={item.before} onChange={(v) => setItem(i, 'before', v)} rows={2} />
          <Textarea label="🟢 Depois" value={item.after} onChange={(v) => setItem(i, 'after', v)} rows={2} />
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
      <Textarea label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} rows={2} />
      <UploadImage slot="solution_image" label="Imagem do sistema (opcional)"
        value={data.image} onChange={(v) => onChange('image', v)}
        help="Print da tela do sistema ou ilustração." />
      <ListHeader label="Motores de IA (7)"
        onAdd={() => onChange('motors', [...(data.motors || []), {
          icon: '⭐', name: '', description: '', gradient: 'from-blue-500 to-indigo-500', features: []
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
          <Textarea label="Descrição" value={m.description} onChange={(v) => setMotor(i, 'description', v)} rows={2} />
          <Textarea label="Features (uma por linha)" value={(m.features || []).join('\n')}
            onChange={(v) => setMotor(i, 'features', v.split('\n').filter(Boolean))} rows={3} />
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
      <Input label="Nome" value={data.name} onChange={(v) => onChange('name', v)} />
      <Input label="Subtítulo (cargo)" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
      <UploadImage slot="founder_photo" label="Foto do criador"
        value={data.photo} onChange={(v) => onChange('photo', v)}
        help="Foto profissional. Se vazio, mostra as iniciais." />
      <Textarea label="Citação (quote)" value={data.quote} onChange={(v) => onChange('quote', v)} rows={2} />
      <Textarea label="Bio (parágrafos separados por linha em branco)"
        value={data.bio} onChange={(v) => onChange('bio', v)} rows={10} />
      <Textarea label="Explicação do significado SIMIDNAPE"
        value={data.brand_explanation} onChange={(v) => onChange('brand_explanation', v)} rows={4} />
      <Input label="URL do vídeo do criador (opcional)" value={data.video_url} onChange={(v) => onChange('video_url', v)} />
      <ListHeader label="Stats de destaque"
        onAdd={() => onChange('highlight_stats', [...(data.highlight_stats || []), { value: '', label: '' }])} />
      {(data.highlight_stats || []).map((s, i) => (
        <ItemBox key={i} index={i} label="Stat" onRemove={() => onChange('highlight_stats', (data.highlight_stats || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Valor" value={s.value} onChange={(v) => setStat(i, 'value', v)} />
            <Input label="Rótulo" value={s.label} onChange={(v) => setStat(i, 'label', v)} />
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
      help="YouTube, Vimeo ou arquivo .mp4" />
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
        <ItemBox key={i} index={i} label="Passo" onRemove={() => onChange('steps', (data.steps || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-3 gap-2">
            <Input label="Número" value={s.number} onChange={(v) => setStep(i, 'number', v)} />
            <div className="col-span-2">
              <Input label="Título" value={s.title} onChange={(v) => setStep(i, 'title', v)} />
            </div>
          </div>
          <Textarea label="Descrição" value={s.description} onChange={(v) => setStep(i, 'description', v)} rows={2} />
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
      <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
      <UploadImage slot="metrics_bg" label="Imagem de fundo (opcional)"
        value={data.background_image} onChange={(v) => onChange('background_image', v)}
        help="Imagem que fica por trás dos números com uma sobreposição escura." />
      <Input label="URL do vídeo de fundo (opcional)"
        value={data.background_video_url} onChange={(v) => onChange('background_video_url', v)}
        help="Se preenchido, tem prioridade sobre a imagem." />
      <Input label="Intensidade da sobreposição escura (0 a 1)"
        type="number" value={data.background_overlay}
        onChange={(v) => onChange('background_overlay', parseFloat(v) || 0.85)}
        help="0.85 deixa 85% escuro. Recomendado: 0.8 a 0.9" />
      <ListHeader label="Métricas"
        onAdd={() => onChange('metrics', [...(data.metrics || []), { value: '', label: '' }])} />
      {(data.metrics || []).map((m, i) => (
        <ItemBox key={i} index={i} label="Métrica" onRemove={() => onChange('metrics', (data.metrics || []).filter((_, j) => j !== i))}>
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
      <Input label="Kicker (rótulo pequeno acima do título)"
        value={data.kicker}
        onChange={(v) => onChange('kicker', v)}
        placeholder="Depoimentos"
        help="Rótulo em caixa alta que aparece acima do título." />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
      <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
      <UploadImage slot="testimonials_image" label="Foto do depoimento destaque"
        value={data.image} onChange={(v) => onChange('image', v)}
        help="Foto grande que aparece à esquerda do depoimento principal." />
      <Input label="Texto do placeholder de imagem (quando não há foto)"
        value={data.image_placeholder}
        onChange={(v) => onChange('image_placeholder', v)}
        placeholder="Foto do depoimento" />
      <Input label="URL do vídeo do depoimento destaque" value={data.video_url}
        onChange={(v) => onChange('video_url', v)} />
      <Input label="Mensagem quando não há depoimentos"
        value={data.empty_message}
        onChange={(v) => onChange('empty_message', v)}
        placeholder="Em breve: depoimentos..."
        help="Aparece quando a lista de depoimentos está vazia." />
      <ListHeader label="Depoimentos em texto"
        onAdd={() => onChange('testimonials', [...(data.testimonials || []), { name: '', school: '', text: '' }])} />
      {(data.testimonials || []).map((t, i) => (
        <ItemBox key={i} index={i} label="Depoimento" onRemove={() => onChange('testimonials', (data.testimonials || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Nome" value={t.name} onChange={(v) => setItem(i, 'name', v)} />
            <Input label="Escola/Info" value={t.school} onChange={(v) => setItem(i, 'school', v)} />
          </div>
          <Textarea label="Depoimento" value={t.text} onChange={(v) => setItem(i, 'text', v)} rows={3} />
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
      <Input label="Cabeçalho da coluna de recursos"
        value={data.feature_column_label}
        onChange={(v) => onChange('feature_column_label', v)}
        placeholder="Recurso"
        help="Rótulo da primeira coluna da tabela comparativa." />
      <Textarea label="Colunas (uma por linha)" value={(data.columns || []).join('\n')}
        onChange={(v) => onChange('columns', v.split('\n').filter(Boolean))} rows={3} />
      <ListHeader label="Linhas de comparação"
        onAdd={() => onChange('rows', [...(data.rows || []), { feature: '', values: [] }])} />
      {(data.rows || []).map((r, i) => (
        <ItemBox key={i} index={i} label="Linha" onRemove={() => onChange('rows', (data.rows || []).filter((_, j) => j !== i))}>
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
// EDITOR FOUNDER OFFER
// ============================================================
const EditorFounderOffer = ({ data, onChange }) => (
  <>
    <Toggle label="Seção ativada" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />
    <Input label="Badge" value={data.badge} onChange={(v) => onChange('badge', v)} />
    <Textarea label="Título" value={data.title} onChange={(v) => onChange('title', v)} rows={2} />
    <Textarea label="Descrição" value={data.description} onChange={(v) => onChange('description', v)} rows={4} />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Preço normal (riscado)" value={data.price_normal} onChange={(v) => onChange('price_normal', v)} />
      <Input label="Preço de fundador (destaque)" value={data.price_founder} onChange={(v) => onChange('price_founder', v)} />
      <Input label="Total de vagas" type="number" value={data.spots_total}
        onChange={(v) => onChange('spots_total', parseInt(v) || 0)} />
      <Input label="Vagas restantes" type="number" value={data.spots_remaining}
        onChange={(v) => onChange('spots_remaining', parseInt(v) || 0)} />
    </div>
    <Input label="Rótulo do período (abaixo do preço)" value={data.period_label}
      onChange={(v) => onChange('period_label', v)} placeholder="para sempre" />
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
      ℹ️ Os planos (preços e créditos) são gerenciados no sistema. Esta seção edita apenas os textos.
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
      <Input label="Kicker (rótulo pequeno acima do título)"
        value={data.kicker}
        onChange={(v) => onChange('kicker', v)}
        placeholder="Perguntas frequentes" />
      <Input label="Título" value={data.title} onChange={(v) => onChange('title', v)} />
      <Input label="Subtítulo" value={data.subtitle} onChange={(v) => onChange('subtitle', v)} />
      <UploadImage slot="faq_image" label="Foto lateral"
        value={data.image} onChange={(v) => onChange('image', v)} />
      <Input label="Texto do placeholder de imagem (quando não há foto)"
        value={data.image_placeholder}
        onChange={(v) => onChange('image_placeholder', v)}
        placeholder="Foto da professora" />
      <Input label="Texto do link de contato"
        value={data.contact_text}
        onChange={(v) => onChange('contact_text', v)}
        placeholder="Entre em contato conosco." />
      <Input label="E-mail de contato"
        value={data.contact_email}
        onChange={(v) => onChange('contact_email', v)}
        placeholder="contato@simidnape.com.br"
        help="Para onde o link de contato aponta." />
      <ListHeader label="Perguntas"
        onAdd={() => onChange('items', [...(data.items || []), { question: '', answer: '' }])} />
      {(data.items || []).map((f, i) => (
        <ItemBox key={i} index={i} label="Pergunta" onRemove={() => onChange('items', (data.items || []).filter((_, j) => j !== i))}>
          <Input label="Pergunta" value={f.question} onChange={(v) => setItem(i, 'question', v)} />
          <Textarea label="Resposta" value={f.answer} onChange={(v) => setItem(i, 'answer', v)} rows={3} />
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
    <Textarea label="Subheadline" value={data.subheadline} onChange={(v) => onChange('subheadline', v)} rows={2} />
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
  const setProductLink = (i, key, value) => {
    const arr = [...(data.product_links || [])];
    arr[i] = { ...arr[i], [key]: value };
    onChange('product_links', arr);
  };
  return (
    <>
      <Toggle label="Rodapé ativado" value={data.enabled !== false} onChange={(v) => onChange('enabled', v)} />

      <div className="mt-2 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Textos principais</p>
      </div>

      <Textarea label="Frase de apresentação (tagline)"
        value={data.tagline}
        onChange={(v) => onChange('tagline', v)}
        rows={2}
        placeholder="Assistente pedagógico com IA para professores brasileiros..."
        help="Frase curta que aparece logo abaixo do logo." />

      <Input label="Badge (selo no rodapé)"
        value={data.badge_text}
        onChange={(v) => onChange('badge_text', v)}
        placeholder="🇧🇷 Feito no Brasil · Alinhado à BNCC" />

      <Textarea label="Explicação do significado SIMIDNAPE"
        value={data.brand_explanation} onChange={(v) => onChange('brand_explanation', v)} rows={3} />

      <div className="mt-6 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Coluna "Produto"</p>
      </div>

      <Input label="Título da coluna"
        value={data.product_column_title}
        onChange={(v) => onChange('product_column_title', v)}
        placeholder="Produto" />

      <ListHeader label="Links da coluna Produto"
        onAdd={() => onChange('product_links', [...(data.product_links || []), { label: '', href: '' }])} />
      {(data.product_links || []).map((l, i) => (
        <ItemBox key={i} index={i} label="Link"
          onRemove={() => onChange('product_links', (data.product_links || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Rótulo" value={l.label} onChange={(v) => setProductLink(i, 'label', v)} />
            <Input label="URL" value={l.href} onChange={(v) => setProductLink(i, 'href', v)}
              help="Aceita âncoras como #plans ou URLs completas." />
          </div>
        </ItemBox>
      ))}

      <div className="mt-6 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Coluna "Institucional"</p>
      </div>

      <Input label="Título da coluna"
        value={data.institutional_column_title}
        onChange={(v) => onChange('institutional_column_title', v)}
        placeholder="Institucional" />

      <ListHeader label="Links da coluna Institucional"
        onAdd={() => onChange('links', [...(data.links || []), { label: '', href: '' }])} />
      {(data.links || []).map((l, i) => (
        <ItemBox key={i} index={i} label="Link" onRemove={() => onChange('links', (data.links || []).filter((_, j) => j !== i))}>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Rótulo" value={l.label} onChange={(v) => setLink(i, 'label', v)} />
            <Input label="URL" value={l.href} onChange={(v) => setLink(i, 'href', v)} />
          </div>
        </ItemBox>
      ))}

      <div className="mt-6 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Rodapé inferior</p>
      </div>

      <Input label="Copyright"
        value={data.copyright_text}
        onChange={(v) => onChange('copyright_text', v)} />
    </>
  );
};

// ============================================================
// EDITOR GLOBAL (SEO)
// ============================================================
const EditorGlobal = ({ config, setConfig, salvando, setMsg }) => {
  const update = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));
  const salvar = async () => {
    if (setMsg) setMsg(null);
    try {
      const res = await api.put('/landing/admin/config', {
        seo_title: config.seo_title,
        seo_description: config.seo_description,
      });
      setConfig(res.data.config);
      if (setMsg) {
        setMsg({ tipo: 'sucesso', texto: 'SEO salvo com sucesso!' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      if (setMsg) setMsg({ tipo: 'erro', texto: 'Erro ao salvar SEO.' });
    }
  };
  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <span className="text-3xl">⚙️</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">SEO e Meta Tags</h2>
          <p className="text-xs text-slate-500">Como a página aparece no Google e nas redes sociais</p>
        </div>
      </div>
      <Input label="Título SEO" value={config.seo_title} onChange={(v) => update('seo_title', v)}
        help="Aparece na aba do navegador e como título nos resultados do Google (máx. 60 caracteres)" />
      <Textarea label="Descrição SEO" value={config.seo_description} onChange={(v) => update('seo_description', v)} rows={3}
        help="Aparece como resumo nos resultados do Google (máx. 160 caracteres)" />
      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-sm">
          {salvando ? 'Salvando...' : '💾 Salvar configurações'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR POPUP
// ============================================================
const EditorPopup = ({ config, setConfig, salvando, setMsg }) => {
  const popup = config.popup || {};
  const update = (field, value) => setConfig(prev => ({ ...prev, popup: { ...prev.popup, [field]: value } }));
  const salvar = async () => {
    if (setMsg) setMsg(null);
    try {
      const res = await api.put('/landing/admin/config', { popup: config.popup });
      setConfig(res.data.config);
      if (setMsg) {
        setMsg({ tipo: 'sucesso', texto: 'Pop-up salvo com sucesso!' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      if (setMsg) setMsg({ tipo: 'erro', texto: 'Erro ao salvar pop-up.' });
    }
  };

  const TEMAS = [
    { value: 'azul',    label: '🔵 Azul institucional',  preview: 'bg-gradient-to-br from-blue-600 to-indigo-700' },
    { value: 'roxo',    label: '🟣 Roxo premium',        preview: 'bg-gradient-to-br from-purple-600 to-indigo-700' },
    { value: 'laranja', label: '🟠 Laranja urgência',    preview: 'bg-gradient-to-br from-orange-500 to-red-600' },
    { value: 'verde',   label: '🟢 Verde sucesso',       preview: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
    { value: 'preto',   label: '⚫ Preto elegante',      preview: 'bg-gradient-to-br from-gray-900 to-blue-950' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <span className="text-3xl">📢</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pop-up de Promoção</h2>
          <p className="text-xs text-slate-500">Card moderno com badge, imagem, bullets e CTA clicável. Aparece após alguns segundos.</p>
        </div>
      </div>

      <Toggle label="Pop-up ativado" value={popup.enabled} onChange={(v) => update('enabled', v)} />

      {/* ============================== */}
      {/* CONTEÚDO PRINCIPAL              */}
      {/* ============================== */}
      <div className="mt-2 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Conteúdo</p>
      </div>

      <Input label="Badge (etiqueta do topo)" value={popup.badge}
        onChange={(v) => update('badge', v)}
        placeholder="🎁 OFERTA DE LANÇAMENTO"
        help="Aparece em destaque no topo do card. Deixe vazio para não mostrar." />

      <Input label="Título principal" value={popup.title} onChange={(v) => update('title', v)} />

      <Textarea label="Subtítulo" value={popup.subtitle} onChange={(v) => update('subtitle', v)} rows={2}
        help="Uma linha curta abaixo do título. Deixe vazio para não mostrar." />

      <Textarea label="Bullets (um por linha)" value={(popup.bullets || []).join('\n')}
        onChange={(v) => update('bullets', v.split('\n').filter(Boolean))} rows={3}
        help="Cada linha vira um item com ✓ no card. Deixe vazio para não mostrar." />

      {/* ============================== */}
      {/* APARÊNCIA                       */}
      {/* ============================== */}
      <div className="mt-6 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Aparência</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Cor de tema</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {TEMAS.map((t) => (
            <button key={t.value} type="button"
              onClick={() => update('cor_tema', t.value)}
              className={`flex items-center gap-3 p-2 rounded-lg border-2 transition text-left ${
                popup.cor_tema === t.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
              <div className={`w-10 h-10 rounded-lg ${t.preview} border border-slate-200`} />
              <span className="text-xs font-medium text-slate-700">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <UploadImage slot="popup_image" label="Imagem do pop-up (opcional)"
        value={popup.image} onChange={(v) => update('image', v)}
        help="Se preencher, o card vira horizontal (imagem à esquerda, texto à direita). Sem imagem, fica vertical compacto." />

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Layout com imagem</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button type="button"
            onClick={() => update('layout', 'horizontal')}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
              popup.layout !== 'vertical'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-slate-200 text-slate-700 hover:border-slate-300'
            }`}>
            ↔ Horizontal (recomendado)
          </button>
          <button type="button"
            onClick={() => update('layout', 'vertical')}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
              popup.layout === 'vertical'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-slate-200 text-slate-700 hover:border-slate-300'
            }`}>
            ↕ Vertical
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Só tem efeito se houver imagem acima. Sem imagem, o pop-up sempre fica vertical compacto.
        </p>
      </div>

      {/* ============================== */}
      {/* COMPORTAMENTO                   */}
      {/* ============================== */}
      <div className="mt-6 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Comportamento</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Texto do botão" value={popup.cta_text} onChange={(v) => update('cta_text', v)} />
        <Input label="Link do botão (card inteiro)" value={popup.cta_link} onChange={(v) => update('cta_link', v)}
          help="Para onde vai ao clicar em qualquer lugar do card." />
        <Input label="Delay em segundos" type="number" value={popup.delay_seconds}
          onChange={(v) => update('delay_seconds', parseInt(v) || 8)} />
      </div>

      <Toggle label="Mostrar apenas uma vez por sessão" value={popup.show_once_per_user}
        onChange={(v) => update('show_once_per_user', v)} />

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-sm">
          {salvando ? 'Salvando...' : '💾 Salvar pop-up'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR HEADER — Logo, nav e botões do topo
// ============================================================
const EditorHeader = ({ config, setConfig, salvando, setMsg }) => {
  const header = config.header || {};
  const update = (field, value) => setConfig(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
  const salvar = async () => {
    if (setMsg) setMsg(null);
    try {
      const res = await api.put('/landing/admin/config', { header: config.header });
      setConfig(res.data.config);
      if (setMsg) {
        setMsg({ tipo: 'sucesso', texto: 'Header salvo com sucesso!' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      if (setMsg) setMsg({ tipo: 'erro', texto: 'Erro ao salvar header.' });
    }
  };
  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <span className="text-3xl">🎯</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Header (topo da página)</h2>
          <p className="text-xs text-slate-500">Logo, menu de navegação e botões de login/cadastro. Aparece no topo de todas as visitas.</p>
        </div>
      </div>

      <Input label="Texto do logo" value={header.logo_text}
        onChange={(v) => update('logo_text', v)}
        placeholder="SIMIDNAPE PRO"
        help="Aparece no canto esquerdo do topo." />

      <div className="mt-6 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Menu de navegação</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Item 1" value={header.nav_motors_label}
          onChange={(v) => update('nav_motors_label', v)}
          placeholder="Motores de IA"
          help="Vai para a seção Solução." />
        <Input label="Item 2" value={header.nav_how_label}
          onChange={(v) => update('nav_how_label', v)}
          placeholder="Como funciona"
          help="Vai para a seção Como Funciona." />
        <Input label="Item 3" value={header.nav_comparison_label}
          onChange={(v) => update('nav_comparison_label', v)}
          placeholder="Comparativo"
          help="Vai para a seção Comparativo." />
        <Input label="Item 4" value={header.nav_plans_label}
          onChange={(v) => update('nav_plans_label', v)}
          placeholder="Planos"
          help="Vai para a seção Planos." />
        <Input label="Item 5" value={header.nav_faq_label}
          onChange={(v) => update('nav_faq_label', v)}
          placeholder="FAQ"
          help="Vai para a seção Perguntas Frequentes." />
      </div>

      <div className="mt-6 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Botões</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Texto do botão Entrar" value={header.login_text}
          onChange={(v) => update('login_text', v)}
          placeholder="Entrar" />
        <Input label="Texto do botão Cadastro" value={header.register_text}
          onChange={(v) => update('register_text', v)}
          placeholder="Criar conta grátis" />
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-sm">
          {salvando ? 'Salvando...' : '💾 Salvar header'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR PÁGINA DE ERRO — textos de fallback quando backend cai
// ============================================================
const EditorErrorPage = ({ config, setConfig, salvando, setMsg }) => {
  const page = config.error_page || {};
  const update = (field, value) => setConfig(prev => ({ ...prev, error_page: { ...prev.error_page, [field]: value } }));
  const salvar = async () => {
    if (setMsg) setMsg(null);
    try {
      const res = await api.put('/landing/admin/config', { error_page: config.error_page });
      setConfig(res.data.config);
      if (setMsg) {
        setMsg({ tipo: 'sucesso', texto: 'Página de erro salva com sucesso!' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      if (setMsg) setMsg({ tipo: 'erro', texto: 'Erro ao salvar página de erro.' });
    }
  };
  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <span className="text-3xl">⚠️</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Página de Erro</h2>
          <p className="text-xs text-slate-500">Textos que aparecem quando o backend está fora do ar ou a config não carrega. Raramente visíveis, mas importantes.</p>
        </div>
      </div>

      <Input label="Texto de carregamento" value={page.loading_text}
        onChange={(v) => update('loading_text', v)}
        placeholder="Carregando..."
        help="Aparece enquanto a página está buscando a configuração." />

      <Input label="Título" value={page.title}
        onChange={(v) => update('title', v)}
        placeholder="SIMIDNAPE PRO"
        help="Aparece centralizado quando a página não carrega." />

      <Textarea label="Subtítulo" value={page.subtitle}
        onChange={(v) => update('subtitle', v)} rows={2}
        help="Uma linha abaixo do título explicando o que é o sistema." />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Texto do botão Cadastro" value={page.register_text}
          onChange={(v) => update('register_text', v)}
          placeholder="Criar conta grátis" />
        <Input label="Texto do botão Login" value={page.login_text}
          onChange={(v) => update('login_text', v)}
          placeholder="Já tenho conta" />
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-sm">
          {salvando ? 'Salvando...' : '💾 Salvar página de erro'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDITOR LOGIN — foto e textos das telas de Login/Cadastro
// ============================================================
const EditorLogin = ({ config, setConfig, salvando, setMsg }) => {
  const loginCfg = config.login || {};
  const registerCfg = config.register || {};

  const updateLogin = (field, value) =>
    setConfig(prev => ({ ...prev, login: { ...prev.login, [field]: value } }));
  const updateRegister = (field, value) =>
    setConfig(prev => ({ ...prev, register: { ...prev.register, [field]: value } }));

  const updateBenefit = (i, value) => {
    const arr = [...(loginCfg.benefits || [])];
    arr[i] = value;
    updateLogin('benefits', arr);
  };

  const salvar = async () => {
    if (setMsg) setMsg(null);
    try {
      const res = await api.put('/landing/admin/config', {
        login: config.login,
        register: config.register,
      });
      setConfig(res.data.config);
      if (setMsg) {
        setMsg({ tipo: 'sucesso', texto: 'Login e Cadastro salvos com sucesso!' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      if (setMsg) setMsg({ tipo: 'erro', texto: 'Erro ao salvar.' });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <span className="text-3xl">🔐</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Login e Cadastro</h2>
          <p className="text-xs text-slate-500">
            Foto e textos das telas de entrar e criar conta.
          </p>
        </div>
      </div>

      {/* ======================== TELA DE LOGIN ======================== */}
      <div className="mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">
          Tela de Login
        </p>
      </div>

      <UploadImage
        slot="login_photo"
        label="Foto da professora (Login)"
        value={loginCfg.photo}
        onChange={(v) => updateLogin('photo', v)}
        help="Imagem retrato, fundo transparente ou claro. Ela vai aparecer saindo do quadro na lateral da tela."
      />

      <Input label="Título de boas-vindas"
        value={loginCfg.welcome_title}
        onChange={(v) => updateLogin('welcome_title', v)}
        placeholder="Bem-vindo de volta."
      />

      <Input label="Subtítulo"
        value={loginCfg.welcome_subtitle}
        onChange={(v) => updateLogin('welcome_subtitle', v)}
        placeholder="Sua próxima aula inesquecível começa aqui."
      />

      <ListHeader
        label="Itens do checklist"
        onAdd={() => updateLogin('benefits', [...(loginCfg.benefits || []), ''])}
      />
      {(loginCfg.benefits || []).map((b, i) => (
        <ItemBox key={i} index={i} label="Item"
          onRemove={() => updateLogin('benefits', (loginCfg.benefits || []).filter((_, j) => j !== i))}>
          <Input label={`Item ${i + 1}`} value={b} onChange={(v) => updateBenefit(i, v)} />
        </ItemBox>
      ))}

      {/* ======================== TELA DE CADASTRO ======================== */}
      <div className="mt-10 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">
          Tela de Cadastro
        </p>
      </div>

      <UploadImage
        slot="register_photo"
        label="Foto da professora (Cadastro)"
        value={registerCfg.photo}
        onChange={(v) => updateRegister('photo', v)}
        help="Pode ser a mesma foto ou uma diferente."
      />

      <Input label="Título de boas-vindas"
        value={registerCfg.welcome_title}
        onChange={(v) => updateRegister('welcome_title', v)}
        placeholder="Crie sua conta."
      />

      <Input label="Subtítulo"
        value={registerCfg.welcome_subtitle}
        onChange={(v) => updateRegister('welcome_subtitle', v)}
        placeholder="7 créditos grátis para testar. Sem cartão de crédito."
      />

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-sm">
          {salvando ? 'Salvando...' : '💾 Salvar Login e Cadastro'}
        </button>
      </div>
    </div>
  );
};


// ============================================================
// EDITOR TEMA — cores e fontes de toda a plataforma
// ============================================================
const FONT_OPTIONS = [
  'Quicksand', 'Inter', 'Lora', 'JetBrains Mono',
  'Poppins', 'Playfair Display', 'Nunito', 'Merriweather',
  'Montserrat', 'Open Sans', 'Roboto', 'Raleway',
];

const COLOR_FIELDS = [
  { key: 'primary',        label: 'Cor Primária',         help: 'Botões principais e CTAs.' },
  { key: 'accent',         label: 'Cor de Destaque',      help: 'Badges, kickers e destaques secundários.' },
  { key: 'bg_light',       label: 'Fundo Claro',          help: 'Fundo das seções claras.' },
  { key: 'bg_dark',        label: 'Fundo Escuro',         help: 'Fundo das seções escuras.' },
  { key: 'text_primary',   label: 'Texto Principal',      help: 'Títulos e corpo de texto.' },
  { key: 'text_secondary', label: 'Texto Secundário',     help: 'Legendas, subtítulos, textos auxiliares.' },
  { key: 'success',        label: 'Sucesso (Verde)',      help: 'Checkmarks, reforço positivo.' },
  { key: 'warning',        label: 'Atenção (Alerta)',     help: 'Cards "Antes", avisos.' },
  { key: 'highlight',      label: 'Realce (Ouro)',        help: 'Selos, medalhas, destaques dourados.' },
];

const FONT_FIELDS = [
  { key: 'font_heading', label: 'Fonte dos Títulos',  help: 'Aplicada em H1, H2 e H3.' },
  { key: 'font_body',    label: 'Fonte do Corpo',     help: 'Aplicada no texto geral.' },
  { key: 'font_accent',  label: 'Fonte de Destaque',  help: 'Slogans, citações e badges.' },
];

const EditorTheme = () => {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get('/theme/admin/config')
      .then(res => setTheme(res.data?.config || null))
      .catch(() => setMsg({ tipo: 'erro', texto: 'Erro ao carregar tema.' }))
      .finally(() => setLoading(false));
  }, []);

  const updateColor = (key, value) => {
    setTheme(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };
  const updateFont = (key, value) => {
    setTheme(prev => ({ ...prev, fonts: { ...prev.fonts, [key]: value } }));
  };

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await api.put('/theme/admin/config', theme);
      setTheme(res.data.config);
      window.dispatchEvent(new CustomEvent('theme-updated'));
      setMsg({ tipo: 'sucesso', texto: 'Tema salvo! Recarregue a landing para ver as mudanças.' });
      setTimeout(() => setMsg(null), 4000);
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar tema.' });
    } finally {
      setSalvando(false);
    }
  };

  const resetar = async () => {
    if (!window.confirm('Tem certeza? Vai reverter todas as cores e fontes para o padrão.')) return;
    if (!window.confirm('Última confirmação: resetar tema?')) return;
    setSalvando(true);
    try {
      const res = await api.post('/theme/admin/config/reset', {});
      setTheme(res.data.config);
      window.dispatchEvent(new CustomEvent('theme-updated'));
      setMsg({ tipo: 'sucesso', texto: 'Tema resetado para o padrão.' });
      setTimeout(() => setMsg(null), 4000);
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro ao resetar tema.' });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando tema...</div>;
  if (!theme) return <div className="p-8 text-center text-red-500">Erro: tema não carregado.</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <span className="text-3xl">🎨</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tema da Plataforma</h2>
          <p className="text-xs text-slate-500">
            Cores e fontes que se aplicam a toda a plataforma (landing page + painel do usuário).
          </p>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg p-3 mb-6 text-sm ${
          msg.tipo === 'sucesso'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
        </div>
      )}

      {/* ======================== CORES ======================== */}
      <div className="mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Paleta de Cores</p>
        <p className="text-xs text-slate-400 mb-4">Clique no quadrado colorido para escolher, ou digite o código hex ao lado.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {COLOR_FIELDS.map(field => (
          <div key={field.key} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <input
              type="color"
              value={theme.colors?.[field.key] || '#000000'}
              onChange={e => updateColor(field.key, e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300 flex-shrink-0"
              title={field.label}
            />
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">{field.label}</label>
              <p className="text-[10px] text-slate-500 leading-tight mb-1">{field.help}</p>
              <input
                type="text"
                value={theme.colors?.[field.key] || ''}
                onChange={e => updateColor(field.key, e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ======================== FONTES ======================== */}
      <div className="mt-8 mb-2 pb-2 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Fontes</p>
        <p className="text-xs text-slate-400 mb-4">Escolha a família tipográfica para cada uso.</p>
      </div>

      <div className="space-y-4">
        {FONT_FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{field.label}</label>
            <p className="text-xs text-slate-500 mb-1.5">{field.help}</p>
            <select
              value={theme.fonts?.[field.key] || ''}
              onChange={e => updateFont(field.key, e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
        ℹ️ <strong>Nota:</strong> por enquanto, apenas <strong>Quicksand</strong>, <strong>Inter</strong>, <strong>Lora</strong> e <strong>JetBrains Mono</strong> estão carregadas no site. Se você escolher outra fonte, ela só aparecerá depois que adicionarmos as fontes extras (próximo bloco, T1d).
      </div>

      {/* ======================== AÇÕES ======================== */}
      <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap justify-between gap-2">
        <button onClick={resetar} disabled={salvando}
          className="bg-white hover:bg-red-50 text-red-600 font-medium px-4 py-2.5 rounded-lg text-sm border border-red-200 disabled:opacity-50 transition">
          🔄 Resetar tema
        </button>
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-sm transition">
          {salvando ? 'Salvando...' : '💾 Salvar tema'}
        </button>
      </div>
    </div>
  );
};

const EditorSistema = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/system/admin/settings');
      setSettings(res.data?.settings || []);
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao carregar configurações do sistema.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const getValor = (chave, padrao) => {
    const item = (settings || []).find(s => s.chave === chave);
    return item ? item.valor : padrao;
  };

  const setValorLocal = (chave, valor) => {
    setSettings(prev => (prev || []).map(s =>
      s.chave === chave ? { ...s, valor } : s
    ));
  };

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const items = (settings || []).map(s => ({
        chave: s.chave,
        valor: s.valor,
        tipo: s.tipo,
        categoria: s.categoria,
        descricao: s.descricao,
      }));
      await api.patch('/system/admin/settings/batch', { items });
      window.dispatchEvent(new CustomEvent('system-flags-updated'));
      setMsg({ tipo: 'sucesso', texto: 'Configurações salvas com sucesso!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar configurações.' });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando configurações...</div>;

  const flagAtiva = getValor('feature_gerar_imagem_ia', false);
  const textoIndisponivel = getValor('texto_imagem_ia_indisponivel', '');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <span className="text-3xl">🧩</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Configurações do Sistema</h2>
          <p className="text-xs text-slate-500">Ligue/desligue recursos globais e edite textos exibidos aos usuários</p>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg p-3 mb-6 text-sm ${
          msg.tipo === 'sucesso'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
        </div>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-bold text-purple-900 mb-1">🎨 Geração de imagens com IA</p>
        <p className="text-xs text-purple-700 mb-3">
          Quando desligado, o botão "🎨 Gerar imagem com IA" não aparece para ninguém (nem super admin).
          Quando ligado, aparece apenas para quem tem cota no plano (VIP: 5/mês, Premium: 10/mês).
          Usuários com API key própria do Gemini têm uso ilimitado.
        </p>
        <Toggle
          label={flagAtiva ? '🟢 LIGADO — Recurso visível para todos com cota' : '⚪ DESLIGADO — Recurso invisível'}
          value={!!flagAtiva}
          onChange={(v) => setValorLocal('feature_gerar_imagem_ia', v)}
        />
      </div>

      <Textarea
        label="Texto exibido quando o recurso está desligado"
        value={textoIndisponivel}
        onChange={(v) => setValorLocal('texto_imagem_ia_indisponivel', v)}
        rows={3}
        help="Mensagem mostrada no lugar do botão quando o recurso está desligado."
      />

      {/* ============================== */}
      {/* WhatsApp — Botão de contato     */}
      {/* ============================== */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 mt-6">
        <p className="text-sm font-bold text-emerald-900 mb-1">💬 WhatsApp — Botão de contato</p>
        <p className="text-xs text-emerald-700 mb-3">
          Quando ligado E com o número preenchido, aparece um botão de WhatsApp em pontos do site
          (perfil do usuário, por exemplo). Ao clicar, abre o WhatsApp do visitante com a mensagem
          já digitada — ele pode editar antes de enviar.
        </p>
        <Toggle
          label={getValor('whatsapp_ativo', false) ? '🟢 LIGADO — Botão visível' : '⚪ DESLIGADO — Botão oculto'}
          value={!!getValor('whatsapp_ativo', false)}
          onChange={(v) => setValorLocal('whatsapp_ativo', v)}
        />
      </div>

      <Input
        label="Número do WhatsApp"
        value={getValor('whatsapp_numero', '')}
        onChange={(v) => setValorLocal('whatsapp_numero', v)}
        placeholder="Ex: 5586999999999"
        help="Somente dígitos. Inclua o código do país (55 = Brasil) + DDD. Sem espaços, traços ou parênteses."
      />

      <Textarea
        label="Mensagem que já aparece digitada"
        value={getValor('whatsapp_mensagem', '')}
        onChange={(v) => setValorLocal('whatsapp_mensagem', v)}
        rows={2}
        help="Texto que o visitante verá ao abrir o WhatsApp. Ele pode editar antes de enviar."
      />

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
        <button onClick={salvar} disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-sm">
          {salvando ? 'Salvando...' : '💾 Salvar configurações'}
        </button>
      </div>
    </div>
  );
};

export default AdminLanding;