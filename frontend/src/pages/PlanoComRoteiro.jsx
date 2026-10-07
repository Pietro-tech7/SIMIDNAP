import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { gerarPDF } from '../utils/pdf';

// ============================================================
// PALETA SIMIDNAPE
// ============================================================
const AZUL          = '#2C5F7C';
const AZUL_CLARO    = '#E8F0F5';
const VERDE         = '#5FA68D';
const VERDE_CLARO   = '#EAF4F0';
const PESSEGO       = '#E8A87C';
const PESSEGO_CLARO = '#FDF1E7';
const CORAL         = '#E07856';
const OURO          = '#D4A843';
const OURO_CLARO    = '#FBF3E0';
const CREME         = '#FDFBF7';
const BRANCO        = '#FFFFFF';
const TEXTO         = '#2D2D2D';
const TEXTO_2       = '#6B6B6B';
const BORDA         = '#E5E0D8';

const MAX_PAGINAS = 10;
const MAX_MB = 10;

const REFERENCIAIS = [
  { v: 'BNCC',           l: 'BNCC' },
  { v: 'Currículo do Piauí', l: 'Currículo do Piauí' },
  { v: 'SAEB',           l: 'SAEB' },
  { v: 'SAEPI',          l: 'SAEPI' },
  { v: 'PPAIC',          l: 'PPAIC' },
];

