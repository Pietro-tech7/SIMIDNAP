import React, { useState, useRef } from 'react';
import api from '../api/api';

/**
 * Componente de upload de imagem para a landing page.
 *
 * Props:
 * - slot: identificador único do campo (ex: 'hero_image', 'founder_photo')
 * - label: rótulo exibido acima
 * - value: URL atual da imagem (string)
 * - onChange: callback chamado com a nova URL após upload
 * - help: texto de ajuda opcional
 *
 * Fluxo:
 * 1. Usuário clica em "Escolher imagem"
 * 2. Seleciona arquivo (JPG, PNG, WEBP ou GIF até 5 MB)
 * 3. Faz upload para /landing/admin/upload/{slot}
 * 4. Backend retorna URL absoluta
 * 5. onChange é chamado com a URL — o pai (AdminLanding) atualiza a config
 * 6. O admin precisa clicar em "Salvar seção" para persistir
 */
const UploadImage = ({ slot, label, value, onChange, help }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Validação de tamanho (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 5 MB.`);
      return;
    }

    // Validação de tipo
    const tiposAceitos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposAceitos.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG, WEBP ou GIF.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/landing/admin/upload/${slot}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // O backend retorna URL relativa ('/api/v1/landing/image/xxx')
      // Convertemos para URL absoluta removendo /api/v1 do baseURL
      const baseUrl = (api.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
      const fullUrl = res.data.url?.startsWith('http')
        ? res.data.url
        : baseUrl + res.data.url;

      onChange(fullUrl);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Erro ao enviar imagem. Tente novamente.';
      setError(detail);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleRemover = async () => {
    if (!window.confirm('Remover esta imagem? A alteração só será aplicada após salvar a seção.')) return;
    setError('');
    try {
      await api.delete(`/landing/admin/upload/${slot}`);
    } catch {
      // Se não existir no backend, ignora — o objetivo é limpar o campo
    }
    onChange('');
  };

  const handleTrocar = () => {
    setError('');
    inputRef.current?.click();
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        📷 {label}
      </label>
      {help && <p className="text-xs text-gray-500 mb-2 leading-relaxed">{help}</p>}

      {/* Preview + Ações (se tiver imagem) */}
      {value ? (
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="rounded-lg overflow-hidden border border-gray-700 flex-shrink-0 bg-gray-900">
            <img
              src={value}
              alt={label}
              className="block max-w-[260px] max-h-[200px] object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleTrocar}
              disabled={uploading}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg whitespace-nowrap"
            >
              {uploading ? '⏳ Enviando...' : '🔄 Trocar imagem'}
            </button>
            <button
              type="button"
              onClick={handleRemover}
              disabled={uploading}
              className="bg-red-900/30 hover:bg-red-900/50 disabled:opacity-50 text-red-300 text-xs font-medium px-4 py-2 rounded-lg border border-red-800 whitespace-nowrap"
            >
              🗑️ Remover
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone / botão de escolher */
        <button
          type="button"
          onClick={handleTrocar}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-600 hover:border-blue-500 disabled:opacity-50 rounded-xl p-6 text-center transition"
        >
          <div className="text-4xl mb-2">{uploading ? '⏳' : '📷'}</div>
          <p className="text-sm text-gray-300 font-medium mb-1">
            {uploading ? 'Enviando imagem...' : 'Clique para escolher uma imagem'}
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, WEBP ou GIF · até 5 MB
          </p>
        </button>
      )}

      {/* Input file escondido */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Erro */}
      {error && (
        <div className="mt-2 bg-red-900/20 border border-red-800 text-red-300 text-xs rounded-lg p-2 leading-relaxed">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default UploadImage;