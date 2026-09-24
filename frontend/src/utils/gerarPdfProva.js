import { gerarPDF } from './pdf';

/**
 * Gera os 2 PDFs da prova (Prova + Gabarito) a partir dos dados fornecidos.
 * Reutiliza a função gerarPDF (com slicing inteligente) já existente.
 */

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
  return (texto || 'prova')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 60);
}

function criarContainer(htmlConteudo) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '820px';
  container.style.background = '#ffffff';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, Helvetica, sans-serif';
  container.style.color = '#000';
  container.innerHTML = htmlConteudo;
  document.body.appendChild(container);
  return container;
}


// ============================================================
// CABEÇALHO (usado nos dois PDFs)
// ============================================================
function montarCabecalho(cabecalho, compacto = false) {
  if (!cabecalho) return '';

  const tipoEscola = cabecalho.tipo_escola || 'ESCOLA MUNICIPAL';
  const nomeEscola = cabecalho.nome_escola || '';
  const labelEscola = tipoEscola === 'OUTRO' ? nomeEscola : `${tipoEscola}: ${nomeEscola}`;

  const linhasCentrais = [
    cabecalho.secretaria,
    cabecalho.endereco,
    [cabecalho.cep && `CEP: ${cabecalho.cep}`, cabecalho.cidade_estado].filter(Boolean).join(' - '),
    [cabecalho.telefone && `FONE: ${cabecalho.telefone}`, cabecalho.email].filter(Boolean).join(' • '),
  ].filter(Boolean);

  return `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
        <div style="width: 80px; height: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          ${cabecalho.logo_prefeitura
            ? `<img src="${cabecalho.logo_prefeitura}" alt="Logo" style="max-width: 80px; max-height: 80px; object-fit: contain;" />`
            : ''}
        </div>

        <div style="flex: 1; text-align: center; font-size: 11px; line-height: 1.4;">
          ${linhasCentrais.map(l => `<div>${escapeHtml(l)}</div>`).join('')}
        </div>

        <div style="width: 80px; height: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          ${cabecalho.logo_escola
            ? `<img src="${cabecalho.logo_escola}" alt="Logo" style="max-width: 80px; max-height: 80px; object-fit: contain;" />`
            : ''}
        </div>
      </div>

      <div style="border-top: 1px solid #000; padding-top: 8px; font-size: 11px; line-height: 1.6;">
        ${nomeEscola ? `<div style="font-weight: bold; margin-bottom: 4px;">${escapeHtml(labelEscola)}</div>` : ''}

        ${!compacto ? `
          <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <div style="flex: 1;">
              <strong>DIRETOR(A):</strong> ${escapeHtml(cabecalho.diretor) || '____________________'}
            </div>
            <div style="flex: 1;">
              <strong>COORDENADOR(A):</strong> ${escapeHtml(cabecalho.coordenador) || '____________________'}
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <div style="flex: 1;">
              <strong>PROFESSOR(A):</strong> ${escapeHtml(cabecalho.professor) || '____________________'}
            </div>
            <div style="flex: 1;">
              <strong>TURMA:</strong> ____________________
            </div>
            <div style="flex: 0 0 160px;">
              <strong>TURNO:</strong> ( ) MANHÃ  ( ) TARDE
            </div>
          </div>
          <div style="border-top: 1px solid #ccc; margin-top: 8px; padding-top: 6px;">
            <strong>NOME DO ALUNO:</strong> _____________________________________________________________
          </div>
          <div style="margin-top: 3px;">
            <strong>DATA:</strong> ____/_____/__________
          </div>
        ` : ''}
      </div>
    </div>
  `;
}


// ============================================================
// ILUSTRAÇÃO (renderiza conforme opção escolhida)
// ============================================================
function montarIlustracao(questao) {
  const ilust = questao.ilustracao || { tipo: 'automatica' };
  const tipo = ilust.tipo;

  if (tipo === 'nenhuma') return '';

  if (tipo === 'personalizada' && ilust.imagem) {
    return `
      <div style="margin: 12px 0; text-align: center;">
        <img src="${ilust.imagem}" alt="Ilustração" style="max-width: 320px; max-height: 200px; object-fit: contain;" />
      </div>
    `;
  }

  if (tipo === 'espaco') {
    return `
      <div style="margin: 12px 0; border: 1px dashed #999; height: 100px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">
        (Cole sua ilustração aqui)
      </div>
    `;
  }

  if (tipo === 'automatica') {
    // Por enquanto: placeholder com a descrição sugerida pela IA
    // Quando a biblioteca de ícones SVG estiver pronta (Bloco 4.5), trocaremos por <img> do SVG
    const descricao = questao.descricao_ilustracao || 'Ilustração';
    return `
      <div style="margin: 12px 0; border: 1px dashed #d4a017; background: #fffaf0; padding: 8px; font-size: 9px; color: #8a6d00; text-align: center;">
        🎨 <em>[Ilustração automática será exibida aqui: ${escapeHtml(descricao)}]</em>
      </div>
    `;
  }

  return '';
}


