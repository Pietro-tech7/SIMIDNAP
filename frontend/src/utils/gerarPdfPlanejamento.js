import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

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
// HTML DA CAPA
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
      width: 1080px;
      padding: 50px;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      box-sizing: border-box;
    ">
      <div style="
        border: 3px solid #1e40af;
        border-radius: 16px;
        padding: 60px 70px;
        min-height: 640px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        <!-- Topo: marca -->
        <div style="text-align: center;">
          <div style="font-size: 56px; font-weight: bold; color: #1e40af; letter-spacing: 6px; line-height: 1;">
            SIMIDNAPE
          </div>
          <div style="font-size: 22px; font-weight: bold; color: #3b82f6; margin-top: 14px; letter-spacing: 1px;">
            PLANEJADOR SIMIDNAPE
          </div>
          <div style="font-size: 15px; color: #64748b; margin-top: 6px;">
            O Professor Inesquecível
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; font-family: monospace;">
            simidnape.com.br
          </div>
        </div>

        <!-- Meio: título -->
        <div style="text-align: center; margin: 40px 0;">
          <div style="
            display: inline-block;
            background: #eff6ff;
            color: #1e40af;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
            padding: 6px 16px;
            border-radius: 999px;
            margin-bottom: 20px;
          ">
            PLANEJAMENTO PEDAGÓGICO
          </div>
          <div style="font-size: 32px; font-weight: bold; color: #0f172a; line-height: 1.3;">
            ${escapeHtml(cab.titulo || 'Sem título')}
          </div>
        </div>

        <!-- Rodapé: dados -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 40px;
          font-size: 14px;
          color: #334155;
          border-top: 1px solid #e2e8f0;
          padding-top: 30px;
        ">
          <div><strong style="color: #0f172a;">Professor(a):</strong> ${escapeHtml(nome)}</div>
          <div><strong style="color: #0f172a;">Componente:</strong> ${escapeHtml(comp)}</div>
          <div><strong style="color: #0f172a;">Escola:</strong> ${escapeHtml(escola)}</div>
          <div><strong style="color: #0f172a;">Ano/Série:</strong> ${escapeHtml(ano)}</div>
          <div><strong style="color: #0f172a;">Município:</strong> ${escapeHtml(muni)} - ${escapeHtml(uf)}</div>
          <div><strong style="color: #0f172a;">Período:</strong> ${escapeHtml(per)}</div>
          <div></div>
          <div><strong style="color: #0f172a;">Total de aulas:</strong> ${escapeHtml(String(total))}</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// HTML DO CORPO (macro + aulas detalhadas)
