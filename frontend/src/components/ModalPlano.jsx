import React, { useState } from 'react';

/**
 * Modal que mostra um planejamento e permite editá-lo inline.
 *
 * Modos:
 *   - "ver": visualiza o conteúdo. Botão "✏️ Editar" muda para edição.
 *   - "editar": edita o conteúdo. Botões "💾 Salvar" e "💾 Salvar como novo".
 *
 * Neste bloco (D11b), apenas o Modo Aula é editável.
 * Modo Planejamento e Modo Coordenação mostram "edição em breve" no modo editar.
 */
const ModalPlano = ({ plano, onFechar, onSalvar }) => {
  const [modo, setModo] = useState('ver');
  const [titulo, setTitulo] = useState(plano.title || '');
  const [conteudo, setConteudo] = useState(
    JSON.parse(JSON.stringify(plano.structured_data || {}))
  );
  const [salvando, setSalvando] = useState(false);

  const modoPlano = plano.modo || 'aula';

  // ============================================================
  // EDIÇÃO — Modo Aula
  // ============================================================
  const atualizarRoteiro = (index, campo, valor) => {
    const novo = { ...conteudo };
    if (!novo.roteiro) novo.roteiro = [];
    novo.roteiro = [...novo.roteiro];
    novo.roteiro[index] = { ...novo.roteiro[index], [campo]: valor };
    setConteudo(novo);
  };

  const adicionarBlocoRoteiro = () => {
    const novo = { ...conteudo };
    if (!novo.roteiro) novo.roteiro = [];
    novo.roteiro = [...novo.roteiro, {
      tempo: '', titulo: '', faca: '', fale: '', pergunte: '', alunos: '',
      principio_relacionado: '',
    }];
    setConteudo(novo);
  };

  const removerBlocoRoteiro = (index) => {
    if (!window.confirm('Remover este bloco do roteiro?')) return;
    const novo = { ...conteudo };
    novo.roteiro = (novo.roteiro || []).filter((_, i) => i !== index);
    setConteudo(novo);
  };

  const atualizarChecklist = (index, valor) => {
    const novo = { ...conteudo };
    novo.checklist = [...(novo.checklist || [])];
    novo.checklist[index] = valor;
    setConteudo(novo);
  };

  const adicionarChecklist = () => {
    const novo = { ...conteudo };
    novo.checklist = [...(novo.checklist || []), ''];
    setConteudo(novo);
  };

  const removerChecklist = (index) => {
    const novo = { ...conteudo };
    novo.checklist = (novo.checklist || []).filter((_, i) => i !== index);
    setConteudo(novo);
  };

  const atualizarAdaptacao = (index, valor) => {
    const novo = { ...conteudo };
    novo.adaptacoes = [...(novo.adaptacoes || [])];
    novo.adaptacoes[index] = valor;
    setConteudo(novo);
  };

  const adicionarAdaptacao = () => {
    const novo = { ...conteudo };
    novo.adaptacoes = [...(novo.adaptacoes || []), ''];
    setConteudo(novo);
  };

  const removerAdaptacao = (index) => {
    const novo = { ...conteudo };
    novo.adaptacoes = (novo.adaptacoes || []).filter((_, i) => i !== index);
    setConteudo(novo);
  };

  // ============================================================
  // EDIÇÃO — Modo Planejamento (D11c)
  // ============================================================
  const atualizarAula = (index, campo, valor) => {
    const novo = { ...conteudo };
    novo.sequencia_didatica = [...(novo.sequencia_didatica || [])];
    novo.sequencia_didatica[index] = { ...novo.sequencia_didatica[index], [campo]: valor };
    setConteudo(novo);
  };

  const atualizarAulaLista = (index, campo, indexItem, valor) => {
    const novo = { ...conteudo };
    const aulas = [...(novo.sequencia_didatica || [])];
    const lista = [...(aulas[index]?.[campo] || [])];
    lista[indexItem] = valor;
    aulas[index] = { ...aulas[index], [campo]: lista };
    novo.sequencia_didatica = aulas;
    setConteudo(novo);
  };

  const adicionarAulaItem = (index, campo) => {
    const novo = { ...conteudo };
    const aulas = [...(novo.sequencia_didatica || [])];
    aulas[index] = {
      ...aulas[index],
      [campo]: [...(aulas[index]?.[campo] || []), ''],
    };
    novo.sequencia_didatica = aulas;
    setConteudo(novo);
  };

  const removerAulaItem = (index, campo, indexItem) => {
    const novo = { ...conteudo };
    const aulas = [...(novo.sequencia_didatica || [])];
    aulas[index] = {
      ...aulas[index],
      [campo]: (aulas[index]?.[campo] || []).filter((_, i) => i !== indexItem),
    };
    novo.sequencia_didatica = aulas;
    setConteudo(novo);
  };

  const adicionarAula = () => {
    const novo = { ...conteudo };
    const aulas = [...(novo.sequencia_didatica || [])];
    aulas.push({
      numero_aula: aulas.length + 1,
      titulo: '',
      objetivo_da_aula: '',
      conteudo: '',
      metodologia: '',
      atividades: [],
      recursos: [],
      avaliacao_da_aula: '',
      duracao_minutos: 50,
      principio_cognitivo: '',
    });
    novo.sequencia_didatica = aulas;
    setConteudo(novo);
  };

  const removerAula = (index) => {
    if (!window.confirm('Remover esta aula da sequência?')) return;
    const novo = { ...conteudo };
    novo.sequencia_didatica = (novo.sequencia_didatica || []).filter((_, i) => i !== index);
    setConteudo(novo);
  };

  const atualizarObjetivoEspecifico = (index, valor) => {
    const novo = { ...conteudo };
    novo.objetivos_especificos = [...(novo.objetivos_especificos || [])];
    novo.objetivos_especificos[index] = valor;
    setConteudo(novo);
  };

  const adicionarObjetivoEspecifico = () => {
    const novo = { ...conteudo };
    novo.objetivos_especificos = [...(novo.objetivos_especificos || []), ''];
    setConteudo(novo);
  };

  const removerObjetivoEspecifico = (index) => {
    const novo = { ...conteudo };
    novo.objetivos_especificos = (novo.objetivos_especificos || []).filter((_, i) => i !== index);
    setConteudo(novo);
  };

  // Adaptações do modo Planejamento (estrutura diferente: { necessidade, estrategias[] })
  const atualizarAdaptacaoPlano = (index, campo, valor) => {
    const novo = { ...conteudo };
    novo.adaptacoes_inclusivas = [...(novo.adaptacoes_inclusivas || [])];
    novo.adaptacoes_inclusivas[index] = { ...novo.adaptacoes_inclusivas[index], [campo]: valor };
    setConteudo(novo);
  };

  const atualizarEstrategiaAdaptacao = (indexAdapt, indexEstrat, valor) => {
    const novo = { ...conteudo };
    const adapts = [...(novo.adaptacoes_inclusivas || [])];
    const ests = [...(adapts[indexAdapt]?.estrategias || [])];
    ests[indexEstrat] = valor;
    adapts[indexAdapt] = { ...adapts[indexAdapt], estrategias: ests };
    novo.adaptacoes_inclusivas = adapts;
    setConteudo(novo);
  };

  const adicionarEstrategiaAdaptacao = (indexAdapt) => {
    const novo = { ...conteudo };
    const adapts = [...(novo.adaptacoes_inclusivas || [])];
    adapts[indexAdapt] = {
      ...adapts[indexAdapt],
      estrategias: [...(adapts[indexAdapt]?.estrategias || []), ''],
    };
    novo.adaptacoes_inclusivas = adapts;
    setConteudo(novo);
  };

  const removerEstrategiaAdaptacao = (indexAdapt, indexEstrat) => {
    const novo = { ...conteudo };
    const adapts = [...(novo.adaptacoes_inclusivas || [])];
    adapts[indexAdapt] = {
      ...adapts[indexAdapt],
      estrategias: (adapts[indexAdapt]?.estrategias || []).filter((_, i) => i !== indexEstrat),
    };
    novo.adaptacoes_inclusivas = adapts;
    setConteudo(novo);
  };

  const adicionarAdaptacaoPlano = () => {
    const novo = { ...conteudo };
    novo.adaptacoes_inclusivas = [...(novo.adaptacoes_inclusivas || []), { necessidade: '', estrategias: [] }];
    setConteudo(novo);
  };

  const removerAdaptacaoPlano = (index) => {
    const novo = { ...conteudo };
    novo.adaptacoes_inclusivas = (novo.adaptacoes_inclusivas || []).filter((_, i) => i !== index);
    setConteudo(novo);
  };

  // ============================================================
  // SALVAR
  // ============================================================
  const salvar = async (comoNovo) => {
    if (!titulo.trim()) { alert('O título não pode ficar vazio.'); return; }
    setSalvando(true);
    try {
      await onSalvar({
        title: titulo.trim(),
        structured_data: conteudo,
        comoNovo,
      });
      setModo('ver');
    } catch (e) {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // RENDER — VIEW
  // ============================================================
  const renderView = () => {
    const sd = conteudo;
    if (modoPlano === 'aula') {
      return (
        <>
          {sd.checklist?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">✅ Checklist</h3>
              <ul className="space-y-1">
                {sd.checklist.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700">☐ {item}</li>
                ))}
              </ul>
            </div>
          )}
          {sd.roteiro?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">⏱️ Roteiro</h3>
              <div className="space-y-3">
                {sd.roteiro.map((b, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                      <span className="font-semibold text-sm text-gray-900">{b.titulo}</span>
                      <div className="flex items-center gap-1.5">
                        {b.principio_relacionado && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                            🧠 {b.principio_relacionado}
                          </span>
                        )}
                        {b.tempo && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                            {b.tempo}
                          </span>
                        )}
                      </div>
                    </div>
                    {b.faca && <p className="text-xs text-gray-700 mb-1"><strong>Faça:</strong> {b.faca}</p>}
                    {b.fale && <p className="text-xs text-gray-700 mb-1"><strong>Fale:</strong> {b.fale}</p>}
                    {b.pergunte && <p className="text-xs text-gray-700 mb-1"><strong>Pergunte:</strong> {b.pergunte}</p>}
                    {b.alunos && <p className="text-xs text-gray-700"><strong>Alunos:</strong> {b.alunos}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {sd.adaptacoes?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">♿ Adaptações</h3>
              <ul className="space-y-1">
                {sd.adaptacoes.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700">• {a}</li>
                ))}
              </ul>
            </div>
          )}
          {sd.intervencao && (
            <div className="bg-yellow-50 border border-yellow-100 rounded p-3">
              <p className="text-sm text-yellow-900"><strong>⚠️ Intervenção:</strong> {sd.intervencao}</p>
            </div>
          )}
        </>
      );
    }

    // Outros modos: exibição resumida (a edição vai chegar em D11c e D11d)
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-600">
        Visualização completa deste modo já é suportada na tela principal.
        Edição em breve nos próximos blocos.
      </div>
    );
  };

  // ============================================================
  // RENDER — EDIT (Modo Aula)
  // ============================================================
  // ============================================================
  // RENDER EDIT — Modo Planejamento (D11c)
  // ============================================================
  const renderEditPlanejamento = () => {
    return (
      <>
        {/* Objetivos gerais */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">🎯 Objetivos gerais</h3>
          <textarea
            value={conteudo.objetivos_gerais || ''}
            onChange={(e) => setConteudo({ ...conteudo, objetivos_gerais: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Objetivos específicos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">🎯 Objetivos específicos</h3>
            <button onClick={adicionarObjetivoEspecifico}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Adicionar
            </button>
          </div>
          <div className="space-y-1.5">
            {(conteudo.objetivos_especificos || []).map((o, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text" value={o}
                  onChange={(e) => atualizarObjetivoEspecifico(i, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <button onClick={() => removerObjetivoEspecifico(i)}
                  className="text-red-600 hover:text-red-800 text-sm px-2">🗑️</button>
              </div>
            ))}
          </div>
        </div>

        {/* Justificativa */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">💡 Justificativa</h3>
          <textarea
            value={conteudo.justificativa || ''}
            onChange={(e) => setConteudo({ ...conteudo, justificativa: e.target.value })}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Sequência didática */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">
              ⏱️ Sequência didática ({(conteudo.sequencia_didatica || []).length} aulas)
            </h3>
            <button onClick={adicionarAula}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Adicionar aula
            </button>
          </div>
          <div className="space-y-4">
            {(conteudo.sequencia_didatica || []).map((aula, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    Aula {aula.numero_aula || i + 1}
                  </span>
                  <button onClick={() => removerAula(i)}
                    className="text-xs text-red-600 hover:text-red-800">🗑️ Remover aula</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text" value={aula.titulo || ''}
                    onChange={(e) => atualizarAula(i, 'titulo', e.target.value)}
                    placeholder="Título da aula"
                    className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number" value={aula.duracao_minutos || 50}
                    onChange={(e) => atualizarAula(i, 'duracao_minutos', Number(e.target.value) || 50)}
                    placeholder="Duração (min)"
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <textarea
                    value={aula.objetivo_da_aula || ''}
                    onChange={(e) => atualizarAula(i, 'objetivo_da_aula', e.target.value)}
                    placeholder="Objetivo da aula"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <textarea
                    value={aula.conteudo || ''}
                    onChange={(e) => atualizarAula(i, 'conteudo', e.target.value)}
                    placeholder="Conteúdo"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <textarea
                    value={aula.metodologia || ''}
                    onChange={(e) => atualizarAula(i, 'metodologia', e.target.value)}
                    placeholder="Metodologia (o que o professor faz, passo a passo)"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>

                {/* Atividades dos alunos */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-600">👥 Atividades dos alunos</span>
                    <button onClick={() => adicionarAulaItem(i, 'atividades')}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(aula.atividades || []).map((at, j) => (
                      <div key={j} className="flex gap-2">
                        <input
                          type="text" value={at}
                          onChange={(e) => atualizarAulaLista(i, 'atividades', j, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-xs"
                        />
                        <button onClick={() => removerAulaItem(i, 'atividades', j)}
                          className="text-red-600 text-xs px-1">🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recursos */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-600">📦 Recursos</span>
                    <button onClick={() => adicionarAulaItem(i, 'recursos')}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(aula.recursos || []).map((r, j) => (
                      <div key={j} className="flex gap-2">
                        <input
                          type="text" value={r}
                          onChange={(e) => atualizarAulaLista(i, 'recursos', j, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-xs"
                        />
                        <button onClick={() => removerAulaItem(i, 'recursos', j)}
                          className="text-red-600 text-xs px-1">🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <textarea
                    value={aula.avaliacao_da_aula || ''}
                    onChange={(e) => atualizarAula(i, 'avaliacao_da_aula', e.target.value)}
                    placeholder="Avaliação da aula"
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text" value={aula.principio_cognitivo || ''}
                    onChange={(e) => atualizarAula(i, 'principio_cognitivo', e.target.value)}
                    placeholder="🧠 Princípio cognitivo (opcional)"
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avaliação geral */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">📊 Avaliação geral</h3>
          <textarea
            value={(conteudo.avaliacao_geral?.indicadores_de_sucesso || []).join('\n')}
            onChange={(e) => setConteudo({
              ...conteudo,
              avaliacao_geral: {
                ...(conteudo.avaliacao_geral || {}),
                indicadores_de_sucesso: e.target.value.split('\n').filter(Boolean),
              },
            })}
            rows={3}
            placeholder="Indicadores de sucesso (um por linha)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Adaptações inclusivas */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">🧩 Adaptações inclusivas</h3>
            <button onClick={adicionarAdaptacaoPlano}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {(conteudo.adaptacoes_inclusivas || []).map((a, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">Adaptação {i + 1}</span>
                  <button onClick={() => removerAdaptacaoPlano(i)}
                    className="text-xs text-red-600 hover:text-red-800">🗑️</button>
                </div>
                <input
                  type="text" value={a.necessidade || ''}
                  onChange={(e) => atualizarAdaptacaoPlano(i, 'necessidade', e.target.value)}
                  placeholder="Necessidade (ex: aluno autista)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-2"
                />
                <div className="space-y-1">
                  {(a.estrategias || []).map((e, j) => (
                    <div key={j} className="flex gap-2">
                      <input
                        type="text" value={e}
                        onChange={(ev) => atualizarEstrategiaAdaptacao(i, j, ev.target.value)}
                        placeholder="Estratégia"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-xs"
                      />
                      <button onClick={() => removerEstrategiaAdaptacao(i, j)}
                        className="text-red-600 text-xs px-1">🗑️</button>
                    </div>
                  ))}
                  <button onClick={() => adicionarEstrategiaAdaptacao(i)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                    + Adicionar estratégia
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Considerações finais */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">📌 Considerações finais</h3>
          <textarea
            value={conteudo.consideracoes_finais || ''}
            onChange={(e) => setConteudo({ ...conteudo, consideracoes_finais: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </>
    );
  };

  const renderEdit = () => {
    if (modoPlano === 'planejamento') {
      return renderEditPlanejamento();
    }
    if (modoPlano !== 'aula') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center text-sm text-amber-800">
          🚧 A edição deste modo será habilitada em breve.
        </div>
      );
    }

    return (
      <>
        {/* Checklist */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">✅ Checklist</h3>
            <button onClick={adicionarChecklist}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Adicionar item
            </button>
          </div>
          <div className="space-y-1.5">
            {(conteudo.checklist || []).map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text" value={item}
                  onChange={(e) => atualizarChecklist(i, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <button onClick={() => removerChecklist(i)}
                  className="text-red-600 hover:text-red-800 text-sm px-2">🗑️</button>
              </div>
            ))}
          </div>
        </div>

        {/* Roteiro */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">⏱️ Roteiro</h3>
            <button onClick={adicionarBlocoRoteiro}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Adicionar bloco
            </button>
          </div>
          <div className="space-y-3">
            {(conteudo.roteiro || []).map((b, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">Bloco {i + 1}</span>
                  <button onClick={() => removerBlocoRoteiro(i)}
                    className="text-xs text-red-600 hover:text-red-800">🗑️ Remover bloco</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <input
                    type="text" value={b.tempo || ''}
                    onChange={(e) => atualizarRoteiro(i, 'tempo', e.target.value)}
                    placeholder="Tempo (ex: 0-5 min)"
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text" value={b.titulo || ''}
                    onChange={(e) => atualizarRoteiro(i, 'titulo', e.target.value)}
                    placeholder="Título do bloco"
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <textarea
                    value={b.faca || ''}
                    onChange={(e) => atualizarRoteiro(i, 'faca', e.target.value)}
                    placeholder="Faça (ação do professor)"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <textarea
                    value={b.fale || ''}
                    onChange={(e) => atualizarRoteiro(i, 'fale', e.target.value)}
                    placeholder="Fale (o que dizer)"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <textarea
                    value={b.pergunte || ''}
                    onChange={(e) => atualizarRoteiro(i, 'pergunte', e.target.value)}
                    placeholder="Pergunte"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <textarea
                    value={b.alunos || ''}
                    onChange={(e) => atualizarRoteiro(i, 'alunos', e.target.value)}
                    placeholder="Alunos (o que eles fazem)"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text" value={b.principio_relacionado || ''}
                    onChange={(e) => atualizarRoteiro(i, 'principio_relacionado', e.target.value)}
                    placeholder="🧠 Princípio relacionado (opcional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Adaptações */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">♿ Adaptações</h3>
            <button onClick={adicionarAdaptacao}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Adicionar
            </button>
          </div>
          <div className="space-y-1.5">
            {(conteudo.adaptacoes || []).map((a, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text" value={a}
                  onChange={(e) => atualizarAdaptacao(i, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <button onClick={() => removerAdaptacao(i)}
                  className="text-red-600 hover:text-red-800 text-sm px-2">🗑️</button>
              </div>
            ))}
          </div>
        </div>

        {/* Intervenção */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">⚠️ Intervenção sugerida</h3>
          <textarea
            value={conteudo.intervencao || ''}
            onChange={(e) => setConteudo({ ...conteudo, intervencao: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {modo === 'ver' ? '👁️ Visualizar' : '✏️ Editar'} ·{' '}
              {modoPlano === 'aula' && '🎯 Aula'}
              {modoPlano === 'planejamento' && '📅 Planejamento'}
              {modoPlano === 'coordenacao' && '🎓 Coordenação'}
            </p>
            {modo === 'ver' ? (
              <h2 className="text-lg font-bold text-gray-900 truncate">{titulo}</h2>
            ) : (
              <input
                type="text" value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="text-lg font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-1 w-full"
              />
            )}
          </div>
          <button
            onClick={onFechar}
            className="text-gray-500 hover:text-gray-900 text-2xl w-8 h-8 flex items-center justify-center ml-2"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {modo === 'ver' ? renderView() : renderEdit()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 flex justify-between items-center gap-2 rounded-b-xl flex-wrap">
          <div>
            {modo === 'ver' && (
              <button
                onClick={() => setModo('editar')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition"
              >
                ✏️ Editar
              </button>
            )}
            {modo === 'editar' && (
              <button
                onClick={() => setModo('ver')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {modo === 'editar' && (
              <>
                <button
                  onClick={() => salvar(true)}
                  disabled={salvando}
                  className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-medium text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  💾 Salvar como novo
                </button>
                <button
                  onClick={() => salvar(false)}
                  disabled={salvando}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-sm px-4 py-2 rounded-lg transition"
                >
                  {salvando ? 'Salvando...' : '💾 Salvar'}
                </button>
              </>
            )}
            {modo === 'ver' && (
              <button
                onClick={onFechar}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-5 py-2 rounded-lg transition"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPlano;