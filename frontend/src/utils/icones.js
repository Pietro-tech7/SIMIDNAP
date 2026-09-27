// ============================================================
// BIBLIOTECA DE ÍCONES
// Suporta dois modos:
//   1) Busca por palavra-chave (buscarIcone) — legado
//   2) Busca por categoria pedagógica (buscarSvgsPorCategoria) — Fase 3
// ============================================================

// ============================================================
// MAPA DE PALAVRAS-CHAVE → SVG (modo legado, mantido)
// Ordem de prioridade importa: termos mais específicos primeiro
// ============================================================
const MAPA_ICONES = [
  // --- NÚMEROS ---
  { chave: 'reta numérica', path: 'numeros/reta-numerica.svg' },
  { chave: 'reta numerica', path: 'numeros/reta-numerica.svg' },
  { chave: 'dez', path: 'numeros/10.svg' },
  { chave: 'nove', path: 'numeros/9.svg' },
  { chave: 'oito', path: 'numeros/8.svg' },
  { chave: 'sete', path: 'numeros/7.svg' },
  { chave: 'seis', path: 'numeros/6.svg' },
  { chave: 'cinco', path: 'numeros/5.svg' },
  { chave: 'quatro', path: 'numeros/4.svg' },
  { chave: 'três', path: 'numeros/3.svg' },
  { chave: 'tres', path: 'numeros/3.svg' },
  { chave: 'dois', path: 'numeros/2.svg' },
  { chave: 'um', path: 'numeros/1.svg' },

  // --- FORMAS ---
  { chave: 'quadrado', path: 'formas/quadrado.svg' },
  { chave: 'círculo', path: 'formas/circulo.svg' },
  { chave: 'circulo', path: 'formas/circulo.svg' },
  { chave: 'triângulo', path: 'formas/triangulo.svg' },
  { chave: 'triangulo', path: 'formas/triangulo.svg' },
  { chave: 'retângulo', path: 'formas/retangulo.svg' },
  { chave: 'retangulo', path: 'formas/retangulo.svg' },
  { chave: 'losango', path: 'formas/losango.svg' },
  { chave: 'estrela', path: 'formas/estrela.svg' },
  { chave: 'coração', path: 'formas/coracao.svg' },
  { chave: 'coracao', path: 'formas/coracao.svg' },
  { chave: 'hexágono', path: 'formas/hexagono.svg' },
  { chave: 'hexagono', path: 'formas/hexagono.svg' },

  // --- OBJETOS ESCOLARES ---
  { chave: 'lápis', path: 'objetos/lapis.svg' },
  { chave: 'lapis', path: 'objetos/lapis.svg' },
  { chave: 'caderno', path: 'objetos/caderno.svg' },
  { chave: 'borracha', path: 'objetos/borracha.svg' },
  { chave: 'régua', path: 'objetos/regua.svg' },
  { chave: 'regua', path: 'objetos/regua.svg' },
  { chave: 'tesoura', path: 'objetos/tesoura.svg' },
  { chave: 'mochila', path: 'objetos/mochila.svg' },

  // --- GENÉRICOS ---
  { chave: 'bola', path: 'genericos/bola.svg' },
  { chave: 'carrinho', path: 'genericos/carrinho.svg' },
  { chave: 'balão', path: 'genericos/balao.svg' },
  { chave: 'balao', path: 'genericos/balao.svg' },
  { chave: 'maçã', path: 'genericos/maca.svg' },
  { chave: 'maca', path: 'genericos/maca.svg' },
  { chave: 'livro', path: 'genericos/livro.svg' },
  { chave: 'dado', path: 'genericos/dado.svg' },
  { chave: 'moeda', path: 'genericos/moeda.svg' },
  { chave: 'presente', path: 'genericos/presente.svg' },
  { chave: 'troféu', path: 'genericos/trofeu.svg' },
  { chave: 'trofeu', path: 'genericos/trofeu.svg' },

  // --- ORDEM (Fase 3) ---
  { chave: 'pódio', path: 'ordem/podio.svg' },
  { chave: 'podio', path: 'ordem/podio.svg' },
  { chave: 'fila', path: 'ordem/fila.svg' },
  { chave: 'estante', path: 'ordem/estante.svg' },
  { chave: 'escada', path: 'ordem/escada.svg' },
  { chave: 'ranking', path: 'ordem/ranking.svg' },

  // --- MEDIDA (Fase 3) ---
  { chave: 'balança', path: 'medida/balanca.svg' },
  { chave: 'balanca', path: 'medida/balanca.svg' },
  { chave: 'relógio', path: 'medida/relogio.svg' },
  { chave: 'relogio', path: 'medida/relogio.svg' },
  { chave: 'termômetro', path: 'medida/termometro.svg' },
  { chave: 'termometro', path: 'medida/termometro.svg' },

  // --- DECOMPOSIÇÃO (Fase 3) ---
  { chave: 'material dourado', path: 'decomposicao/material-dourado.svg' },
  { chave: 'ábaco', path: 'decomposicao/abaco.svg' },
  { chave: 'abaco', path: 'decomposicao/abaco.svg' },
  { chave: 'centena', path: 'decomposicao/bloco-centena.svg' },
  { chave: 'dezena', path: 'decomposicao/bloco-dezena.svg' },
  { chave: 'unidade', path: 'decomposicao/bloco-unidade.svg' },

  // --- SEQUÊNCIA (Fase 3) ---
  { chave: 'sequência', path: 'sequencia/seta-sequencia.svg' },
  { chave: 'sequencia', path: 'sequencia/seta-sequencia.svg' },
  { chave: 'padrão', path: 'sequencia/padrao-geometrico.svg' },
  { chave: 'padrao', path: 'sequencia/padrao-geometrico.svg' },
];