// ============================================================
function htmlCorpo(sd) {
  const cab = sd.cabecalho || {};

  // Lógica pedagógica + eixos + descritores
  const logicaHtml = sd.logica_pedagogica ? `
    <div style="
      background: #eff6ff;
      border-left: 5px solid #1e40af;
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 18px;
    ">
      <div style="font-size: 11px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
        Lógica pedagógica do período
      </div>
      <div style="font-size: 13px; color: #1e3a8a; line-height: 1.6; font-style: italic;">
        ${escapeHtml(sd.logica_pedagogica)}
      </div>
    </div>
  ` : '';

  const eixosHtml = (sd.eixos_predominantes || []).length > 0 ? `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
        Eixos predominantes
      </div>
      ${sd.eixos_predominantes.map(e => `
        <div style="display: flex; gap: 10px; align-items: baseline; margin-bottom: 4px; font-size: 12px;">
          <span style="background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">${escapeHtml(e.periodo || '')}</span>
          <span style="color: #334155;">${escapeHtml(e.eixo || '')}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const descritoresHtml = (sd.descritores_trabalhados || []).length > 0 ? `
    <div style="margin-bottom: 18px;">
      <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
        Descritores trabalhados
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${sd.descritores_trabalhados.map(d => `
          <span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace;">
            ${escapeHtml(d)}
          </span>
        `).join('')}
      </div>
    </div>
  ` : '';

  const objetivosHtml = sd.objetivos_gerais ? `
    <div style="margin-bottom: 18px;">
      <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
        Objetivos gerais
      </div>
      <div style="font-size: 12px; color: #0f172a; line-height: 1.6; margin-bottom: 8px;">
        ${escapeHtml(sd.objetivos_gerais)}
      </div>
      ${(sd.objetivos_especificos || []).map(o => `
        <div style="font-size: 12px; color: #334155; line-height: 1.6;">✓ ${escapeHtml(o)}</div>
      `).join('')}
    </div>
  ` : '';

  const justificativaHtml = sd.justificativa ? `
    <div style="
      background: #f8fafc;
      border-left: 4px solid #64748b;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 18px;
    ">
      <div style="font-size: 11px; font-weight: bold; color: #334155; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
        Justificativa
      </div>
      <div style="font-size: 12px; color: #334155; line-height: 1.6;">
        ${escapeHtml(sd.justificativa)}
      </div>
    </div>
  ` : '';

  // ============================================================
  // AULAS
  // ============================================================
  const aulasHtml = (sd.sequencia_didatica || []).map((aula, i) => {
    const bloco = (titulo, conteudo, cor = '#475569', bg = '#ffffff') => conteudo ? `
      <div style="
        background: ${bg};
        border-left: 3px solid ${cor};
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 8px;
      ">
        <div style="font-size: 10px; font-weight: bold; color: ${cor}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">
          ${titulo}
        </div>
        <div style="font-size: 12px; color: #1e293b; line-height: 1.55;">
          ${escapeHtml(conteudo)}
        </div>
      </div>
    ` : '';

    return `
      <div style="
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 14px;
        page-break-inside: avoid;
      ">
        <!-- Header da aula -->
        <div style="
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: #ffffff;
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-size: 10px; font-weight: bold; color: #bfdbfe; letter-spacing: 1.5px;">
              ${aula.semana ? 'SEMANA ' + aula.semana + ' · ' : ''}AULA ${aula.numero_aula || i + 1}
            </div>
            <div style="font-size: 15px; font-weight: bold; margin-top: 2px;">
              ${escapeHtml(aula.titulo || '')}
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            ${aula.principio_cognitivo ? `
              <span style="background: rgba(255,255,255,0.25); color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid rgba(255,255,255,0.4);">
                🧠 ${escapeHtml(aula.principio_cognitivo)}
              </span>
            ` : ''}
            ${aula.duracao_minutos ? `
              <span style="background: rgba(255,255,255,0.25); color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid rgba(255,255,255,0.4); font-family: monospace;">
                ${aula.duracao_minutos} min
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Corpo da aula -->
        <div style="padding: 12px 16px;">

          <!-- Pergunta problematizadora -->
          ${aula.pergunta_problematizadora ? `
            <div style="
              background: #fef9c3;
              border-left: 4px solid #eab308;
              padding: 10px 14px;
              border-radius: 6px;
              margin-bottom: 10px;
            ">
              <div style="font-size: 10px; font-weight: bold; color: #854d0e; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 4px;">
                ❓ Pergunta problematizadora
              </div>
              <div style="font-size: 13px; font-weight: 600; color: #713f12; font-style: italic; line-height: 1.5;">
                "${escapeHtml(aula.pergunta_problematizadora)}"
              </div>
            </div>
          ` : ''}

          <!-- Grid de metadados -->
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
            ${aula.habilidade_foco ? `<span style="background: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">🎯 ${escapeHtml(aula.habilidade_foco)}</span>` : ''}
            ${aula.foco ? `<span style="background: #f1f5f9; color: #475569; padding: 3px 10px; border-radius: 4px; font-size: 11px;">📌 ${escapeHtml(aula.foco)}</span>` : ''}
            ${(aula.descritores || []).map(d => `<span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace;">${escapeHtml(d)}</span>`).join('')}
          </div>

          ${bloco('🎯 Objetivo', aula.objetivo_da_aula, '#059669')}
          ${bloco('🎨 Estratégia concreta', aula.estrategia, '#7c3aed', '#faf5ff')}
          ${bloco('👨‍🏫 Metodologia', aula.metodologia)}

          ${(aula.atividades || []).length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                👥 Atividades dos alunos
              </div>
              ${aula.atividades.map(a => `<div style="font-size: 12px; color: #334155; line-height: 1.5;">• ${escapeHtml(a)}</div>`).join('')}
            </div>
          ` : ''}

          ${bloco('📦 Recursos', (aula.recursos || []).join(' · '))}
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
    `;
  }).join('');

  // ============================================================
  // AVALIAÇÃO GERAL + ADAPTAÇÕES + CONSIDERAÇÕES FINAIS
  // ============================================================
  const avalGeral = sd.avaliacao_geral || {};
  const avalHtml = (avalGeral.instrumentos || avalGeral.indicadores_de_sucesso || avalGeral.como_acompanhar) ? `
    <div style="
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    ">
      <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 10px;">
        📊 Avaliação geral do período
      </div>
      ${(avalGeral.instrumentos || []).length > 0 ? `
        <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Instrumentos</div>
        ${avalGeral.instrumentos.map(x => `<div style="font-size: 12px; color: #334155; line-height: 1.5;">• ${escapeHtml(x)}</div>`).join('')}
      ` : ''}
      ${(avalGeral.indicadores_de_sucesso || []).length > 0 ? `
        <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 10px 0 4px;">Indicadores de sucesso</div>
        ${avalGeral.indicadores_de_sucesso.map(x => `<div style="font-size: 12px; color: #334155; line-height: 1.5;">• ${escapeHtml(x)}</div>`).join('')}
      ` : ''}
      ${avalGeral.como_acompanhar ? `
        <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 10px 0 4px;">Como acompanhar</div>
        <div style="font-size: 12px; color: #334155; line-height: 1.5;">${escapeHtml(avalGeral.como_acompanhar)}</div>
      ` : ''}
    </div>
  ` : '';

  const adaptHtml = (sd.adaptacoes_inclusivas || []).length > 0 ? `
    <div style="
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    ">
      <div style="font-size: 14px; font-weight: bold; color: #1e3a8a; margin-bottom: 10px;">
        🧩 Adaptações inclusivas
      </div>
      ${sd.adaptacoes_inclusivas.map(a => `
        <div style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 3px;">${escapeHtml(a.necessidade || '')}</div>
          ${(a.estrategias || []).map(e => `<div style="font-size: 12px; color: #1e3a8a; line-height: 1.5;">• ${escapeHtml(e)}</div>`).join('')}
        </div>
      `).join('')}
    </div>
  ` : '';

  const consHtml = sd.consideracoes_finais ? `
    <div style="
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    ">
      <div style="font-size: 14px; font-weight: bold; color: #854d0e; margin-bottom: 6px;">
        📌 Considerações finais
      </div>
      <div style="font-size: 12px; color: #713f12; line-height: 1.6;">
        ${escapeHtml(sd.consideracoes_finais)}
      </div>
    </div>
  ` : '';

  // ============================================================
  // HTML final
  // ============================================================
  return `
    <div style="
      width: 1080px;
      padding: 30px 40px;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      box-sizing: border-box;
    ">
      <!-- Cabeçalho pequeno -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #1e40af;
        padding-bottom: 10px;
        margin-bottom: 20px;
      ">
        <div>
          <div style="font-size: 16px; font-weight: bold; color: #1e40af;">PLANEJADOR SIMIDNAPE</div>
          <div style="font-size: 10px; color: #64748b;">O Professor Inesquecível</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #475569;">
          <div><strong>${escapeHtml(cab.titulo || '')}</strong></div>
          <div>${escapeHtml(cab.componente || '')} · ${escapeHtml(cab.ano || '')} · ${escapeHtml(cab.periodo_texto || '')}</div>
        </div>
      </div>

      ${logicaHtml}
      ${eixosHtml}
      ${descritoresHtml}
      ${objetivosHtml}
      ${justificativaHtml}

      <div style="
        font-size: 14px;
        font-weight: bold;
        color: #0f172a;
        margin: 20px 0 12px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
      ">
        📋 Sequência didática — ${(sd.sequencia_didatica || []).length} aula(s)
      </div>

      ${aulasHtml}

      ${avalHtml}
      ${adaptHtml}
      ${consHtml}
    </div>
  `;
}

// ============================================================
// RODAPÉ EM CADA PÁGINA
// ============================================================
function desenharRodape(pdf, pdfW, pdfH, MARGEM, RODAPE_ALTURA, numPagina) {
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    'SIMIDNAPE PRO · O Professor Inesquecível · simidnape.com.br',
    MARGEM,
    pdfH - 5
  );
  pdf.text(
    `Página ${numPagina}`,
    pdfW - MARGEM,
    pdfH - 5,
    { align: 'right' }
  );
}

