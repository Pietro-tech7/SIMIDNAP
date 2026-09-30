import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// ============================================================
// CONSTANTES DE LAYOUT — A4 PAISAGEM
// ============================================================
const PDF_W = 297;            // mm
const PDF_H = 210;            // mm
const MARGEM = 12;            // mm
const RODAPE_ALTURA = 10;     // mm
const GAP_ENTRE_BLOCOS = 4;   // mm
const CONTENT_W_MM = PDF_W - MARGEM * 2;                       // 273 mm
const CONTENT_H_MM = PDF_H - MARGEM - RODAPE_ALTURA - 2;       // 186 mm
const CANVAS_W_PX = 1600;     // largura lógica do canvas

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
// CARREGAR LOGO SIMIDNAPE COMO BASE64
// Lê /logo-simidnape.png (em public/) e devolve data URL.
// Se o arquivo não existir, devolve string vazia (fallback silencioso).
// ============================================================
async function carregarLogoBase64() {
  try {
    const res = await fetch('/logo-simidnape.png');
    if (!res.ok) return '';
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}


// ============================================================
// RENDERIZAR BLOCO (HTML → Canvas)
// ============================================================
async function renderizarBloco(html) {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; left: -99999px; top: 0;
    width: ${CANVAS_W_PX}px;
    background: #ffffff;
    font-family: Arial, Helvetica, sans-serif;
    color: #0f172a;
    box-sizing: border-box;
  `;
  el.innerHTML = html;
  document.body.appendChild(el);
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
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
// CAPA PREMIUM
// ============================================================
//
// LOGO: quando você tiver o PNG da logo SIMIDNAPE, coloque em
//   frontend/public/logo-simidnape.png
// e substitua o bloco do EMBLEMA CSS abaixo por:
//   <img src="/logo-simidnape.png" style="width: 180px; height: auto; margin: 0 auto 20px;" />
//
function htmlCapa(cab, logoBase64 = '') {
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
      box-sizing: border-box;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%);
      padding: 30px;
    ">
      <!-- Moldura dupla: navy externa + dourada interna -->
      <div style="
        border: 3px solid #1e3a8a;
        border-radius: 18px;
        padding: 6px;
        background: #ffffff;
      ">
        <div style="
          border: 2px solid #d4af37;
          border-radius: 14px;
          padding: 55px 65px;
          background: #ffffff;
        ">
          <!-- Emblema: usa a logo SIMIDNAPE se estiver disponível -->
          <div style="text-align: center; margin-bottom: 22px;">
            ${logoBase64
              ? `<img src="${logoBase64}" alt="SIMIDNAPE" style="width: 260px; height: auto; display: block; margin: 0 auto;" />`
              : `<div style="
                  width: 130px;
                  height: 130px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                  margin: 0 auto;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 4px solid #d4af37;
                  box-shadow: 0 8px 22px rgba(30,58,138,0.22);
                ">
                  <div style="
                    font-family: Georgia, 'Times New Roman', serif;
                    font-size: 68px;
                    font-weight: bold;
                    color: #d4af37;
                    line-height: 1;
                    letter-spacing: -2px;
                  ">S</div>
                </div>`
            }
          </div>

          <!-- Marca -->
          <div style="text-align: center; margin-bottom: 22px;">
            <div style="
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 58px;
              font-weight: bold;
              color: #1e3a8a;
              letter-spacing: 8px;
              line-height: 1;
            ">SIMIDNAPE</div>
            <div style="
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 32px;
              font-weight: bold;
              color: #d4af37;
              letter-spacing: 12px;
              margin-top: 6px;
            ">P R O</div>
            <div style="
              font-family: Georgia, 'Times New Roman', serif;
              font-style: italic;
              font-size: 22px;
              color: #64748b;
              margin-top: 10px;
            ">O Professor Inesquecível</div>
            <div style="
              font-family: monospace;
              font-size: 13px;
              color: #94a3b8;
              margin-top: 6px;
              letter-spacing: 2px;
            ">simidnape.com.br</div>
          </div>

          <!-- Linha dourada separadora -->
          <div style="
            height: 2px;
            background: linear-gradient(to right, transparent, #d4af37, transparent);
            margin: 32px 0;
          "></div>

          <!-- Título do plano -->
          <div style="text-align: center; margin-bottom: 36px;">
            <div style="
              display: inline-block;
              background: #eff6ff;
              color: #1e40af;
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 3px;
              padding: 8px 20px;
              border-radius: 999px;
              margin-bottom: 22px;
              border: 1px solid #bfdbfe;
            ">PLANEJAMENTO PEDAGÓGICO</div>
            <div style="
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 34px;
              font-weight: bold;
              color: #0f172a;
              line-height: 1.3;
              max-width: 900px;
              margin: 0 auto;
            ">${escapeHtml(cab.titulo || 'Sem título')}</div>
          </div>

          <!-- Linha dourada separadora -->
          <div style="
            height: 2px;
            background: linear-gradient(to right, transparent, #d4af37, transparent);
            margin: 0 0 32px;
          "></div>

          <!-- Dados -->
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px 60px;
            font-size: 15px;
            color: #334155;
            padding: 0 20px;
          ">
            <div><strong style="color: #1e3a8a;">Professor(a):</strong> ${escapeHtml(nome)}</div>
            <div><strong style="color: #1e3a8a;">Componente:</strong> ${escapeHtml(comp)}</div>
            <div><strong style="color: #1e3a8a;">Escola:</strong> ${escapeHtml(escola)}</div>
            <div><strong style="color: #1e3a8a;">Ano/Série:</strong> ${escapeHtml(ano)}</div>
            <div><strong style="color: #1e3a8a;">Município:</strong> ${escapeHtml(muni)} - ${escapeHtml(uf)}</div>
            <div><strong style="color: #1e3a8a;">Período:</strong> ${escapeHtml(per)}</div>
            <div></div>
            <div><strong style="color: #1e3a8a;">Total de aulas:</strong> ${escapeHtml(String(total))}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// BLOCO — CABEÇALHO DO PLANO
// ============================================================
function htmlCabecalhoPlano(sd, logoBase64 = '') {
  const cab = sd.cabecalho || {};
  return `
    <div style="
      width: ${CANVAS_W_PX}px;
      box-sizing: border-box;
      padding: 22px 32px;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff;
      border-radius: 12px;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.3);
        padding-bottom: 12px;
        margin-bottom: 14px;
      ">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${logoBase64 ? `<img src="${logoBase64}" alt="SIMIDNAPE" style="height: 42px; width: auto;" />` : ''}
          <div>
            <div style="font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #bfdbfe;">PLANEJADOR SIMIDNAPE</div>
            <div style="font-size: 11px; color: #dbeafe;">O Professor Inesquecível</div>
          </div>
        </div>
        <div style="font-family: monospace; font-size: 12px; color: #bfdbfe;">simidnape.com.br</div>
      </div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px; font-family: Georgia, serif;">${escapeHtml(cab.titulo || '')}</div>
      <div style="font-size: 12px; color: #dbeafe; margin-bottom: 4px;">
        ${cab.nome_professor ? `<strong style="color:#fff;">Professor(a):</strong> ${escapeHtml(cab.nome_professor)}` : ''}
        ${cab.nome_escola ? ` · <strong style="color:#fff;">Escola:</strong> ${escapeHtml(cab.nome_escola)}` : ''}
        ${cab.municipio ? ` · <strong style="color:#fff;">Município:</strong> ${escapeHtml(cab.municipio)}` : ''}
        ${cab.estado ? ` - ${escapeHtml(cab.estado)}` : ''}
      </div>
      <div style="font-size: 12px; color: #dbeafe;">
        <strong style="color:#fff;">Componente:</strong> ${escapeHtml(cab.componente || '')} · 
        <strong style="color:#fff;">Ano:</strong> ${escapeHtml(cab.ano || '')} · 
        <strong style="color:#fff;">Período:</strong> ${escapeHtml(cab.periodo_texto || '')} · 
        <strong style="color:#fff;">Total de aulas:</strong> ${escapeHtml(String(cab.total_aulas || ''))}
      </div>
    </div>
  `;
}

// ============================================================
// BLOCO — MACRO (lógica + eixos + descritores + objetivos + justificativa)
// ============================================================
function htmlBlocoMacro(sd) {
  const partes = [];

  if (sd.logica_pedagogica) {
    partes.push(`
      <div style="background: #eff6ff; border-left: 5px solid #1e40af; padding: 14px 18px; border-radius: 8px; margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Lógica pedagógica do período</div>
        <div style="font-size: 13px; color: #1e3a8a; line-height: 1.6; font-style: italic;">${escapeHtml(sd.logica_pedagogica)}</div>
      </div>
    `);
  }

  if ((sd.eixos_predominantes || []).length > 0) {
    partes.push(`
      <div style="margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Eixos predominantes</div>
        ${sd.eixos_predominantes.map(e => `
          <div style="display: flex; gap: 10px; align-items: baseline; margin-bottom: 4px; font-size: 12px;">
            <span style="background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">${escapeHtml(e.periodo || '')}</span>
            <span style="color: #334155;">${escapeHtml(e.eixo || '')}</span>
          </div>
        `).join('')}
      </div>
    `);
  }

  if ((sd.descritores_detalhados || []).length > 0) {
    partes.push(`
      <div style="margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Descritores trabalhados no período</div>
        ${sd.descritores_detalhados.map(d => `
          <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px; font-size: 12px;">
            <span style="background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-family: monospace; flex-shrink: 0;">${escapeHtml(d.codigo)}</span>
            ${d.fonte ? `<span style="background: #e0e7ff; color: #3730a3; padding: 3px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; text-transform: uppercase; flex-shrink: 0;">${escapeHtml(d.fonte)}</span>` : ''}
            <span style="color: #334155; line-height: 1.5;">${escapeHtml(d.texto)}</span>
          </div>
        `).join('')}
      </div>
    `);
  } else if ((sd.descritores_trabalhados || []).length > 0) {
    partes.push(`
      <div style="margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Descritores trabalhados</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${sd.descritores_trabalhados.map(d => `<span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace;">${escapeHtml(d)}</span>`).join('')}
        </div>
      </div>
    `);
  }

  if (sd.objetivos_gerais) {
    partes.push(`
      <div style="margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Objetivos gerais</div>
        <div style="font-size: 12px; color: #0f172a; line-height: 1.6; margin-bottom: 8px;">${escapeHtml(sd.objetivos_gerais)}</div>
        ${(sd.objetivos_especificos || []).map(o => `
          <div style="font-size: 12px; color: #334155; line-height: 1.6;">✓ ${escapeHtml(o)}</div>
        `).join('')}
      </div>
    `);
  }

  if (sd.justificativa) {
    partes.push(`
      <div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 12px 16px; border-radius: 6px; margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: bold; color: #334155; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Justificativa</div>
        <div style="font-size: 12px; color: #334155; line-height: 1.6;">${escapeHtml(sd.justificativa)}</div>
      </div>
    `);
  }

  if (partes.length === 0) return '';

  return `
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 20px 32px; background: #ffffff;">
      ${partes.join('')}
    </div>
  `;
}

