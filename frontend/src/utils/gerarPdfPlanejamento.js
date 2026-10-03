import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// ============================================================
// LAYOUT — A4 PAISAGEM
// ============================================================
const PDF_W = 297;
const PDF_H = 210;
const MARGEM = 15;
const RODAPE_ALTURA = 10;
const GAP = 2.5;
const CONTENT_W_MM = PDF_W - MARGEM * 2;
const CONTENT_H_MM = PDF_H - MARGEM - RODAPE_ALTURA - 2;
const CANVAS_W_PX = 1600;
const CAPA_ALTURA_PX = 1096;
const PICAPAU_URL = '/icons/comparacao/simidnape-picapau.svg';

// ============================================================
// PALETA
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
// FONTES
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
// HELPERS — LIMPEZA E EXTRAÇÃO ROBUSTA
// ============================================================

/**
 * FUNÇÃO UNIVERSAL DE STRINGIFICAÇÃO
 * Trata QUALQUER formato: string, número, array, objeto {codigo, texto},
 * objeto {nome, uso}, objeto desconhecido, null, undefined.
 * NUNCA retorna "[object Object]".
 */
function stringificar(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);

  if (Array.isArray(valor)) {
    return valor
      .map(v => stringificar(v))
      .filter(Boolean)
      .join(' · ');
  }

  if (typeof valor === 'object') {
    // Formato {codigo, texto} (habilidade)
    if ('codigo' in valor || 'texto' in valor) {
      const c = valor.codigo || '';
      const t = valor.texto || '';
      return c && t ? `${c} — ${t}` : (c || t || '');
    }
    // Formato {nome, uso} (recurso)
    if ('nome' in valor || 'uso' in valor) {
      const n = valor.nome || '';
      const u = valor.uso || '';
      return n && u ? `${n} — ${u}` : (n || u || '');
    }
    // Fallback: concatena todos os valores string
    const vals = Object.values(valor)
      .map(v => stringificar(v))
      .filter(Boolean);
    if (vals.length > 0) return vals.join(' — ');
    // Último recurso: JSON (mas limpo)
    try {
      const j = JSON.stringify(valor);
      return j.length > 200 ? j.substring(0, 200) + '...' : j;
    } catch {
      return '';
    }
  }

  return String(valor);
}

/**
 * SEPARA HABILIDADE em { codigo, texto }
 * Aceita: "EF02MA13 — texto", "EF02MA13 - texto", { codigo, texto }, etc.
 */
function separarHabilidade(valor) {
  const str = stringificar(valor).trim();
  if (!str) return { codigo: '', texto: '' };

  // Tenta separar por travessão (—) ou hífen espaçado ( - )
  const match = str.match(/^([A-Z]{2}\d{2}[A-Z]{2}\d{2}|EI\d{2}[A-Z]{2}\d{2}|EF\d{2}[A-Z]{2}\d{2})\s*[—–-]\s*(.+)$/i);
  if (match) {
    return { codigo: match[1].trim(), texto: match[2].trim() };
  }

  // Tenta separar por " — " simples
  if (str.includes(' — ')) {
    const [codigo, ...resto] = str.split(' — ');
    return { codigo: codigo.trim(), texto: resto.join(' — ').trim() };
  }
  if (str.includes(' - ')) {
    const [codigo, ...resto] = str.split(' - ');
    return { codigo: codigo.trim(), texto: resto.join(' - ').trim() };
  }

  // Se for só código, retorna
  return { codigo: str, texto: '' };
}

/**
 * SEPARA RECURSO em { nome, uso }
 */
function separarRecurso(valor) {
  const str = stringificar(valor).trim();
  if (!str) return { nome: '', uso: '' };

  if (str.includes(' — ')) {
    const [nome, ...resto] = str.split(' — ');
    return { nome: nome.trim(), uso: resto.join(' — ').trim() };
  }
  if (str.includes(' - ')) {
    const [nome, ...resto] = str.split(' - ');
    return { nome: nome.trim(), uso: resto.join(' - ').trim() };
  }
  return { nome: str, uso: '' };
}

/**
 * Sanitiza texto: remove lixo/strings corrompidas
 * - Remove sequências de caracteres repetidos absurdos (ex: "iiiiiiiiiii")
 * - Limita tamanho de strings sem espaço
 * - Remove caracteres estranhos
 */