// ============================================================
// MAPA DE CATEGORIA PEDAGÓGICA → LISTA DE SVGs (Fase 3)
// A chave é o valor do campo "tipo_figura_sugerida" que a IA devolve.
// ============================================================
const SVGS_POR_CATEGORIA = {
  quantidade: [
    'genericos/bola.svg',
    'genericos/maca.svg',
    'genericos/balao.svg',
    'genericos/carrinho.svg',
    'genericos/presente.svg',
    'genericos/dado.svg',
    'objetos/lapis.svg',
    'objetos/borracha.svg',
  ],
  ordem: [
    'ordem/fila.svg',
    'ordem/podio.svg',
    'ordem/estante.svg',
    'ordem/ranking.svg',
    'ordem/escada.svg',
    'ordem/seta-posicao.svg',
    'genericos/trofeu.svg',
  ],
  medida: [
    'medida/balanca.svg',
    'medida/relogio.svg',
    'medida/termometro.svg',
    'medida/fita-metrica.svg',
    'medida/jarra.svg',
    'medida/ampulheta.svg',
    'objetos/regua.svg',
  ],
  decomposicao: [
    'decomposicao/bloco-centena.svg',
    'decomposicao/bloco-dezena.svg',
    'decomposicao/bloco-unidade.svg',
    'decomposicao/material-dourado.svg',
    'decomposicao/abaco.svg',
    'decomposicao/valor-posicional.svg',
  ],
  sequencia: [
    'sequencia/seta-sequencia.svg',
    'sequencia/padrao-geometrico.svg',
    'sequencia/serie-numerica.svg',
    'sequencia/escada-numerica.svg',
    'sequencia/linha-tempo.svg',
    'sequencia/ciclo.svg',
    'numeros/reta-numerica.svg',
  ],
  comparacao: [
    'comparacao/duas-colunas.svg',
    'comparacao/comparar-grupos.svg',
    'comparacao/sinal-maior.svg',
    'comparacao/sinal-menor.svg',
    'comparacao/sinal-igual.svg',
    'comparacao/maior-menor.svg',
  ],
  objetos_escolares: [
    'objetos/lapis.svg',
    'objetos/caderno.svg',
    'objetos/borracha.svg',
    'objetos/regua.svg',
    'objetos/tesoura.svg',
    'objetos/mochila.svg',
    'genericos/livro.svg',
  ],
  formas: [
    'formas/quadrado.svg',
    'formas/circulo.svg',
    'formas/triangulo.svg',
    'formas/retangulo.svg',
    'formas/losango.svg',
    'formas/estrela.svg',
    'formas/coracao.svg',
    'formas/hexagono.svg',
  ],
  numeros: [
    'numeros/1.svg',
    'numeros/2.svg',
    'numeros/3.svg',
    'numeros/4.svg',
    'numeros/5.svg',
    'numeros/6.svg',
    'numeros/7.svg',
    'numeros/8.svg',
    'numeros/9.svg',
    'numeros/10.svg',
    'numeros/reta-numerica.svg',
  ],
  nenhuma: [],
};


