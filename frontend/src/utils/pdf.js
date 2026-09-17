import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Gera um PDF a partir de um elemento HTML e baixa automaticamente.
 * @param {HTMLElement} elemento - O elemento DOM que será convertido em PDF
 * @param {string} nomeArquivo - Nome do arquivo PDF (sem .pdf)
 */
export async function gerarPDF(elemento, nomeArquivo = 'documento') {
  if (!elemento) {
    throw new Error('Elemento não encontrado.');
  }

  // Captura o elemento como canvas com alta qualidade
  const canvas = await html2canvas(elemento, {
    scale: 2,              // 2x para melhor qualidade
    useCORS: true,          // Permite imagens externas
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4: 210 x 297 mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Calcula a altura proporcional da imagem no PDF
  const imgHeightInPdf = (imgHeight * pdfWidth) / imgWidth;

  if (imgHeightInPdf <= pdfHeight) {
    // Cabe em uma página
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeightInPdf);
  } else {
    // Múltiplas páginas
    let alturaRestante = imgHeightInPdf;
    let posicaoY = 0;

    while (alturaRestante > 0) {
      pdf.addImage(imgData, 'JPEG', 0, posicaoY, pdfWidth, imgHeightInPdf);
      alturaRestante -= pdfHeight;

      if (alturaRestante > 0) {
        pdf.addPage();
        posicaoY = -pdfHeight * (pdf.getNumberOfPages() - 1);
      }
    }
  }

  // Salva o arquivo (baixa automaticamente)
  pdf.save(`${nomeArquivo}.pdf`);
}