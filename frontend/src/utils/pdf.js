import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Gera um PDF a partir de um elemento HTML e baixa automaticamente.
 * Usa html2canvas-pro (suporte a Tailwind v4 / oklch).
 *
 * @param {HTMLElement} elemento - O elemento DOM que será convertido em PDF
 * @param {string} nomeArquivo - Nome do arquivo PDF (sem .pdf)
 */
export async function gerarPDF(elemento, nomeArquivo = 'documento') {
  if (!elemento) {
    throw new Error('Elemento não encontrado.');
  }

  // ============================================================
  // 1. Captura o elemento como canvas (com suporte a oklch/Tailwind v4)
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
  // 2. Configura o PDF em A4 retrato
  // ============================================================
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = pdfWidth / canvasWidth;
  const scaledHeight = canvasHeight * ratio;

  // ============================================================
  // 3. Se cabe em uma página, adiciona direto
  // ============================================================
  if (scaledHeight <= pdfHeight) {
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, scaledHeight);
  } else {
    // ============================================================
    // 4. Multi-página: fatia o canvas em blocos do tamanho de uma página
    //    (abordagem correta — cada página recebe só a sua fatia)
    // ============================================================
    const pageHeightInCanvasPx = pdfHeight / ratio;
    let positionY = 0;
    let pageIndex = 0;

    while (positionY < canvasHeight) {
      const sliceHeight = Math.min(pageHeightInCanvasPx, canvasHeight - positionY);

      // Cria um canvas temporário do tamanho da fatia
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      // Desenha apenas a fatia correspondente
      ctx.drawImage(
        canvas,
        0, positionY, canvasWidth, sliceHeight,
        0, 0, canvasWidth, sliceHeight
      );

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        pageImgData,
        'JPEG',
        0, 0,
        pdfWidth,
        sliceHeight * ratio
      );

      positionY += sliceHeight;
      pageIndex++;
    }
  }

  // ============================================================
  // 5. Salva (baixa) o arquivo
  // ============================================================
  pdf.save(`${nomeArquivo}.pdf`);
}