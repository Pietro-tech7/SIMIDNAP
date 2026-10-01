import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// ============================================================
// LAYOUT — A4 PAISAGEM
// ============================================================
const PDF_W = 297;
const PDF_H = 210;
const MARGEM = 15;
const RODAPE_ALTURA = 10;
const GAP = 3;
const CONTENT_W_MM = PDF_W - MARGEM * 2;
const CONTENT_H_MM = PDF_H - MARGEM - RODAPE_ALTURA - 2;
const CANVAS_W_PX = 1600;

// ============================================================
// PALETA SUAVE — IDENTIDADE VISUAL SIMIDNAPE
// ============================================================
const CREME       = '#FDFBF7';
const BRANCO      = '#FFFFFF';
const AZUL        = '#2C5F7C';
const AZUL_CLARO  = '#E8F0F5';
const VERDE       = '#7FB3A0';
const VERDE_CLARO = '#EAF4F0';
const PESSEGO     = '#F5C6A5';
const PESSEGO_CLARO = '#FDF1E7';
const CORAL       = '#E07856';
const CORAL_CLARO = '#FBE9E2';
const OURO        = '#D4A843';
const OURO_CLARO  = '#FBF3E0';
const TEXTO       = '#2D2D2D';
const TEXTO_2     = '#6B6B6B';
const BORDA       = '#E5E0D8';

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
// LOGO SIMIDNAPE (Pica-pau + nome)
// ============================================================
function htmlLogo(opcoes = {}) {
  const { tamanhoNome = 48, tamanhoSlogan = 16, alturaPicapau = 72, alinhamento = 'left' } = opcoes;
  const justify = alinhamento === 'center' ? 'center' : 'flex-start';

  return `
    <div style="display: flex; align-items: center; gap: 18px; justify-content: ${justify};">
      <img src="/icons/comparacao/simidnape-picapau.svg" alt="" 
           style="height: ${alturaPicapau}px; width: auto; display: block;" 
           crossorigin="anonymous" />
      <div style="display: flex; flex-direction: column; line-height: 1;">
        <div style="
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: ${tamanhoNome}px;
          color: ${AZUL};
          letter-spacing: 4px;
          line-height: 1.05;
        ">SIMIDNAPE</div>
        <div style="
          font-family: 'Lora', serif;
          font-style: italic;
          font-weight: 400;
          font-size: ${tamanhoSlogan}px;
          color: ${TEXTO_2};
          margin-top: 4px;
          letter-spacing: 0.5px;
        ">O Professor Inesquecível</div>
      </div>
    </div>
  `;
}

