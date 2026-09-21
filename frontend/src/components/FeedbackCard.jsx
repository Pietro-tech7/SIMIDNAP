import React, { useState, useEffect } from 'react';
import api from '../api/api';

/**
 * Card de autoavaliação.
 * Exibe 3 botões (👍 🤔 👎) e campo de comentário opcional.
 * Envia o feedback para o backend.
 *
 * Props:
 *   - content_type: 'pratica_exitosa' | 'material' | 'neuroaula' | 'aula_que_funciona' | 'reflection' | 'pedagogical_case'
 *   - content_id: UUID do conteúdo
 *   - initialFeedback: (opcional) feedback já existente { rating, comment, created_at }
 */
const FeedbackCard = ({ content_type, content_id, initialFeedback = null }) => {
  const [rating, setRating] = useState(initialFeedback?.rating || null);
  const [comment, setComment] = useState(initialFeedback?.comment || '');
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [enviado, setEnviado] = useState(!!initialFeedback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialFeedback) {
      setRating(initialFeedback.rating);
      setComment(initialFeedback.comment || '');
      setEnviado(true);
    }
  }, [initialFeedback]);

  const handleEscolher = (novoRating) => {
    setRating(novoRating);
    setEnviado(false);
    setError('');
    // Sempre permite comentar (mesmo no positivo)
    setMostrarComentario(true);
  };

  const handleEnviar = async () => {
    if (!rating) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/feedback', {
        content_type,
        content_id,
        rating,
        comment: comment.trim() || null,
      });
      setEnviado(true);
      setMostrarComentario(false);
    } catch (err) {
      setError('Erro ao salvar avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = () => {
    setEnviado(false);
    setMostrarComentario(true);
  };

  // Rótulos por rating
  const rotulos = {
    positive: { texto: 'Ótimo!', cor: 'green', emoji: '👍' },
    partial: { texto: 'Em parte', cor: 'yellow', emoji: '🤔' },
    negative: { texto: 'Não era isso', cor: 'red', emoji: '👎' },
  };

  // ============================================================
  // Estado já enviado: mostra o feedback
  // ============================================================
  if (enviado && rating) {
    const r = rotulos[rating];
    const cores = {
      green: 'bg-green-50 border-green-200 text-green-900',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      red: 'bg-red-50 border-red-200 text-red-900',
    };
    return (
      <div className={`rounded-xl border ${cores[r.cor]} p-5 mb-6`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl">{r.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold">Obrigado pela sua avaliação!</p>
              <p className="text-sm mt-1">
                Você avaliou como: <strong>{r.texto}</strong>
              </p>
              {comment && (
                <p className="text-sm mt-2 italic opacity-80">
                  "{comment}"
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleEditar}
            className="text-sm underline opacity-70 hover:opacity-100 whitespace-nowrap"
          >
            Alterar
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Estado inicial: mostra os 3 botões
  // ============================================================
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 mb-6 print:hidden">
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        Isso é o que você procurava?
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Sua avaliação nos ajuda a melhorar o sistema para todos os professores.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => handleEscolher('positive')}
          className={`p-4 rounded-lg border-2 transition text-center ${
            rating === 'positive'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-2xl mb-1">👍</div>
          <div className="text-sm font-medium text-gray-800">Ótimo!</div>
        </button>

        <button
          onClick={() => handleEscolher('partial')}
          className={`p-4 rounded-lg border-2 transition text-center ${
            rating === 'partial'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-2xl mb-1">🤔</div>
          <div className="text-sm font-medium text-gray-800">Em parte</div>
        </button>

        <button
          onClick={() => handleEscolher('negative')}
          className={`p-4 rounded-lg border-2 transition text-center ${
            rating === 'negative'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-2xl mb-1">👎</div>
          <div className="text-sm font-medium text-gray-800">Não era isso</div>
        </button>
      </div>

      {/* Campo de comentário (opcional) */}
      {mostrarComentario && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quer contar mais? <span className="text-xs text-gray-500">(opcional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {rating === 'positive'
              ? 'O que ficou bom? Podemos usar como referência.'
              : 'O que faltou? O que precisa ser diferente?'}
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
            maxLength="2000"
            placeholder={
              rating === 'positive'
                ? 'Ex: "As atividades práticas foram muito boas..."'
                : 'Ex: "Faltou mais exemplos de cálculo..."'
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-xs text-gray-400 mt-1">{comment.length}/2000</p>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-3">{error}</p>
      )}

      {/* Botão de enviar */}
      {rating && (
        <button
          onClick={handleEnviar}
          disabled={loading}
          className="mt-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold px-6 py-2.5 rounded-lg transition"
        >
          {loading ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      )}
    </div>
  );
};

export default FeedbackCard;