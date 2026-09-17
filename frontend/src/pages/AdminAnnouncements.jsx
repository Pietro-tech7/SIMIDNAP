import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recados, setRecados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    tipo: 'info',
    target_user_id: '',
    para_todos: true,
  });

  useEffect(() => {
    if (user && !user.is_superuser) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const carregar = async () => {
    setLoading(true);
    try {
      const [recadosRes, usersRes] = await Promise.all([
        api.get('/announcements/all'),
        api.get('/admin/users'),
      ]);
      setRecados(recadosRes.data);
      setUsuarios(usersRes.data.filter(u => u.is_active));
    } catch (err) {
      if (err.response?.status === 403) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSalvando(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        tipo: form.tipo,
      };
      if (!form.para_todos && form.target_user_id) {
        payload.target_user_id = form.target_user_id;
      }
      await api.post('/announcements', payload);
      setMsg({ tipo: 'sucesso', texto: 'Recado enviado com sucesso!' });
      setForm({ title: '', message: '', tipo: 'info', target_user_id: '', para_todos: true });
      setCriando(false);
      await carregar();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.response?.data?.detail || 'Erro ao enviar.' });
    } finally {
      setSalvando(false);
    }
  };

  const handleDesativar = async (id) => {
    if (!window.confirm('Desativar este recado? Ele deixará de aparecer para os usuários.')) return;
    try {
      await api.put(`/announcements/${id}/deactivate`);
      await carregar();
    } catch {
      alert('Erro ao desativar.');
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir permanentemente este recado?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      await carregar();
    } catch {
      alert('Erro ao excluir.');
    }
  };

  const corTipo = {
    info: 'bg-blue-100 text-blue-800',
    aviso: 'bg-yellow-100 text-yellow-800',
    sucesso: 'bg-green-100 text-green-800',
  };

  if (!user?.is_superuser) return null;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Recados</h1>
          <p className="text-gray-400 mt-1">
            Envie mensagens para professores — individuais ou para todos.
          </p>
        </div>
        <button
          onClick={() => setCriando(!criando)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
        >
          {criando ? 'Cancelar' : '+ Novo recado'}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 text-sm rounded-lg p-3 border ${
          msg.tipo === 'sucesso'
            ? 'bg-green-900 bg-opacity-50 border-green-700 text-green-200'
            : 'bg-red-900 bg-opacity-50 border-red-700 text-red-200'
        }`}>
          {msg.tipo === 'sucesso' ? '✅' : '⚠️'} {msg.texto}
        </div>
      )}

      {/* Formulário */}
      {criando && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Novo recado</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Título *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Ex: Atualização importante"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mensagem *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows="4"
                placeholder="Escreva a mensagem que deseja enviar..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="info">ℹ️ Informação</option>
                  <option value="aviso">⚠️ Aviso</option>
                  <option value="sucesso">✅ Sucesso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Destinatário</label>
                <select
                  value={form.para_todos ? 'todos' : form.target_user_id}
                  onChange={(e) => {
                    if (e.target.value === 'todos') {
                      setForm({ ...form, para_todos: true, target_user_id: '' });
                    } else {
                      setForm({ ...form, para_todos: false, target_user_id: e.target.value });
                    }
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="todos">📢 Todos os professores</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>
                      👤 {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCriando(false)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold px-5 py-2.5 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-lg"
              >
                {salvando ? 'Enviando...' : 'Enviar recado'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : recados.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center text-gray-400">
          Nenhum recado enviado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {recados.map(r => (
            <div
              key={r.id}
              className={`bg-gray-800 rounded-xl border p-5 ${
                r.active ? 'border-gray-700' : 'border-gray-800 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corTipo[r.tipo] || corTipo.info}`}>
                    {r.tipo}
                  </span>
                  <span className="text-xs text-gray-400">
                    {r.target_user_name ? `👤 ${r.target_user_name}` : '📢 Todos'}
                  </span>
                  {!r.active && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                      Desativado
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <h3 className="text-white font-semibold">{r.title}</h3>
              <p className="text-sm text-gray-300 mt-1">{r.message}</p>

              <div className="flex gap-3 mt-4">
                {r.active && (
                  <button
                    onClick={() => handleDesativar(r.id)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    Desativar
                  </button>
                )}
                <button
                  onClick={() => handleExcluir(r.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;