// ============================================================
// FUNÇÃO PÚBLICA
// ============================================================
export async function gerarPdfPlanejamento(plano) {
  if (!plano || !plano.structured_data) {
    throw new Error('Plano inválido.');
  }

  const sd = plano.structured_data;
  const cab = sd.cabecalho || {};

  // ------------------------------------------------------------
  // 1. Monta os containers ocultos
  // ------------------------------------------------------------
  const capaEl = document.createElement('div');
  capaEl.style.cssText = 'position: fixed; left: -99999px; top: 0; width: 1080px; background: #fff;';
  capaEl.innerHTML = htmlCapa(cab);
  document.body.appendChild(capaEl);

  const corpoEl = document.createElement('div');
  corpoEl.style.cssText = 'position: fixed; left: -99999px; top: 0; width: 1080px; background: #fff;';
  corpoEl.innerHTML = htmlCorpo(sd);
  document.body.appendChild(corpoEl);

  try {
    // ----------------------------------------------------------
    // 2. Captura os canvases
    // ----------------------------------------------------------
    const canvasCapa = await html2canvas(capaEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: capaEl.scrollWidth,
      windowHeight: capaEl.scrollHeight,
    });

    const canvasCorpo = await html2canvas(corpoEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: corpoEl.scrollWidth,
      windowHeight: corpoEl.scrollHeight,
    });

    // ----------------------------------------------------------
    // 3. PDF em A4 paisagem
    // ----------------------------------------------------------
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();   // 297
    const pdfH = pdf.internal.pageSize.getHeight();  // 210
    const MARGEM = 10;
    const RODAPE_ALTURA = 8;
    const usableW = pdfW - MARGEM * 2;
    const usableH = pdfH - MARGEM - RODAPE_ALTURA - 2;

    // ----------------------------------------------------------
    // 4. Página 1 — CAPA
    // ----------------------------------------------------------
    const ratioCapa = usableW / canvasCapa.width;
    const capaHeightInPdf = Math.min(canvasCapa.height * ratioCapa, usableH);
    const capaImgData = canvasCapa.toDataURL('image/jpeg', 0.95);
    pdf.addImage(capaImgData, 'JPEG', MARGEM, MARGEM, usableW, capaHeightInPdf);
    desenharRodape(pdf, pdfW, pdfH, MARGEM, RODAPE_ALTURA, 1);

    // ----------------------------------------------------------
    // 5. Páginas 2+ — CORPO com slicing
    // ----------------------------------------------------------
    const ratio = usableW / canvasCorpo.width;
    const alturaPaginaEmPx = usableH / ratio;
    const ctx = canvasCorpo.getContext('2d');
    const canvasW = canvasCorpo.width;
    const canvasH = canvasCorpo.height;

    // Detecta linha branca (para não cortar no meio de texto)
    const linhaBranca = (y) => {
      if (y < 0 || y >= canvasH) return false;
      const data = ctx.getImageData(0, y, canvasW, 1).data;
      let escuros = 0;
      for (let i = 0; i < data.length; i += 16) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < 220) escuros++;
      }
      return (escuros / (data.length / 16)) < 0.01;
    };

    const acharCorte = (yInicial, yMinimo) => {
      let y = yInicial;
      let t = 0;
      while (y > yMinimo && t < 300) {
        if (linhaBranca(y)) return y;
        y--;
        t++;
      }
      return yInicial;
    };

    let posY = 0;
    let pageIndex = 1; // já foi a capa

    while (posY < canvasH) {
      const corteCru = Math.min(posY + alturaPaginaEmPx, canvasH);
      let corteFinal = corteCru;
      if (corteCru < canvasH) {
        corteFinal = acharCorte(corteCru, posY + alturaPaginaEmPx * 0.55);
      }
      const sliceHeight = corteFinal - posY;

      // Cria canvas temporário
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasW;
      pageCanvas.height = sliceHeight;
      const pctx = pageCanvas.getContext('2d');
      pctx.fillStyle = '#ffffff';
      pctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pctx.drawImage(canvasCorpo, 0, posY, canvasW, sliceHeight, 0, 0, canvasW, sliceHeight);

      const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
      const sliceHeightInPdf = sliceHeight * ratio;

      pdf.addPage('a4', 'landscape');
      pdf.addImage(imgData, 'JPEG', MARGEM, MARGEM, usableW, sliceHeightInPdf);
      pageIndex++;
      desenharRodape(pdf, pdfW, pdfH, MARGEM, RODAPE_ALTURA, pageIndex);

      posY = corteFinal;
    }

    // ----------------------------------------------------------
    // 6. Salva
    // ----------------------------------------------------------
    pdf.save(`${slug(cab.titulo)}_PLANEJAMENTO.pdf`);
  } finally {
    document.body.removeChild(capaEl);
    document.body.removeChild(corpoEl);
  }
}

export default gerarPdfPlanejamento;