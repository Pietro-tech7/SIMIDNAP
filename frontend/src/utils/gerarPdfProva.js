import { gerarPDF } from './pdf';
import { buscarIcone, carregarIconeComoDataURL } from './icones';

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
// CABEÇALHO
// ============================================================
function montarCabecalho(cabecalho) {
  if (!cabecalho) return '';

  const tipoEscola = cabecalho.tipo_escola || 'ESCOLA MUNICIPAL';
  const nomeEscola = cabecalho.nome_escola || '';
  const labelEscola = tipoEscola === 'OUTRO' ? nomeEscola : `${tipoEscola}: ${nomeEscola}`;

  return `
    <div style="margin-bottom: 14px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 70px; height: 70px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          ${cabecalho.logo_prefeitura ? `<img src="${cabecalho.logo_prefeitura}" style="max-width: 70px; max-height: 70px; object-fit: contain;" />` : ''}
        </div>
        <div style="flex: 0 1 500px; text-align: center; font-size: 10px; line-height: 1.4;">
          ${cabecalho.secretaria ? `<div style="font-weight: bold;">${escapeHtml(cabecalho.secretaria)}</div>` : ''}
          ${cabecalho.endereco ? `<div>${escapeHtml(cabecalho.endereco)}</div>` : ''}
          ${(cabecalho.cep || cabecalho.cidade_estado) ? `<div>${[cabecalho.cep && `CEP: ${cabecalho.cep}`, cabecalho.cidade_estado].filter(Boolean).map(escapeHtml).join(' - ')}</div>` : ''}
          ${(cabecalho.telefone || cabecalho.email) ? `<div>${[cabecalho.telefone && `FONE: ${cabecalho.telefone}`, cabecalho.email].filter(Boolean).map(escapeHtml).join(' • ')}</div>` : ''}
        </div>
        <div style="width: 70px; height: 70px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          ${cabecalho.logo_escola ? `<img src="${cabecalho.logo_escola}" style="max-width: 70px; max-height: 70px; object-fit: contain;" />` : ''}
        </div>
      </div>

      <table style="width: 100%; font-size: 10px; border-top: 1px solid #000; padding-top: 6px; border-collapse: collapse;">
        <tbody>
          ${nomeEscola ? `<tr><td colspan="2" style="padding: 3px 0; font-weight: bold;">${escapeHtml(labelEscola)}</td></tr>` : ''}
          <tr>
            <td style="padding: 3px 0; width: 50%;">
              <strong>DIRETOR(A):</strong> ${escapeHtml(cabecalho.diretor) || '___________________________'}
            </td>
            <td style="padding: 3px 0; width: 50%;">
              <strong>COORDENADOR(A):</strong> ${escapeHtml(cabecalho.coordenador) || '___________________________'}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">
              <strong>PROFESSOR(A):</strong> ${escapeHtml(cabecalho.professor) || '___________________________'}
            </td>
            <td style="padding: 3px 0;">
              <strong>TURMA:</strong> ${escapeHtml(cabecalho.turma) || '__________'}
              &nbsp;&nbsp;
              <strong>TURNO:</strong> ( ) MANHÃ &nbsp; ( ) TARDE
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 6px 0 3px; border-top: 1px solid #ccc;">
              <strong>NOME DO ALUNO:</strong> _____________________________________________________________
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 3px 0;">
              <strong>DATA:</strong> ____/_____/__________
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}


// ============================================================
// ILUSTRAÇÃO — com busca automática de SVG
// ============================================================
async function montarIlustracao(questao) {
  const ilust = questao.ilustracao || { tipo: 'automatica', imagem: null };
  const tipo = ilust.tipo;

  if (tipo === 'nenhuma') return '';

  if (tipo === 'personalizada') {
    if (ilust.imagem) {
      return `
        <div style="margin: 12px 0; text-align: center;">
          <img src="${ilust.imagem}" style="max-width: 320px; max-height: 200px; object-fit: contain;" />
        </div>
      `;
    }
    return '';
  }

  if (tipo === 'espaco') {
    return `
      <div style="margin: 12px 0; border: 1px dashed #d1d5db; height: 100px;"></div>
    `;
  }

  if (tipo === 'automatica') {
    if (ilust.imagem) {
      return `
        <div style="margin: 12px 0; text-align: center;">
          <img src="${ilust.imagem}" style="max-width: 200px; max-height: 150px; object-fit: contain;" />
        </div>
      `;
    }

    if (questao.descricao_ilustracao) {
      const caminho = buscarIcone(questao.descricao_ilustracao);
      if (caminho) {
        const dataUrl = await carregarIconeComoDataURL(caminho);
        if (dataUrl) {
          return `
            <div style="margin: 12px 0; text-align: center;">
              <img src="${dataUrl}" style="max-width: 160px; max-height: 120px; object-fit: contain;" />
            </div>
          `;
        }
      }
    }

    return '';
  }

  return '';
}


// ============================================================
// QUESTÕES (async — precisa resolver os ícones)
// ============================================================
async function montarQuestoes(questoes, opcoes = {}) {
  const { mostrarTemaCondutor = true, mostrarDescritor = false } = opcoes;
  const blocos = [];
  for (let idx = 0; idx < questoes.length; idx++) {
    const q = questoes[idx];
    const ilustracaoHtml = await montarIlustracao(q);

    // Fase 4 — faixa do tema condutor (opcional)
    const temaHtml = (mostrarTemaCondutor && q.tema_condutor)
      ? `<div style="background: #e5e7eb; color: #1f2937; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; margin-bottom: 6px; border-radius: 3px; display: inline-block;">${escapeHtml(q.tema_condutor)}</div>`
      : '';

    // Fase 4 — descritor abaixo da questão (opcional)
    const descritorHtml = (mostrarDescritor && q.descritor)
      ? `<div style="margin-top: 6px; font-size: 9px; color: #6b7280; font-style: italic;">Descritor: ${escapeHtml(q.descritor)}${q.descritor_texto ? ' — ' + escapeHtml(q.descritor_texto) : ''}</div>`
      : '';

    // Bloco de alternativas (HTML puro — o wrapper é aplicado abaixo).
    const alternativasHtml = (q.alternativas || []).map(a => `
      <div style="margin-bottom: 2px;">
        <strong>(${escapeHtml(a.letra)})</strong> ${escapeHtml(a.texto)}
      </div>
    `).join('');

    // Quando a questão tem uma IMAGEM escolhida (personalizada ou automática),
    // coloca as alternativas à esquerda e a imagem à direita, no mesmo bloco.
    // Aproveita o espaço vazio ao lado das alternativas.
    const _ilust = q.ilustracao || { tipo: 'automatica', imagem: null };
    const temImagemLado =
      (_ilust.tipo === 'personalizada' || _ilust.tipo === 'automatica') && !!_ilust.imagem;

    let corpoHtml;
    if (temImagemLado && ilustracaoHtml) {
      corpoHtml = `
        <div style="display: flex; align-items: flex-start; gap: 16px; margin-top: 8px; page-break-inside: avoid;">
          <div style="flex: 1 1 auto; min-width: 0; font-size: 11px; line-height: 1.7;">
            ${alternativasHtml}
          </div>
          <div style="flex: 0 0 auto;">
            ${ilustracaoHtml}
          </div>
        </div>
      `;
    } else {
      corpoHtml = `
        <div style="margin-top: 8px; font-size: 11px; line-height: 1.7;">
          ${alternativasHtml}
        </div>
        ${ilustracaoHtml}
      `;
    }

    blocos.push(`
      <div style="margin-bottom: 22px; page-break-inside: avoid;">
        ${temaHtml}
        <div style="font-weight: bold; margin-bottom: 6px; font-size: 12px;">
          ${idx + 1}) ${escapeHtml(q.enunciado)}
        </div>
        ${q.imagem_url ? `<div style="margin: 8px 0; text-align: center;"><img src="${q.imagem_url}" style="max-width: 100%; max-height: 250px;" /></div>` : ''}
        ${corpoHtml}
        ${descritorHtml}
      </div>
    `);
  }
  return blocos.join('');
}


// ============================================================
// GABARITO
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
// FUNÇÕES PÚBLICAS
// ============================================================
export async function gerarProvaPDF({ titulo, cabecalho, questoes, opcoes }) {
  if (!questoes || questoes.length === 0) throw new Error('Sem questões.');

  const questoesHtml = await montarQuestoes(questoes, opcoes || {});

  const html = `
    <div style="padding: 10px;">
      ${montarCabecalho(cabecalho)}
      <div style="text-align: center; margin: 14px 0 18px; font-weight: bold; font-size: 13px; text-transform: uppercase;">
        ${escapeHtml(titulo)}
      </div>
      ${questoesHtml}
    </div>
  `;

  const container = criarContainer(html);
  try {
    await gerarPDF(container, `${slug(titulo)}_PROVA`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function gerarGabaritoPDF({ titulo, cabecalho, questoes }) {
  if (!questoes || questoes.length === 0) throw new Error('Sem questões.');

  const html = `
    <div style="padding: 10px;">
      <div style="text-align: center; margin-bottom: 14px;">
        <div style="font-size: 15px; font-weight: bold;">GABARITO — ${escapeHtml(titulo)}</div>
        ${cabecalho?.professor ? `<div style="font-size: 11px; margin-top: 4px;">Professor(a): ${escapeHtml(cabecalho.professor)}</div>` : ''}
        ${cabecalho?.turma ? `<div style="font-size: 11px;">Turma: ${escapeHtml(cabecalho.turma)}</div>` : ''}
      </div>
      <div style="border-top: 1px solid #000; margin-bottom: 14px;"></div>
      ${montarGabaritoQuestoes(questoes)}
    </div>
  `;

  const container = criarContainer(html);
  try {
    await gerarPDF(container, `${slug(titulo)}_GABARITO`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function gerarPdfsDaProva(dados) {
  await gerarProvaPDF(dados);
  await new Promise(r => setTimeout(r, 1500));
  await gerarGabaritoPDF(dados);
  return { sucesso: true };
}