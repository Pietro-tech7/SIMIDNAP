import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// ============================================================
// PALETA SIMIDNAPE — mesma usada no PDF do planejador
// ============================================================
const CREME         = '#FDFBF7';
const BRANCO        = '#FFFFFF';
const AZUL          = '#2C5F7C';
const AZUL_CLARO    = '#E8F0F5';
const VERDE         = '#5FA68D';
const PESSEGO       = '#E8A87C';
const PESSEGO_CLARO = '#FDF1E7';
const CORAL         = '#E07856';
const OURO          = '#D4A843';
const OURO_CLARO    = '#FBF3E0';
const TEXTO         = '#2D2D2D';
const TEXTO_2       = '#6B6B6B';
const BORDA         = '#E5E0D8';

const PICAPAU_URL = '/icons/comparacao/simidnape-picapau.svg';

// ============================================================
// HELPERS
// ============================================================
function sanitizar(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v !== 'string') return '';
  let s = v;
  s = s.replace(/(.)\1{14,}/g, '$1$1$1...');
  s = s.replace(/\S{120,}/g, (m) => m.substring(0, 120) + '...');
  s = s.replace(/[\u0000-\u001F\u007F]/g, '');
  return s.trim();
}

function escapeHtml(t) {
  const l = sanitizar(t);
  if (!l) return '';
  return l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

async function renderizarBloco(html, { largura = 1600, background = CREME } = {}) {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:-99999px;top:0;width:${largura}px;background:${background};font-family:'Inter',Arial,sans-serif;color:${TEXTO};box-sizing:border-box;`;
  el.innerHTML = html;
  document.body.appendChild(el);
  try {
    return await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: background,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
  } finally {
    document.body.removeChild(el);
  }
}

// ============================================================
// LOGO SIMIDNAPE (Quicksand + bolinhas coloridas)
// ============================================================
function htmlLogo(tamanhoNome = 96, tamanhoSlogan = 26, alturaPicapau = 120) {
  const dotSize = Math.round(tamanhoNome * 0.11);
  const dotTop  = Math.round(tamanhoNome * 0.12);
  const conteudo = 'SIMIDNAPE'.split('').map((letra, i) => {
    if (i === 1) {
      return `<span style="position:relative;display:inline-block;">${letra}<span style="position:absolute;top:-${dotTop}px;left:50%;transform:translateX(-50%);width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${CORAL};display:block;"></span></span>`;
    }
    if (i === 3) {
      return `<span style="position:relative;display:inline-block;">${letra}<span style="position:absolute;top:-${dotTop}px;left:50%;transform:translateX(-50%);width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${OURO};display:block;"></span></span>`;
    }
    return letra;
  }).join('');

  return `
    <div style="display:flex;align-items:center;gap:28px;">
      <img src="${PICAPAU_URL}" alt="" style="height:${alturaPicapau}px;width:auto;display:block;flex-shrink:0;" crossorigin="anonymous" />
      <div style="display:flex;flex-direction:column;line-height:1;">
        <div style="font-family:'Quicksand','Poppins',sans-serif;font-weight:700;font-size:${tamanhoNome}px;color:${AZUL};letter-spacing:7px;line-height:1.05;">${conteudo}</div>
        <div style="font-family:'Lora',serif;font-style:italic;font-weight:400;font-size:${tamanhoSlogan}px;color:${TEXTO_2};margin-top:10px;letter-spacing:1px;">O Professor Inesquecível</div>
      </div>
    </div>`;
}

// ============================================================
// CAPA institucional
// ============================================================
function htmlCapa(capa) {
  const { titulo = '', subtitulo = '', badge = '', dados = [] } = capa || {};
  const dadosFiltrados = (dados || []).filter(d => d && d.valor);

  return `
    <div style="width:1600px;min-height:1096px;background:${CREME};font-family:'Inter',Arial,sans-serif;color:${TEXTO};box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;">
      <div style="display:flex;height:14px;width:100%;flex-shrink:0;">
        <div style="flex:3;background:${AZUL};"></div>
        <div style="flex:2;background:${VERDE};"></div>
        <div style="flex:2;background:${PESSEGO};"></div>
        <div style="flex:1;background:${CORAL};"></div>
      </div>
      <div style="position:absolute;top:170px;right:-100px;width:340px;height:340px;border-radius:50%;background:${AZUL_CLARO};opacity:0.5;"></div>
      <div style="position:absolute;bottom:110px;left:-90px;width:260px;height:260px;border-radius:50%;background:${PESSEGO_CLARO};opacity:0.7;"></div>
      <div style="position:relative;z-index:1;padding:55px 70px 55px;flex:1;display:flex;flex-direction:column;justify-content:space-between;min-height:1082px;box-sizing:border-box;">
        <div>${htmlLogo()}</div>

        <div style="text-align:center;margin:24px 0;">
          ${badge ? `<div style="display:inline-block;background:${OURO_CLARO};color:${OURO};font-family:'Quicksand',sans-serif;font-size:16px;font-weight:700;letter-spacing:6px;padding:12px 30px;border-radius:999px;margin-bottom:32px;text-transform:uppercase;">${escapeHtml(badge)}</div>` : ''}
          ${titulo ? `<div style="font-family:'Lora',serif;font-weight:400;font-size:62px;color:${AZUL};line-height:1.25;max-width:1150px;margin:0 auto;">${escapeHtml(titulo)}</div>` : ''}
          ${subtitulo ? `<div style="font-family:'Inter',sans-serif;font-size:22px;color:${TEXTO_2};margin-top:16px;">${escapeHtml(subtitulo)}</div>` : ''}
        </div>

        ${dadosFiltrados.length > 0 ? `
          <div style="background:${BRANCO};border-radius:16px;padding:34px 46px;display:grid;grid-template-columns:1fr 1fr;gap:22px 60px;font-size:22px;color:${TEXTO};box-shadow:0 2px 10px rgba(0,0,0,0.05);border:1px solid ${BORDA};">
            ${dadosFiltrados.map(d => `<div><span style="color:${TEXTO_2};">${escapeHtml(d.label)}:</span> <strong style="color:${TEXTO};font-weight:700;">${escapeHtml(d.valor)}</strong></div>`).join('')}
          </div>` : '<div></div>'}
      </div>
    </div>`;
}

// ============================================================
// RODAPÉ
// ============================================================
function desenharRodape(pdf, numPagina) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setTextColor(155, 145, 130);
  pdf.text('SIMIDNAPE · O Professor Inesquecível · simidnape.com.br', 10, h - 5);
  pdf.text(`Página ${numPagina}`, w - 10, h - 5, { align: 'right' });
}

// ============================================================
// FUNÇÃO PRINCIPAL
//
// Uso atual (compatível): gerarPDF(el, 'arquivo')
// Uso novo (com capa):    gerarPDF(el, 'arquivo', { capa: { titulo, badge, dados } })
// ============================================================
export async function gerarPDF(elemento, nomeArquivo = 'documento', opcoes = {}) {
  if (!elemento) {
    throw new Error('Elemento não encontrado.');
  }

  const orientacao = opcoes.orientacao || 'portrait';
  const comCapa = !!(opcoes.capa && (opcoes.capa.titulo || opcoes.capa.badge));
  const comRodape = opcoes.rodape !== false; // padrão: rodapé ativado

  // ==========================================================
  // 1. CAPTURA DO CONTEÚDO (DOM do motor)
  // ==========================================================
  let canvas;
  try {
    canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: elemento.scrollWidth,
      windowHeight: elemento.scrollHeight,
    });
  } catch (err) {
    console.error('[PDF] Falha ao capturar:', err);
    throw new Error('Falha ao processar o conteúdo para PDF.');
  }

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('O conteúdo capturado está vazio.');
  }

  // ==========================================================
  // 2. CONFIGURAÇÃO DO PDF
  // ==========================================================
  const MARGEM_MM = 10;
  const pdf = new jsPDF({ orientation: orientacao, unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const usableW = pdfW - MARGEM_MM * 2;
  const usableH = pdfH - MARGEM_MM * 2;
  const ratio = usableW / canvas.width;

  // ==========================================================
  // 3. CAPA INSTITUCIONAL (opcional)
  // ==========================================================
  if (comCapa) {
    await preloadImage(PICAPAU_URL);
    const capaHtml = htmlCapa(opcoes.capa);
    const capaCanvas = await renderizarBloco(capaHtml, { largura: 1600 });
    const capaRatio = usableW / capaCanvas.width;
    const capaAltura = Math.min(capaCanvas.height * capaRatio, usableH);
    pdf.addImage(
      capaCanvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      MARGEM_MM,
      MARGEM_MM,
      usableW,
      capaAltura
    );
    pdf.addPage();
  }

  // ==========================================================
  // 4. CONTEÚDO EM UMA OU MAIS PÁGINAS (slicing inteligente)
  // ==========================================================
  const canvasHeightInPdf = canvas.height * ratio;

  if (canvasHeightInPdf <= usableH) {
    // Cabe em uma página
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', MARGEM_MM, MARGEM_MM, usableW, canvasHeightInPdf);
  } else {
    // Múltiplas páginas
    const ctx = canvas.getContext('2d');
    const alturaPaginaEmPx = usableH / ratio;

    const linhaBranca = (y) => {
      if (y < 0 || y >= canvas.height) return false;
      const data = ctx.getImageData(0, y, canvas.width, 1).data;
      let escuros = 0;
      for (let i = 0; i < data.length; i += 16) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < 220) escuros++;
      }
      return escuros / (data.length / 16) < 0.01;
    };

    const encontrarCorte = (yIni, yMin) => {
      let y = yIni;
      let t = 0;
      while (y > yMin && t < 200) {
        if (linhaBranca(y)) return y;
        y--;
        t++;
      }
      return yIni;
    };

    let posY = 0;
    let pageIndex = 0;

    while (posY < canvas.height) {
      const corteCru = Math.min(posY + alturaPaginaEmPx, canvas.height);
      let corteFinal = corteCru;
      if (corteCru < canvas.height) {
        corteFinal = encontrarCorte(corteCru, posY + alturaPaginaEmPx * 0.6);
      }
      const sliceH = corteFinal - posY;

      const pc = document.createElement('canvas');
      pc.width = canvas.width;
      pc.height = sliceH;
      const pctx = pc.getContext('2d');
      pctx.fillStyle = '#ffffff';
      pctx.fillRect(0, 0, pc.width, pc.height);
      pctx.drawImage(canvas, 0, posY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const sliceHInPdf = sliceH * ratio;
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        pc.toDataURL('image/jpeg', 0.95),
        'JPEG',
        MARGEM_MM,
        MARGEM_MM,
        usableW,
        sliceHInPdf
      );

      posY = corteFinal;
      pageIndex++;
    }
  }

  // ==========================================================
  // 5. RODAPÉ em todas as páginas
  // ==========================================================
  if (comRodape) {
    const total = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      desenharRodape(pdf, i);
    }
  }

  // ==========================================================
  // 6. SALVA
  // ==========================================================
  pdf.save(`${nomeArquivo}.pdf`);
}

export default gerarPDF;