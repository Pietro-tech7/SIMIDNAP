import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Gera um PDF a partir de um elemento HTML e baixa automaticamente.
 * Usa html2canvas-pro (suporte a Tailwind v4 / oklch).
 *
 * Slicing inteligente:
 * - Antes de cortar uma página, o algoritmo analisa as linhas de pixel
 *   ao redor do ponto de corte.
 * - Se a linha de corte cair em texto (pixels escuros), ele sobe o corte
 *   até a linha em branco mais próxima acima.
 * - Resultado: as páginas terminam em espaços, não no meio de palavras.
 *
 * @param {HTMLElement} elemento - O elemento DOM que será convertido em PDF
 * @param {string} nomeArquivo - Nome do arquivo PDF (sem .pdf)
 */
export async function gerarPDF(elemento, nomeArquivo = 'documento') {
  if (!elemento) {
    throw new Error('Elemento não encontrado.');
  }

  // ============================================================
  // 1. Captura o elemento como canvas
  // ============================================================
  let canvas;
  try {
    canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: elemento.scrollWidth,
      windowHeight: elemento.scrollHeight,
    });
  } catch (err) {
    console.error('[PDF] Falha ao capturar o elemento:', err);
    throw new Error('Falha ao processar o conteúdo para PDF.');
  }

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('O conteúdo capturado está vazio.');
  }

  // ============================================================
  // 2. Configuração do PDF em A4 retrato com margens
  // ============================================================
  const MARGEM_MM = 10; // margem de 10mm em cada lado

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const pdfUsableWidth = pdfWidth - MARGEM_MM * 2;
  const pdfUsableHeight = pdfHeight - MARGEM_MM * 2;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Razão mm / pixel do canvas
  const ratio = pdfUsableWidth / canvasWidth;
  const canvasHeightInPdf = canvasHeight * ratio;

  // ============================================================
  // 3. Uma página só
  // ============================================================
  if (canvasHeightInPdf <= pdfUsableHeight) {
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', MARGEM_MM, MARGEM_MM, pdfUsableWidth, canvasHeightInPdf);
    pdf.save(`${nomeArquivo}.pdf`);
    return;
  }

  // ============================================================
  // 4. Múltiplas páginas com slicing inteligente
  // ============================================================
  const ctxOriginal = canvas.getContext('2d');
  const alturaPaginaEmPx = pdfUsableHeight / ratio; // altura de uma página em pixels do canvas

  // ---- Função: verifica se uma linha horizontal é "branca" (sem texto) ----
  // Retorna true se ~99% dos pixels da linha forem brancos/claros
  const linhaBranca = (y) => {
    if (y < 0 || y >= canvasHeight) return false;
    const data = ctxOriginal.getImageData(0, y, canvasWidth, 1).data;
    let pixelsEscuros = 0;
    // Amostra de 4 em 4 pixels para performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Considera "escuro" se a luminância for baixa
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 220) pixelsEscuros++;
    }
    const totalAmostras = data.length / 16;
    return pixelsEscuros / totalAmostras < 0.01; // menos de 1% de pixels escuros
  };

  // ---- Função: encontra o melhor ponto de corte perto do limite ----
  // Sobe a partir de yInicial até achar uma linha branca
  const encontrarPontoDeCorte = (yInicial, yMinimo) => {
    let y = yInicial;
    let tentativas = 0;
    const maxTentativas = 200; // limite de busca (evita loop infinito)
    while (y > yMinimo && tentativas < maxTentativas) {
      if (linhaBranca(y)) return y;
      y--;
      tentativas++;
    }
    // Se não achou linha branca, corta no ponto original mesmo
    return yInicial;
  };

  // ---- Itera pelas páginas ----
  let positionY = 0;
  let pageIndex = 0;

  while (positionY < canvasHeight) {
    // Ponto onde seria o corte "cru"
    const corteCru = Math.min(positionY + alturaPaginaEmPx, canvasHeight);

    // Se não é a última página, tenta achar ponto de corte inteligente
    let corteFinal = corteCru;
    if (corteCru < canvasHeight) {
      corteFinal = encontrarPontoDeCorte(corteCru, positionY + alturaPaginaEmPx * 0.6);
    }

    const sliceHeight = corteFinal - positionY;

    // Cria canvas temporário com a fatia
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvasWidth;
    pageCanvas.height = sliceHeight;
    const ctx = pageCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0, positionY, canvasWidth, sliceHeight,
      0, 0, canvasWidth, sliceHeight
    );

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    const sliceHeightInPdf = sliceHeight * ratio;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(pageImgData, 'JPEG', MARGEM_MM, MARGEM_MM, pdfUsableWidth, sliceHeightInPdf);

    positionY = corteFinal;
    pageIndex++;
  }

  // ============================================================
  // 5. Salva (baixa) o arquivo
  // ============================================================
  pdf.save(`${nomeArquivo}.pdf`);
}