// ============================================================
// CAPA
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
      background: ${CREME};
      font-family: 'Inter', Arial, sans-serif;
      color: ${TEXTO};
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    ">
      <!-- Faixa decorativa no topo -->
      <div style="display: flex; height: 8px; width: 100%;">
        <div style="flex: 3; background: ${AZUL};"></div>
        <div style="flex: 2; background: ${VERDE};"></div>
        <div style="flex: 2; background: ${PESSEGO};"></div>
        <div style="flex: 1; background: ${CORAL};"></div>
      </div>

      <!-- Círculos decorativos suaves -->
      <div style="position: absolute; top: 120px; right: -80px; width: 260px; height: 260px; border-radius: 50%; background: ${AZUL_CLARO}; opacity: 0.55;"></div>
      <div style="position: absolute; bottom: 60px; left: -60px; width: 200px; height: 200px; border-radius: 50%; background: ${PESSEGO_CLARO}; opacity: 0.65;"></div>

      <div style="
        position: relative;
        z-index: 1;
        padding: 55px 70px 60px;
        min-height: 730px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        <!-- Topo: logo -->
        <div>
          ${htmlLogo({ tamanhoNome: 52, tamanhoSlogan: 17, alturaPicapau: 82 })}
        </div>

        <!-- Centro: título -->
        <div style="text-align: center; margin: 60px 0 50px;">
          <div style="
            display: inline-block;
            background: ${OURO_CLARO};
            color: ${OURO};
            font-family: 'Poppins', sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 4px;
            padding: 8px 22px;
            border-radius: 999px;
            margin-bottom: 28px;
            text-transform: uppercase;
          ">
            Planejamento Pedagógico
          </div>
          <div style="
            font-family: 'Lora', serif;
            font-weight: 400;
            font-size: 34px;
            color: ${AZUL};
            line-height: 1.35;
            max-width: 900px;
            margin: 0 auto;
          ">
            ${escapeHtml(cab.titulo || 'Sem título')}
          </div>
        </div>

        <!-- Rodapé: card branco com dados -->
        <div style="
          background: ${BRANCO};
          border-radius: 14px;
          padding: 28px 36px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 50px;
          font-size: 13px;
          color: ${TEXTO};
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          border: 1px solid ${BORDA};
        ">
          <div><span style="color: ${TEXTO_2};">Professor(a):</span> <strong style="color: ${TEXTO}; font-weight: 600;">${escapeHtml(nome)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Componente:</span> <strong style="color: ${TEXTO}; font-weight: 600;">${escapeHtml(comp)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Escola:</span> <strong style="color: ${TEXTO}; font-weight: 600;">${escapeHtml(escola)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Ano/Série:</span> <strong style="color: ${TEXTO}; font-weight: 600;">${escapeHtml(ano)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Município:</span> <strong style="color: ${TEXTO}; font-weight: 600;">${escapeHtml(muni)} - ${escapeHtml(uf)}</strong></div>
          <div><span style="color: ${TEXTO_2};">Período:</span> <strong style="color: ${TEXTO}; font-weight: 600;">${escapeHtml(per)}</strong></div>
          <div></div>
          <div><span style="color: ${TEXTO_2};">Total de aulas:</span> <strong style="color: ${TEXTO}; font-weight: 600;">${escapeHtml(String(total))}</strong></div>
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
      padding: 0 32px;
      font-family: 'Inter', Arial, sans-serif;
    ">
      <div style="
        background: ${AZUL_CLARO};
        border-radius: 12px;
        padding: 22px 28px;
        border-left: 5px solid ${AZUL};
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 3px; color: ${AZUL}; text-transform: uppercase;">
            PLANEJADOR SIMIDNAPE
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${TEXTO_2};">simidnape.com.br</div>
        </div>
        <div style="font-family: 'Lora', serif; font-size: 24px; color: ${AZUL}; margin-bottom: 10px; line-height: 1.3;">
          ${escapeHtml(cab.titulo || '')}
        </div>
        <div style="font-size: 12px; color: ${TEXTO_2}; line-height: 1.6;">
          ${cab.nome_professor ? `<strong style="color:${TEXTO};">Professor(a):</strong> ${escapeHtml(cab.nome_professor)}` : ''}
          ${cab.nome_escola ? ` · <strong style="color:${TEXTO};">Escola:</strong> ${escapeHtml(cab.nome_escola)}` : ''}
          ${cab.municipio ? ` · <strong style="color:${TEXTO};">Município:</strong> ${escapeHtml(cab.municipio)}` : ''}
          ${cab.estado ? ` - ${escapeHtml(cab.estado)}` : ''}
        </div>
        <div style="font-size: 12px; color: ${TEXTO_2}; margin-top: 4px;">
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
// MICRO-BLOCOS — MACRO
// ============================================================
function htmlMicroMacro(sd) {
  const blocos = [];

  const cartaoLabel = (titulo, conteudoHtml, corBarra, corFundo) => `
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${corFundo}; border-left: 4px solid ${corBarra}; border-radius: 8px; padding: 16px 22px;">
        <div style="font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: ${corBarra}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">${titulo}</div>
        ${conteudoHtml}
      </div>
    </div>
  `;

  if (sd.logica_pedagogica) {
    blocos.push(cartaoLabel(
      'Lógica pedagógica do período',
      `<div style="font-family: 'Lora', serif; font-style: italic; font-size: 15px; color: ${AZUL}; line-height: 1.6;">${escapeHtml(sd.logica_pedagogica)}</div>`,
      AZUL, AZUL_CLARO
    ));
  }

  if ((sd.eixos_predominantes || []).length > 0) {
    const linhas = sd.eixos_predominantes.map(e => `
      <div style="display: flex; gap: 12px; align-items: baseline; margin-bottom: 6px; font-size: 13px;">
        <span style="background: ${BRANCO}; color: ${AZUL}; padding: 3px 12px; border-radius: 4px; font-weight: 600; font-size: 11px; font-family: 'JetBrains Mono', monospace;">${escapeHtml(e.periodo || '')}</span>
        <span style="color: ${TEXTO};">${escapeHtml(e.eixo || '')}</span>
      </div>
    `).join('');
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 8px; padding: 16px 22px;">
          <div style="font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Eixos predominantes</div>
          ${linhas}
        </div>
      </div>
    `);
  }

  const descs = sd.descritores_detalhados || [];
  if (descs.length > 0) {
    const linhas = descs.map(d => `
      <div style="display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; font-size: 13px;">
        <span style="background: ${PESSEGO_CLARO}; color: ${CORAL}; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; font-size: 11px;">${escapeHtml(d.codigo)}</span>
        ${d.fonte ? `<span style="background: ${OURO_CLARO}; color: ${OURO}; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 10px; text-transform: uppercase; flex-shrink: 0; letter-spacing: 0.5px;">${escapeHtml(d.fonte)}</span>` : ''}
        <span style="color: ${TEXTO}; line-height: 1.55;">${escapeHtml(d.texto)}</span>
      </div>
    `).join('');
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 8px; padding: 16px 22px;">
          <div style="font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Descritores trabalhados no período</div>
          ${linhas}
        </div>
      </div>
    `);
  } else if ((sd.descritores_trabalhados || []).length > 0) {
    const chips = sd.descritores_trabalhados.map(d => 
      `<span style="background: ${PESSEGO_CLARO}; color: ${CORAL}; padding: 4px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; font-family: 'JetBrains Mono', monospace;">${escapeHtml(d)}</span>`
    ).join('');
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 8px; padding: 16px 22px;">
          <div style="font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Descritores trabalhados</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">${chips}</div>
        </div>
      </div>
    `);
  }

  if (sd.objetivos_gerais) {
    blocos.push(cartaoLabel(
      'Objetivos gerais',
      `<div style="font-size: 14px; color: ${TEXTO}; line-height: 1.65; margin-bottom: 8px;">${escapeHtml(sd.objetivos_gerais)}</div>
       ${(sd.objetivos_especificos || []).map(o => `<div style="font-size: 13px; color: ${TEXTO}; line-height: 1.7; padding-left: 16px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE}; font-weight: 700;">✓</span>${escapeHtml(o)}</div>`).join('')}`,
      VERDE, VERDE_CLARO
    ));
  }

  if (sd.justificativa) {
    blocos.push(cartaoLabel(
      'Justificativa',
      `<div style="font-size: 14px; color: ${TEXTO}; line-height: 1.65;">${escapeHtml(sd.justificativa)}</div>`,
      OURO, OURO_CLARO
    ));
  }

  return blocos;
}

// ============================================================
// MICRO-BLOCOS — UMA AULA
// ============================================================
function htmlMicroAula(aula, index) {
  const blocos = [];

  const headerBadges = [
    aula.principio_cognitivo ? `<span style="background: ${BRANCO}; color: ${AZUL}; padding: 5px 14px; border-radius: 999px; font-size: 11px; font-weight: 600; border: 1px solid ${BORDA};">🧠 ${escapeHtml(aula.principio_cognitivo)}</span>` : '',
    aula.duracao_minutos ? `<span style="background: ${BRANCO}; color: ${TEXTO_2}; padding: 5px 14px; border-radius: 999px; font-size: 11px; font-weight: 600; border: 1px solid ${BORDA}; font-family: 'JetBrains Mono', monospace;">${aula.duracao_minutos} min</span>` : '',
  ].filter(Boolean).join('');

  const badgesRow = [
    aula.habilidade_foco ? `<span style="background: ${VERDE_CLARO}; color: ${VERDE}; padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;">🎯 ${escapeHtml(aula.habilidade_foco)}</span>` : '',
    aula.foco ? `<span style="background: ${AZUL_CLARO}; color: ${AZUL}; padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 500;">📌 ${escapeHtml(aula.foco)}</span>` : '',
    ...(aula.descritores || []).map(d => `<span style="background: ${PESSEGO_CLARO}; color: ${CORAL}; padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; font-family: 'JetBrains Mono', monospace;">${escapeHtml(d)}</span>`),
  ].filter(Boolean).join('');

  blocos.push(`
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 14px 32px 4px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-left: 5px solid ${AZUL}; border-radius: 10px; padding: 18px 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; color: ${CORAL}; letter-spacing: 2px; text-transform: uppercase;">
              ${aula.semana ? 'SEMANA ' + aula.semana + ' · ' : ''}AULA ${aula.numero_aula || index + 1}
            </div>
            <div style="font-family: 'Lora', serif; font-size: 19px; color: ${AZUL}; margin-top: 6px; line-height: 1.3;">
              ${escapeHtml(aula.titulo || '')}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;">${headerBadges}</div>
        </div>

        ${aula.pergunta_problematizadora ? `
          <div style="margin-top: 14px; padding: 14px 18px; background: ${OURO_CLARO}; border-radius: 8px; border-left: 3px solid ${OURO};">
            <div style="font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; color: ${OURO}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">❓ Pergunta problematizadora</div>
            <div style="font-family: 'Lora', serif; font-style: italic; font-size: 15px; color: #7A5E20; line-height: 1.55;">"${escapeHtml(aula.pergunta_problematizadora)}"</div>
          </div>
        ` : ''}

        ${badgesRow ? `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;">${badgesRow}</div>` : ''}
      </div>
    </div>
  `);

  const cartao = (titulo, conteudo, cor, corFundo) => conteudo ? `
    <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 5px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
      <div style="background: ${corFundo || BRANCO}; border-left: 3px solid ${cor}; border-radius: 6px; padding: 12px 18px;">
        <div style="font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; color: ${cor}; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">${titulo}</div>
        <div style="font-size: 14px; color: ${TEXTO}; line-height: 1.65;">${escapeHtml(conteudo)}</div>
      </div>
    </div>
  ` : '';

  blocos.push(cartao('🎯 Objetivo', aula.objetivo_da_aula, VERDE, VERDE_CLARO));
  blocos.push(cartao('📖 Conteúdo', aula.conteudo, AZUL, AZUL_CLARO));
  blocos.push(cartao('🎨 Estratégia concreta', aula.estrategia, CORAL, PESSEGO_CLARO));
  blocos.push(cartao('👨‍🏫 Metodologia', aula.metodologia, AZUL, BRANCO));

  if ((aula.atividades || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 5px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 6px; padding: 14px 18px;">
          <div style="font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; color: ${AZUL}; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px;">👥 Atividades dos alunos</div>
          ${aula.atividades.map(a => `<div style="font-size: 13px; color: ${TEXTO}; line-height: 1.7; padding-left: 16px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE};">•</span>${escapeHtml(a)}</div>`).join('')}
        </div>
      </div>
    `);
  }

  blocos.push(cartao('📦 Recursos', (aula.recursos || []).join(' · '), TEXTO_2, BRANCO));
  blocos.push(cartao('✅ Avaliação da aula', aula.avaliacao_da_aula, VERDE, VERDE_CLARO));
  blocos.push(cartao('🎯 Evidência de aprendizagem', aula.evidencia_de_aprendizagem, VERDE, VERDE_CLARO));
  blocos.push(cartao('⚠️ Onde pode travar', aula.onde_pode_travar, OURO, OURO_CLARO));
  blocos.push(cartao('🎚️ Diferenciação', aula.diferenciacao, CORAL, PESSEGO_CLARO));
  blocos.push(cartao('✨ Momento de encantamento', aula.momento_de_encantamento, CORAL, PESSEGO_CLARO));
  blocos.push(cartao('💭 Leitura relacional', aula.leitura_relacional, AZUL, AZUL_CLARO));
  blocos.push(cartao('🎯 Resultado visível', aula.resultado_visivel, VERDE, VERDE_CLARO));
  blocos.push(cartao('🌍 Conexão com a vida', aula.conexao_com_a_vida, CORAL, PESSEGO_CLARO));

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
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${BRANCO}; border: 1px solid ${BORDA}; border-radius: 10px; padding: 22px 26px;">
          <div style="font-family: 'Lora', serif; font-size: 18px; color: ${AZUL}; margin-bottom: 14px;">📊 Avaliação geral do período</div>
          ${(aval.instrumentos || []).length > 0 ? `
            <div style="font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Instrumentos</div>
            ${aval.instrumentos.map(x => `<div style="font-size: 13px; color: ${TEXTO}; line-height: 1.7; padding-left: 16px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE};">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${(aval.indicadores_de_sucesso || []).length > 0 ? `
            <div style="font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin: 14px 0 6px;">Indicadores de sucesso</div>
            ${aval.indicadores_de_sucesso.map(x => `<div style="font-size: 13px; color: ${TEXTO}; line-height: 1.7; padding-left: 16px; position: relative;"><span style="position: absolute; left: 0; color: ${VERDE};">•</span>${escapeHtml(x)}</div>`).join('')}
          ` : ''}
          ${aval.como_acompanhar ? `
            <div style="font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; color: ${TEXTO_2}; text-transform: uppercase; letter-spacing: 1.5px; margin: 14px 0 6px;">Como acompanhar</div>
            <div style="font-size: 13px; color: ${TEXTO}; line-height: 1.7;">${escapeHtml(aval.como_acompanhar)}</div>
          ` : ''}
        </div>
      </div>
    `);
  }

  if ((sd.adaptacoes_inclusivas || []).length > 0) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${AZUL_CLARO}; border-radius: 10px; padding: 22px 26px; border-left: 5px solid ${AZUL};">
          <div style="font-family: 'Lora', serif; font-size: 18px; color: ${AZUL}; margin-bottom: 14px;">🧩 Adaptações inclusivas</div>
          ${sd.adaptacoes_inclusivas.map(a => `
            <div style="margin-bottom: 14px;">
              <div style="font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 600; color: ${AZUL}; margin-bottom: 6px;">${escapeHtml(a.necessidade || '')}</div>
              ${(a.estrategias || []).map(e => `<div style="font-size: 13px; color: ${TEXTO}; line-height: 1.7; padding-left: 16px; position: relative;"><span style="position: absolute; left: 0; color: ${AZUL};">•</span>${escapeHtml(e)}</div>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  if (sd.consideracoes_finais) {
    blocos.push(`
      <div style="width: ${CANVAS_W_PX}px; box-sizing: border-box; padding: 6px 32px; background: ${CREME}; font-family: 'Inter', Arial, sans-serif;">
        <div style="background: ${PESSEGO_CLARO}; border-radius: 10px; padding: 22px 26px; border-left: 5px solid ${CORAL};">
          <div style="font-family: 'Lora', serif; font-size: 18px; color: ${CORAL}; margin-bottom: 10px;">📌 Considerações finais</div>
          <div style="font-size: 13px; color: ${TEXTO}; line-height: 1.7;">${escapeHtml(sd.consideracoes_finais)}</div>
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

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // 1. CAPA (página 1)
  const canvasCapa = await renderizarBloco(htmlCapa(cab));
  const capaRatio = CONTENT_W_MM / canvasCapa.width;
  const capaAlturaMM = Math.min(canvasCapa.height * capaRatio, CONTENT_H_MM);
  pdf.addImage(canvasCapa.toDataURL('image/jpeg', 0.95), 'JPEG', MARGEM, MARGEM, CONTENT_W_MM, capaAlturaMM);

  // 2. Monta micro-blocos do conteúdo
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