// ============================================================
// CACHE de data URLs (evita re-fetch)
// ============================================================
const CACHE = {};


// ============================================================
// NORMALIZA texto para busca (remove acentos e lowercase)
// ============================================================
function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}


// ============================================================
// BUSCA o ícone mais adequado para uma descrição (modo legado)
// ============================================================
export function buscarIcone(descricao) {
  if (!descricao) return null;
  const desc = normalizar(descricao);

  for (const item of MAPA_ICONES) {
    const chave = normalizar(item.chave);
    if (desc.includes(chave)) {
      return item.path;
    }
  }
  return null;
}


// ============================================================
// BUSCA SVGs por CATEGORIA PEDAGÓGICA (Fase 3)
// Retorna lista de paths da categoria.
// Se a categoria não existir, retorna lista vazia.
// ============================================================
export function buscarSvgsPorCategoria(categoria) {
  if (!categoria) return [];
  const cat = String(categoria).toLowerCase().trim();
  return SVGS_POR_CATEGORIA[cat] || [];
}


// ============================================================
// Retorna TODAS as categorias disponíveis (útil para debug/UI)
// ============================================================
export function listarCategorias() {
  return Object.keys(SVGS_POR_CATEGORIA);
}


// ============================================================
// CARREGA um SVG como Data URL (base64) — cacheado
// ============================================================
export async function carregarIconeComoDataURL(caminho) {
  if (!caminho) return null;
  if (CACHE[caminho]) return CACHE[caminho];

  try {
    const res = await fetch(`/icons/${caminho}`);
    if (!res.ok) return null;
    const svg = await res.text();

    // Converte para data URL base64 (mais compatível com html2canvas)
    const b64 = btoa(unescape(encodeURIComponent(svg)));
    const dataUrl = `data:image/svg+xml;base64,${b64}`;
    CACHE[caminho] = dataUrl;
    return dataUrl;
  } catch {
    return null;
  }
}


// ============================================================
// CARREGA vários SVGs de uma categoria de uma vez (Fase 3)
// Retorna [{ caminho, dataUrl }, ...]
// ============================================================
export async function carregarSvgsDaCategoria(categoria) {
  const caminhos = buscarSvgsPorCategoria(categoria);
  if (caminhos.length === 0) return [];

  const resultados = await Promise.all(
    caminhos.map(async (caminho) => {
      const dataUrl = await carregarIconeComoDataURL(caminho);
      return { caminho, dataUrl };
    })
  );

  // Remove os que falharam ao carregar
  return resultados.filter(r => r.dataUrl);
}


// ============================================================
// HELPER — busca por descrição + carrega (modo legado)
// ============================================================
export async function buscarEcarregarIcone(descricao) {
  const caminho = buscarIcone(descricao);
  if (!caminho) return null;
  return await carregarIconeComoDataURL(caminho);
}