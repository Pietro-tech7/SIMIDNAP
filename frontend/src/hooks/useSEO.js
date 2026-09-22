import { useEffect } from 'react';

/**
 * Hook para aplicar SEO dinâmico.
 *
 * Recebe um objeto com:
 * - title       → <title> da página
 * - description → <meta name="description">
 * - image       → <meta property="og:image">
 * - url         → <meta property="og:url">
 *
 * Aplica também Open Graph (WhatsApp/Facebook) e Twitter Card.
 * Atualiza as tags se já existirem, cria se não existirem.
 */
export function useSEO({ title, description, image, url } = {}) {
  useEffect(() => {
    if (!title && !description) return;

    // ============================================================
    // HELPER — Aplicar meta tag
    // ============================================================
    const setMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    };

    // ============================================================
    // 1. Título da página
    // ============================================================
    if (title) {
      document.title = title;
    }

    // ============================================================
    // 2. Meta description
    // ============================================================
    if (description) {
      setMeta('meta[name="description"]', {
        name: 'description',
        content: description,
      });
    }

    // ============================================================
    // 3. Open Graph (WhatsApp, Facebook, LinkedIn)
    // ============================================================
    if (title) {
      setMeta('meta[property="og:title"]', {
        property: 'og:title',
        content: title,
      });
    }
    if (description) {
      setMeta('meta[property="og:description"]', {
        property: 'og:description',
        content: description,
      });
    }
    if (image) {
      setMeta('meta[property="og:image"]', {
        property: 'og:image',
        content: image,
      });
    }
    if (url) {
      setMeta('meta[property="og:url"]', {
        property: 'og:url',
        content: url,
      });
    }
    setMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: 'website',
    });
    setMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: 'SIMIDNAPE PRO',
    });

    // ============================================================
    // 4. Twitter Card
    // ============================================================
    setMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: image ? 'summary_large_image' : 'summary',
    });
    if (title) {
      setMeta('meta[name="twitter:title"]', {
        name: 'twitter:title',
        content: title,
      });
    }
    if (description) {
      setMeta('meta[name="twitter:description"]', {
        name: 'twitter:description',
        content: description,
      });
    }
    if (image) {
      setMeta('meta[name="twitter:image"]', {
        name: 'twitter:image',
        content: image,
      });
    }
  }, [title, description, image, url]);
}

export default useSEO;