function formatarBytes(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

const PlanoComRoteiro = () => {
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [texto, setTexto] = useState('');
  const [arquivos, setArquivos] = useState([]);        // [{file, nome, tamanho}]
  const [etapa, setEtapa] = useState('EF');
  const [serie, setSerie] = useState('');
  const [ano, setAno] = useState('');
  const [referenciais, setReferenciais] = useState(['BNCC']);

  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);

  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [baixandoWord, setBaixandoWord] = useState(false);

  // ============================================================
  // AÇÕES
  // ============================================================
  const podeGerar = () => (texto.trim().length >= 20 || arquivos.length > 0);

  const handleArquivos = (e) => {
    setErro('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const aceitos = [];
    const rejeitados = [];

    for (const f of files) {
      const ext = f.name.split('.').pop().toLowerCase();
      const extOk = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx'].includes(ext);
      if (!extOk) {
        rejeitados.push(`${f.name}: formato não aceito`);
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        rejeitados.push(`${f.name}: maior que ${MAX_MB} MB`);
        continue;
      }
      aceitos.push(f);
    }

    setArquivos((prev) => {
      const combinado = [...prev.map((a) => a.file), ...aceitos];
      const unico = combinado.slice(0, MAX_PAGINAS);
      return unico.map((file) => ({ file, nome: file.name, tamanho: file.size }));
    });

    if (rejeitados.length) {
      setErro(
        `Alguns arquivos foram ignorados:\n${rejeitados.join('\n')}`
      );
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  const removerArquivo = (idx) => {
    setArquivos((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleReferencial = (v) => {
    setReferenciais((prev) =>
      prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]
    );
  };

  const limpar = () => {
    if (!window.confirm('Limpar tudo e começar de novo?')) return;
    setTexto('');
    setArquivos([]);
    setSerie('');
    setAno('');
    setResultado(null);
    setErro('');
  };

  // ============================================================
  // GERAR
  // ============================================================
  const gerar = async () => {
    setErro('');
    setResultado(null);

    if (!podeGerar()) {
      setErro('Escreva um esboço ou anexe pelo menos um arquivo.');
      return;
    }
    if (!referenciais.length) {
      setErro('Selecione pelo menos um referencial.');
      return;
    }

    const formData = new FormData();
    formData.append('texto', texto.trim());
    formData.append('etapa', etapa);
    if (serie) formData.append('serie', serie.trim());
    if (ano) formData.append('ano', ano.trim());
    formData.append('referenciais', JSON.stringify(referenciais));
    arquivos.forEach((a) => formData.append('paginas', a.file));

    setGerando(true);
    try {
      const res = await api.post(
        '/lesson-plans/generate-from-sketch',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 240000 }
      );
      setResultado(res.data);
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Erro ao gerar o plano. Tente novamente.';
      setErro(msg);
    } finally {
      setGerando(false);
    }
  };

  // ============================================================
  // BAIXAR PDF
  // ============================================================
  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      const el = document.getElementById('plano-conteudo');
      if (!el) {
        alert('Conteúdo não encontrado.');
        return;
      }
      const nome = (resultado?.title || 'plano_com_roteiro').replace(/\s+/g, '_');
      const cab = resultado?.structured_data?.cabecalho || {};

      const dadosCapa = [];
      if (cab.periodo)      dadosCapa.push({ label: 'Período', valor: cab.periodo });
      if (cab.turma)        dadosCapa.push({ label: 'Turma', valor: cab.turma });
      if (cab.faixa_etaria) dadosCapa.push({ label: 'Faixa etária', valor: cab.faixa_etaria });
      if (cab.etapa)        dadosCapa.push({ label: 'Etapa', valor: cab.etapa });

      await gerarPDF(el, nome, {
        capa: {
          badge: 'Plano com Roteiro · BNCC',
          titulo: cab.titulo || resultado?.title,
          dados: dadosCapa,
        },
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  // ============================================================
  // BAIXAR WORD
  // ============================================================
  const baixarWord = async () => {
    setBaixandoWord(true);
    try {
      const id = resultado?.id;
      if (!id) {
        alert('Plano ainda não foi salvo.');
        return;
      }
      const res = await api.post(
        `/lesson-plans/export-word/${id}`,
        {},
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const nome = (resultado?.title || 'plano_com_roteiro')
        .replace(/\s+/g, '_')
        .slice(0, 60);
      a.download = `${nome}_PLANO.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao baixar Word.');
    } finally {
      setBaixandoWord(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <Link to="/planejador" className="text-sm hover:underline" style={{ color: AZUL }}>
        ← Voltar ao Planejador
      </Link>

      {/* HEADER */}
      <div className="mt-6 mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📋</span>
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full mb-2"
              style={{ backgroundColor: OURO_CLARO, color: OURO }}
            >
              <span>🧠</span>
              <span>PLANEJADOR SIMIDNAPE · PLANO COM ROTEIRO</span>
            </div>
            <h1
              className="text-3xl font-bold"
              style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}
            >
              Plano com Roteiro
            </h1>
            <p style={{ color: TEXTO_2 }}>
              Cole um esboço, escreva ou envie foto/PDF/Word. A IA devolve o plano completo.
            </p>
          </div>
        </div>
        {(texto || arquivos.length > 0 || resultado) && (
          <button
            onClick={limpar}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition"
            style={{ backgroundColor: PESSEGO_CLARO, color: CORAL, borderColor: BORDA }}
          >
            🔄 Limpar tudo
          </button>
        )}
      </div>

      {/* FORMULÁRIO */}
      {!resultado && (
        <>
          {/* Área de texto */}
          <div
            className="rounded-xl shadow-sm border p-6 mb-5"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h2
              className="text-lg font-semibold mb-2"
              style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}
            >
              ✍️ Cole ou escreva seu esboço
            </h2>
            <p className="text-xs mb-3" style={{ color: TEXTO_2 }}>
              Pode ser um rascunho, uma lista de temas, uma semana inteira. A IA lê e organiza.
            </p>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={10}
              placeholder={`Ex:\n\n3ª semana (13 a 15/10) - Pré II\n- Promoção da saúde: hábitos de higiene\n- Atividades esportivas e recreativas: jogos escolares\n- Oficina de arte, música e teatro (Dia dos Professores)\n- Literatura Infantil: trava-língua\n- Computação desplugada: caça ao tesouro`}
              className="w-full rounded-lg px-4 py-3 text-sm border focus:outline-none focus:ring-2 transition resize-y"
              style={{
                borderColor: BORDA,
                color: TEXTO,
                backgroundColor: BRANCO,
                minHeight: '180px',
              }}
            />
            <p className="text-xs mt-2" style={{ color: TEXTO_2 }}>
              {texto.length} caracteres
            </p>
          </div>

          {/* Área de upload */}
          <div
            className="rounded-xl shadow-sm border p-6 mb-5"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h2
              className="text-lg font-semibold mb-2"
              style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}
            >
              📎 Anexe fotos, PDF ou Word
            </h2>
            <p className="text-xs mb-3" style={{ color: TEXTO_2 }}>
              Até {MAX_PAGINAS} arquivos · {MAX_MB} MB cada · JPG, PNG, WEBP, PDF, DOCX
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"
              multiple
              onChange={handleArquivos}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={arquivos.length >= MAX_PAGINAS}
              className="w-full border-2 border-dashed rounded-xl p-6 text-center transition disabled:opacity-50"
              style={{ borderColor: BORDA, backgroundColor: CREME }}
            >
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm font-medium" style={{ color: TEXTO }}>
                {arquivos.length >= MAX_PAGINAS
                  ? `Máximo de ${MAX_PAGINAS} arquivos atingido`
                  : 'Clique para escolher arquivos'}
              </p>
              <p className="text-xs mt-1" style={{ color: TEXTO_2 }}>
                No celular, escolha a câmera para fotografar o caderno
              </p>
            </button>

            {/* Preview dos arquivos */}
            {arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold" style={{ color: TEXTO_2 }}>
                  {arquivos.length} arquivo(s) anexado(s)
                </p>
                {arquivos.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-2"
                    style={{ borderColor: BORDA, backgroundColor: BRANCO }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xl flex-shrink-0">
                        {a.nome.toLowerCase().endsWith('.pdf')
                          ? '📄'
                          : a.nome.toLowerCase().endsWith('.docx')
                          ? '📝'
                          : '🖼️'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: TEXTO }}
                        >
                          {a.nome}
                        </p>
                        <p className="text-[10px]" style={{ color: TEXTO_2 }}>
                          {formatarBytes(a.tamanho)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerArquivo(i)}
                      className="text-xs px-2 py-1 flex-shrink-0"
                      style={{ color: CORAL }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Etapa + série + ano */}
          <div
            className="rounded-xl shadow-sm border p-6 mb-5"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h2
              className="text-lg font-semibold mb-3"
              style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}
            >
              🎓 Etapa de ensino
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {[
                { v: 'EI', l: 'Educação Infantil', emoji: '🧸' },
                { v: 'EF', l: 'Ensino Fundamental', emoji: '📘' },
                { v: 'EM', l: 'Ensino Médio', emoji: '🎓' },
              ].map((op) => (
                <button
                  key={op.v}
                  type="button"
                  onClick={() => setEtapa(op.v)}
                  className="rounded-lg border-2 p-3 text-left transition"
                  style={{
                    borderColor: etapa === op.v ? AZUL : BORDA,
                    backgroundColor: etapa === op.v ? AZUL_CLARO : BRANCO,
                  }}
                >
                  <p className="text-2xl mb-1">{op.emoji}</p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: etapa === op.v ? AZUL : TEXTO }}
                  >
                    {op.l}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>
                  Série/Turma (opcional)
                </label>
                <input
                  type="text"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  placeholder="Ex: Pré II, 5º ano A, 3ª série EM"
                  className="w-full rounded-lg px-3 py-2 text-sm border"
                  style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: TEXTO }}>
                  Ano (opcional)
                </label>
                <input
                  type="text"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  placeholder="Ex: 5"
                  className="w-full rounded-lg px-3 py-2 text-sm border"
                  style={{ borderColor: BORDA, color: TEXTO, backgroundColor: BRANCO }}
                />
              </div>
            </div>
          </div>

          {/* Referenciais */}
          <div
            className="rounded-xl shadow-sm border p-6 mb-5"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h2
              className="text-lg font-semibold mb-3"
              style={{ color: TEXTO, fontFamily: "'Quicksand', sans-serif" }}
            >
              📖 Referenciais ativos
            </h2>
            <div className="flex flex-wrap gap-2">
              {REFERENCIAIS.map((r) => {
                const ativo = referenciais.includes(r.v);
                return (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => toggleReferencial(r.v)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full border-2 transition"
                    style={{
                      borderColor: ativo ? AZUL : BORDA,
                      backgroundColor: ativo ? AZUL_CLARO : BRANCO,
                      color: ativo ? AZUL : TEXTO_2,
                    }}
                  >
                    {ativo ? '✓ ' : ''}{r.l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div
              className="rounded-lg p-3 mb-5 text-sm whitespace-pre-line border"
              style={{
                backgroundColor: PESSEGO_CLARO,
                borderColor: CORAL,
                color: CORAL,
              }}
            >
              ⚠️ {erro}
            </div>
          )}

          {/* Botão gerar */}
          <div
            className="rounded-xl p-6 mb-5 text-white"
            style={{ background: `linear-gradient(135deg, ${OURO}, ${CORAL})` }}
          >
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/80">
                  Gerar plano
                </p>
                <p className="text-2xl font-bold">Plano com Roteiro</p>
                <p className="text-sm text-white/90 mt-1">
                  {arquivos.length > 0
                    ? `${arquivos.length} arquivo(s) + texto`
                    : texto.trim()
                    ? `${texto.length} caracteres`
                    : 'Envie texto ou arquivos'}
                </p>
              </div>
              <button
                onClick={gerar}
                disabled={gerando || !podeGerar()}
                className="bg-white font-bold px-6 py-3 rounded-xl transition disabled:opacity-60"
                style={{ color: OURO }}
              >
                {gerando ? '✨ Lendo seu esboço...' : '✨ Gerar plano com roteiro'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* RESULTADO */}
      {resultado && (
        <ResultadoPlano
          resultado={resultado}
          onNovaGeracao={limpar}
          onPdf={baixarPdf}
          onWord={baixarWord}
          gerandoPdf={gerandoPdf}
          baixandoWord={baixandoWord}
        />
      )}
    </div>
  );
};

// ============================================================
// RESULTADO — renderiza o plano
// ============================================================
const ResultadoPlano = ({
  resultado,
  onNovaGeracao,
  onPdf,
  onWord,
  gerandoPdf,
  baixandoWord,
}) => {
  const sd = resultado.structured_data || {};
  const cab = sd.cabecalho || {};

  return (
    <div className="space-y-5">
      {/* Barra de ações */}
      <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
        <button
          onClick={onNovaGeracao}
          className="text-sm font-medium hover:underline"
          style={{ color: AZUL }}
        >
          ← Criar outro plano
        </button>
        <div className="flex gap-2">
          <button
            onClick={onWord}
            disabled={baixandoWord}
            className="text-sm font-semibold px-4 py-2 rounded-lg border disabled:opacity-60"
            style={{
              backgroundColor: BRANCO,
              color: AZUL,
              borderColor: AZUL,
            }}
          >
            {baixandoWord ? '⏳ Gerando Word...' : '📝 Baixar Word'}
          </button>
          <button
            onClick={onPdf}
            disabled={gerandoPdf}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
            style={{ backgroundColor: AZUL }}
          >
            {gerandoPdf ? '⏳ Gerando PDF...' : '📥 Baixar PDF'}
          </button>
        </div>
      </div>

      {/* Conteúdo capturado para PDF */}
      <div
        id="plano-conteudo"
        style={{ backgroundColor: CREME, padding: '24px', borderRadius: '12px' }}
      >
        {/* Cabeçalho */}
        <div
          className="rounded-xl p-6 mb-5 border"
          style={{ backgroundColor: BRANCO, borderColor: BORDA }}
        >
          <div
            className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
            style={{ backgroundColor: OURO_CLARO, color: OURO }}
          >
            📋 PLANO COM ROTEIRO
          </div>
          <h2
            className="text-3xl font-bold mb-3"
            style={{ color: AZUL, fontFamily: "'Lora', serif" }}
          >
            {cab.titulo || resultado.title}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {cab.periodo && (
              <div>
                <p className="text-xs uppercase" style={{ color: TEXTO_2 }}>Período</p>
                <p className="font-medium" style={{ color: TEXTO }}>{cab.periodo}</p>
              </div>
            )}
            {cab.turma && (
              <div>
                <p className="text-xs uppercase" style={{ color: TEXTO_2 }}>Turma</p>
                <p className="font-medium" style={{ color: TEXTO }}>{cab.turma}</p>
              </div>
            )}
            {cab.faixa_etaria && (
              <div>
                <p className="text-xs uppercase" style={{ color: TEXTO_2 }}>Faixa etária</p>
                <p className="font-medium" style={{ color: TEXTO }}>{cab.faixa_etaria}</p>
              </div>
            )}
            {cab.etapa && (
              <div>
                <p className="text-xs uppercase" style={{ color: TEXTO_2 }}>Etapa</p>
                <p className="font-medium" style={{ color: TEXTO }}>{cab.etapa}</p>
              </div>
            )}
          </div>

          {cab.tema_geral && (
            <div className="mt-4">
              <p className="text-xs uppercase" style={{ color: TEXTO_2 }}>Tema geral</p>
              <p className="font-semibold" style={{ color: TEXTO }}>{cab.tema_geral}</p>
            </div>
          )}

          {cab.referenciais?.length > 0 && (
            <p className="text-xs mt-3" style={{ color: TEXTO_2 }}>
              Referenciais: {cab.referenciais.join(' · ')}
            </p>
          )}
        </div>

        {/* Objetivo geral */}
        {sd.objetivo_geral && (
          <div
            className="rounded-xl p-6 mb-5 border"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}
            >
              🎯 Objetivo Geral
            </h3>
            <p className="leading-relaxed" style={{ color: TEXTO }}>
              {sd.objetivo_geral}
            </p>
          </div>
        )}

        {/* Dias */}
        {(sd.dias || []).map((dia, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border mb-5"
            style={{ borderColor: BORDA }}
          >
            <div
              className="px-5 py-3 text-white"
              style={{ backgroundColor: AZUL }}
            >
              <p className="text-sm font-bold">
                {dia.data} · {dia.titulo}
              </p>
            </div>
            <div
              className="p-5 space-y-3"
              style={{ backgroundColor: BRANCO }}
            >
              {dia.conteudos?.length > 0 && (
                <div>
                  <p
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: AZUL }}
                  >
                    Conteúdos
                  </p>
                  <p className="text-sm" style={{ color: TEXTO }}>
                    {dia.conteudos.join(' · ')}
                  </p>
                </div>
              )}
              {dia.desenvolvimento && (
                <div>
                  <p
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: AZUL }}
                  >
                    Desenvolvimento
                  </p>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: TEXTO }}
                  >
                    {dia.desenvolvimento}
                  </p>
                </div>
              )}
              {dia.habilidades_bncc?.length > 0 && (
                <div>
                  <p
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: AZUL }}
                  >
                    Habilidades BNCC
                  </p>
                  <div className="space-y-1">
                    {dia.habilidades_bncc.map((h, j) => (
                      <p key={j} className="text-sm" style={{ color: TEXTO }}>
                        <strong style={{ color: VERDE }}>{h.codigo}</strong> — {h.texto}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {dia.objetivos?.length > 0 && (
                <div>
                  <p
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: AZUL }}
                  >
                    Objetivos
                  </p>
                  <ul className="space-y-1">
                    {dia.objetivos.map((o, j) => (
                      <li
                        key={j}
                        className="text-sm flex gap-2"
                        style={{ color: TEXTO }}
                      >
                        <span style={{ color: AZUL }}>•</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Literatura Infantil */}
        {(sd.literatura_infantil?.genero || sd.literatura_infantil?.atividades?.length > 0) && (
          <div
            className="rounded-xl p-6 mb-5 border"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}
            >
              📖 Literatura Infantil e Produção Textual
            </h3>
            {sd.literatura_infantil.genero && (
              <p className="text-sm mb-2" style={{ color: TEXTO }}>
                <strong>Gênero:</strong> {sd.literatura_infantil.genero}
              </p>
            )}
            {sd.literatura_infantil.atividades?.length > 0 && (
              <ul className="space-y-1 mb-3">
                {sd.literatura_infantil.atividades.map((a, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: TEXTO }}>
                    <span style={{ color: AZUL }}>•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            )}
            {sd.literatura_infantil.habilidades_bncc?.map((h, i) => (
              <p key={i} className="text-sm" style={{ color: TEXTO }}>
                <strong style={{ color: VERDE }}>{h.codigo}</strong> — {h.texto}
              </p>
            ))}
          </div>
        )}

        {/* Computação */}
        {sd.computacao?.tema && (
          <div
            className="rounded-xl p-6 mb-5 border"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}
            >
              💻 Computação
            </h3>
            <p className="text-sm mb-2" style={{ color: TEXTO }}>
              <strong>Tema:</strong> {sd.computacao.tema}
            </p>
            {sd.computacao.objetivo && (
              <p className="text-sm mb-2" style={{ color: TEXTO }}>
                <strong>Objetivo:</strong> {sd.computacao.objetivo}
              </p>
            )}
            {sd.computacao.desenvolvimento && (
              <p
                className="text-sm leading-relaxed whitespace-pre-line mb-3"
                style={{ color: TEXTO }}
              >
                {sd.computacao.desenvolvimento}
              </p>
            )}
            {sd.computacao.habilidades_bncc?.map((h, i) => (
              <p key={i} className="text-sm" style={{ color: TEXTO }}>
                <strong style={{ color: VERDE }}>{h.codigo}</strong> — {h.texto}
              </p>
            ))}
          </div>
        )}

        {/* Recursos */}
        {sd.recursos?.length > 0 && (
          <div
            className="rounded-xl p-6 mb-5 border"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}
            >
              📦 Recursos
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: TEXTO }}>
              {sd.recursos.join(' · ')}
            </p>
          </div>
        )}

        {/* Avaliação */}
        {sd.avaliacao && (
          <div
            className="rounded-xl p-6 mb-5 border"
            style={{ backgroundColor: BRANCO, borderColor: BORDA }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}
            >
              📊 Avaliação
            </h3>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: TEXTO }}
            >
              {sd.avaliacao}
            </p>
          </div>
        )}

        {/* Culminância */}
        {sd.culminancia && (
          <div
            className="rounded-xl p-6 mb-5 border"
            style={{ backgroundColor: VERDE_CLARO, borderColor: BORDA }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: AZUL, fontFamily: "'Quicksand', sans-serif" }}
            >
              🎉 Culminância
            </h3>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: TEXTO }}
            >
              {sd.culminancia}
            </p>
          </div>
        )}

        {/* Reflexão pós-aula (em branco) */}
        <div
          className="rounded-xl p-6 border-2 border-dashed"
          style={{ borderColor: OURO, backgroundColor: OURO_CLARO }}
        >
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: OURO, fontFamily: "'Quicksand', sans-serif" }}
          >
            📝 Reflexão pós-aula
          </h3>
          <p className="text-xs italic mb-3" style={{ color: TEXTO_2 }}>
            Espaço reservado para você registrar, após o período, o que funcionou bem e o que pode ser ajustado.
          </p>
          <div className="space-y-3 pt-2">
            <div className="h-3 border-b" style={{ borderColor: 'rgba(212,168,67,0.4)' }} />
            <div className="h-3 border-b" style={{ borderColor: 'rgba(212,168,67,0.4)' }} />
            <div className="h-3 border-b" style={{ borderColor: 'rgba(212,168,67,0.4)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanoComRoteiro;