import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// ============================================================
// CONSTANTES DE LAYOUT — A4 PAISAGEM
// ============================================================
const PDF_W = 297;
const PDF_H = 210;
const MARGEM = 15;
const RODAPE_ALTURA = 10;
const GAP = 3;
const CONTENT_W_MM = PDF_W - MARGEM * 2;                  // 267 mm
const CONTENT_H_MM = PDF_H - MARGEM - RODAPE_ALTURA - 2;  // 183 mm
const CANVAS_W_PX = 1600;

// ============================================================
// PALETA — IDENTIDADE VISUAL SIMIDNAPE
// ============================================================
const AZUL_NOITE = '#0D2B45';
const TERRACOTA  = '#C0392B';
const OURO       = '#F1C40F';
const MARROM     = '#6E2C00';
const CREME      = '#FDFBF7';
const TEXTO      = '#2C3E50';

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slug(texto) {
  return (texto || 'planejamento')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 60) || 'planejamento';
}

// ============================================================
// RENDERIZAR UM MICRO-BLOCO (HTML → Canvas)
// ============================================================
async function renderizarBloco(html) {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; left: -99999px; top: 0;
    width: ${CANVAS_W_PX}px;
    background: ${CREME};
    font-family: 'Inter', Arial, sans-serif;
    color: ${TEXTO};
    box-sizing: border-box;
  `;
  el.innerHTML = html;
  document.body.appendChild(el);
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: CREME,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
    return canvas;
  } finally {
    document.body.removeChild(el);
  }
}

// ============================================================
// CAPA (página 1 — sempre sozinha)
// ============================================================
function htmlCapa(cab) {
  const nome = cab.nome_professor || '—';
  const escola = cab.nome_escola || '—';
  const muni = cab.municipio || '—';
  const uf = cab.estado || '—';
  const comp = cab.componente || '—';
  const ano = cab.ano || '—';
  const per = cab.periodo_texto || '—';
  const total = cab.total_aulas || '—';

  return `
    <div style="
      width: ${CANVAS_W_PX}px;
      padding: 0;
      background: ${AZUL_NOITE};
      font-family: 'Nunito', 'Inter', Arial, sans-serif;
      color: #ffffff;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    ">
      <div style="
        position: absolute; top: -80px; right: -80px;
        width: 340px; height: 340px;
        background: ${OURO};
        transform: rotate(45deg);
        opacity: 0.12;
      "></div>

      <div style="
        position: relative; z-index: 1;
        padding: 60px 70px;
        min-height: 780px;
        display: flex; flex-direction: column; justify-content: space-between;
      ">
        <div style="text-align: center;">
          <div style="
            width: 130px; height: 130px;
            margin: 0 auto 22px;
            border: 2px dashed rgba(255,255,255,0.3);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; color: rgba(255,255,255,0.5);
          ">PICA-PAU</div>

          <div style="
            font-size: 64px; font-weight: 900;
            color: #ffffff; letter-spacing: 8px; line-height: 1;
            font-family: 'Nunito', sans-serif;
          ">SIMIDNAPE</div>

          <div style="
            font-size: 22px; color: ${OURO};
            margin-top: 12px;
            font-family: 'Playfair Display', serif;
            font-style: italic; letter-spacing: 1px;
          ">O Professor Inesquecível</div>

          <div style="width: 80px; height: 3px; background: ${OURO}; margin: 24px auto 0;"></div>
        </div>

        <div style="text-align: center; margin: 50px 0;">
          <div style="
            display: inline-block;
            background: rgba(255,255,255,0.1);
            color: ${OURO};
            font-size: 11px; font-weight: bold; letter-spacing: 3px;
            padding: 8px 20px; border-radius: 999px;
            margin-bottom: 24px;
            border: 1px solid rgba(241,196,15,0.4);
          ">PLANEJAMENTO PEDAGÓGICO</div>

          <div style="
            font-size: 38px; font-weight: bold; color: #ffffff;
            line-height: 1.3;
            font-family: 'Playfair Display', serif;
          ">${escapeHtml(cab.titulo || 'Sem título')}</div>
        </div>

        <div style="
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 18px 50px; font-size: 15px;
          color: rgba(255,255,255,0.9);
          border-top: 1px solid rgba(255,255,255,0.2);
          padding-top: 32px;
        ">
          <div><strong style="color: ${OURO};">Professor(a):</strong> ${escapeHtml(nome)}</div>
          <div><strong style="color: ${OURO};">Componente:</strong> ${escapeHtml(comp)}</div>
          <div><strong style="color: ${OURO};">Escola:</strong> ${escapeHtml(escola)}</div>
          <div><strong style="color: ${OURO};">Ano/Série:</strong> ${escapeHtml(ano)}</div>
          <div><strong style="color: ${OURO};">Município:</strong> ${escapeHtml(muni)} - ${escapeHtml(uf)}</div>
          <div><strong style="color: ${OURO};">Período:</strong> ${escapeHtml(per)}</div>
          <div></div>
          <div><strong style="color: ${OURO};">Total de aulas:</strong> ${escapeHtml(String(total))}</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// MICRO-BLOCO — Cabeçalho do plano
// ============================================================
function htmlMicroCabecalho(sd) {
  const cab = sd.cabecalho || {};
  return `
    <div style="
      width: ${CANVAS_W_PX}px; box-sizing: border-box;
      padding: 24px 32px;
      background: linear-gradient(135deg, ${AZUL_NOITE} 0%, ${TERRACOTA} 100%);
      color: #ffffff; border-radius: 12px;
      font-family: 'Inter', Arial, sans-serif;
      margin-bottom: 12px;
    ">
      <div style="
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.3);
        padding-bottom: 14px; margin-bottom: 16px;
      ">
        <div>
          <div style="font-size: 15px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: ${OURO}; font-family: 'Nunito', sans-serif;">PLANEJADOR SIMIDNAPE</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.8);">O Professor Inesquecível</div>
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.8);">simidnape.com.br</div>
      </div>
      <div style="font-size: 26px; font-weight: bold; margin-bottom: 10px; font-family: 'Playfair Display', serif;">${escapeHtml(cab.titulo || '')}</div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.9); margin-bottom: 6px;">
        ${cab.nome_professor ? `<strong style="color:#fff;">Professor(a):</strong> ${escapeHtml(cab.nome_professor)}` : ''}
        ${cab.nome_escola ? ` · <strong style="color:#fff;">Escola:</strong> ${escapeHtml(cab.nome_escola)}` : ''}
        ${cab.municipio ? ` · <strong style="color:#fff;">Município:</strong> ${escapeHtml(cab.municipio)}` : ''}
        ${cab.estado ? ` - ${escapeHtml(cab.estado)}` : ''}
      </div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.9);">
        <strong style="color:#fff;">Componente:</strong> ${escapeHtml(cab.componente || '')} · 
        <strong style="color:#fff;">Ano:</strong> ${escapeHtml(cab.ano || '')} · 
        <strong style="color:#fff;">Período:</strong> ${escapeHtml(cab.periodo_texto || '')} · 
        <strong style="color:#fff;">Total de aulas:</strong> ${escapeHtml(String(cab.total_aulas || ''))}
      </div>
    </div>
  `;
}

// ============================================================
// MICRO-BLOCOS — MACRO
// ============================================================
function htmlMicroMacro(sd) {
  const blocos = [];

  if (sd.logica_pedagogica) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: #F0F4F8; border-left: 5px solid ${AZUL_NOITE}; padding: 16px 20px; border-radius: 8px;">
          <div style="font-size: 12px; font-weight: bold; color: ${AZUL_NOITE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Lógica pedagógica do período</div>
          <div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6; font-style: italic;">${escapeHtml(sd.logica_pedagogica)}</div>
        </div>
      </div>
    `);
  }

  if ((sd.eixos_predominantes || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="font-size: 12px; font-weight: bold; color: ${TEXTO}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Eixos predominantes</div>
        ${sd.eixos_predominantes.map(e => `
          <div style="display: flex; gap: 10px; align-items: baseline; margin-bottom: 6px; font-size: 13px;">
            <span style="background: #E2E8F0; color: ${TEXTO}; padding: 2px 10px; border-radius: 4px; font-weight: 600; font-size: 12px;">${escapeHtml(e.periodo || '')}</span>
            <span style="color: ${TEXTO};">${escapeHtml(e.eixo || '')}</span>
          </div>
        `).join('')}
      </div>
    `);
  }

  const descs = sd.descritores_detalhados || [];
  if (descs.length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="font-size: 12px; font-weight: bold; color: ${TEXTO}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Descritores trabalhados no período</div>
        ${descs.map(d => `
          <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px; font-size: 13px;">
            <span style="background: #DBEAFE; color: #1E40AF; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-family: 'JetBrains Mono', monospace; flex-shrink: 0;">${escapeHtml(d.codigo)}</span>
            ${d.fonte ? `<span style="background: #E0E7FF; color: #3730A3; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; text-transform: uppercase; flex-shrink: 0;">${escapeHtml(d.fonte)}</span>` : ''}
            <span style="color: ${TEXTO}; line-height: 1.5;">${escapeHtml(d.texto)}</span>
          </div>
        `).join('')}
      </div>
    `);
  } else if ((sd.descritores_trabalhados || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="font-size: 12px; font-weight: bold; color: ${TEXTO}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Descritores trabalhados</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${sd.descritores_trabalhados.map(d => `<span style="background: #DBEAFE; color: #1E40AF; padding: 3px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; font-family: 'JetBrains Mono', monospace;">${escapeHtml(d)}</span>`).join('')}
        </div>
      </div>
    `);
  }

  if (sd.objetivos_gerais) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="font-size: 12px; font-weight: bold; color: ${TEXTO}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Objetivos gerais</div>
        <div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 8px;">${escapeHtml(sd.objetivos_gerais)}</div>
        ${(sd.objetivos_especificos || []).map(o => `
          <div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6;">✓ ${escapeHtml(o)}</div>
        `).join('')}
      </div>
    `);
  }

  if (sd.justificativa) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: #F8FAFC; border-left: 4px solid #64748B; padding: 14px 18px; border-radius: 6px;">
          <div style="font-size: 12px; font-weight: bold; color: ${TEXTO}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Justificativa</div>
          <div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(sd.justificativa)}</div>
        </div>
      </div>
    `);
  }

  return blocos;
}

// ============================================================
// MICRO-BLOCOS — UMA AULA
// ============================================================
function htmlMicroAula(aula, index) {
  const blocos = [];

  const headerBadges = [
    aula.principio_cognitivo ? `<span style="background: rgba(255,255,255,0.2); color: #fff; padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid rgba(255,255,255,0.3);">🧠 ${escapeHtml(aula.principio_cognitivo)}</span>` : '',
    aula.duracao_minutos ? `<span style="background: rgba(255,255,255,0.2); color: #fff; padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid rgba(255,255,255,0.3); font-family: 'JetBrains Mono', monospace;">${aula.duracao_minutos} min</span>` : '',
  ].filter(Boolean).join('');

  const badgesRow = [
    aula.habilidade_foco ? `<span style="background: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">🎯 ${escapeHtml(aula.habilidade_foco)}</span>` : '',
    aula.foco ? `<span style="background: #F1F5F9; color: ${TEXTO}; padding: 4px 12px; border-radius: 4px; font-size: 12px;">📌 ${escapeHtml(aula.foco)}</span>` : '',
    ...(aula.descritores || []).map(d => `<span style="background: #DBEAFE; color: #1E40AF; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; font-family: 'JetBrains Mono', monospace;">${escapeHtml(d)}</span>`),
  ].filter(Boolean).join('');

  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 16px 32px 4px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="border-radius: 10px; overflow: hidden;">
        <div style="
          background: linear-gradient(135deg, ${AZUL_NOITE} 0%, ${TERRACOTA} 100%);
          color: #ffffff; padding: 14px 20px;
          display: flex; justify-content: space-between; align-items: center;
          font-family: 'Nunito', sans-serif;
        ">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; font-weight: bold; color: ${OURO}; letter-spacing: 1.5px;">
              ${aula.semana ? 'SEMANA ' + aula.semana + ' · ' : ''}AULA ${aula.numero_aula || index + 1}
            </div>
            <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">
              ${escapeHtml(aula.titulo || '')}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: 16px;">${headerBadges}</div>
        </div>
      </div>

      ${aula.pergunta_problematizadora ? `
        <div style="background: #FEF9C3; border-left: 4px solid ${OURO}; padding: 12px 16px; border-radius: 6px; margin-top: 10px;">
          <div style="font-size: 11px; font-weight: bold; color: #854D0E; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 5px;">❓ Pergunta problematizadora</div>
          <div style="font-size: 14px; font-weight: 600; color: #713F12; font-style: italic; line-height: 1.5;">"${escapeHtml(aula.pergunta_problematizadora)}"</div>
        </div>
      ` : ''}

      ${badgesRow ? `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">${badgesRow}</div>` : ''}
    </div>
  `);

  const cartao = (titulo, conteudo, cor, bg) => conteudo ? `
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${bg || CREME}; border-left: 3px solid ${cor}; padding: 12px 16px; border-radius: 6px;">
        <div style="font-size: 11px; font-weight: bold; color: ${cor}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">${titulo}</div>
        <div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(conteudo)}</div>
      </div>
    </div>
  ` : '';

  blocos.push(cartao('🎯 Objetivo', aula.objetivo_da_aula, '#059669', CREME));
  blocos.push(cartao('📖 Conteúdo', aula.conteudo, TEXTO, CREME));
  blocos.push(cartao('🎨 Estratégia concreta', aula.estrategia, '#7C3AED', '#F5F3FF'));
  blocos.push(cartao('👨‍🏫 Metodologia', aula.metodologia, TEXTO, CREME));

  if ((aula.atividades || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div>
          <div style="font-size: 11px; font-weight: bold; color: ${TEXTO}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">👥 Atividades dos alunos</div>
          ${aula.atividades.map(a => `<div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6;">• ${escapeHtml(a)}</div>`).join('')}
        </div>
      </div>
    `);
  }

  blocos.push(cartao('📦 Recursos', (aula.recursos || []).join(' · '), TEXTO, CREME));
  blocos.push(cartao('✅ Avaliação da aula', aula.avaliacao_da_aula, '#059669', '#ECFDF5'));
  blocos.push(cartao('🎯 Evidência de aprendizagem', aula.evidencia_de_aprendizagem, '#0D9488', '#F0FDFA'));
  blocos.push(cartao('⚠️ Onde pode travar', aula.onde_pode_travar, '#B45309', '#FFFBEB'));
  blocos.push(cartao('🎚️ Diferenciação', aula.diferenciacao, '#A21CAF', '#FDF4FF'));
  blocos.push(cartao('✨ Momento de encantamento', aula.momento_de_encantamento, '#BE185D', '#FDF2F8'));
  blocos.push(cartao('💭 Leitura relacional', aula.leitura_relacional, '#4338CA', '#EEF2FF'));
  blocos.push(cartao('🎯 Resultado visível', aula.resultado_visivel, '#059669', '#ECFDF5'));
  blocos.push(cartao('🌍 Conexão com a vida', aula.conexao_com_a_vida, '#C2410C', '#FFF7ED'));

  return blocos.filter(Boolean);
}

// ============================================================
// MICRO-BLOCOS — FINAL
// ============================================================
function htmlMicroFinal(sd) {
  const blocos = [];
  const aval = sd.avaliacao_geral || {};

  if (aval.instrumentos?.length || aval.indicadores_de_sucesso?.length || aval.como_acompanhar) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="border: 1px solid #CBD5E1; border-radius: 10px; padding: 20px 24px;">
          <div style="font-size: 16px; font-weight: bold; color: ${AZUL_NOITE}; margin-bottom: 12px; font-family: 'Nunito', sans-serif;">📊 Avaliação geral do período</div>
          ${(aval.instrumentos || []).length > 0 ? `
            <div style="font-size: 12px; font-weight: bold; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Instrumentos</div>
            ${aval.instrumentos.map(x => `<div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6;">• ${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${(aval.indicadores_de_sucesso || []).length > 0 ? `
            <div style="font-size: 12px; font-weight: bold; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 5px;">Indicadores de sucesso</div>
            ${aval.indicadores_de_sucesso.map(x => `<div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6;">• ${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${aval.como_acompanhar ? `
            <div style="font-size: 12px; font-weight: bold; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 5px;">Como acompanhar</div>
            <div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aval.como_acompanhar)}</div>
          ` : ''}
        </div>
      </div>
    `);
  }

  if ((sd.adaptacoes_inclusivas || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: #F0F4F8; border: 1px solid #BFDBFE; border-radius: 10px; padding: 20px 24px;">
          <div style="font-size: 16px; font-weight: bold; color: ${AZUL_NOITE}; margin-bottom: 12px; font-family: 'Nunito', sans-serif;">🧩 Adaptações inclusivas</div>
          ${sd.adaptacoes_inclusivas.map(a => `
            <div style="margin-bottom: 12px;">
              <div style="font-size: 14px; font-weight: bold; color: ${AZUL_NOITE}; margin-bottom: 5px;">${escapeHtml(a.necessidade || '')}</div>
              ${(a.estrategias || []).map(e => `<div style="font-size: 14px; color: ${TEXTO}; line-height: 1.6;">• ${escapeHtml(e)}</div>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  if (sd.consideracoes_finais) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 20px 24px;">
          <div style="font-size: 16px; font-weight: bold; color: #854D0E; margin-bottom: 8px; font-family: 'Nunito', sans-serif;">📌 Considerações finais</div>
          <div style="font-size: 14px; color: #713F12; line-height: 1.6;">${escapeHtml(sd.consideracoes_finais)}</div>
        </div>
      </div>
    `);
  }

  return blocos;
}

// ============================================================
// RODAPÉ
// ============================================================
function desenharRodape(pdf, numPagina) {
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('SIMIDNAPE PRO · O Professor Inesquecível · simidnape.com.br', MARGEM, PDF_H - 4);
  pdf.text(`Página ${numPagina}`, PDF_W - MARGEM, PDF_H - 4, { align: 'right' });
}

// ============================================================
// FUNÇÃO PRINCIPAL — PAGINAÇÃO POR MICRO-BLOCOS
// ============================================================
export async function gerarPdfPlanejamento(plano) {
  if (!plano || !plano.structured_data) {
    throw new Error('Plano inválido.');
  }

  const sd = plano.structured_data;
  const cab = sd.cabecalho || {};

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // 1. CAPA (página 1)
  const canvasCapa = await renderizarBloco(htmlCapa(cab));
  const capaRatio = CONTENT_W_MM / canvasCapa.width;
  const capaAlturaMM = Math.min(canvasCapa.height * capaRatio, CONTENT_H_MM);
  pdf.addImage(canvasCapa.toDataURL('image/jpeg', 0.95), 'JPEG', MARGEM, MARGEM, CONTENT_W_MM, capaAlturaMM);

  // 2. Monta micro-blocos
  const micros = [];
  micros.push(htmlMicroCabecalho(sd));
  micros.push(...htmlMicroMacro(sd));
  (sd.sequencia_didatica || []).forEach((aula, i) => {
    micros.push(...htmlMicroAula(aula, i));
  });
  micros.push(...htmlMicroFinal(sd));

  // 3. Nova página e empilha
  pdf.addPage('a4', 'landscape');
  let yAtual = MARGEM;

  for (const html of micros.filter(Boolean)) {
    const canvas = await renderizarBloco(html);
    const ratio = CONTENT_W_MM / canvas.width;
    const alturaMM = canvas.height * ratio;

    if (yAtual + alturaMM <= MARGEM + CONTENT_H_MM + 0.5) {
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', MARGEM, yAtual, CONTENT_W_MM, alturaMM);
      yAtual += alturaMM + GAP;
    } else {
      pdf.addPage('a4', 'landscape');
      yAtual = MARGEM;

      if (alturaMM > CONTENT_H_MM + 0.5) {
        const alturaPaginaPx = CONTENT_H_MM / ratio;
        let posY = 0;
        while (posY < canvas.height) {
          const restante = canvas.height - posY;
          const fatiaPx = Math.min(alturaPaginaPx, restante);

          const fatia = document.createElement('canvas');
          fatia.width = canvas.width;
          fatia.height = Math.ceil(fatiaPx);
          const fctx = fatia.getContext('2d');
          fctx.fillStyle = CREME;
          fctx.fillRect(0, 0, fatia.width, fatia.height);
          fctx.drawImage(canvas, 0, posY, canvas.width, fatiaPx, 0, 0, canvas.width, fatiaPx);

          const fatiaAlturaMM = fatiaPx * ratio;
          pdf.addImage(fatia.toDataURL('image/jpeg', 0.95), 'JPEG', MARGEM, yAtual, CONTENT_W_MM, fatiaAlturaMM);
          posY += fatiaPx;

          if (posY < canvas.height) {
            pdf.addPage('a4', 'landscape');
            yAtual = MARGEM;
          } else {
            yAtual += fatiaAlturaMM + GAP;
          }
        }
      } else {
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', MARGEM, yAtual, CONTENT_W_MM, alturaMM);
        yAtual += alturaMM + GAP;
      }
    }
  }

  // 4. Rodapé
  const totalPaginas = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    pdf.setPage(i);
    desenharRodape(pdf, i);
  }

  // 5. Salva
  pdf.save(`${slug(cab.titulo)}_PLANEJAMENTO.pdf`);
}

export default gerarPdfPlanejamento;