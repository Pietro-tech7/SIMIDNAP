import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * Componente que renderiza texto com suporte a LaTeX.
 *
 * Detecta:
 *   - $...$    → fórmula inline (no meio do texto)
 *   - $$...$$  → fórmula em bloco (destacada, centralizada)
 *   - \(...\)  → fórmula inline (alternativa LaTeX)
 *   - \[...\]  → fórmula em bloco (alternativa LaTeX)
 *
 * Uso:
 *   <LatexText text="Resolva $x^2 + 5x + 6 = 0$" />
 *   <LatexText text="A fórmula é: $$\Delta = b^2 - 4ac$$" />
 *
 * @param {string} text - Texto com ou sem fórmulas LaTeX
 * @param {string} className - Classes CSS extras
 */
const LatexText = ({ text, className = '' }) => {
  if (!text) return null;

  // Se o texto não é string, converte para string
  const conteudo = typeof text === 'string' ? text : String(text);

  // Regex que captura blocos e fórmulas inline, em ordem de prioridade:
  // 1. $$...$$   (bloco — deve vir antes de $...$)
  // 2. \[...\]   (bloco)
  // 3. $...$     (inline)
  // 4. \(...\)   (inline)
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([^)]+?\\\))/g;

  const partes = conteudo.split(regex);

  return (
    <span className={className}>
      {partes.map((parte, i) => {
        if (!parte) return null;

        // Bloco $$...$$
        if (parte.startsWith('$$') && parte.endsWith('$$')) {
          const formula = parte.slice(2, -2).trim();
          return (
            <span key={i} className="block my-3 text-center overflow-x-auto">
              <BlockMath math={formula} errorColor="#cc0000" />
            </span>
          );
        }

        // Bloco \[...\]
        if (parte.startsWith('\\[') && parte.endsWith('\\]')) {
          const formula = parte.slice(2, -2).trim();
          return (
            <span key={i} className="block my-3 text-center overflow-x-auto">
              <BlockMath math={formula} errorColor="#cc0000" />
            </span>
          );
        }

        // Inline $...$
        if (parte.startsWith('$') && parte.endsWith('$') && parte.length > 2) {
          const formula = parte.slice(1, -1).trim();
          return (
            <InlineMath key={i} math={formula} errorColor="#cc0000" />
          );
        }

        // Inline \(...\)
        if (parte.startsWith('\\(') && parte.endsWith('\\)')) {
          const formula = parte.slice(2, -2).trim();
          return (
            <InlineMath key={i} math={formula} errorColor="#cc0000" />
          );
        }

        // Texto normal — renderiza com suporte a quebras de linha
        return (
          <React.Fragment key={i}>
            {parte.split('\n').map((linha, j, arr) => (
              <React.Fragment key={j}>
                {linha}
                {j < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export default LatexText;