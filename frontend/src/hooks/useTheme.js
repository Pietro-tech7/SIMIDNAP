import { useEffect, useState, useCallback } from 'react';
import api from '../api/api';

// ============================================================
// TEMA PADRÃO SIMIDNAPE — usado como fallback
// quando o backend não responde
// ============================================================
const DEFAULT_THEME = {
  colors: {
    primary:        '#F59E0B',
    accent:         '#2C5F7C',
    bg_light:       '#FDFBF7',
    bg_dark:        '#1E3A4C',
    text_primary:   '#1F2937',
    text_secondary: '#4B5563',
    success:        '#7FA88D',
    warning:        '#E07856',
    highlight:      '#D4A843',
  },
  fonts: {
    font_heading: 'Quicksand',
    font_body:    'Inter',
    font_accent:  'Lora',
  },
};

// ============================================================
// MAPA DE FAMÍLIAS DE FONTE
// (nome amigável → font-family CSS completa)
// ============================================================
const FONT_STACKS = {
  'Quicksand':        "'Quicksand', system-ui, -apple-system, sans-serif",
  'Inter':            "'Inter', system-ui, -apple-system, sans-serif",
  'Lora':             "'Lora', Georgia, 'Times New Roman', serif",
  'JetBrains Mono':   "'JetBrains Mono', ui-monospace, monospace",
  'Poppins':          "'Poppins', system-ui, -apple-system, sans-serif",
  'Playfair Display': "'Playfair Display', Georgia, serif",
  'Nunito':           "'Nunito', system-ui, -apple-system, sans-serif",
  'Merriweather':     "'Merriweather', Georgia, serif",
  'Montserrat':       "'Montserrat', system-ui, -apple-system, sans-serif",
  'Open Sans':        "'Open Sans', system-ui, -apple-system, sans-serif",
  'Roboto':           "'Roboto', system-ui, -apple-system, sans-serif",
  'Raleway':          "'Raleway', system-ui, -apple-system, sans-serif",
};

// ============================================================
// APLICA O TEMA COMO CSS VARIABLES NO <html>
// ============================================================
const aplicarTemaNoDOM = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const { colors = {}, fonts = {} } = theme || {};

  // ---- Cores ----
  const coresFinais = { ...DEFAULT_THEME.colors, ...colors };
  Object.entries(coresFinais).forEach(([key, value]) => {
    const cssVar = `--theme-${key.replace(/_/g, '-')}`;
    root.style.setProperty(cssVar, value);
  });

  // ---- Fontes ----
  const fontesFinais = { ...DEFAULT_THEME.fonts, ...fonts };
  Object.entries(fontesFinais).forEach(([key, value]) => {
    const cssVar = `--theme-${key.replace(/_/g, '-')}`;
    const stack = FONT_STACKS[value] || value;
    root.style.setProperty(cssVar, stack);
  });
};

// ============================================================
// HOOK useTheme
// Busca o tema do backend, aplica no <html> e expõe os valores.
// ============================================================
export const useTheme = () => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/theme/config');
      const config = res.data?.config || DEFAULT_THEME;
      setTheme(config);
      aplicarTemaNoDOM(config);
    } catch (err) {
      // Fallback silencioso — aplica os padrões
      aplicarTemaNoDOM(DEFAULT_THEME);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    carregar();

    // Escuta evento global para recarregar tema (útil quando admin salva)
    const handler = () => carregar();
    window.addEventListener('theme-updated', handler);
    return () => window.removeEventListener('theme-updated', handler);
  }, [carregar]);

  return { theme, loaded, recarregar: carregar };
};

export default useTheme;