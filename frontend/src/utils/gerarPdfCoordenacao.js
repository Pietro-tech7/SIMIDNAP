import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// ============================================================
// LAYOUT — A4 PAISAGEM (igual ao planejamento)
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
// PALETA SUAVE (igual ao planejamento)
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
// FONTES (igual ao planejamento)
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
    if ('codigo' in valor || 'texto' in valor) {
      const c = valor.codigo || '';
      const t = valor.texto || '';
      return c && t ? `${c} — ${t}` : (c || t || '');
    }
    if ('nome' in valor || 'uso' in valor) {
      const n = valor.nome || '';
      const u = valor.uso || '';
      return n && u ? `${n} — ${u}` : (n || u || '');
    }
    const vals = Object.values(valor)
      .map(v => stringificar(v))
      .filter(Boolean);
    if (vals.length > 0) return vals.join(' — ');
    try {
      const j = JSON.stringify(valor);
      return j.length > 200 ? j.substring(0, 200) + '...' : j;
    } catch {
      return '';
    }
  }

  return String(valor);
}

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

function sanitizarTexto(valor) {
  let str = stringificar(valor);
  if (!str) return '';
  str = str.replace(/(.)\1{14,}/g, '$1$1$1...');
  str = str.replace(/\S{100,}/g, (match) => match.substring(0, 100) + '...');
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
  return (texto || 'coordenacao')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 60) || 'coordenacao';
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
// LOGO
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
// MAPEAMENTO TIPO DE AÇÃO
// ============================================================
const TIPO_ACAO_NOMES = {
  formacao: 'Plano de Formação Continuada',
  acompanhamento: 'Plano de Acompanhamento Docente',
  intervencao: 'Plano de Intervenção Pedagógica',
  acao_pedagogica: 'Plano de Ação Pedagógica',
  indicadores: 'Análise de Indicadores Educacionais',
  reuniao: 'Reunião / Conselho de Classe',
};

function nomeTipoAcao(tipo) {
  return TIPO_ACAO_NOMES[tipo] || (tipo ? tipo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Coordenação');
}

// ============================================================
// CAPA
// ============================================================
function htmlCapa(cab) {
  const nome    = sanitizarTexto(cab.nome_professor) || '—';
  const escola  = sanitizarTexto(cab.nome_escola) || '—';
  const muni    = sanitizarTexto(cab.municipio) || '—';
  const uf      = sanitizarTexto(cab.estado) || '—';
  const tipo    = nomeTipoAcao(cab.tipo_acao);
  const publico = sanitizarTexto(cab.publico_alvo) || '—';
  const per     = sanitizarTexto(cab.periodo_texto) || '—';
  const total   = sanitizarTexto(cab.total_aulas) || '—';

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
        <div style="flex: 3; background: ${VERDE};"></div>
        <div style="flex: 2; background: ${AZUL};"></div>
        <div style="flex: 2; background: ${PESSEGO};"></div>
        <div style="flex: 1; background: ${CORAL};"></div>
      </div>

      <div style="position: absolute; top: 170px; right: -100px; width: 340px; height: 340px; border-radius: 50%; background: ${VERDE_CLARO}; opacity: 0.6;"></div>
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
            background: ${VERDE_CLARO};
            color: ${VERDE};
            font-family: 'Quicksand', sans-serif;
            font-size: ${F_COVER_BADGE}px;
            font-weight: 700;
            letter-spacing: 6px;
            padding: 12px 30px;
            border-radius: 999px;
            margin-bottom: 32px;
            text-transform: uppercase;
          ">
            Coordenação Pedagógica
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
          <div style="
            font-family: 'Inter', sans-serif;
            font-size: ${F_BODY_SM}px;
            color: ${VERDE};
            margin-top: 16px;
            font-weight: 600;
          ">
            ${escapeHtml(tipo)}
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
          <div><span style="color: ${TEXTO_2};">Coordenador(a):</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(nome)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Escola:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(escola)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Município:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(muni)} - ${escapeHtml(uf)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Período:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(per)}</strong></div>
          <div style="grid-column: 1 / -1;"><span style="color: ${TEXTO_2};">Público-alvo:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(publico)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Total de ações:</span> <strong style="color: ${TEXTO}; font-weight: 700;">${escapeHtml(total)}</strong></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// CABEÇALHO
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
        background: ${VERDE_CLARO};
        border-radius: 14px;
        padding: 26px 32px;
        border-left: 7px solid ${VERDE};
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; letter-spacing: 5px; color: ${VERDE}; text-transform: uppercase;">
            COORDENAÇÃO SIMIDNAPE
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: ${F_LABEL_SM}px; color: ${TEXTO_2};">simidnape.com.br</div>
        </div>
        <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_SEC}px; color: ${AZUL}; margin-bottom: 14px; line-height: 1.25;">
          ${escapeHtml(cab.titulo || '')}
        </div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.6;">
          ${cab.nome_professor ? `<strong style="color:${TEXTO};">Coordenador(a):</strong> ${escapeHtml(cab.nome_professor)}` : ''}
          ${cab.nome_escola ? ` · <strong style="color:${TEXTO};">Escola:</strong> ${escapeHtml(cab.nome_escola)}` : ''}
          ${cab.municipio ? ` · <strong style="color:${TEXTO};">Município:</strong> ${escapeHtml(cab.municipio)}` : ''}
          ${cab.estado ? ` - ${escapeHtml(cab.estado)}` : ''}
        </div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; margin-top: 6px;">
          <strong style="color:${TEXTO};">Tipo de ação:</strong> ${escapeHtml(cab.tipo_acao_nome || nomeTipoAcao(cab.tipo_acao))} · 
          <strong style="color:${TEXTO};">Período:</strong> ${escapeHtml(cab.periodo_texto || '')} · 
          <strong style="color:${TEXTO};">Total de ações:</strong> ${escapeHtml(cab.total_aulas || '')}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// CONTEXTO + OBJETIVOS
