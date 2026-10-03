import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// ============================================================
// LAYOUT — A4 PAISAGEM
// ============================================================
const PDF_W = 297;
const PDF_H = 210;
const MARGEM = 15;
const RODAPE_ALTURA = 10;
const GAP = 4;
const CONTENT_W_MM = PDF_W - MARGEM * 2;
const CONTENT_H_MM = PDF_H - MARGEM - RODAPE_ALTURA - 2;
const CANVAS_W_PX = 1600;
const CAPA_ALTURA_PX = 1096;
const PICAPAU_URL = '/icons/comparacao/simidnape-picapau.svg';

// ============================================================
// PALETA SUAVE
// ============================================================
const CREME         = '#FDFBF7';
const BRANCO        = '#FFFFFF';
const AZUL          = '#2C5F7C';
const AZUL_CLARO    = '#E8F0F5';
const VERDE         = '#5FA68D';
const VERDE_CLARO   = '#EAF4F0';
const PESSEGO       = '#E8A87C';
const PESSEGO_CLARO = '#FDF1E7';
const CORAL         = '#E07856';
const CORAL_CLARO   = '#FBE9E2';
const OURO          = '#D4A843';
const OURO_CLARO    = '#FBF3E0';
const TEXTO         = '#2D2D2D';
const TEXTO_2       = '#6B6B6B';
const BORDA         = '#E5E0D8';

// ============================================================
// TAMANHOS DE FONTE
// ============================================================
const F_BODY       = 26;
const F_BODY_SM    = 22;
const F_LABEL      = 16;
const F_LABEL_SM   = 14;
const F_CHIP       = 18;
const F_TITULO_AULA = 36;
const F_TITULO_SEC = 44;
const F_LOGO       = 96;
const F_SLOGAN     = 26;
const F_COVER_TIT  = 62;
const F_COVER_BADGE = 16;
const F_COVER_CARD = 22;

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

