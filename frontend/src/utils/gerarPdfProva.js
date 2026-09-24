import { gerarPDF } from './pdf';

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
// CABEÇALHO (com tabela para alinhamento perfeito)
// ============================================================
function montarCabecalho(cabecalho) {
  if (!cabecalho) return '';

  const tipoEscola = cabecalho.tipo_escola || 'ESCOLA MUNICIPAL';
  const nomeEscola = cabecalho.nome_escola || '';
  const labelEscola = tipoEscola === 'OUTRO' ? nomeEscola : `${tipoEscola}: ${nomeEscola}`;

  return `
    <div style="margin-bottom: 14px;">
      <!-- Linha 1: logos próximas do texto central -->
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

      <!-- Linha 2: dados em tabela -->
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
// ILUSTRAÇÃO — sem nenhuma mensagem
// ============================================================
function montarIlustracao(questao) {
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
    return ''; // sem imagem, sem nada
  }

  if (tipo === 'espaco') {
    // Área reservada em branco, sem texto
    return `
      <div style="margin: 12px 0; border: 1px dashed #d1d5db; height: 100px;"></div>
    `;
  }

  if (tipo === 'automatica') {
    // Se tiver ícone (futuro, Bloco 4.5), mostra. Se não tiver, NÃO mostra nada.
    if (ilust.imagem) {
      return `
        <div style="margin: 12px 0; text-align: center;">
          <img src="${ilust.imagem}" style="max-width: 200px; max-height: 150px; object-fit: contain;" />
        </div>
      `;
    }
    return ''; // sem SVG ainda, deixa em branco (sem mensagens)
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
// FUNÇÕES PÚBLICAS (prova e gabarito SEPARADAS)
// ============================================================
export async function gerarProvaPDF({ titulo, cabecalho, questoes }) {
  if (!questoes || questoes.length === 0) throw new Error('Sem questões.');

  const html = `
    <div style="padding: 10px;">
      ${montarCabecalho(cabecalho)}
      <div style="text-align: center; margin: 14px 0 18px; font-weight: bold; font-size: 13px; text-transform: uppercase;">
        ${escapeHtml(titulo)}
      </div>
      ${montarQuestoes(questoes)}
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

// Compatível com chamada anterior
export async function gerarPdfsDaProva(dados) {
  await gerarProvaPDF(dados);
  await new Promise(r => setTimeout(r, 1500));
  await gerarGabaritoPDF(dados);
  return { sucesso: true };
}