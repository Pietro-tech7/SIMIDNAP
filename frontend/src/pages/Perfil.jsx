import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import AvatarUpload from '../components/AvatarUpload';

const Perfil = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [assinatura, setAssinatura] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trocando, setTrocando] = useState(false);

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [nomeEdit, setNomeEdit] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState(null);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [statusRes, planosRes] = await Promise.all([
        api.get('/subscriptions/status'),
        api.get('/subscriptions/planos'),
      ]);
      setAssinatura(statusRes.data);
      setPlanos(planosRes.data);
    } catch {
      setAssinatura(null);
      setPlanos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    if (user) {
      setNomeEdit(user.full_name || '');
    }
  }, [user]);

  const handleTrocarPlano = (codigo, nome) => {
    navigate('/minha-assinatura');
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setMsgPerfil(null);
    setSalvandoPerfil(true);
    try {
      await api.put('/users/me', { full_name: nomeEdit });
      if (refreshUser) await refreshUser();
      setMsgPerfil({ tipo: 'sucesso', texto: 'Nome atualizado com sucesso!' });
      setEditandoPerfil(false);
    } catch {
      setMsgPerfil({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleTrocarSenha = async (e) => {
    e.preventDefault();
    setMsgSenha(null);

    if (novaSenha !== confirmarSenha) {
      setMsgSenha({ tipo: 'erro', texto: 'As senhas não coincidem.' });
      return;
    }
    if (novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setTrocandoSenha(true);
    try {
      await api.put('/users/me/password', {
        current_password: senhaAtual,
        new_password: novaSenha,
      });
      setMsgSenha({ tipo: 'sucesso', texto: 'Senha alterada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erro ao trocar a senha.';
      setMsgSenha({ tipo: 'erro', texto: detail });
    } finally {
      setTrocandoSenha(false);
    }
  };

  const pctUsado = assinatura
    ? (assinatura.creditos_usados / assinatura.creditos_total) * 100
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie seus dados, sua segurança e sua assinatura.</p>
      </div>

      {/* Dados do usuário com foto */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-800">👤 Dados Pessoais</h2>
          {!editandoPerfil && (
            <button
              onClick={() => setEditandoPerfil(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ✏️ Editar nome
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <AvatarUpload
            user={user}
            onAtualizado={async () => {
              if (refreshUser) await refreshUser();
            }}
          />

          <div className="flex-1 w-full">
            {!editandoPerfil ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Nome</p>
                  <p className="text-gray-800 font-medium">{user?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">E-mail</p>
                  <p className="text-gray-800 font-medium">{user?.email}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSalvarPerfil} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={nomeEdit}
                    onChange={(e) => setNomeEdit(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O e-mail não pode ser alterado por aqui.
                  </p>
                </div>

                {msgPerfil && (
                  <div className={`text-sm rounded-lg p-3 border ${
                    msgPerfil.tipo === 'sucesso'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {msgPerfil.tipo === 'sucesso' ? '✅' : '⚠️'} {msgPerfil.texto}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditandoPerfil(false);
                      setNomeEdit(user.full_name || '');
                      setMsgPerfil(null);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoPerfil}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                  >
                    {salvandoPerfil ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">🔒 Segurança</h2>
        <p className="text-sm text-gray-500 mb-4">Altere sua senha periodicamente para manter sua conta segura.</p>

        <form onSubmit={handleTrocarSenha} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              minLength={6}
              placeholder="Repita a nova senha"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {msgSenha && (
            <div className={`text-sm rounded-lg p-3 border ${
              msgSenha.tipo === 'sucesso'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {msgSenha.tipo === 'sucesso' ? '✅' : '⚠️'} {msgSenha.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={trocandoSenha}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-5 py-2.5 rounded-lg transition"
          >
            {trocandoSenha ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </div>

      {/* Assinatura atual */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <p className="text-gray-500">Carregando assinatura...</p>
        </div>
      ) : assinatura ? (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 mb-6 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-200">Assinatura Atual</p>
              <h2 className="text-2xl font-bold mt-1">{assinatura.plano_nome}</h2>
              <p className="text-sm text-blue-100 mt-1">
                {assinatura.plano === 'trial'
                  ? 'Acesso de teste gratuito'
                  : assinatura.plano_preco === 0
                  ? 'Grátis'
                  : `R$ ${assinatura.plano_preco.toFixed(2).replace('.', ',')}/mês`}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              assinatura.status === 'active'
                ? 'bg-green-400 text-green-900'
                : 'bg-red-400 text-red-900'
            }`}>
              {assinatura.status === 'active' ? '● Ativo' : '● Expirado'}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-blue-100 mb-2">
              <span>Créditos usados</span>
              <span className="font-bold text-white">
                {assinatura.creditos_usados.toFixed(1)} / {assinatura.creditos_total.toFixed(1)}
              </span>
            </div>
            <div className="w-full bg-blue-900 bg-opacity-40 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  pctUsado > 80 ? 'bg-red-400' : pctUsado > 50 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${Math.min(pctUsado, 100)}%` }}
              />
            </div>
            <p className="text-sm text-blue-100 mt-2">
              Você ainda tem <strong className="text-white">{assinatura.creditos_disponiveis.toFixed(1)}</strong> créditos disponíveis.
            </p>
          </div>

          <div className="text-xs text-blue-200 border-t border-blue-500 border-opacity-50 pt-3">
            {assinatura.plano === 'trial' ? (
              <p>⚠️ Plano de teste — válido até {new Date(assinatura.periodo_fim).toLocaleDateString('pt-BR')}. Não renova automaticamente.</p>
            ) : (
              <p>Renovação automática em {new Date(assinatura.periodo_fim).toLocaleDateString('pt-BR')}.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6">
          <p className="text-red-800">Erro ao carregar assinatura. Tente recarregar a página.</p>
        </div>
      )}

      {/* Como usar créditos */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Como usar seus créditos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">1 crédito</p>
            <p className="text-xs text-gray-600 mt-1">NeuroAula, Aula que Funciona, Atividade, Jogo ou Simulado</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">2 créditos</p>
            <p className="text-xs text-gray-600 mt-1">Material Diferenciado (principal + adaptada)</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">0,2 crédito</p>
            <p className="text-xs text-gray-600 mt-1">1 mensagem na Terapia Pedagógica</p>
          </div>
        </div>
      </div>

      {/* Planos disponíveis */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">🚀 Escolha seu plano</h2>
        <p className="text-sm text-gray-600">
          Todos os planos renovam automaticamente. Cancele quando quiser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {planos.map((p) => {
          const isAtual = assinatura?.plano === p.codigo;
          const destaque = p.codigo === 'padrao';
          const ehTrial = p.codigo === 'trial';

          return (
            <div
              key={p.codigo}
              className={`rounded-xl border-2 p-5 transition relative ${
                isAtual
                  ? 'border-blue-500 bg-blue-50'
                  : destaque
                  ? 'border-orange-400 bg-orange-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {destaque && !isAtual && (
                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  ⭐ Mais escolhido
                </span>
              )}
              {isAtual && (
                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  Plano atual
                </span>
              )}

              <h3 className="font-bold text-gray-900 text-lg mt-2">{p.nome}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-3 mb-1">
                {p.preco === 0 ? 'Grátis' : `R$ ${p.preco.toFixed(2).replace('.', ',')}`}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {ehTrial ? 'uma vez, sem renovação' : 'por mês, renovação automática'}
              </p>

              <div className="border-t border-gray-100 pt-4 mb-4">
                <p className="text-2xl font-bold text-blue-600">{p.creditos_mes} créditos</p>
                <p className="text-xs text-gray-500 mt-1">{ehTrial ? 'para testar' : 'por mês'}</p>
              </div>

              {!isAtual && !ehTrial && (
                <button
                  onClick={() => handleTrocarPlano(p.codigo, p.nome)}
                  disabled={trocando}
                  className={`w-full font-semibold py-2.5 rounded-lg transition text-sm ${
                    destaque
                      ? 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
                  }`}
                >
                  {trocando ? 'Processando...' : 'Assinar este plano'}
                </button>
              )}
              {isAtual && (
                <p className="text-center text-xs text-blue-700 font-medium py-2">
                  ✓ Você está neste plano
                </p>
              )}
              {ehTrial && !isAtual && (
                <p className="text-center text-xs text-gray-400 py-2">
                  Apenas para novos usuários
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Perfil;