function normalizarCodigo(codigo) {
  if (!codigo) return '';
  let s = String(codigo).trim();
  if (s.includes(':')) s = s.split(':').pop();
  return s.trim().toUpperCase();
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function renderizarBloco(html, opcoes = {}) {
  const { larguraPx = CANVAS_W_PX, alturaMinimaPx = null } = opcoes;
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; left: -99999px; top: 0;
    width: ${larguraPx}px;
    ${alturaMinimaPx ? `min-height: ${alturaMinimaPx}px;` : ''}
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
      allowTaint: true,
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
// LOGO SIMIDNAPE (inalterado)
// ============================================================
function htmlLogo(opcoes = {}) {
  const {
    tamanhoNome = F_LOGO,
    tamanhoSlogan = F_SLOGAN,
    alturaPicapau = 120,
    gap = 28,
  } = opcoes;

  const corBolinha1 = CORAL;
  const corBolinha2 = OURO;
  const dotSize = Math.round(tamanhoNome * 0.11);
  const dotTop  = Math.round(tamanhoNome * 0.12);

  const letras = 'SIMIDNAPE'.split('');
  const conteudo = letras.map((letra, i) => {
    if (i === 1) {
      return `<span style="position: relative; display: inline-block;">${letra}<span style="position: absolute; top: -${dotTop}px; left: 50%; transform: translateX(-50%); width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${corBolinha1}; display: block;"></span></span>`;
    }
    if (i === 3) {
      return `<span style="position: relative; display: inline-block;">${letra}<span style="position: absolute; top: -${dotTop}px; left: 50%; transform: translateX(-50%); width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${corBolinha2}; display: block;"></span></span>`;
    }
    return letra;
  }).join('');

  return `
    <div style="display: flex; align-items: center; gap: ${gap}px;">
      <img src="${PICAPAU_URL}" alt=""
           style="height: ${alturaPicapau}px; width: auto; display: block; flex-shrink: 0;"
           crossorigin="anonymous" />
      <div style="display: flex; flex-direction: column; line-height: 1;">
        <div style="
          font-family: 'Quicksand', 'Poppins', sans-serif;
          font-weight: 700;
          font-size: ${tamanhoNome}px;
          color: ${AZUL};
          letter-spacing: 7px;
          line-height: 1.05;
        ">${conteudo}</div>
        <div style="
          font-family: 'Lora', serif;
          font-style: italic;
          font-weight: 400;
          font-size: ${tamanhoSlogan}px;
          color: ${TEXTO_2};
          margin-top: 10px;
          letter-spacing: 1px;
        ">O Professor Inesquecível</div>
      </div>
    </div>
  `;
}

// ============================================================
// CAPA (inalterada)
// ============================================================
function htmlCapa(cab) {
  const nome   = cab.nome_professor || '—';
  const escola = cab.nome_escola || '—';
  const muni   = cab.municipio || '—';
  const uf     = cab.estado || '—';
  const comp   = cab.componente || '—';
  const ano    = cab.ano || '—';
  const per    = cab.periodo_texto || '—';
  const total  = cab.total_aulas || '—';

  return `
    <div style="
      width: ${CANVAS_W_PX}px;
      min-height: ${CAPA_ALTURA_PX}px;
      background: ${CREME};
      font-family: 'Inter', Arial, sans-serif;
      color: ${TEXTO};
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    ">
      <div style="display: flex; height: 14px; width: 100%; flex-shrink: 0;">
        <div style="flex: 3; background: ${AZUL};"></div>
        <div style="flex: 2; background: ${VERDE};"></div>
        <div style="flex: 2; background: ${PESSEGO};"></div>
        <div style="flex: 1; background: ${CORAL};"></div>
      </div>

      <div style="position: absolute; top: 170px; right: -100px; width: 340px; height: 340px; border-radius: 50%; background: ${AZUL_CLARO}; opacity: 0.5;"></div>
      <div style="position: absolute; bottom: 110px; left: -90px; width: 260px; height: 260px; border-radius: 50%; background: ${PESSEGO_CLARO}; opacity: 0.7;"></div>

      <div style="
        position: relative;
        z-index: 1;
        padding: 55px 70px 55px;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: ${CAPA_ALTURA_PX - 14}px;
        box-sizing: border-box;
      ">
        <div>
          ${htmlLogo({ tamanhoNome: F_LOGO, tamanhoSlogan: F_SLOGAN, alturaPicapau: 120 })}
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <div style="
            display: inline-block;
            background: ${OURO_CLARO};
            color: ${OURO};
            font-family: 'Quicksand', sans-serif;
            font-size: ${F_COVER_BADGE}px;
            font-weight: 700;
            letter-spacing: 6px;
            padding: 12px 30px;
            border-radius: 999px;
            margin-bottom: 32px;
            text-transform: uppercase;
          ">
            Planejamento Pedagógico
          </div>
          <div style="
            font-family: 'Lora', serif;
            font-weight: 400;
            font-size: ${F_COVER_TIT}px;
            color: ${AZUL};
            line-height: 1.25;
            max-width: 1150px;
            margin: 0 auto;
          ">
            ${escapeHtml(cab.titulo || 'Sem título')}
          </div>
        </div>

        <div style="
          background: ${BRANCO};
          border-radius: 16px;
          padding: 34px 46px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px 60px;
          font-size: ${F_COVER_CARD}px;
          color: ${TEXTO};
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid ${BORDA};
        ">
          <div><span style="color: ${TEXTO_2};">Professor(a):</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(nome)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Componente:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(comp)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Escola:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(escola)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Ano/Série:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(ano)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Município:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(muni)} - ${escapeHtml(uf)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Período:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(per)}</strong></div>
          <div></div>
          <div><span style="color: ${TEXTO_2};">Total de aulas:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(String(total))}</strong></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// CABEÇALHO DO PLANO (inalterado)
// ============================================================
function htmlMicroCabecalho(sd) {
  const cab = sd.cabecalho || {};
  return `
    <div style="
      width: ${CANVAS_W_PX}px; box-sizing: border-box;
      padding: 0 40px;
      font-family: 'Inter', Arial, sans-serif;
    ">
      <div style="
        background: ${AZUL_CLARO};
        border-radius: 14px;
        padding: 30px 36px;
        border-left: 7px solid ${AZUL};
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; letter-spacing: 5px; color: ${AZUL}; text-transform: uppercase;">
            PLANEJADOR SIMIDNAPE
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: ${F_LABEL_SM}px; color: ${TEXTO_2};">simidnape.com.br</div>
        </div>
        <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_SEC}px; color: ${AZUL}; margin-bottom: 16px; line-height: 1.25;">
          ${escapeHtml(cab.titulo || '')}
        </div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.65;">
          ${cab.nome_professor ? `<strong style="color:${TEXTO};">Professor(a):</strong> ${escapeHtml(cab.nome_professor)}` : ''}
          ${cab.nome_escola ? ` · <strong style="color:${TEXTO};">Escola:</strong> ${escapeHtml(cab.nome_escola)}` : ''}
          ${cab.municipio ? ` · <strong style="color:${TEXTO};">Município:</strong> ${escapeHtml(cab.municipio)}` : ''}
          ${cab.estado ? ` - ${escapeHtml(cab.estado)}` : ''}
        </div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; margin-top: 6px;">
          <strong style="color:${TEXTO};">Componente:</strong> ${escapeHtml(cab.componente || '')} · 
          <strong style="color:${TEXTO};">Ano:</strong> ${escapeHtml(cab.ano || '')} · 
          <strong style="color:${TEXTO};">Período:</strong> ${escapeHtml(cab.periodo_texto || '')} · 
          <strong style="color:${TEXTO};">Total de aulas:</strong> ${escapeHtml(String(cab.total_aulas || ''))}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// MACRO — nova ordem:
//   1. Estruturação Curricular (habilidades BNCC + descritores)
//   2. Objetivos (absorve justificativa)
//   3. Progressão Cognitiva (era logica_pedagogica)
// ============================================================
function htmlMicroMacro(sd) {
  const blocos = [];

  // -------- 1. ESTRUTURAÇÃO CURRICULAR --------
  const habilidades = sd.habilidades || [];
  const descritores = sd.descritores_detalhados || [];
  const temEstrutura = habilidades.length > 0 || descritores.length > 0;

  if (temEstrutura) {
    const htmlHabilidades = habilidades.length > 0 ? `
      <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 14px;">
        🎯 Habilidades BNCC
      </div>
      ${habilidades.map(h => `
        <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px;">
          <span style="background: ${AZUL_CLARO}; color: ${AZUL}; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: ${F_CHIP}px; border: 1px solid ${AZUL};">${escapeHtml(h.codigo)}</span>
          <span style="color: ${TEXTO}; line-height: 1.55; font-size: ${F_BODY}px;">${escapeHtml(h.texto || '')}</span>
        </div>
      `).join('')}
    ` : '';

    const htmlDescritores = descritores.length > 0 ? `
      <div style="margin-top: 22px; padding-top: 20px; border-top: 1px dashed ${BORDA};">
        <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 14px;">
          📊 Descritores SAEB / SAEPI
        </div>
        ${descritores.map(d => `
          <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px;">
            <span style="background: ${PESSEGO_CLARO}; color: ${CORAL}; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: ${F_CHIP}px;">${escapeHtml(d.codigo)}</span>
            ${d.fonte ? `<span style="background: ${OURO_CLARO}; color: ${OURO}; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: ${F_LABEL_SM}px; text-transform: uppercase; flex-shrink: 0; letter-spacing: 0.5px;">${escapeHtml(d.fonte)}</span>` : ''}
            <span style="color: ${TEXTO}; line-height: 1.55; font-size: ${F_BODY}px;">${escapeHtml(d.texto)}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 7px solid ${AZUL}; border-radius: 14px; padding: 30px 36px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_SEC}px; color: ${AZUL}; margin-bottom: 22px; line-height: 1.2;">
            📚 Estruturação Curricular
          </div>
          ${htmlHabilidades}
          ${htmlDescritores}
        </div>
      </div>
    `);
  }

  // -------- 2. OBJETIVOS (absorve justificativa) --------
  if (sd.objetivos_gerais || sd.justificativa) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${VERDE_CLARO}; border-left: 6px solid ${VERDE}; border-radius: 12px; padding: 26px 30px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${VERDE}; margin-bottom: 16px;">
            🎯 Objetivos do Período
          </div>
          ${sd.justificativa ? `
            <div style="background: ${BRANCO}; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.55; font-style: italic;">
              ${escapeHtml(sd.justificativa)}
            </div>
          ` : ''}
          ${sd.objetivos_gerais ? `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 14px; font-weight: 600;">${escapeHtml(sd.objetivos_gerais)}</div>
          ` : ''}
          ${(sd.objetivos_especificos || []).map(o => `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.7; padding-left: 26px; position: relative;">
              <span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">✓</span>${escapeHtml(o)}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  // -------- 3. PROGRESSÃO COGNITIVA (era logica_pedagogica) --------
  const eixos = sd.eixos_predominantes || [];
  if (sd.logica_pedagogica || eixos.length > 0) {
    const htmlEixos = eixos.length > 0 ? `
      <div style="margin-top: 18px; padding-top: 16px; border-top: 1px dashed ${BORDA};">
        <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 12px;">Eixos predominantes</div>
        ${eixos.map(e => `
          <div style="display: flex; gap: 16px; align-items: baseline; margin-bottom: 10px; font-size: ${F_BODY}px;">
            <span style="background: ${BRANCO}; color: ${AZUL}; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: ${F_CHIP}px; font-family: 'JetBrains Mono', monospace; flex-shrink: 0;">${escapeHtml(e.periodo || '')}</span>
            <span style="color: ${TEXTO};">${escapeHtml(e.eixo || '')}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-left: 6px solid ${AZUL}; border-radius: 12px; padding: 26px 30px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 16px;">
            🧭 Progressão Cognitiva do Período
          </div>
          ${sd.logica_pedagogica ? `
            <div style="font-family: 'Lora', serif; font-style: italic; font-size: ${F_BODY}px; color: ${AZUL}; line-height: 1.55;">${escapeHtml(sd.logica_pedagogica)}</div>
          ` : ''}
          ${htmlEixos}
        </div>
      </div>
    `);
  }

  return blocos;
}

// ============================================================
// NORMALIZA METODOLOGIA (fallback p/ planos antigos)
// ============================================================
function normalizarMetodologia(metodologia, duracaoTotal) {
  // Novo formato (objeto)
  if (metodologia && typeof metodologia === 'object' && !Array.isArray(metodologia)) {
    return {
      introducao: metodologia.introducao || null,
      desenvolvimento: metodologia.desenvolvimento || null,
      fechamento: metodologia.fechamento || null,
    };
  }
  // Formato antigo (string)
  if (typeof metodologia === 'string' && metodologia.trim()) {
    return {
      introducao: null,
      desenvolvimento: {
        duracao_minutos: duracaoTotal || 0,
        estrategia: '',
        passos: [metodologia],
      },
      fechamento: null,
    };
  }
  return { introducao: null, desenvolvimento: null, fechamento: null };
}

// ============================================================
// UMA AULA — nova estrutura (8 seções)
// ============================================================
function htmlMicroAula(aula, index, sd) {
  const blocos = [];

  // Mapa de descritores por código normalizado
  const mapaDescritores = {};
  (sd.descritores_detalhados || []).forEach(d => {
    const chave = normalizarCodigo(d.codigo);
    if (chave) mapaDescritores[chave] = d;
  });

  const descritoresDaAula = (aula.descritores || []).map(codigoOriginal => {
    const chave = normalizarCodigo(codigoOriginal);
    const detalhe = mapaDescritores[chave];
    return detalhe || { codigo: chave || String(codigoOriginal), texto: '', fonte: '' };
  });

  // ==========================
  // SEÇÃO 1 — CABEÇALHO DA AULA
  // ==========================
  const headerBadges = [
    aula.principio_cognitivo ? `<span style="background: ${BRANCO}; color: ${AZUL}; padding: 8px 18px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; border: 1px solid ${BORDA};">🧠 ${escapeHtml(aula.principio_cognitivo)}</span>` : '',
    aula.duracao_minutos ? `<span style="background: ${BRANCO}; color: ${TEXTO_2}; padding: 8px 18px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; border: 1px solid ${BORDA}; font-family: 'JetBrains Mono', monospace;">${aula.duracao_minutos} min</span>` : '',
  ].filter(Boolean).join('');

  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 18px 40px 6px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 7px solid ${AZUL}; border-radius: 14px; padding: 26px 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${CORAL}; letter-spacing: 4px; text-transform: uppercase;">
              ${aula.semana ? 'SEMANA ' + aula.semana + ' · ' : ''}AULA ${aula.numero_aula || index + 1}
            </div>
            <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-top: 10px; line-height: 1.25;">
              ${escapeHtml(aula.titulo || '')}
            </div>
            ${aula.tema ? `
              <div style="font-family: 'Inter', sans-serif; font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; margin-top: 8px; font-style: italic;">
                Tema: ${escapeHtml(aula.tema)}
              </div>
            ` : ''}
          </div>
          <div style="display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;">${headerBadges}</div>
        </div>
      </div>
    </div>
  `);

  // ==========================
  // SEÇÃO 2 — HABILIDADES E DESCRITORES DESTA AULA
  // ==========================
  const habilidade = aula.habilidade_foco || '';
  const foco = aula.foco || '';
  const temHabilidades = habilidade || descritoresDaAula.length > 0;

  if (temHabilidades) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-radius: 12px; padding: 24px 30px; border-left: 6px solid ${AZUL};">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 16px;">
            🎯 Habilidades e descritores desta aula
          </div>
          ${habilidade ? `
            <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px; flex-wrap: wrap;">
              <span style="background: ${BRANCO}; color: ${AZUL}; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: ${F_CHIP}px; border: 1px solid ${AZUL};">${escapeHtml(habilidade)}</span>
              ${foco ? `<span style="background: ${BRANCO}; color: ${TEXTO_2}; padding: 8px 16px; border-radius: 6px; font-size: ${F_LABEL}px; font-weight: 600; border: 1px solid ${BORDA};">${escapeHtml(foco)}</span>` : ''}
            </div>
          ` : ''}
          ${descritoresDaAula.length > 0 ? `
            <div style="margin-top: 12px; padding-top: 14px; border-top: 1px dashed ${BORDA};">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 12px;">Descritores</div>
              ${descritoresDaAula.map(d => `
                <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; font-size: ${F_BODY_SM}px;">
                  <span style="background: ${PESSEGO_CLARO}; color: ${CORAL}; padding: 5px 14px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: ${F_CHIP}px;">${escapeHtml(d.codigo)}</span>
                  ${d.fonte ? `<span style="background: ${OURO_CLARO}; color: ${OURO}; padding: 5px 12px; border-radius: 6px; font-weight: 700; font-size: ${F_LABEL_SM}px; text-transform: uppercase; flex-shrink: 0;">${escapeHtml(d.fonte)}</span>` : ''}
                  <span style="color: ${TEXTO}; line-height: 1.55;">${escapeHtml(d.texto || '—')}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `);
  }

  // ==========================
  // SEÇÃO 3 — OBJETIVO E EVIDÊNCIA
  // ==========================
  const cartao = (titulo, conteudo, cor, corFundo) => conteudo ? `
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${corFundo || BRANCO}; border-left: 5px solid ${cor}; border-radius: 10px; padding: 20px 26px;">
        <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${cor}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">${titulo}</div>
        <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; word-wrap: break-word;">${escapeHtml(conteudo)}</div>
      </div>
    </div>
  ` : '';

  if (aula.objetivo_da_aula || aula.conteudo || aula.evidencia_de_aprendizagem) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${VERDE_CLARO}; border-left: 6px solid ${VERDE}; border-radius: 12px; padding: 22px 28px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 16px;">
            🎯 Objetivo e evidência
          </div>
          ${aula.objetivo_da_aula ? `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 12px;">
              <strong style="color: ${VERDE};">Objetivo:</strong> ${escapeHtml(aula.objetivo_da_aula)}
            </div>
          ` : ''}
          ${aula.conteudo ? `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 12px;">
              <strong style="color: ${AZUL};">Conteúdo:</strong> ${escapeHtml(aula.conteudo)}
            </div>
          ` : ''}
          ${aula.evidencia_de_aprendizagem ? `
            <div style="background: ${BRANCO}; border-radius: 8px; padding: 14px 18px; margin-top: 14px; border: 1px solid ${VERDE};">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">O que observar</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.evidencia_de_aprendizagem)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `);
  }

  // ==========================
  // SEÇÃO 4 — METODOLOGIA EM 3 MOMENTOS
  // ==========================
  const metodo = normalizarMetodologia(aula.metodologia, aula.duracao_minutos);
  const temMetodologia = metodo.introducao || metodo.desenvolvimento || metodo.fechamento;

  if (temMetodologia) {
    // 4.1 — INTRODUÇÃO
    const htmlIntro = metodo.introducao ? `
      <div style="background: ${OURO_CLARO}; border-radius: 12px; padding: 22px 26px; border-left: 5px solid ${OURO}; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${OURO}; text-transform: uppercase; letter-spacing: 2.5px;">
            1 · Introdução / Problematização
          </div>
          ${metodo.introducao.duracao_minutos ? `<span style="background: ${BRANCO}; color: ${OURO}; padding: 5px 14px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${metodo.introducao.duracao_minutos} min</span>` : ''}
        </div>
        ${metodo.introducao.gancho_de_curiosidade ? `
          <div style="background: ${BRANCO}; border-radius: 8px; padding: 14px 18px; margin-bottom: 14px;">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">✨ Gancho de curiosidade</div>
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; font-style: italic;">${escapeHtml(metodo.introducao.gancho_de_curiosidade)}</div>
          </div>
        ` : ''}
        ${(metodo.introducao.passos || []).map((p, i) => `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 30px; position: relative; margin-bottom: 4px;">
            <span style="position: absolute; left: 0; color: ${OURO}; font-weight: 700;">${i + 1}.</span>${escapeHtml(p)}
          </div>
        `).join('')}
      </div>
    ` : '';

    // 4.2 — DESENVOLVIMENTO
    const htmlDesenv = metodo.desenvolvimento ? `
      <div style="background: ${BRANCO}; border-radius: 12px; padding: 22px 26px; border-left: 5px solid ${AZUL}; margin-bottom: 14px; border: 1px solid ${BORDA}; border-left: 5px solid ${AZUL};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px;">
            2 · Desenvolvimento
          </div>
          ${metodo.desenvolvimento.duracao_minutos ? `<span style="background: ${AZUL_CLARO}; color: ${AZUL}; padding: 5px 14px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${metodo.desenvolvimento.duracao_minutos} min</span>` : ''}
        </div>
        ${metodo.desenvolvimento.estrategia ? `
          <div style="background: ${PESSEGO_CLARO}; border-radius: 8px; padding: 14px 18px; margin-bottom: 14px;">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">🎨 Estratégia concreta</div>
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(metodo.desenvolvimento.estrategia)}</div>
          </div>
        ` : ''}
        ${(metodo.desenvolvimento.passos || []).map((p, i) => `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 30px; position: relative; margin-bottom: 4px;">
            <span style="position: absolute; left: 0; color: ${AZUL}; font-weight: 700;">${i + 1}.</span>${escapeHtml(p)}
          </div>
        `).join('')}
      </div>
    ` : '';

    // 4.3 — FECHAMENTO
    const htmlFech = metodo.fechamento ? `
      <div style="background: ${VERDE_CLARO}; border-radius: 12px; padding: 22px 26px; border-left: 5px solid ${VERDE};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 2.5px;">
            3 · Fechamento / Síntese
          </div>
          ${metodo.fechamento.duracao_minutos ? `<span style="background: ${BRANCO}; color: ${VERDE}; padding: 5px 14px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${metodo.fechamento.duracao_minutos} min</span>` : ''}
        </div>
        ${metodo.fechamento.sistematizacao ? `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 12px;">
            <strong style="color: ${VERDE};">Sistematização:</strong> ${escapeHtml(metodo.fechamento.sistematizacao)}
          </div>
        ` : ''}
        ${metodo.fechamento.aplicacao_no_cotidiano ? `
          <div style="background: ${BRANCO}; border-radius: 8px; padding: 14px 18px; margin-bottom: 14px; border: 1px solid ${VERDE};">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">🌍 Aplicação no cotidiano</div>
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; font-style: italic;">${escapeHtml(metodo.fechamento.aplicacao_no_cotidiano)}</div>
          </div>
        ` : ''}
        ${(metodo.fechamento.passos || []).map((p, i) => `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 30px; position: relative; margin-bottom: 4px;">
            <span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">${i + 1}.</span>${escapeHtml(p)}
          </div>
        `).join('')}
      </div>
    ` : '';

    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 16px; padding: 0 4px;">
          👨‍🏫 Metodologia
        </div>
        ${htmlIntro}
        ${htmlDesenv}
        ${htmlFech}
      </div>
    `);
  }

  // ==========================
  // SEÇÃO 5 — RECURSOS
  // ==========================
  if ((aula.recursos || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 10px; padding: 20px 26px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">📦 Recursos didáticos</div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${aula.recursos.map(r => `<span style="background: ${CREME}; color: ${TEXTO}; padding: 8px 16px; border-radius: 999px; font-size: ${F_BODY_SM}px; border: 1px solid ${BORDA};">${escapeHtml(r)}</span>`).join('')}
          </div>
        </div>
      </div>
    `);
  }

  // ==========================
  // SEÇÃO 6 — AVALIAÇÃO E INTERVENÇÕES
  // ==========================
  const temAvaliacao = aula.avaliacao_da_aula || aula.onde_pode_travar || aula.diferenciacao;
  if (temAvaliacao) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 6px solid ${VERDE}; border-radius: 12px; padding: 22px 28px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${VERDE}; margin-bottom: 16px;">
            ✅ Avaliação e intervenções
          </div>
          ${aula.avaliacao_da_aula ? `
            <div style="margin-bottom: 14px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Como avaliar</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.avaliacao_da_aula)}</div>
            </div>
          ` : ''}
          ${aula.onde_pode_travar ? `
            <div style="background: ${OURO_CLARO}; border-radius: 8px; padding: 14px 18px; margin-bottom: 12px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${OURO}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">⚠️ Se o aluno travar</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.onde_pode_travar)}</div>
            </div>
          ` : ''}
          ${aula.diferenciacao ? `
            <div style="background: ${PESSEGO_CLARO}; border-radius: 8px; padding: 14px 18px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">🎚️ Diferenciação</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.diferenciacao)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `);
  }

  // ==========================
  // SEÇÃO 7 — NOTA PEDAGÓGICA (leitura relacional discreta)
  // ==========================
  if (aula.leitura_relacional) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="padding: 12px 26px; border-left: 3px solid ${BORDA}; background: ${BRANCO}; border-radius: 6px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">💭 Nota pedagógica</div>
          <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.6; font-style: italic;">${escapeHtml(aula.leitura_relacional)}</div>
        </div>
      </div>
    `);
  }

  // ==========================
  // SEÇÃO 8 — REFLEXÃO PÓS-AULA (espaço em branco)
  // ==========================
  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 40px 14px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1.5px dashed ${BORDA}; border-radius: 12px; padding: 22px 28px;">
        <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">📝 Reflexão pós-aula</div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.5; margin-bottom: 18px; font-style: italic;">
          Espaço reservado para o professor registrar, após a aula, o que funcionou bem e o que precisa ser ajustado.
        </div>
        ${aula.reflexao_pos_aula ? `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.reflexao_pos_aula)}</div>
        ` : `
          <div style="height: 60px;"></div>
          <div style="height: 60px;"></div>
          <div style="height: 60px; border-bottom: 1px solid ${BORDA};"></div>
        `}
      </div>
    </div>
  `);

  return blocos.filter(Boolean);
}

// ============================================================
// FINAL — nova ordem:
//   1. Avaliação geral
//   2. Adaptações inclusivas
//   3. Reflexão pós-período (novo)
// (considerações finais saíram do PDF — ficam só no painel)
// ============================================================
function htmlMicroFinal(sd) {
  const blocos = [];
  const aval = sd.avaliacao_geral || {};

  // 1. AVALIAÇÃO GERAL
  if (aval.instrumentos?.length || aval.indicadores_de_sucesso?.length || aval.como_acompanhar) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 14px; padding: 30px 36px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 18px;">📊 Avaliação geral do período</div>
          ${(aval.instrumentos || []).length > 0 ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 10px;">Instrumentos</div>
            ${aval.instrumentos.map(x => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${(aval.indicadores_de_sucesso || []).length > 0 ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin: 20px 0 10px;">Indicadores de sucesso</div>
            ${aval.indicadores_de_sucesso.map(x => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${aval.como_acompanhar ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin: 20px 0 10px;">Como acompanhar</div>
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65;">${escapeHtml(aval.como_acompanhar)}</div>
          ` : ''}
        </div>
      </div>
    `);
  }

  // 2. ADAPTAÇÕES INCLUSIVAS
  if ((sd.adaptacoes_inclusivas || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-radius: 14px; padding: 30px 36px; border-left: 7px solid ${AZUL};">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 18px;">🧩 Adaptações inclusivas</div>
          ${sd.adaptacoes_inclusivas.map(a => `
            <div style="margin-bottom: 18px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_BODY}px; font-weight: 700; color: ${AZUL}; margin-bottom: 10px;">${escapeHtml(a.necessidade || '')}</div>
              ${(a.estrategias || []).map(e => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${AZUL}; font-weight: 700;">•</span>${escapeHtml(e)}</div>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  // 3. REFLEXÃO PÓS-PERÍODO (novo — sempre presente, vazio ou preenchido)
  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px 14px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1.5px dashed ${BORDA}; border-radius: 14px; padding: 30px 36px;">
        <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 6px;">📝 Reflexão pós-período</div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.55; margin-bottom: 22px; font-style: italic;">
          Espaço reservado para o professor registrar, após o período, o que funcionou bem, o que precisa ser ajustado e o que levará para o próximo planejamento.
        </div>
        ${sd.reflexao_pos_periodo ? `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(sd.reflexao_pos_periodo)}</div>
        ` : `
          <div style="height: 70px;"></div>
          <div style="height: 70px;"></div>
          <div style="height: 70px; border-bottom: 1px solid ${BORDA};"></div>
        `}
      </div>
    </div>
  `);

  return blocos;
}

// ============================================================
// RODAPÉ (inalterado)
// ============================================================
function desenharRodape(pdf, numPagina) {
  pdf.setFontSize(9);
  pdf.setTextColor(155, 145, 130);
  pdf.text('SIMIDNAPE · O Professor Inesquecível · simidnape.com.br', MARGEM, PDF_H - 4);
  pdf.text(`Página ${numPagina}`, PDF_W - MARGEM, PDF_H - 4, { align: 'right' });
}

// ============================================================
// FUNÇÃO PRINCIPAL (inalterada, só ordem dos micro-blocos)
// ============================================================
export async function gerarPdfPlanejamento(plano) {
  if (!plano || !plano.structured_data) {
    throw new Error('Plano inválido.');
  }

  const sd = plano.structured_data;
  const cab = sd.cabecalho || {};

  await preloadImage(PICAPAU_URL);

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // 1. CAPA
  const canvasCapa = await renderizarBloco(htmlCapa(cab), { alturaMinimaPx: CAPA_ALTURA_PX });
  const capaRatio = CONTENT_W_MM / canvasCapa.width;
  const capaAlturaMM = Math.min(canvasCapa.height * capaRatio, CONTENT_H_MM);
  pdf.addImage(canvasCapa.toDataURL('image/jpeg', 0.95), 'JPEG', MARGEM, MARGEM, CONTENT_W_MM, capaAlturaMM);

  // 2. Micro-blocos
  const micros = [];
  micros.push(htmlMicroCabecalho(sd));
  micros.push(...htmlMicroMacro(sd));
  (sd.sequencia_didatica || []).forEach((aula, i) => {
    micros.push(...htmlMicroAula(aula, i, sd));
  });
  micros.push(...htmlMicroFinal(sd));

  // 3. Página 2 em diante
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