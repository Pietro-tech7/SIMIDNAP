// ============================================================
// BIBLIOTECA DE ÍCONES (Fase A - MVP)
// Mapeia palavras-chave da descrição → caminho do SVG
// ============================================================

// Ordem de prioridade importa: termos mais específicos primeiro
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
];

// Cache de data URLs (evita re-fetch)
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
// BUSCA o ícone mais adequado para uma descrição
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
// HELPER — para uso direto em componentes React
// ============================================================
export async function buscarEcarregarIcone(descricao) {
  const caminho = buscarIcone(descricao);
  if (!caminho) return null;
  return await carregarIconeComoDataURL(caminho);
}