function sanitizarTexto(valor) {
  let str = stringificar(valor);
  if (!str) return '';

  // Remove sequências de 15+ caracteres iguais
  str = str.replace(/(.)\1{14,}/g, '$1$1$1...');

  // Se tem uma palavra gigante (100+ chars sem espaço), corta
  str = str.replace(/\S{100,}/g, (match) => match.substring(0, 100) + '...');

  // Remove caracteres de controle
  str = str.replace(/[\u0000-\u001F\u007F]/g, '');

  return str.trim();
}

function escapeHtml(texto) {
  const limpo = sanitizarTexto(texto);
  if (!limpo) return '';
  return String(limpo)
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
// LOGO SIMIDNAPE
// ============================================================
function htmlLogo(opcoes = {}) {
  const {
    tamanhoNome = F_LOGO,
    tamanhoSlogan = F_SLOGAN,
    alturaPicapau = 120,
    gap = 28,
  } = opcoes;

  const dotSize = Math.round(tamanhoNome * 0.11);
  const dotTop  = Math.round(tamanhoNome * 0.12);

  const letras = 'SIMIDNAPE'.split('');
  const conteudo = letras.map((letra, i) => {
    if (i === 1) {
      return `<span style="position: relative; display: inline-block;">${letra}<span style="position: absolute; top: -${dotTop}px; left: 50%; transform: translateX(-50%); width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${CORAL}; display: block;"></span></span>`;
    }
    if (i === 3) {
      return `<span style="position: relative; display: inline-block;">${letra}<span style="position: absolute; top: -${dotTop}px; left: 50%; transform: translateX(-50%); width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${OURO}; display: block;"></span></span>`;
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
// CAPA
// ============================================================
function htmlCapa(cab) {
  const nome   = sanitizarTexto(cab.nome_professor) || '—';
  const escola = sanitizarTexto(cab.nome_escola) || '—';
  const muni   = sanitizarTexto(cab.municipio) || '—';
  const uf     = sanitizarTexto(cab.estado) || '—';
  const comp   = sanitizarTexto(cab.componente) || '—';
  const ano    = sanitizarTexto(cab.ano) || '—';
  const per    = sanitizarTexto(cab.periodo_texto) || '—';
  const total  = sanitizarTexto(cab.total_aulas) || '—';

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
          <div><span style="color: ${TEXTO_2};">Total de aulas:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(total)}</strong></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// CABEÇALHO DO PLANO
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
        padding: 26px 32px;
        border-left: 7px solid ${AZUL};
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; letter-spacing: 5px; color: ${AZUL}; text-transform: uppercase;">
            PLANEJADOR SIMIDNAPE
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: ${F_LABEL_SM}px; color: ${TEXTO_2};">simidnape.com.br</div>
        </div>
        <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_SEC}px; color: ${AZUL}; margin-bottom: 14px; line-height: 1.25;">
          ${escapeHtml(cab.titulo || '')}
        </div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.6;">
          ${cab.nome_professor ? `<strong style="color:${TEXTO};">Professor(a):</strong> ${escapeHtml(cab.nome_professor)}` : ''}
          ${cab.nome_escola ? ` · <strong style="color:${TEXTO};">Escola:</strong> ${escapeHtml(cab.nome_escola)}` : ''}
          ${cab.municipio ? ` · <strong style="color:${TEXTO};">Município:</strong> ${escapeHtml(cab.municipio)}` : ''}
          ${cab.estado ? ` - ${escapeHtml(cab.estado)}` : ''}
        </div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; margin-top: 6px;">
          <strong style="color:${TEXTO};">Componente:</strong> ${escapeHtml(cab.componente || '')} · 
          <strong style="color:${TEXTO};">Ano:</strong> ${escapeHtml(cab.ano || '')} · 
          <strong style="color:${TEXTO};">Período:</strong> ${escapeHtml(cab.periodo_texto || '')} · 
          <strong style="color:${TEXTO};">Total de aulas:</strong> ${escapeHtml(cab.total_aulas || '')}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// MACRO
// ============================================================
function htmlMicroMacro(sd) {
  const blocos = [];

  const habilidades = sd.habilidades || [];
  const descritores = sd.descritores_detalhados || [];
  const temEstrutura = habilidades.length > 0 || descritores.length > 0;

  if (temEstrutura) {
    const htmlHabilidades = habilidades.length > 0 ? `
      <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 12px;">
        Habilidades BNCC
      </div>
      ${habilidades.map(h => {
        const { codigo, texto } = separarHabilidade(h);
        return `
          <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px;">
            <span style="background: ${AZUL_CLARO}; color: ${AZUL}; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: ${F_CHIP}px; border: 1px solid ${AZUL};">${escapeHtml(codigo)}</span>
            <span style="color: ${TEXTO}; line-height: 1.55; font-size: ${F_BODY}px;">${escapeHtml(texto)}</span>
          </div>
        `;
      }).join('')}
    ` : '';

    const htmlDescritores = descritores.length > 0 ? `
      <div style="margin-top: 18px; padding-top: 16px; border-top: 1px dashed ${BORDA};">
        <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 12px;">
          Descritores SAEB / SAEPI
        </div>
        ${descritores.map(d => `
          <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px;">
            <span style="background: ${PESSEGO_CLARO}; color: ${CORAL}; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: ${F_CHIP}px;">${escapeHtml(d.codigo)}</span>
            ${d.fonte ? `<span style="background: ${OURO_CLARO}; color: ${OURO}; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: ${F_LABEL_SM}px; text-transform: uppercase; flex-shrink: 0; letter-spacing: 0.5px;">${escapeHtml(d.fonte)}</span>` : ''}
            <span style="color: ${TEXTO}; line-height: 1.55; font-size: ${F_BODY}px;">${escapeHtml(d.texto)}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 7px solid ${AZUL}; border-radius: 14px; padding: 26px 32px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_SEC}px; color: ${AZUL}; margin-bottom: 20px; line-height: 1.2;">
            Estruturação Curricular
          </div>
          ${htmlHabilidades}
          ${htmlDescritores}
        </div>
      </div>
    `);
  }

  if (sd.objetivos_gerais || sd.justificativa) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${VERDE_CLARO}; border-left: 6px solid ${VERDE}; border-radius: 12px; padding: 22px 26px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${VERDE}; margin-bottom: 14px;">
            Objetivos do Período
          </div>
          ${sd.justificativa ? `
            <div style="background: ${BRANCO}; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.55; font-style: italic;">
              ${escapeHtml(sd.justificativa)}
            </div>
          ` : ''}
          ${sd.objetivos_gerais ? `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 12px; font-weight: 600;">${escapeHtml(sd.objetivos_gerais)}</div>
          ` : ''}
          ${(sd.objetivos_especificos || []).map(o => `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;">
              <span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">✓</span>${escapeHtml(o)}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  const eixos = sd.eixos_predominantes || [];
  if (sd.logica_pedagogica || eixos.length > 0) {
    const htmlEixos = eixos.length > 0 ? `
      <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed ${BORDA};">
        <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 10px;">Eixos predominantes</div>
        ${eixos.map(e => `
          <div style="display: flex; gap: 16px; align-items: baseline; margin-bottom: 8px; font-size: ${F_BODY}px;">
            <span style="background: ${BRANCO}; color: ${AZUL}; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: ${F_CHIP}px; font-family: 'JetBrains Mono', monospace; flex-shrink: 0;">${escapeHtml(e.periodo || '')}</span>
            <span style="color: ${TEXTO};">${escapeHtml(e.eixo || '')}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-left: 6px solid ${AZUL}; border-radius: 12px; padding: 22px 26px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 14px;">
            Progressão Cognitiva do Período
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
// NORMALIZA METODOLOGIA
// ============================================================
function normalizarMetodologia(metodologia, duracaoTotal) {
  if (metodologia && typeof metodologia === 'object' && !Array.isArray(metodologia)) {
    return {
      introducao: metodologia.introducao || null,
      desenvolvimento: metodologia.desenvolvimento || null,
      fechamento: metodologia.fechamento || null,
    };
  }
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
// UMA AULA
// ============================================================
function htmlMicroAula(aula, index, sd) {
  const blocos = [];

  const mapaDescritores = {};
  (sd.descritores_detalhados || []).forEach(d => {
    const chave = (d.codigo || '').toUpperCase().trim();
    if (chave) mapaDescritores[chave] = d;
  });

  const descritoresDaAula = (aula.descritores || []).map(codigoOriginal => {
    let chave = String(codigoOriginal || '').trim();
    if (chave.includes(':')) chave = chave.split(':').pop();
    chave = chave.toUpperCase().trim();
    return mapaDescritores[chave] || { codigo: chave, texto: '', fonte: '' };
  });

  // SEÇÃO 1 — CABEÇALHO
  const headerBadges = [
    aula.principio_cognitivo ? `<span style="background: ${BRANCO}; color: ${AZUL}; padding: 8px 18px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; border: 1px solid ${BORDA};">${escapeHtml(aula.principio_cognitivo)}</span>` : '',
    aula.duracao_minutos ? `<span style="background: ${BRANCO}; color: ${TEXTO_2}; padding: 8px 18px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; border: 1px solid ${BORDA}; font-family: 'JetBrains Mono', monospace;">${aula.duracao_minutos} min</span>` : '',
  ].filter(Boolean).join('');

  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 16px 40px 4px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 7px solid ${AZUL}; border-radius: 14px; padding: 24px 30px;">
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

  // SEÇÃO 2 — HABILIDADES E DESCRITORES
  const habilidadeSeparada = separarHabilidade(aula.habilidade_foco);
  const foco = sanitizarTexto(aula.foco);
  const temHabilidades = habilidadeSeparada.codigo || descritoresDaAula.length > 0;

  if (temHabilidades) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-radius: 12px; padding: 20px 26px; border-left: 6px solid ${AZUL};">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 14px;">
            Habilidades e descritores desta aula
          </div>
          ${habilidadeSeparada.codigo ? `
            <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap;">
              <span style="background: ${BRANCO}; color: ${AZUL}; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: ${F_CHIP}px; border: 1px solid ${AZUL};">${escapeHtml(habilidadeSeparada.codigo)}</span>
              ${foco ? `<span style="background: ${BRANCO}; color: ${TEXTO_2}; padding: 8px 16px; border-radius: 6px; font-size: ${F_LABEL}px; font-weight: 600; border: 1px solid ${BORDA};">${escapeHtml(foco)}</span>` : ''}
            </div>
            ${habilidadeSeparada.texto ? `
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 12px;">${escapeHtml(habilidadeSeparada.texto)}</div>
            ` : ''}
          ` : ''}
          ${descritoresDaAula.length > 0 ? `
            <div style="margin-top: 10px; padding-top: 12px; border-top: 1px dashed ${BORDA};">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 10px;">Descritores</div>
              ${descritoresDaAula.map(d => `
                <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 8px; font-size: ${F_BODY_SM}px;">
                  <span style="background: ${PESSEGO_CLARO}; color: ${CORAL}; padding: 5px 14px; border-radius: 6px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: ${F_CHIP}px;">${escapeHtml(d.codigo)}</span>
                  ${d.fonte ? `<span style="background: ${OURO_CLARO}; color: ${OURO}; padding: 5px 12px; border-radius: 6px; font-weight: 700; font-size: ${F_LABEL_SM}px; text-transform: uppercase; flex-shrink: 0;">${escapeHtml(d.fonte)}</span>` : ''}
                  <span style="color: ${TEXTO}; line-height: 1.55;">${escapeHtml(d.texto || '')}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `);
  }

  // SEÇÃO 3 — OBJETIVO E EVIDÊNCIA
  if (aula.objetivo_da_aula || aula.conteudo || aula.evidencia_de_aprendizagem) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${VERDE_CLARO}; border-left: 6px solid ${VERDE}; border-radius: 12px; padding: 20px 26px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 14px;">
            Objetivo e evidência
          </div>
          ${aula.objetivo_da_aula ? `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 10px;">
              <strong style="color: ${VERDE};">Objetivo:</strong> ${escapeHtml(aula.objetivo_da_aula)}
            </div>
          ` : ''}
          ${aula.conteudo ? `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 10px;">
              <strong style="color: ${AZUL};">Conteúdo:</strong> ${escapeHtml(aula.conteudo)}
            </div>
          ` : ''}
          ${aula.evidencia_de_aprendizagem ? `
            <div style="background: ${BRANCO}; border-radius: 8px; padding: 12px 16px; margin-top: 12px; border: 1px solid ${VERDE};">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">O que observar</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.evidencia_de_aprendizagem)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `);
  }

  // SEÇÃO 4 — METODOLOGIA
  const metodo = normalizarMetodologia(aula.metodologia, aula.duracao_minutos);

  if (metodo.introducao || metodo.desenvolvimento || metodo.fechamento) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 12px; padding: 0 4px;">
          Metodologia
        </div>
      </div>
    `);
  }

  if (metodo.introducao) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${OURO_CLARO}; border-radius: 12px; padding: 18px 24px; border-left: 5px solid ${OURO};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${OURO}; text-transform: uppercase; letter-spacing: 2.5px;">
              1 · Introdução / Problematização
            </div>
            ${metodo.introducao.duracao_minutos ? `<span style="background: ${BRANCO}; color: ${OURO}; padding: 5px 14px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${metodo.introducao.duracao_minutos} min</span>` : ''}
          </div>
          ${metodo.introducao.gancho_de_curiosidade ? `
            <div style="background: ${BRANCO}; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Gancho de curiosidade</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; font-style: italic;">${escapeHtml(metodo.introducao.gancho_de_curiosidade)}</div>
            </div>
          ` : ''}
          ${(metodo.introducao.passos || []).map((p, i) => `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; padding-left: 30px; position: relative; margin-bottom: 4px;">
              <span style="position: absolute; left: 0; color: ${OURO}; font-weight: 700;">${i + 1}.</span>${escapeHtml(p)}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  if (metodo.desenvolvimento) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border-radius: 12px; padding: 18px 24px; border: 1px solid ${BORDA}; border-left: 5px solid ${AZUL};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px;">
              2 · Desenvolvimento
            </div>
            ${metodo.desenvolvimento.duracao_minutos ? `<span style="background: ${AZUL_CLARO}; color: ${AZUL}; padding: 5px 14px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${metodo.desenvolvimento.duracao_minutos} min</span>` : ''}
          </div>
          ${metodo.desenvolvimento.estrategia ? `
            <div style="background: ${PESSEGO_CLARO}; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Estratégia concreta</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(metodo.desenvolvimento.estrategia)}</div>
            </div>
          ` : ''}
          ${(metodo.desenvolvimento.passos || []).map((p, i) => `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; padding-left: 30px; position: relative; margin-bottom: 4px;">
              <span style="position: absolute; left: 0; color: ${AZUL}; font-weight: 700;">${i + 1}.</span>${escapeHtml(p)}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  if (metodo.fechamento) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${VERDE_CLARO}; border-radius: 12px; padding: 18px 24px; border-left: 5px solid ${VERDE};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 2.5px;">
              3 · Fechamento / Síntese
            </div>
            ${metodo.fechamento.duracao_minutos ? `<span style="background: ${BRANCO}; color: ${VERDE}; padding: 5px 14px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${metodo.fechamento.duracao_minutos} min</span>` : ''}
          </div>
          ${metodo.fechamento.sistematizacao ? `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 10px;">
              <strong style="color: ${VERDE};">Sistematização:</strong> ${escapeHtml(metodo.fechamento.sistematizacao)}
            </div>
          ` : ''}
          ${metodo.fechamento.aplicacao_no_cotidiano ? `
            <div style="background: ${BRANCO}; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; border: 1px solid ${VERDE};">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Aplicação no cotidiano</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; font-style: italic;">${escapeHtml(metodo.fechamento.aplicacao_no_cotidiano)}</div>
            </div>
          ` : ''}
          ${(metodo.fechamento.passos || []).map((p, i) => `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; padding-left: 30px; position: relative; margin-bottom: 4px;">
              <span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">${i + 1}.</span>${escapeHtml(p)}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  // SEÇÃO 5 — RECURSOS DIDÁTICOS
  if ((aula.recursos || []).length > 0) {
    const recursosSeparados = (aula.recursos || [])
      .map(separarRecurso)
      .filter(r => r.nome);

    if (recursosSeparados.length > 0) {
      blocos.push(`
        <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
          <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 10px; padding: 18px 24px;">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Recursos didáticos</div>
            ${recursosSeparados.map(r => `
              <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px;">
                <span style="background: ${CREME}; color: ${TEXTO}; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: ${F_BODY_SM}px; border: 1px solid ${BORDA}; flex-shrink: 0;">${escapeHtml(r.nome)}</span>
                ${r.uso ? `<span style="color: ${TEXTO_2}; line-height: 1.55; font-size: ${F_BODY_SM}px; padding-top: 4px;">${escapeHtml(r.uso)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `);
    }
  }

  // SEÇÃO 6 — AVALIAÇÃO E INTERVENÇÕES
  if (aula.avaliacao_da_aula || aula.onde_pode_travar || aula.diferenciacao) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 6px solid ${VERDE}; border-radius: 12px; padding: 20px 26px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${VERDE}; margin-bottom: 14px;">
            Avaliação e intervenções
          </div>
          ${aula.avaliacao_da_aula ? `
            <div style="margin-bottom: 12px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Como avaliar</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.avaliacao_da_aula)}</div>
            </div>
          ` : ''}
          ${aula.onde_pode_travar ? `
            <div style="background: ${OURO_CLARO}; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${OURO}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Se o aluno travar</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.onde_pode_travar)}</div>
            </div>
          ` : ''}
          ${aula.diferenciacao ? `
            <div style="background: ${PESSEGO_CLARO}; border-radius: 8px; padding: 12px 16px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Diferenciação</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.diferenciacao)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `);
  }

  // SEÇÃO 7 — NOTA PEDAGÓGICA (sem emoji)
  if (aula.leitura_relacional) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="padding: 10px 24px; border-left: 3px solid ${BORDA}; background: ${BRANCO}; border-radius: 6px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Nota pedagógica</div>
          <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.6; font-style: italic;">${escapeHtml(aula.leitura_relacional)}</div>
        </div>
      </div>
    `);
  }

  // SEÇÃO 8 — REFLEXÃO PÓS-AULA
  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px 12px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1.5px dashed ${BORDA}; border-radius: 12px; padding: 18px 24px;">
        <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Reflexão pós-aula</div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.5; margin-bottom: 16px; font-style: italic;">
          Espaço reservado para o professor registrar, após a aula, o que funcionou bem e o que precisa ser ajustado.
        </div>
        ${aula.reflexao_pos_aula ? `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(aula.reflexao_pos_aula)}</div>
        ` : `
          <div style="height: 50px;"></div>
          <div style="height: 50px;"></div>
          <div style="height: 50px; border-bottom: 1px solid ${BORDA};"></div>
        `}
      </div>
    </div>
  `);

  return blocos.filter(Boolean);
}

// ============================================================
// FINAL
// ============================================================
function htmlMicroFinal(sd) {
  const blocos = [];
  const aval = sd.avaliacao_geral || {};

  if (aval.instrumentos?.length || aval.indicadores_de_sucesso?.length || aval.como_acompanhar) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 14px; padding: 26px 32px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 16px;">Avaliação geral do período</div>
          ${(aval.instrumentos || []).length > 0 ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 8px;">Instrumentos</div>
            ${aval.instrumentos.map(x => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${(aval.indicadores_de_sucesso || []).length > 0 ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin: 16px 0 8px;">Indicadores de sucesso</div>
            ${aval.indicadores_de_sucesso.map(x => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${aval.como_acompanhar ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin: 16px 0 8px;">Como acompanhar</div>
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65;">${escapeHtml(aval.como_acompanhar)}</div>
          ` : ''}
        </div>
      </div>
    `);
  }

  if ((sd.adaptacoes_inclusivas || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-radius: 14px; padding: 26px 32px; border-left: 7px solid ${AZUL};">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 16px;">Adaptações inclusivas</div>
          ${sd.adaptacoes_inclusivas.map(a => `
            <div style="margin-bottom: 14px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_BODY}px; font-weight: 700; color: ${AZUL}; margin-bottom: 8px;">${escapeHtml(a.necessidade || '')}</div>
              ${(a.estrategias || []).map(e => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${AZUL}; font-weight: 700;">•</span>${escapeHtml(e)}</div>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px 12px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1.5px dashed ${BORDA}; border-radius: 14px; padding: 26px 32px;">
        <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 4px;">Reflexão pós-período</div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.55; margin-bottom: 20px; font-style: italic;">
          Espaço reservado para o professor registrar, após o período, o que funcionou bem, o que precisa ser ajustado e o que levará para o próximo planejamento.
        </div>
        ${sd.reflexao_pos_periodo ? `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(sd.reflexao_pos_periodo)}</div>
        ` : `
          <div style="height: 60px;"></div>
          <div style="height: 60px;"></div>
          <div style="height: 60px; border-bottom: 1px solid ${BORDA};"></div>
        `}
      </div>
    </div>
  `);

  return blocos;
}

// ============================================================
// RODAPÉ
// ============================================================
function desenharRodape(pdf, numPagina) {
  pdf.setFontSize(9);
  pdf.setTextColor(155, 145, 130);
  pdf.text('SIMIDNAPE · O Professor Inesquecível · simidnape.com.br', MARGEM, PDF_H - 4);
  pdf.text(`Página ${numPagina}`, PDF_W - MARGEM, PDF_H - 4, { align: 'right' });
}

// ============================================================
// FUNÇÃO PRINCIPAL
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