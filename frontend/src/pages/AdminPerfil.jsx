import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import AvatarUpload from '../components/AvatarUpload';

const AdminPerfil = () => {
  const { user, refreshUser } = useAuth();

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [nomeEdit, setNomeEdit] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState(null);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState(null);

  useEffect(() => {
    if (user) {
      setNomeEdit(user.full_name || '');
    }
  }, [user]);

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setMsgPerfil(null);
    setSalvandoPerfil(true);
    try {
      await api.put('/users/me', { full_name: nomeEdit });
      if (refreshUser) await refreshUser();
      setMsgPerfil({ tipo: 'sucesso', texto: 'Perfil atualizado com sucesso!' });
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

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
        <p className="text-gray-400 mt-1">Gerencie seus dados e sua segurança.</p>
      </div>

      {/* Dados pessoais */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-white">👤 Dados Pessoais</h2>
          {!editandoPerfil && (
            <button
              onClick={() => setEditandoPerfil(true)}
              className="text-sm text-red-400 hover:text-red-300 font-medium"
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
                  <p className="text-white font-medium">{user?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">E-mail</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Função</p>
                  <p className="text-red-400 font-medium">🔐 Administrador do sistema</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSalvarPerfil} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={nomeEdit}
                    onChange={(e) => setNomeEdit(e.target.value)}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O e-mail não pode ser alterado por aqui.
                  </p>
                </div>

                {msgPerfil && (
                  <div className={`text-sm rounded-lg p-3 border ${
                    msgPerfil.tipo === 'sucesso'
                      ? 'bg-green-900 bg-opacity-50 border-green-700 text-green-200'
                      : 'bg-red-900 bg-opacity-50 border-red-700 text-red-200'
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
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoPerfil}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold px-4 py-2 rounded-lg text-sm"
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
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-1">🔒 Segurança</h2>
        <p className="text-sm text-gray-400 mb-4">
          Altere sua senha periodicamente para manter sua conta segura.
        </p>

        <form onSubmit={handleTrocarSenha} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              minLength={6}
              placeholder="Repita a nova senha"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {msgSenha && (
            <div className={`text-sm rounded-lg p-3 border ${
              msgSenha.tipo === 'sucesso'
                ? 'bg-green-900 bg-opacity-50 border-green-700 text-green-200'
                : 'bg-red-900 bg-opacity-50 border-red-700 text-red-200'
            }`}>
              {msgSenha.tipo === 'sucesso' ? '✅' : '⚠️'} {msgSenha.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={trocandoSenha}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-lg transition"
          >
            {trocandoSenha ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPerfil;