import React, { useRef, useState, useEffect } from 'react';
import api from '../api/api';

const AvatarUpload = ({ user, onAtualizado, tamanho = 120 }) => {
  const inputRef = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [avatarLocal, setAvatarLocal] = useState(user?.avatar_url || null);

  useEffect(() => {
    setAvatarLocal(user?.avatar_url || null);
  }, [user?.avatar_url]);

  // ============================================================
  // Redimensionamento robusto com createImageBitmap
  // ============================================================
  const redimensionarImagem = async (file) => {
    // 1. Decodifica o arquivo em um bitmap confiável
    const bitmap = await createImageBitmap(file);

    const size = 300;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 2. Preenche com fundo branco (evita preto em PNGs com transparência)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // 3. Center-crop: pega o menor lado e recorta o quadrado central
    const menorLado = Math.min(bitmap.width, bitmap.height);
    const offsetX = (bitmap.width - menorLado) / 2;
    const offsetY = (bitmap.height - menorLado) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      bitmap,
      offsetX, offsetY, menorLado, menorLado,
      0, 0, size, size
    );

    // 4. Converte para Blob JPEG
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('[Avatar] Blob gerado:', blob.size, 'bytes');
            resolve(blob);
          } else {
            reject(new Error('Falha ao processar imagem.'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
  };

  const handleSelecionarArquivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErro(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErro('Use JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter até 5 MB.');
      return;
    }

    setEnviando(true);
    try {
      const blob = await redimensionarImagem(file);

      if (blob.size < 100) {
        throw new Error('Imagem gerada inválida.');
      }

      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');

      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('[Avatar] Resposta do backend:', res.data);

      setAvatarLocal(res.data.avatar_url);

      if (onAtualizado) onAtualizado(res.data);
    } catch (err) {
      console.error('[Avatar] Erro:', err);
      setErro(err.response?.data?.detail || err.message || 'Erro ao enviar imagem.');
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemover = async () => {
    if (!window.confirm('Remover sua foto de perfil?')) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await api.delete('/users/me/avatar');
      setAvatarLocal(null);
      if (onAtualizado) onAtualizado(res.data);
    } catch {
      setErro('Erro ao remover foto.');
    } finally {
      setEnviando(false);
    }
  };

  const inicial = user?.full_name?.[0]?.toUpperCase() || 'P';

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative group cursor-pointer"
        style={{ width: tamanho, height: tamanho }}
        onClick={() => !enviando && inputRef.current?.click()}
        title="Clique para trocar a foto"
      >
        {avatarLocal ? (
          <img
            src={avatarLocal}
            alt={user?.full_name || 'Avatar'}
            className="w-full h-full rounded-full object-cover border-4 border-blue-100 group-hover:border-blue-300 transition"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-3xl group-hover:bg-blue-200 transition">
            {inicial}
          </div>
        )}

        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition">
          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition text-center px-2">
            {enviando ? 'Enviando...' : '📷 Trocar'}
          </span>
        </div>

        {enviando && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelecionarArquivo}
        className="hidden"
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
        >
          {avatarLocal ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {avatarLocal && (
          <button
            type="button"
            onClick={handleRemover}
            disabled={enviando}
            className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
          >
            Remover
          </button>
        )}
      </div>

      {erro && (
        <p className="text-xs text-red-500 text-center">{erro}</p>
      )}
    </div>
  );
};

export default AvatarUpload;