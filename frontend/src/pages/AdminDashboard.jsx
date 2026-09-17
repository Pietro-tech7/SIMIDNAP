import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !user.is_superuser) {
      navigate('/dashboard');
      return;
    }

    api.get('/admin/metrics')
      .then(res => setMetrics(res.data))
      .catch(err => {
        if (err.response?.status === 403) navigate('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user?.is_superuser) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do SIMIDNAPE.</p>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando métricas...</p>
      ) : metrics ? (
        <>
          {/* Métricas principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard titulo="Usuários totais" valor={metrics.total_usuarios} cor="blue" icon="👥" />
            <MetricCard titulo="Ativos" valor={metrics.usuarios_ativos} cor="green" icon="✅" />
            <MetricCard titulo="Bloqueados" valor={metrics.usuarios_bloqueados} cor="red" icon="🚫" />
            <MetricCard titulo="Novos (7 dias)" valor={metrics.ultimos_7_dias_cadastros} cor="purple" icon="🆕" />
          </div>

          {/* Planos */}
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Distribuição por plano</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard titulo="Trial" valor={metrics.usuarios_trial} cor="gray" icon="🎁" />
            <MetricCard titulo="Básico" valor={metrics.usuarios_basico} cor="blue" icon="💳" />
            <MetricCard titulo="Padrão" valor={metrics.usuarios_padrao} cor="orange" icon="⭐" />
            <MetricCard titulo="Avançado" valor={metrics.usuarios_avancado} cor="purple" icon="🚀" />
          </div>

          {/* Uso */}
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Uso geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Créditos consumidos (total)</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {metrics.creditos_consumidos_total.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-1">desde o início do sistema</p>
            </div>
          </div>

          {/* Atalho rápido */}
          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">⚡ Ação rápida</h3>
            <p className="text-sm text-blue-800 mb-3">
              Precisa gerenciar um usuário específico, adicionar créditos ou trocar plano?
            </p>
            <button
              onClick={() => navigate('/admin/users')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
            >
              Ir para Usuários →
            </button>
          </div>
        </>
      ) : (
        <p className="text-red-500">Erro ao carregar métricas.</p>
      )}
    </div>
  );
};

const MetricCard = ({ titulo, valor, cor, icon }) => {
  const cores = {
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    green: 'bg-green-50 text-green-800 border-green-100',
    red: 'bg-red-50 text-red-800 border-red-100',
    purple: 'bg-purple-50 text-purple-800 border-purple-100',
    orange: 'bg-orange-50 text-orange-800 border-orange-100',
    gray: 'bg-gray-50 text-gray-800 border-gray-200',
  };

  return (
    <div className={`rounded-xl border p-5 ${cores[cor] || cores.blue}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wide opacity-80">{titulo}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className="text-3xl font-bold">{valor}</p>
    </div>
  );
};

export default AdminDashboard;