// ============================================================
// QUESTÕES (PDF da Prova)
// ============================================================
function montarQuestoes(questoes) {
  return questoes.map((q, idx) => `
    <div style="margin-bottom: 22px; page-break-inside: avoid;">
      <div style="font-weight: bold; margin-bottom: 6px; font-size: 12px;">
        ${idx + 1}) ${escapeHtml(q.enunciado)}
      </div>

      ${q.imagem_url ? `<div style="margin: 8px 0; text-align: center;"><img src="${q.imagem_url}" style="max-width: 100%; max-height: 250px;" /></div>` : ''}

      ${montarIlustracao(q)}

      <div style="margin-top: 8px; font-size: 11px; line-height: 1.7;">
        ${(q.alternativas || []).map(a => `
          <div style="margin-bottom: 2px;">
            <strong>(${escapeHtml(a.letra)})</strong> ${escapeHtml(a.texto)}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}


// ============================================================
// GABARITO (PDF do Gabarito)
// ============================================================
function montarGabaritoQuestoes(questoes) {
  return questoes.map((q, idx) => `
    <div style="margin-bottom: 20px; page-break-inside: avoid; border-left: 3px solid #2563eb; padding-left: 10px;">
      <div style="font-size: 12px; font-weight: bold; color: #1e40af; margin-bottom: 4px;">
        Questão ${idx + 1} — Gabarito: <span style="color: #059669;">${escapeHtml(q.gabarito)}</span>
      </div>

      ${q.habilidade_codigo ? `<div style="font-size: 10px; color: #666;">Habilidade: <strong>${escapeHtml(q.habilidade_codigo)}</strong>${q.habilidade_texto ? ' — ' + escapeHtml(q.habilidade_texto) : ''}</div>` : ''}
      ${q.descritor ? `<div style="font-size: 10px; color: #666;">Descritor: <strong>${escapeHtml(q.descritor)}</strong>${q.descritor_texto ? ' — ' + escapeHtml(q.descritor_texto) : ''}</div>` : ''}

      ${q.explicacao_gabarito ? `
        <div style="margin-top: 6px; font-size: 11px; line-height: 1.5; background: #f3f4f6; padding: 6px; border-radius: 4px;">
          <strong>Explicação:</strong> ${escapeHtml(q.explicacao_gabarito)}
        </div>
      ` : ''}
    </div>
  `).join('');
}


// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================
export async function gerarPdfsDaProva(dados) {
  const { titulo, cabecalho, questoes } = dados;

  if (!questoes || questoes.length === 0) {
    throw new Error('Nenhuma questão para gerar o PDF.');
  }

  const nomeBase = slug(titulo);

  // -------- PDF 1: PROVA --------
  const htmlProva = `
    <div style="padding: 10px;">
      ${montarCabecalho(cabecalho, false)}

      <div style="text-align: center; margin: 14px 0 18px; font-weight: bold; font-size: 14px; text-transform: uppercase;">
        ${escapeHtml(titulo)}
      </div>

      ${montarQuestoes(questoes)}
    </div>
  `;

  const containerProva = criarContainer(htmlProva);
  try {
    await gerarPDF(containerProva, `${nomeBase}_PROVA`);
  } finally {
    document.body.removeChild(containerProva);
  }

  // Pequena pausa entre os PDFs (evita concorrência no download)
  await new Promise(r => setTimeout(r, 800));

  // -------- PDF 2: GABARITO --------
  const htmlGabarito = `
    <div style="padding: 10px;">
      <div style="text-align: center; margin-bottom: 14px;">
        <div style="font-size: 16px; font-weight: bold;">GABARITO — ${escapeHtml(titulo)}</div>
        ${cabecalho?.professor ? `<div style="font-size: 11px; margin-top: 4px;">Professor(a): ${escapeHtml(cabecalho.professor)}</div>` : ''}
      </div>

      <div style="border-top: 1px solid #000; margin-bottom: 14px;"></div>

      ${montarGabaritoQuestoes(questoes)}
    </div>
  `;

  const containerGabarito = criarContainer(htmlGabarito);
  try {
    await gerarPDF(containerGabarito, `${nomeBase}_GABARITO`);
  } finally {
    document.body.removeChild(containerGabarito);
  }

  return {
    sucesso: true,
    arquivos: [`${nomeBase}_PROVA.pdf`, `${nomeBase}_GABARITO.pdf`],
  };
}