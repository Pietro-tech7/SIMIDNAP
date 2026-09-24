import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'simidnape_cabecalho_padrao';

const TIPOS_ESCOLA = [
  'ESCOLA MUNICIPAL',
  'ESCOLA ESTADUAL',
  'CENTRO EDUCACIONAL',
  'UNIDADE DE ENSINO',
  'UNIDADE ESCOLAR',
  'CENTRO DE EDUCAÇÃO INFANTIL',
  'CRECHE MUNICIPAL',
  'ESCOLA PARTICULAR',
  'OUTRO',
];

const CABECALHO_INICIAL = {
  tipo_escola: 'ESCOLA MUNICIPAL',
  nome_escola: '',
  secretaria: '',
  endereco: '',
  cidade_estado: '',
  cep: '',
  telefone: '',
  email: '',
  diretor: '',
  coordenador: '',
  professor: '',
  turma: '',
  logo_prefeitura: '',
  logo_escola: '',
};

function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EditorCabecalhoProva = ({ onChange, professorNome }) => {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(CABECALHO_INICIAL);
  const [salvoFeedback, setSalvoFeedback] = useState('');
  const prefeituraRef = useRef(null);
  const escolaRef = useRef(null);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const obj = JSON.parse(salvo);
        if (!obj.professor && professorNome) obj.professor = professorNome;
        setDados({ ...CABECALHO_INICIAL, ...obj });
        onChange?.({ ...CABECALHO_INICIAL, ...obj });
      } else if (professorNome) {
        const inicial = { ...CABECALHO_INICIAL, professor: professorNome };
        setDados(inicial);
        onChange?.(inicial);
      } else {
        onChange?.(CABECALHO_INICIAL);
      }
    } catch {}
  }, [professorNome]);

  const atualizar = (campo, valor) => {
    setDados(prev => {
      const novo = { ...prev, [campo]: valor };
      onChange?.(novo);
      return novo;
    });
  };

  const uploadImagem = async (campo, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande. Máximo 2 MB.'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      alert('Formato inválido. Use PNG, JPG, WEBP ou SVG.'); return;
    }
    const b64 = await arquivoParaBase64(file);
    atualizar(campo, b64);
  };

  const removerImagem = (campo) => {
    atualizar(campo, '');
    if (campo === 'logo_prefeitura' && prefeituraRef.current) prefeituraRef.current.value = '';
    if (campo === 'logo_escola' && escolaRef.current) escolaRef.current.value = '';
  };

  const salvarPadrao = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
      setSalvoFeedback('✅ Cabeçalho salvo! Nas próximas provas já vem preenchido.');
      setTimeout(() => setSalvoFeedback(''), 3000);
    } catch {
      setSalvoFeedback('⚠️ Erro ao salvar.');
    }
  };

  const limparTudo = () => {
    if (!window.confirm('Limpar todos os campos do cabeçalho?')) return;
    const vazio = { ...CABECALHO_INICIAL, professor: professorNome || '' };
    setDados(vazio);
    onChange?.(vazio);
    localStorage.removeItem(STORAGE_KEY);
    if (prefeituraRef.current) prefeituraRef.current.value = '';
    if (escolaRef.current) escolaRef.current.value = '';
  };

  const tipoEscola = dados.tipo_escola || 'ESCOLA MUNICIPAL';
  const labelEscola = tipoEscola === 'OUTRO' ? dados.nome_escola : `${tipoEscola}: ${dados.nome_escola || '___________'}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition rounded-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏫</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Cabeçalho da Prova</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {aberto ? 'Clique para recolher' : 'Configure o cabeçalho que aparecerá na prova (opcional)'}
            </p>
          </div>
        </div>
        <span className="text-2xl text-gray-400">{aberto ? '▾' : '▸'}</span>
      </button>

      {aberto && (
        <div className="border-t border-gray-100 p-6">
          {/* Preview */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 uppercase mb-3 text-center">Pré-visualização</p>

            {/* Linha 1: logos próximas do texto central */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 70, height: 70, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                {dados.logo_prefeitura ? (
                  <img src={dados.logo_prefeitura} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 2 }} />
                ) : (
                  <span style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>Logo<br/>prefeitura</span>
                )}
              </div>
              <div style={{ flex: '0 1 500px', textAlign: 'center', fontSize: 10, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 'bold' }}>{dados.secretaria || 'SECRETARIA MUNICIPAL DE EDUCAÇÃO'}</div>
                <div>{dados.endereco || 'Endereço'}</div>
                <div>{[dados.cep && `CEP: ${dados.cep}`, dados.cidade_estado].filter(Boolean).join(' - ') || 'CEP - Cidade - Estado'}</div>
                <div>{[dados.telefone && `FONE: ${dados.telefone}`, dados.email].filter(Boolean).join(' • ') || 'Fone • Email'}</div>
              </div>
              <div style={{ width: 70, height: 70, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                {dados.logo_escola ? (
                  <img src={dados.logo_escola} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 2 }} />
                ) : (
                  <span style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>Logo<br/>escola</span>
                )}
              </div>
            </div>

            {/* Dados alinhados em tabela */}
            <table style={{ width: '100%', fontSize: 11, borderTop: '1px solid #000', paddingTop: 8, borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0', fontWeight: 'bold' }} colSpan={2}>{labelEscola}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', width: '50%' }}>
                    <strong>DIRETOR(A):</strong> {dados.diretor || '_____________________'}
                  </td>
                  <td style={{ padding: '3px 0', width: '50%' }}>
                    <strong>COORDENADOR(A):</strong> {dados.coordenador || '_____________________'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>
                    <strong>PROFESSOR(A):</strong> {dados.professor || '_____________________'}
                  </td>
                  <td style={{ padding: '3px 0' }}>
                    <strong>TURMA:</strong> {dados.turma || '________'}
                    {'  '}
                    <strong>TURNO:</strong> ( ) MANHÃ  ( ) TARDE
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0 3px', borderTop: '1px solid #ccc' }} colSpan={2}>
                    <strong>NOME DO ALUNO:</strong> _________________________________________________________
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }} colSpan={2}>
                    <strong>DATA:</strong> ____/_____/__________
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            {/* Escola */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">🏫 Identificação da Escola</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Escola *</label>
                  <select value={dados.tipo_escola}
                    onChange={(e) => atualizar('tipo_escola', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    {TIPOS_ESCOLA.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Escola *</label>
                  <input type="text" value={dados.nome_escola}
                    onChange={(e) => atualizar('nome_escola', e.target.value)}
                    placeholder="Ex: RAIMUNDO FERREIRA, DOMINGOS ALVES, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            {/* Logos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo da Prefeitura (esquerda)</label>
                <input ref={prefeituraRef} type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => uploadImagem('logo_prefeitura', e.target.files?.[0])}
                  className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100" />
                {dados.logo_prefeitura && (
                  <button type="button" onClick={() => removerImagem('logo_prefeitura')}
                    className="text-xs text-red-600 hover:text-red-800 mt-1">🗑️ Remover</button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo da Escola / SEMED (direita)</label>
                <input ref={escolaRef} type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => uploadImagem('logo_escola', e.target.files?.[0])}
                  className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100" />
                {dados.logo_escola && (
                  <button type="button" onClick={() => removerImagem('logo_escola')}
                    className="text-xs text-red-600 hover:text-red-800 mt-1">🗑️ Remover</button>
                )}
              </div>
            </div>

            {/* Textos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Secretaria *</label>
                <input type="text" value={dados.secretaria}
                  onChange={(e) => atualizar('secretaria', e.target.value)}
                  placeholder="Ex: SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input type="text" value={dados.endereco}
                  onChange={(e) => atualizar('endereco', e.target.value)}
                  placeholder="Ex: AV. CÂNDIDO GONÇALVES DA ROCHA – CENTRO"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input type="text" value={dados.cep}
                  onChange={(e) => atualizar('cep', e.target.value)}
                  placeholder="64.858-000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / Estado</label>
                <input type="text" value={dados.cidade_estado}
                  onChange={(e) => atualizar('cidade_estado', e.target.value)}
                  placeholder="Ex: PORTO ALEGRE - PI"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="text" value={dados.telefone}
                  onChange={(e) => atualizar('telefone', e.target.value)}
                  placeholder="(89) 99449-3273"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" value={dados.email}
                  onChange={(e) => atualizar('email', e.target.value)}
                  placeholder="sme@municipio.pi.gov.br"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Nomes + Turma */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diretor(a)</label>
                <input type="text" value={dados.diretor}
                  onChange={(e) => atualizar('diretor', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coordenador(a)</label>
                <input type="text" value={dados.coordenador}
                  onChange={(e) => atualizar('coordenador', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professor(a)</label>
                <input type="text" value={dados.professor}
                  onChange={(e) => atualizar('professor', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                <input type="text" value={dados.turma}
                  onChange={(e) => atualizar('turma', e.target.value)}
                  placeholder="Ex: 2º A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={salvarPadrao}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm">
              💾 Salvar como padrão
            </button>
            <button type="button" onClick={limparTudo}
              className="bg-white hover:bg-red-50 text-red-700 border border-red-200 font-medium px-5 py-2 rounded-lg text-sm">
              🗑️ Limpar
            </button>
            {salvoFeedback && <span className="text-sm text-green-700 self-center">{salvoFeedback}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorCabecalhoProva;