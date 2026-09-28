from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from ..models.system_setting import SystemSetting


# ============================================================
# DEFINIÇÕES PADRÃO
# Aparecem no painel admin mesmo antes de serem salvas pela primeira vez.
# O super admin pode alterar; a estrutura abaixo é só o valor inicial.
# ============================================================
DEFAULTS: Dict[str, Dict[str, Any]] = {
    "feature_gerar_imagem_ia": {
        "valor": "false",
        "tipo": "bool",
        "categoria": "feature_flag",
        "descricao": (
            "Liga/desliga a geração de imagens IA para todos os usuários. "
            "Quando desligado, o botão não aparece para ninguém e o endpoint "
            "retorna indisponível."
        ),
    },
    "texto_imagem_ia_indisponivel": {
        "valor": (
            "A geração de imagens com IA está temporariamente indisponível. "
            "Em breve liberaremos novamente."
        ),
        "tipo": "string",
        "categoria": "texto",
        "descricao": (
            "Mensagem exibida quando o recurso de geração de imagens IA está desligado."
        ),
    },
}


# ============================================================
# SERIALIZAÇÃO / DESSERIALIZAÇÃO
# ============================================================
def _serializar(valor: Any, tipo: str) -> str:
    if tipo == "bool":
        return "true" if bool(valor) else "false"
    if tipo == "json":
        import json
        return json.dumps(valor, ensure_ascii=False)
    return str(valor)


def _desserializar(valor: str, tipo: str) -> Any:
    if tipo == "bool":
        return str(valor).strip().lower() in ("true", "1", "sim", "yes")
    if tipo == "int":
        try:
            return int(valor)
        except (ValueError, TypeError):
            return 0
    if tipo == "json":
        import json
        try:
            return json.loads(valor)
        except (ValueError, TypeError):
            return None
    return valor


# ============================================================
# LEITURA
# ============================================================
def obter_setting(db: Session, chave: str, default: Any = None) -> Any:
    """
    Retorna o valor já desserializado de uma chave.
    Se não existir no banco, cai no DEFAULTS declarado acima.
    Se ainda assim não houver, retorna `default`.
    """
    row = db.query(SystemSetting).filter(SystemSetting.chave == chave).first()
    if row:
        return _desserializar(row.valor, row.tipo)

    if chave in DEFAULTS:
        return _desserializar(DEFAULTS[chave]["valor"], DEFAULTS[chave]["tipo"])

    return default


def flag_ativa(db: Session, chave: str, default: bool = False) -> bool:
    """
    Helper para checar flags booleanas.
    Se a chave não existir, retorna `default`.
    """
    val = obter_setting(db, chave, default=None)
    if val is None:
        return default
    return bool(val)


# ============================================================
# ESCRITA
# ============================================================
def set_setting(
    db: Session,
    chave: str,
    valor: Any,
    tipo: Optional[str] = None,
    categoria: Optional[str] = None,
    descricao: Optional[str] = None,
    updated_by: Optional[str] = None,
) -> SystemSetting:
    """
    Cria ou atualiza uma chave (upsert).
    Se a chave já existe, atualiza valor/tipo/categoria/descricao.
    Se não existe, cria — usando DEFAULTS como fallback de metadados.
    """
    row = db.query(SystemSetting).filter(SystemSetting.chave == chave).first()

    if not row:
        meta = DEFAULTS.get(chave, {})
        row = SystemSetting(
            chave=chave,
            tipo=tipo or meta.get("tipo", "string"),
            categoria=categoria or meta.get("categoria", "geral"),
            descricao=descricao if descricao is not None else meta.get("descricao"),
            updated_by=updated_by,
        )
        db.add(row)
    else:
        if tipo is not None:
            row.tipo = tipo
        if categoria is not None:
            row.categoria = categoria
        if descricao is not None:
            row.descricao = descricao
        row.updated_by = updated_by

    row.valor = _serializar(valor, row.tipo)
    db.commit()
    db.refresh(row)
    return row


# ============================================================
# LISTAGEM (para o painel admin)
# ============================================================
def listar_settings(db: Session, categoria: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Lista todas as settings — incluindo as que ainda NÃO foram salvas,
    mas estão declaradas em DEFAULTS. Assim o super admin sempre vê o switch.
    """
    query = db.query(SystemSetting)
    if categoria:
        query = query.filter(SystemSetting.categoria == categoria)
    rows = query.all()

    existentes = {r.chave: r for r in rows}
    resultado: List[Dict[str, Any]] = []

    # 1) DEFAULTS (garante que sempre apareçam)
    for chave, meta in DEFAULTS.items():
        if categoria and meta["categoria"] != categoria:
            continue

        if chave in existentes:
            r = existentes[chave]
            resultado.append({
                "chave": r.chave,
                "valor": _desserializar(r.valor, r.tipo),
                "valor_raw": r.valor,
                "tipo": r.tipo,
                "categoria": r.categoria,
                "descricao": r.descricao,
                "updated_by": str(r.updated_by) if r.updated_by else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                "padrao": False,
            })
        else:
            resultado.append({
                "chave": chave,
                "valor": _desserializar(meta["valor"], meta["tipo"]),
                "valor_raw": meta["valor"],
                "tipo": meta["tipo"],
                "categoria": meta["categoria"],
                "descricao": meta.get("descricao"),
                "updated_by": None,
                "updated_at": None,
                "padrao": True,
            })

    # 2) Chaves que existem no banco mas não estão em DEFAULTS
    for chave, r in existentes.items():
        if chave in DEFAULTS:
            continue
        if categoria and r.categoria != categoria:
            continue
        resultado.append({
            "chave": r.chave,
            "valor": _desserializar(r.valor, r.tipo),
            "valor_raw": r.valor,
            "tipo": r.tipo,
            "categoria": r.categoria,
            "descricao": r.descricao,
            "updated_by": str(r.updated_by) if r.updated_by else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            "padrao": False,
        })

    resultado.sort(key=lambda x: (x["categoria"], x["chave"]))
    return resultado


# ============================================================
# LEITURA PÚBLICA
# Retorna apenas o que o frontend precisa saber (sem dados sensíveis)
# ============================================================
def listar_flags_publicas(db: Session) -> Dict[str, Any]:
    """
    Devolve apenas as flags/valores que podem ser expostos publicamente.
    Usado pelo hook useSystemFlags() no frontend.
    """
    return {
        "feature_gerar_imagem_ia": flag_ativa(
            db, "feature_gerar_imagem_ia", default=False
        ),
        "texto_imagem_ia_indisponivel": obter_setting(
            db,
            "texto_imagem_ia_indisponivel",
            default=DEFAULTS["texto_imagem_ia_indisponivel"]["valor"],
        ),
    }