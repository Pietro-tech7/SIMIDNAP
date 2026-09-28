import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

/**
 * Hook para consultar o plano e os recursos liberados do usuário logado.
 *
 * Retorna:
 *   - plano: código interno ('trial', 'basico', 'padrao', 'vip', 'avancado')
 *   - nomePlano: nome exibido ("Intermediário", etc.)
 *   - iconePlano: emoji do plano
 *   - recursos: lista de recursos liberados
 *   - temApi: se o usuário tem chave do Gemini cadastrada
 *   - creditos: créditos disponíveis
 *   - loading / erro
 *   - temRecurso(recurso): helper para checar acesso
 *   - recarregar(): força nova consulta
 *
 * Re-verifica automaticamente quando o evento "subscription-updated" é disparado.
 */
export const usePlan = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/subscriptions/status');
      setStatus(res.data);
      setErro(null);
    } catch (e) {
      setErro(e?.response?.data?.detail || 'Erro ao carregar plano.');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    const handleUpdate = () => carregar();
    window.addEventListener('subscription-updated', handleUpdate);
    return () => window.removeEventListener('subscription-updated', handleUpdate);
  }, [carregar]);

  const temRecurso = useCallback((recurso) => {
    if (!status || !Array.isArray(status.recursos)) return false;
    return status.recursos.includes(recurso);
  }, [status]);

  return {
    plano: status?.plano,
    nomePlano: status?.plano_nome,
    iconePlano: status?.plano_icone,
    recursos: status?.recursos || [],
    temApi: status?.tem_api_propria || false,
    creditos: status?.creditos_disponiveis || 0,
    status,
    loading,
    erro,
    temRecurso,
    recarregar: carregar,
  };
};

export default usePlan;