// ============================================================
function htmlMicroMacro(sd) {
  const blocos = [];

  if (sd.contexto) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-left: 6px solid ${AZUL}; border-radius: 12px; padding: 22px 26px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 14px;">
            Contexto (diagnóstico)
          </div>
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">
            ${escapeHtml(sd.contexto)}
          </div>
        </div>
      </div>
    `);
  }

  const obj = sd.objetivos || {};
  if (obj.geral || (obj.especificos || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${VERDE_CLARO}; border-left: 6px solid ${VERDE}; border-radius: 12px; padding: 22px 26px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${VERDE}; margin-bottom: 14px;">
            Objetivos da Ação
          </div>
          ${obj.geral ? `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; margin-bottom: 12px; font-weight: 600;">${escapeHtml(obj.geral)}</div>
          ` : ''}
          ${(obj.especificos || []).map(o => `
            <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;">
              <span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">✓</span>${escapeHtml(o)}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  return blocos;
}

// ============================================================
// UMA AÇÃO — 8 seções
// ============================================================
function htmlMicroAcao(acao, index) {
  const blocos = [];

  const numero = acao.numero || index + 1;
  const titulo = sanitizarTexto(acao.titulo) || `Ação ${numero}`;
  const tema = sanitizarTexto(acao.tema);

  // SEÇÃO 1 — CABEÇALHO DA AÇÃO
  const badges = [
    acao.prazo ? `<span style="background: ${BRANCO}; color: ${TEXTO_2}; padding: 8px 18px; border-radius: 999px; font-size: ${F_LABEL}px; font-weight: 700; border: 1px solid ${BORDA}; font-family: 'JetBrains Mono', monospace;">${escapeHtml(acao.prazo)}</span>` : '',
  ].filter(Boolean).join('');

  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 16px 40px 4px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 7px solid ${VERDE}; border-radius: 14px; padding: 24px 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${VERDE}; letter-spacing: 4px; text-transform: uppercase;">
              AÇÃO ${numero}
            </div>
            <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-top: 10px; line-height: 1.25;">
              ${escapeHtml(titulo)}
            </div>
            ${tema ? `
              <div style="font-family: 'Inter', sans-serif; font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; margin-top: 8px; font-style: italic;">
                Tema: ${escapeHtml(tema)}
              </div>
            ` : ''}
            ${acao.responsavel ? `
              <div style="font-family: 'Inter', sans-serif; font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; margin-top: 6px;">
                <strong style="color: ${TEXTO};">Responsável:</strong> ${escapeHtml(acao.responsavel)}
              </div>
            ` : ''}
          </div>
          <div style="display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;">${badges}</div>
        </div>
      </div>
    </div>
  `);

  // SEÇÃO 2 — DESCRIÇÃO
  if (acao.descricao) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-radius: 12px; padding: 20px 26px; border-left: 6px solid ${AZUL};">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${AZUL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 12px;">
            Descrição da Ação
          </div>
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">
            ${escapeHtml(acao.descricao)}
          </div>
        </div>
      </div>
    `);
  }

  // SEÇÃO 3 — RECURSOS
  const recursos = (acao.recursos || []).map(separarRecurso).filter(r => r.nome);
  if (recursos.length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 10px; padding: 18px 24px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Recursos</div>
          ${recursos.map(r => `
            <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px;">
              <span style="background: ${CREME}; color: ${TEXTO}; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: ${F_BODY_SM}px; border: 1px solid ${BORDA}; flex-shrink: 0;">${escapeHtml(r.nome)}</span>
              ${r.uso ? `<span style="color: ${TEXTO_2}; line-height: 1.55; font-size: ${F_BODY_SM}px; padding-top: 4px;">${escapeHtml(r.uso)}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  // SEÇÃO 4 — PRINCÍPIO PEDAGÓGICO + COMO AVALIAR
  if (acao.principio_pedagogico || acao.como_avaliar) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${VERDE_CLARO}; border-left: 6px solid ${VERDE}; border-radius: 12px; padding: 20px 26px;">
          ${acao.principio_pedagogico ? `
            <div style="margin-bottom: 12px;">
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Fundamento pedagógico</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; font-weight: 600;">${escapeHtml(acao.principio_pedagogico)}</div>
            </div>
          ` : ''}
          ${acao.como_avaliar ? `
            <div>
              <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Como avaliar</div>
              <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(acao.como_avaliar)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `);
  }

  // SEÇÃO 5 — ONDE PODE RESISTIR
  if (acao.onde_pode_resistir) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${OURO_CLARO}; border-radius: 12px; padding: 18px 24px; border-left: 5px solid ${OURO};">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${OURO}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 10px;">
            Onde pode resistir
          </div>
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(acao.onde_pode_resistir)}</div>
        </div>
      </div>
    `);
  }

  // SEÇÃO 6 — MOMENTO DE ENCANTAMENTO
  if (acao.momento_de_encantamento) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${PESSEGO_CLARO}; border-radius: 12px; padding: 18px 24px; border-left: 5px solid ${CORAL};">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${CORAL}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 10px;">
            Momento de encantamento
          </div>
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6; font-style: italic;">${escapeHtml(acao.momento_de_encantamento)}</div>
        </div>
      </div>
    `);
  }

  // SEÇÃO 7 — RESULTADO VISÍVEL
  if (acao.resultado_visivel) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 5px solid ${VERDE}; border-radius: 12px; padding: 18px 24px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${VERDE}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 10px;">
            Resultado visível
          </div>
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(acao.resultado_visivel)}</div>
        </div>
      </div>
    `);
  }

  // SEÇÃO 8 — NOTA PEDAGÓGICA (leitura relacional)
  if (acao.leitura_relacional) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="padding: 10px 24px; border-left: 3px solid ${BORDA}; background: ${BRANCO}; border-radius: 6px;">
          <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL_SM}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Nota pedagógica</div>
          <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.6; font-style: italic;">${escapeHtml(acao.leitura_relacional)}</div>
        </div>
      </div>
    `);
  }

  // SEÇÃO 9 — REFLEXÃO PÓS-ENCONTRO
  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 4px 40px 12px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1.5px dashed ${BORDA}; border-radius: 12px; padding: 18px 24px;">
        <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Reflexão pós-encontro</div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.5; margin-bottom: 16px; font-style: italic;">
          Espaço reservado para o coordenador registrar, após o encontro, o que funcionou bem e o que precisa ser ajustado.
        </div>
        ${acao.reflexao_pos_encontro ? `
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.6;">${escapeHtml(acao.reflexao_pos_encontro)}</div>
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
// FINAL — Cronograma + Avaliação + Reflexão pós-período
// ============================================================
function htmlMicroFinal(sd) {
  const blocos = [];

  // CRONOGRAMA
  if ((sd.cronograma || []).length > 0) {
    const linhas = sd.cronograma.map(c => `
      <tr>
        <td style="padding: 12px 16px; font-size: ${F_BODY_SM}px; color: ${TEXTO}; border-bottom: 1px solid ${BORDA};">${escapeHtml(c.periodo || '')}</td>
        <td style="padding: 12px 16px; font-size: ${F_BODY_SM}px; color: ${TEXTO}; border-bottom: 1px solid ${BORDA};">${escapeHtml(c.acao || '')}</td>
        <td style="padding: 12px 16px; font-size: ${F_BODY_SM}px; color: ${TEXTO}; border-bottom: 1px solid ${BORDA};">${escapeHtml(c.responsavel || '')}</td>
      </tr>
    `).join('');

    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 14px; padding: 26px 32px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 18px;">
            Cronograma
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: ${AZUL_CLARO};">
                <th style="padding: 12px 16px; text-align: left; font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; color: ${AZUL}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid ${AZUL};">Período</th>
                <th style="padding: 12px 16px; text-align: left; font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; color: ${AZUL}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid ${AZUL};">Ação</th>
                <th style="padding: 12px 16px; text-align: left; font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; color: ${AZUL}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid ${AZUL};">Responsável</th>
              </tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>
        </div>
      </div>
    `);
  }

  // AVALIAÇÃO
  const aval = sd.avaliacao || {};
  const temAval = (aval.instrumentos || []).length > 0 || (aval.indicadores || []).length > 0 || (aval.como_registrar_evidencias || []).length > 0;
  if (temAval) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 14px; padding: 26px 32px;">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 16px;">
            Avaliação da Ação
          </div>
          ${(aval.instrumentos || []).length > 0 ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 8px;">Instrumentos</div>
            ${aval.instrumentos.map(x => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${(aval.indicadores || []).length > 0 ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin: 16px 0 8px;">Indicadores</div>
            ${aval.indicadores.map(x => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${(aval.como_registrar_evidencias || []).length > 0 ? `
            <div style="font-family: 'Quicksand', sans-serif; font-size: ${F_LABEL}px; font-weight: 700; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 2.5px; margin: 16px 0 8px;">Como registrar evidências</div>
            ${aval.como_registrar_evidencias.map(x => `<div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65; padding-left: 26px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
        </div>
      </div>
    `);
  }

  // CONSIDERAÇÕES FINAIS (opcional)
  if (sd.consideracoes_finais) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${PESSEGO_CLARO}; border-radius: 14px; padding: 26px 32px; border-left: 7px solid ${CORAL};">
          <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${CORAL}; margin-bottom: 14px;">
            Considerações finais
          </div>
          <div style="font-size: ${F_BODY}px; color: ${TEXTO}; line-height: 1.65;">${escapeHtml(sd.consideracoes_finais)}</div>
        </div>
      </div>
    `);
  }

  // REFLEXÃO PÓS-PERÍODO
  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 8px 40px 12px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1.5px dashed ${BORDA}; border-radius: 14px; padding: 26px 32px;">
        <div style="font-family: 'Lora', serif; font-size: ${F_TITULO_AULA}px; color: ${AZUL}; margin-bottom: 4px;">Reflexão pós-período</div>
        <div style="font-size: ${F_BODY_SM}px; color: ${TEXTO_2}; line-height: 1.55; margin-bottom: 20px; font-style: italic;">
          Espaço reservado para o coordenador registrar, após o período, o que funcionou bem, o que precisa ser ajustado e o que levará para a próxima ação.
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
export async function gerarPdfCoordenacao(plano) {
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
  (sd.acoes || []).forEach((acao, i) => {
    micros.push(...htmlMicroAcao(acao, i));
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
  pdf.save(`${slug(cab.titulo)}_COORDENACAO.pdf`);
}

export default gerarPdfCoordenacao;