// ============================================================
// BLOCO — UMA AULA
// ============================================================
function htmlBlocoAula(aula, index) {
  const bloco = (titulo, conteudo, cor = '#475569', bg = '#ffffff') => conteudo ? `
    <div style="background: ${bg}; border-left: 3px solid ${cor}; padding: 10px 14px; border-radius: 4px; margin-bottom: 8px;">
      <div style="font-size: 10px; font-weight: bold; color: ${cor}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${titulo}</div>
      <div style="font-size: 12px; color: #1e293b; line-height: 1.55;">${escapeHtml(conteudo)}</div>
    </div>
  ` : '';

  return `
    <div style="
      width: ${CANVAS_W_PX}px;
      box-sizing: border-box;
      padding: 16px 32px;
      background: #ffffff;
    ">
      <div style="
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: #ffffff;
          padding: 12px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 10px; font-weight: bold; color: #bfdbfe; letter-spacing: 1.5px;">
              ${aula.semana ? 'SEMANA ' + aula.semana + ' · ' : ''}AULA ${aula.numero_aula || index + 1}
            </div>
            <div style="font-size: 16px; font-weight: bold; margin-top: 3px;">
              ${escapeHtml(aula.titulo || '')}
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0; margin-left: 14px;">
            ${aula.principio_cognitivo ? `<span style="background: rgba(255,255,255,0.25); color: #fff; padding: 4px 11px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid rgba(255,255,255,0.4); white-space: nowrap;">🧠 ${escapeHtml(aula.principio_cognitivo)}</span>` : ''}
            ${aula.duracao_minutos ? `<span style="background: rgba(255,255,255,0.25); color: #fff; padding: 4px 11px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid rgba(255,255,255,0.4); font-family: monospace; white-space: nowrap;">${aula.duracao_minutos} min</span>` : ''}
          </div>
        </div>

        <!-- Corpo -->
        <div style="padding: 14px 18px;">

          ${aula.pergunta_problematizadora ? `
            <div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 11px 15px; border-radius: 6px; margin-bottom: 10px;">
              <div style="font-size: 10px; font-weight: bold; color: #854d0e; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 5px;">❓ Pergunta problematizadora</div>
              <div style="font-size: 13px; font-weight: 600; color: #713f12; font-style: italic; line-height: 1.5;">"${escapeHtml(aula.pergunta_problematizadora)}"</div>
            </div>
          ` : ''}

          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
            ${aula.habilidade_foco ? `<span style="background: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">🎯 ${escapeHtml(aula.habilidade_foco)}</span>` : ''}
            ${aula.foco ? `<span style="background: #f1f5f9; color: #475569; padding: 3px 10px; border-radius: 4px; font-size: 11px;">📌 ${escapeHtml(aula.foco)}</span>` : ''}
            ${(aula.descritores || []).map(d => `<span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace;">${escapeHtml(d)}</span>`).join('')}
          </div>

          ${bloco('🎯 Objetivo', aula.objetivo_da_aula, '#059669')}
          ${bloco('📖 Conteúdo', aula.conteudo, '#475569')}
          ${bloco('🎨 Estratégia concreta', aula.estrategia, '#7c3aed', '#faf5ff')}
          ${bloco('👨‍🏫 Metodologia', aula.metodologia, '#475569')}

          ${(aula.atividades || []).length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">👥 Atividades dos alunos</div>
              ${aula.atividades.map(a => `<div style="font-size: 12px; color: #334155; line-height: 1.5;">• ${escapeHtml(a)}</div>`).join('')}
            </div>
          ` : ''}

          ${(aula.recursos || []).length > 0 ? bloco('📦 Recursos', (aula.recursos || []).join(' · '), '#475569') : ''}
          ${bloco('✅ Avaliação da aula', aula.avaliacao_da_aula, '#059669', '#ecfdf5')}
          ${bloco('🎯 Evidência de aprendizagem', aula.evidencia_de_aprendizagem, '#0d9488', '#f0fdfa')}
          ${bloco('⚠️ Onde pode travar', aula.onde_pode_travar, '#b45309', '#fffbeb')}
          ${bloco('🎚️ Diferenciação', aula.diferenciacao, '#a21caf', '#fdf4ff')}
          ${bloco('✨ Momento de encantamento', aula.momento_de_encantamento, '#be185d', '#fdf2f8')}
          ${bloco('💭 Leitura relacional', aula.leitura_relacional, '#4338ca', '#eef2ff')}
          ${bloco('🎯 Resultado visível', aula.resultado_visivel, '#059669', '#ecfdf5')}
          ${bloco('🌍 Conexão com a vida', aula.conexao_com_a_vida, '#c2410c', '#fff7ed')}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// BLOCO FINAL (avaliação geral + adaptações + considerações)
// ============================================================
function htmlBlocoFinal(sd) {
  const partes = [];
  const aval = sd.avaliacao_geral || {};

  if (aval.instrumentos?.length || aval.indicadores_de_sucesso?.length || aval.como_acompanhar) {
    partes.push(`
      <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px 20px; margin-bottom: 14px;">
        <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 10px;">📊 Avaliação geral do período</div>
        ${(aval.instrumentos || []).length > 0 ? `
          <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Instrumentos</div>
          ${aval.instrumentos.map(x => `<div style="font-size: 12px; color: #334155; line-height: 1.5;">• ${escapeHtml(x)}</div>`).join('')}
        ` : ''}
        ${(aval.indicadores_de_sucesso || []).length > 0 ? `
          <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 10px 0 4px;">Indicadores de sucesso</div>
          ${aval.indicadores_de_sucesso.map(x => `<div style="font-size: 12px; color: #334155; line-height: 1.5;">• ${escapeHtml(x)}</div>`).join('')}
        ` : ''}
        ${aval.como_acompanhar ? `
          <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 10px 0 4px;">Como acompanhar</div>
          <div style="font-size: 12px; color: #334155; line-height: 1.5;">${escapeHtml(aval.como_acompanhar)}</div>
        ` : ''}
      </div>
    `);
  }

  if ((sd.adaptacoes_inclusivas || []).length > 0) {
    partes.push(`
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 20px; margin-bottom: 14px;">
        <div style="font-size: 15px; font-weight: bold; color: #1e3a8a; margin-bottom: 10px;">🧩 Adaptações inclusivas</div>
        ${sd.adaptacoes_inclusivas.map(a => `
          <div style="margin-bottom: 10px;">
            <div style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px;">${escapeHtml(a.necessidade || '')}</div>
            ${(a.estrategias || []).map(e => `<div style="font-size: 12px; color: #1e3a8a; line-height: 1.5;">• ${escapeHtml(e)}</div>`).join('')}
          </div>
        `).join('')}
      </div>
    `);
  }

  if (sd.consideracoes_finais) {
    partes.push(`
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin-bottom: 14px;">
        <div style="font-size: 15px; font-weight: bold; color: #854d0e; margin-bottom: 6px;">📌 Considerações finais</div>
        <div style="font-size: 12px; color: #713f12; line-height: 1.6;">${escapeHtml(sd.consideracoes_finais)}</div>
      </div>
    `);
  }

  if (partes.length === 0) return '';

  return `
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 16px 32px; background: #ffffff;">
      ${partes.join('')}
    </div>
  `;
}

// ============================================================
// RODAPÉ
// ============================================================
function desenharRodape(pdf, numPagina) {
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    'SIMIDNAPE PRO · O Professor Inesquecível · simidnape.com.br',
    MARGEM,
    PDF_H - 4
  );
  pdf.text(
    `Página ${numPagina}`,
    PDF_W - MARGEM,
    PDF_H - 4,
    { align: 'right' }
  );
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

  // Carrega a logo SIMIDNAPE (uma vez) para usar na capa e no cabeçalho
  const logoBase64 = await carregarLogoBase64();

  // 1. PDF vazio (A4 paisagem)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // 2. Capa (página 1)
  const canvasCapa = await renderizarBloco(htmlCapa(cab, logoBase64));
  const capaRatio = CONTENT_W_MM / canvasCapa.width;
  const capaAlturaMM = Math.min(canvasCapa.height * capaRatio, CONTENT_H_MM);
  pdf.addImage(
    canvasCapa.toDataURL('image/jpeg', 0.95),
    'JPEG',
    MARGEM,
    MARGEM,
    CONTENT_W_MM,
    capaAlturaMM
  );

  // 3. Prepara os blocos do corpo (cada bloco é uma unidade atômica)
  const blocosHtml = [
    htmlCabecalhoPlano(sd, logoBase64),
    htmlBlocoMacro(sd),
    ...(sd.sequencia_didatica || []).map((a, i) => htmlBlocoAula(a, i)),
    htmlBlocoFinal(sd),
  ].filter(Boolean);

  // 4. Coloca cada bloco no PDF
  let yAtual = MARGEM;
  let paginaAtual = 1;

  for (const html of blocosHtml) {
    const canvas = await renderizarBloco(html);
    const ratio = CONTENT_W_MM / canvas.width;
    const alturaMM = canvas.height * ratio;

    // Caso A — Cabe na página atual
    if (yAtual + alturaMM <= MARGEM + CONTENT_H_MM + 0.5) {
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        MARGEM,
        yAtual,
        CONTENT_W_MM,
        alturaMM
      );
      yAtual += alturaMM + GAP_ENTRE_BLOCOS;
    }
    // Caso B — Não cabe, mas o bloco inteiro cabe em uma página nova
    else if (alturaMM <= CONTENT_H_MM + 0.5) {
      pdf.addPage('a4', 'landscape');
      paginaAtual++;
      yAtual = MARGEM;
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        MARGEM,
        yAtual,
        CONTENT_W_MM,
        alturaMM
      );
      yAtual += alturaMM + GAP_ENTRE_BLOCOS;
    }
    // Caso C — Bloco é maior que uma página inteira → fatia
    else {
      // Se ainda tem conteúdo na página atual, começa nova
      if (yAtual > MARGEM + 1) {
        pdf.addPage('a4', 'landscape');
        paginaAtual++;
        yAtual = MARGEM;
      }

      const alturaPaginaPx = CONTENT_H_MM / ratio;
      let posY = 0;

      while (posY < canvas.height) {
        const restante = canvas.height - posY;
        const fatiaPx = Math.min(alturaPaginaPx, restante);

        const fatiaCanvas = document.createElement('canvas');
        fatiaCanvas.width = canvas.width;
        fatiaCanvas.height = Math.ceil(fatiaPx);
        const fctx = fatiaCanvas.getContext('2d');
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(0, 0, fatiaCanvas.width, fatiaCanvas.height);
        fctx.drawImage(canvas, 0, posY, canvas.width, fatiaPx, 0, 0, canvas.width, fatiaPx);

        const fatiaAlturaMM = fatiaPx * ratio;
        pdf.addImage(
          fatiaCanvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          MARGEM,
          yAtual,
          CONTENT_W_MM,
          fatiaAlturaMM
        );

        posY += fatiaPx;

        if (posY < canvas.height) {
          pdf.addPage('a4', 'landscape');
          paginaAtual++;
          yAtual = MARGEM;
        } else {
          yAtual += fatiaAlturaMM + GAP_ENTRE_BLOCOS;
        }
      }
    }
  }

  // 5. Rodapé em todas as páginas (desenha por cima)
  const totalPaginas = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    pdf.setPage(i);
    desenharRodape(pdf, i);
  }

  // 6. Salva
  pdf.save(`${slug(cab.titulo)}_PLANEJAMENTO.pdf`);
}

export default gerarPdfPlanejamento;