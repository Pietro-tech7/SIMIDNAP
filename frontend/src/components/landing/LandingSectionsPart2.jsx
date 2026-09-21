import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VideoEmbed } from './LandingSectionsPart1';

const Check = ({ className = 'text-blue-600' }) => (
  <svg className={`w-5 h-5 ${className} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);


// ============================================================
// METRICS — Faixa azul escura com números em destaque
// ============================================================
export const MetricsSection = ({ data }) => {
  if (!data.metrics?.length) return null;

  return (
    <section id="metrics" className="py-16 md:py-20 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{data.title}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {data.metrics.map((m, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">{m.value}</p>
              <p className="text-sm text-gray-400 leading-snug">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ============================================================
// TESTIMONIALS — Foto destaque + quote + cards menores
// ============================================================
export const TestimonialsSection = ({ data }) => {
  const temDestaque = data.image || data.video_url;
  const temTestemunhos = data.testimonials?.length > 0;

  // Placeholder: sem nada
  if (!temDestaque && !temTestemunhos) {
    return (
      <section id="testimonials" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
            {data.subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{data.subtitle}</p>}
          </div>
          <div className="text-center bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 max-w-2xl mx-auto">
            <p className="text-5xl mb-3">💬</p>
            <p className="text-gray-500">
              Em breve: depoimentos de professores que estão usando o SIMIDNAPE PRO.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Com destaque (foto + vídeo)
  if (temDestaque) {
    return (
      <section id="testimonials" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
              Depoimentos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
            {data.subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{data.subtitle}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            {/* Foto */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[3/4] bg-gray-200">
                {data.image ? (
                  <>
                    <img src={data.image} alt="Depoimento destaque" className="w-full h-full object-cover" />
                    {data.video_url && (
                      <a
                        href={data.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
                      >
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
                          <svg className="w-10 h-10 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </a>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <span className="text-8xl mb-3">🎤</span>
                    <span className="text-sm font-medium">Foto do depoimento</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quote */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-8 md:p-10 border border-gray-200 shadow-sm">
              {data.testimonials?.[0] ? (
                <>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4">
                    {data.testimonials[0].school || 'Depoimento'}
                  </p>
                  <blockquote className="text-xl md:text-2xl text-gray-900 leading-relaxed mb-6">
                    "{data.testimonials[0].text}"
                  </blockquote>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {data.testimonials[0].name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{data.testimonials[0].name}</p>
                      <p className="text-sm text-gray-600">{data.testimonials[0].school}</p>
                    </div>
                  </div>
                  {data.video_url && (
                    <a
                      href={data.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Assistir ao depoimento
                    </a>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-5xl mb-3">💬</p>
                  <p className="text-gray-500">Depoimento em breve.</p>
                </div>
              )}
            </div>
          </div>

          {/* Outros depoimentos */}
          {data.testimonials?.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {data.testimonials.slice(1).map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {t.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.school}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic">"{t.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Só depoimentos em cards
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{data.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {t.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.school}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed italic">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ============================================================
// COMPARISON
// ============================================================
export const ComparisonSection = ({ data }) => {
  return (
    <section id="comparison" className="py-20 md:py-28 bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Recurso
                  </th>
                  {data.columns?.map((col, i) => (
                    <th
                      key={i}
                      className={`px-4 md:px-6 py-4 text-center text-xs md:text-sm font-bold uppercase tracking-wide ${
                        i === 0 ? 'text-blue-700 bg-blue-50' : 'text-gray-500'
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.rows?.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900 font-medium">
                      {row.feature}
                    </td>
                    {row.values?.map((val, j) => (
                      <td
                        key={j}
                        className={`px-4 md:px-6 py-4 text-center text-lg ${
                          j === 0 ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// FOUNDER OFFER — Oferta de Fundador com urgência
// ============================================================
export const FounderOfferSection = ({ data }) => {
  if (!data.enabled) return null;

  const pct = data.spots_total > 0
    ? Math.round(((data.spots_total - data.spots_remaining) / data.spots_total) * 100)
    : 0;

  return (
    <section id="founder_offer" className="py-20 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-center">
          {data.badge && (
            <p className="inline-block bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
              {data.badge}
            </p>
          )}

          <h2 className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight">
            {data.title}
          </h2>

          {data.description && (
            <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              {data.description}
            </p>
          )}

          {/* Preços */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
            <div className="text-center">
              <p className="text-gray-500 line-through text-lg">{data.price_normal}</p>
              <p className="text-xs text-gray-500 mt-1">preço normal</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white">{data.price_founder}</p>
              <p className="text-xs text-blue-400 font-semibold mt-1 uppercase tracking-wider">
                para sempre
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          {data.spots_total > 0 && (
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{data.spots_total - data.spots_remaining} vagas preenchidas</span>
                <span className="font-bold text-white">
                  Restam {data.spots_remaining} de {data.spots_total}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          <Link
            to={data.cta_link || '/register'}
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-lg hover:bg-gray-100 transition shadow-sm text-lg"
          >
            {data.cta_text || 'Quero garantir minha vaga'}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// PLANS
// ============================================================
const PLANOS_FIXOS = [
  {
    codigo: 'trial',
    nome: 'Trial',
    preco: 0,
    creditos_mes: 5,
    trial: true,
    itens: ['5 créditos grátis', 'Acesso a todos os motores', 'Sem cartão de crédito', 'Válido por 30 dias'],
  },
  {
    codigo: 'basico',
    nome: 'Básico',
    preco: 9.90,
    creditos_mes: 15,
    itens: ['15 créditos/mês', 'Acesso a todos os motores', 'Cancele quando quiser'],
  },
  {
    codigo: 'padrao',
    nome: 'Padrão',
    preco: 19.90,
    creditos_mes: 25,
    destaque: true,
    itens: ['25 créditos/mês', 'Acesso a todos os motores', 'Suporte prioritário', 'Cancele quando quiser'],
  },
  {
    codigo: 'avancado',
    nome: 'Avançado',
    preco: 49.90,
    creditos_mes: 100,
    itens: ['100 créditos/mês', 'Acesso a todos os motores', 'Suporte prioritário', 'Cancele quando quiser'],
  },
];

export const PlansSection = ({ data }) => {
  return (
    <section id="plans" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANOS_FIXOS.map((p) => {
            const precoPorDia = p.preco > 0 ? (p.preco / 30).toFixed(2).replace('.', ',') : null;

            return (
              <div
                key={p.codigo}
                className={`relative rounded-2xl p-6 border-2 transition flex flex-col bg-white ${
                  p.destaque
                    ? 'border-blue-600 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    ⭐ Mais escolhido
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-3 mt-1">{p.nome}</h3>

                <div className="mb-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {p.preco === 0 ? 'Grátis' : `R$ ${p.preco.toFixed(2).replace('.', ',')}`}
                  </span>
                  {p.preco > 0 && <span className="text-gray-500 ml-1 text-sm">/mês</span>}
                </div>

                {precoPorDia && (
                  <p className="text-xs text-gray-500 mb-4">
                    Apenas R$ {precoPorDia} por dia
                  </p>
                )}

                <p className="text-2xl font-bold text-blue-700 mb-5">
                  {p.creditos_mes} {p.creditos_mes === 1 ? 'crédito' : 'créditos'}
                </p>

                <ul className="space-y-2 mb-6 flex-1">
                  {p.itens.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="text-green-600 w-4 h-4 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block text-center font-semibold py-3 rounded-lg transition ${
                    p.destaque
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : p.trial
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
                        : 'bg-gray-900 hover:bg-black text-white'
                  }`}
                >
                  {p.trial ? 'Começar grátis' : 'Assinar agora'}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          💳 Pagamento via Pix (instantâneo) ou cartão de crédito/débito. Cancele a qualquer momento.
        </p>
      </div>
    </section>
  );
};


// ============================================================
// GUARANTEE
// ============================================================
export const GuaranteeSection = ({ data }) => {
  return (
    <section id="guarantee" className="py-16 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🛡️</div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{data.title}</h2>
          </div>
          <ul className="space-y-3 max-w-2xl mx-auto">
            {data.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-800">
                <Check className="text-green-600 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// FAQ — 2 colunas (título + foto à esquerda, accordion à direita)
// ============================================================
export const FAQSection = ({ data }) => {
  const [aberto, setAberto] = useState(null);

  return (
    <section id="faq" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Coluna esquerda */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
              Perguntas frequentes
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {data.title}
            </h2>
            {data.subtitle && (
              <p className="text-lg text-gray-600 mb-6">
                {data.subtitle}{' '}
                <a href="mailto:contato@simidnape.com.br" className="text-blue-700 hover:underline font-semibold">
                  Entre em contato conosco.
                </a>
              </p>
            )}

            {/* Foto */}
            <div className="hidden lg:block mt-8">
              <div className="rounded-2xl overflow-hidden shadow-lg aspect-square max-w-sm bg-gray-200">
                {data.image ? (
                  <img src={data.image} alt="Professora" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <span className="text-8xl mb-3">👩‍🏫</span>
                    <span className="text-sm font-medium">Foto da professora</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna direita — Accordion */}
          <div className="lg:col-span-3">
            <div className="space-y-3">
              {data.items?.map((f, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition"
                >
                  <button
                    onClick={() => setAberto(aberto === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition"
                  >
                    <span className="text-xl font-bold text-blue-700 flex-shrink-0 w-8">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-gray-900 flex-1 leading-snug">
                      {f.question}
                    </span>
                    <span className={`text-2xl text-gray-400 flex-shrink-0 transition-transform ${aberto === i ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </button>
                  {aberto === i && (
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed pl-12">{f.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


// ============================================================
// FINAL CTA
// ============================================================
export const FinalCTASection = ({ data }) => {
  return (
    <section id="final_cta" className="py-20 md:py-28 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {data.headline}
        </h2>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          {data.subheadline}
        </p>
        <Link
          to={data.cta_link || '/register'}
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-10 py-4 rounded-lg hover:bg-gray-100 transition shadow-sm text-lg"
        >
          {data.cta_text || 'Criar conta grátis'}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
};


// ============================================================
// FOOTER
// ============================================================
export const FooterSection = ({ data }) => {
  return (
    <footer className="bg-black text-gray-400 py-14 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-1">SIMIDNAPE PRO</h3>
            <p className="text-sm text-blue-400 font-bold mb-4">O Professor Inesquecível</p>
            {data.brand_explanation && (
              <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-md">
                {data.brand_explanation}
              </p>
            )}
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              Assistente pedagógico com IA para professores brasileiros.
              Neuroeducação, ciência da aprendizagem e respeito à autonomia docente.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              🇧🇷 Feito no Brasil · Alinhado à BNCC
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#solution" className="hover:text-white transition">Motores de IA</a></li>
              <li><a href="#comparison" className="hover:text-white transition">Comparativo</a></li>
              <li><a href="#plans" className="hover:text-white transition">Planos</a></li>
              <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2 text-sm">
              {data.links?.map((link, i) => (
                <li key={i}>
                  {link.href?.startsWith('http') || link.href?.startsWith('mailto') ? (
                    <a href={link.href} className="hover:text-white transition">{link.label}</a>
                  ) : (
                    <Link to={link.href} className="hover:text-white transition">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-xs">
          <p>{data.copyright_text || '© 2025 SIMIDNAPE PRO — O Professor Inesquecível. Todos os direitos reservados.'}</p>
        </div>
      </div>
    </footer>
  );
};


// ============================================================
// POPUP
// ============================================================
export const PopupSection = ({ data }) => {
  const [visivel, setVisivel] = useState(false);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    if (!data.enabled || fechado) return;
    if (data.show_once_per_user && sessionStorage.getItem('popup_landing_shown')) return;

    const timer = setTimeout(() => {
      setVisivel(true);
      sessionStorage.setItem('popup_landing_shown', '1');
    }, (data.delay_seconds || 8) * 1000);

    return () => clearTimeout(timer);
  }, [data.enabled, data.delay_seconds, data.show_once_per_user, fechado]);

  if (!data.enabled || !visivel || fechado) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-slide-in">
      <button
        onClick={() => setFechado(true)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl w-7 h-7 flex items-center justify-center"
      >
        ×
      </button>
      <h3 className="text-lg font-bold text-gray-900 mb-2 pr-6">{data.title}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{data.message}</p>
      <Link
        to={data.cta_link || '/register'}
        className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
      >
        {data.cta_text || 'Ver planos'}
      </Link>
    </div>
  );
};