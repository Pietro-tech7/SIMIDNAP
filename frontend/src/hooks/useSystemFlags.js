import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

/**
 * Hook para consultar as flags globais do sistema (definidas pelo super admin).
 *
 * Hoje expõe:
 *   - feature_gerar_imagem_ia: bool   → liga/desliga a geração de imagens IA
 *   - texto_imagem_ia_indisponivel: string → mensagem exibida quando desligado
 *
 * Retorna:
 *   - flags: objeto cru com todas as flags
 *   - loading / erro
 *   - gerarImagemIAAtiva(): helper booleano
 *   - textoImagemIAIndisponivel(): helper de texto
 *   - recarregar(): força nova consulta
 *
 * Re-verifica automaticamente quando o evento "system-flags-updated" é disparado.
 */
export const useSystemFlags = () => {
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/system/flags');
      setFlags(res.data);
      setErro(null);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao carregar configurações do sistema.');
      setFlags(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    const handleUpdate = () => carregar();
    window.addEventListener('system-flags-updated', handleUpdate);
    return () => window.removeEventListener('system-flags-updated', handleUpdate);
  }, [carregar]);

  const gerarImagemIAAtiva = useCallback(() => {
    if (!flags) return false;
    return flags.feature_gerar_imagem_ia === true;
  }, [flags]);

  const textoImagemIAIndisponivel = useCallback(() => {
    if (!flags) {
      return 'A geração de imagens com IA está temporariamente indisponível.';
    }
    return (
      flags.texto_imagem_ia_indisponivel ||
      'A geração de imagens com IA está temporariamente indisponível.'
    );
  }, [flags]);

  return {
    flags,
    loading,
    erro,
    gerarImagemIAAtiva,
    textoImagemIAIndisponivel,
    recarregar: carregar,
  };
};

export default useSystemFlags;