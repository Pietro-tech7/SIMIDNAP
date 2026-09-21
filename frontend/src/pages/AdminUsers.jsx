import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroPlano, setFiltroPlano] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);

  useEffect(() => {
    if (user && !user.is_superuser) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filtroPlano) params.plan = filtroPlano;

      const res = await api.get('/admin/users', { params });
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 403) navigate('/dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [search, filtroPlano]);

  const abrirModal = (u) => {
    setUsuarioSelecionado(u);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setUsuarioSelecionado(null);
    setModalAberto(false);
  };

  const verConteudo = (u) => {
    navigate(`/admin/users/${u.id}`);
  };

  const executarAcao = async (acao) => {
    setAcaoEmAndamento(true);
    try {
      await acao();
      await carregarUsuarios();
      if (usuarioSelecionado) {
        const res = await api.get(`/admin/users/${usuarioSelecionado.id}`);
        setUsuarioSelecionado(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao executar ação.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const handleAdicionarCreditos = () => {
    const valor = prompt('Quantos créditos adicionar? (use negativo para remover)', '10');
    if (!valor) return;
    const num = parseFloat(valor);
    if (isNaN(num)) {
      alert('Valor inválido.');
      return;
    }
    executarAcao(() =>
      api.post(`/admin/users/${usuarioSelecionado.id}/credits/add`, { quantidade: num })
    );
  };

  const handleResetCreditos = () => {
    if (!window.confirm('Zerar os créditos usados deste usuário?')) return;
    executarAcao(() =>
      api.post(`/admin/users/${usuarioSelecionado.id}/credits/reset`, {})
    );
  };

  const handleTrocarPlano = async () => {
    const plano = prompt(
      'Novo plano? (trial, basico, padrao, avancado)',
      usuarioSelecionado.plan || 'trial'
    );
    if (!plano) return;
    executarAcao(() =>
      api.post(`/admin/users/${usuarioSelecionado.id}/plan`, { plano })
    );
  };

  const handleBloquear = () => {
    const novoStatus = !usuarioSelecionado.is_active;
    const msg = novoStatus ? 'Desbloquear' : 'Bloquear';
    if (!window.confirm(`${msg} este usuário?`)) return;
    executarAcao(() =>
      api.put(`/admin/users/${usuarioSelecionado.id}`, { is_active: novoStatus })
    );
  };

  const handleExcluir = () => {
    if (!window.confirm('⚠️ EXCLUIR usuário e TODOS os dados dele? Esta ação é irreversível.')) return;
    if (!window.confirm('Tem certeza ABSOLUTA? Não há como desfazer.')) return;
    executarAcao(async () => {
      await api.delete(`/admin/users/${usuarioSelecionado.id}`);
      fecharModal();
    });
  };

  if (!user?.is_superuser) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
        <p className="text-gray-600 mt-1">
          {users.length} {users.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filtroPlano}
            onChange={(e) => setFiltroPlano(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os planos</option>
            <option value="trial">Trial</option>
            <option value="basico">Básico</option>
            <option value="padrao">Padrão</option>
            <option value="avancado">Avançado</option>
          </select>
          <button
            onClick={carregarUsuarios}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            🔄 Recarregar
          </button>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <p className="text-gray-500">Carregando usuários...</p>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">E-mail</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Créditos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                          {u.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium">{u.full_name}</span>
                        {u.is_superuser && (
                          <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            🔐 Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {u.plan ? (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          u.plan === 'trial' ? 'bg-gray-100 text-gray-700' :
                          u.plan === 'basico' ? 'bg-blue-100 text-blue-800' :
                          u.plan === 'padrao' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {u.plan}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">sem plano</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {u.credits_available !== null ? (
                        <>
                          <strong>{u.credits_available.toFixed(1)}</strong>
                          <span className="text-gray-400 text-xs ml-1">
                            / {u.credits_total.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {u.is_active ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">● Ativo</span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">● Bloqueado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => verConteudo(u)}
                          className="text-teal-600 hover:text-teal-800 font-medium whitespace-nowrap"
                          title="Ver tudo que este usuário criou"
                        >
                          👁️ Ver conteúdo
                        </button>
                        <button
                          onClick={() => abrirModal(u)}
                          className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                        >
                          Gerenciar →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO */}
      {modalAberto && usuarioSelecionado && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={fecharModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {usuarioSelecionado.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{usuarioSelecionado.full_name}</h2>
                  <p className="text-sm text-gray-500">{usuarioSelecionado.email}</p>
                </div>
              </div>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Informações */}
              <div className="grid grid-cols-2 gap-4">
                <InfoBox label="Plano" valor={usuarioSelecionado.plan || 'Sem plano'} />
                <InfoBox label="Status" valor={usuarioSelecionado.plan_status || '—'} />
                <InfoBox
                  label="Créditos totais"
                  valor={usuarioSelecionado.credits_total?.toFixed(1) ?? '—'}
                />
                <InfoBox
                  label="Créditos disponíveis"
                  valor={usuarioSelecionado.credits_available?.toFixed(1) ?? '—'}
                  destaque={usuarioSelecionado.credits_available !== null && usuarioSelecionado.credits_available < 2}
                />
              </div>

              {/* Ações */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Ações</h3>

                <div className="space-y-2">
                  <ActionButton
                    onClick={() => verConteudo(usuarioSelecionado)}
                    disabled={acaoEmAndamento}
                    icone="👁️"
                    titulo="Ver conteúdo gerado"
                    descricao="Ver tudo que este usuário criou no sistema"
                    cor="teal"
                  />

                  <ActionButton
                    onClick={handleAdicionarCreditos}
                    disabled={acaoEmAndamento}
                    icone="➕"
                    titulo="Adicionar / Remover créditos"
                    descricao="Dar bônus, cortesia ou ajustar"
                    cor="green"
                  />

                  <ActionButton
                    onClick={handleResetCreditos}
                    disabled={acaoEmAndamento}
                    icone="🔄"
                    titulo="Resetar créditos usados"
                    descricao="Zerar o consumo do ciclo atual"
                    cor="blue"
                  />

                  <ActionButton
                    onClick={handleTrocarPlano}
                    disabled={acaoEmAndamento}
                    icone="🎫"
                    titulo="Trocar plano"
                    descricao="Mudar para trial, básico, padrão ou avançado"
                    cor="purple"
                  />

                  <ActionButton
                    onClick={handleBloquear}
                    disabled={acaoEmAndamento}
                    icone={usuarioSelecionado.is_active ? '🚫' : '✅'}
                    titulo={usuarioSelecionado.is_active ? 'Bloquear usuário' : 'Desbloquear usuário'}
                    descricao={usuarioSelecionado.is_active ? 'Impedir login' : 'Permitir login novamente'}
                    cor="yellow"
                  />

                  <ActionButton
                    onClick={handleExcluir}
                    disabled={acaoEmAndamento}
                    icone="🗑️"
                    titulo="Excluir usuário"
                    descricao="Remover permanentemente com todos os dados"
                    cor="red"
                  />
                </div>
              </div>

              {acaoEmAndamento && (
                <div className="text-center py-3">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 mt-2">Processando...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoBox = ({ label, valor, destaque }) => (
  <div className={`rounded-lg p-3 border ${
    destaque ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
  }`}>
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`text-lg font-semibold ${destaque ? 'text-red-700' : 'text-gray-800'}`}>
      {valor}
    </p>
  </div>
);

const ActionButton = ({ onClick, disabled, icone, titulo, descricao, cor }) => {
  const cores = {
    green: 'bg-green-50 hover:bg-green-100 border-green-100 text-green-900',
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-900',
    purple: 'bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-900',
    yellow: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-100 text-yellow-900',
    red: 'bg-red-50 hover:bg-red-100 border-red-100 text-red-900',
    teal: 'bg-teal-50 hover:bg-teal-100 border-teal-100 text-teal-900',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left border rounded-lg p-4 transition disabled:opacity-50 disabled:cursor-not-allowed ${cores[cor]}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icone}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{titulo}</p>
          <p className="text-xs opacity-80 mt-0.5">{descricao}</p>
        </div>
      </div>
    </button>
  );
};

export default AdminUsers;