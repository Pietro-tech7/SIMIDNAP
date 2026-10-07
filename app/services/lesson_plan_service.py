from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
from typing import Dict, Any, Optional, List
import re
from ..models.lesson_plan import LessonPlan
from .ai_service import get_ai_service


def generate_lesson_plan(
    db: Session,
    user_id: str,
    plan_type: str,
    title: str,
    subject: str = None,
    grade: str = None,
    content: str = None,
    objective: str = None,
    bncc_codigo: str = None,
    bncc_texto: str = None,
    duracao_minutos: int = None,
    tipo_aula: str = None,
    num_alunos: int = None,
    dificuldades: str = None,
    conhecimentos_previos: str = None,
    necessidades_especificas: str = None,
    diferenciado: bool = False,
    extra: Dict[str, Any] = None,
    user=None,
) -> LessonPlan:

    ai = get_ai_service()

    payload = {
        "title": title,
        "subject": subject,
        "grade": grade,
        "content": content,
        "objective": objective,
        "bncc_codigo": bncc_codigo,
        "bncc_texto": bncc_texto,
        "duracao_minutos": duracao_minutos,
        "tipo_aula": tipo_aula,
        "num_alunos": num_alunos,
        "dificuldades": dificuldades,
        "conhecimentos_previos": conhecimentos_previos,
        "necessidades_especificas": necessidades_especificas,
    }
    # Cabeçalho institucional (D9-REBUILD-5) — usado pelo Modo Coordenação
    if extra:
        for k in ("nome_professor", "nome_escola", "municipio", "estado"):
            if extra.get(k):
                payload[k] = extra[k]
    if extra:
        payload.update(extra)

    structured_data = ai.generate_structured(
        task_type=plan_type,
        payload=payload,
        diferenciado=diferenciado,
        user=user,
    )

    # ============================================================
    # Metadados do Planejador SIMIDNAPE (Bloco D5).
    # Extrai modo, período e total de aulas do `extra` e salva na
    # tabela. Campos antigos continuam com o comportamento padrão.
    # ============================================================
    extra = extra or {}

    MODO_POR_PLAN_TYPE = {
        "neuroaula": "aula",
        "aula_que_funciona": "aula",
        "planejamento": "planejamento",
        "coordenacao": "coordenacao",
    }
    modo = extra.get("modo") or MODO_POR_PLAN_TYPE.get(plan_type, "aula")
    periodo_tipo = extra.get("periodo_tipo")
    total_aulas = extra.get("total_aulas")

    def _parse_data(valor):
        """Converte 'YYYY-MM-DD' em objeto date. Retorna None se inválido."""
        if not valor:
            return None
        try:
            return datetime.strptime(str(valor), "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None

    periodo_inicio = _parse_data(extra.get("periodo_inicio"))
    periodo_fim = _parse_data(extra.get("periodo_fim"))

    plan = LessonPlan(
        user_id=user_id,
        plan_type=plan_type,
        title=title,
        subject=subject,
        grade=grade,
        content=content,
        objective=objective,
        structured_data=structured_data,
        modo=modo,
        periodo_tipo=periodo_tipo,
        periodo_inicio=periodo_inicio,
        periodo_fim=periodo_fim,
        total_aulas=total_aulas,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def list_lesson_plans(db: Session, user_id: str, plan_type: str = None):
    query = db.query(LessonPlan).filter(LessonPlan.user_id == user_id)
    if plan_type:
        query = query.filter(LessonPlan.plan_type == plan_type)
    return query.order_by(LessonPlan.created_at.desc()).all()


def get_lesson_plan(db: Session, user_id: str, plan_id: str):
    return db.query(LessonPlan).filter(
        LessonPlan.id == plan_id,
        LessonPlan.user_id == user_id
    ).first()


def delete_lesson_plan(db: Session, user_id: str, plan_id: str):
    plan = get_lesson_plan(db, user_id, plan_id)
    if plan:
        db.delete(plan)
        db.commit()
    return plan


# ============================================================
# MODO PLANEJAMENTO — Geração em LOTES (Bloco D10-fix-3a)
# ============================================================
def generate_planejamento_lote(
    db: Session,
    user_id: str,
    title: str,
    subject: str = None,
    grade: str = None,
    content: str = None,
    objetivo: str = None,
    batch_start: int = 1,
    batch_end: int = 4,
    total_aulas: int = 4,
    extra: Dict[str, Any] = None,
    diferenciado: bool = False,
    user=None,
) -> Dict[str, Any]:
    """
    Gera UM LOTE de aulas para o Modo Planejamento.
    NÃO salva no banco — devolve o JSON parcial para o frontend acumular.
    O salvamento é feito depois por `save_planejamento_completo`.
    """
    ai = get_ai_service()

    payload = {
        "title": title,
        "subject": subject,
        "grade": grade,
        "content": content,
        "objetivo": objetivo,
        # Cabeçalho — dados do professor e da escola (D9-REBUILD-3b)
        "nome_professor": (extra or {}).get("nome_professor"),
        "nome_escola": (extra or {}).get("nome_escola"),
        "municipio": (extra or {}).get("municipio"),
        "estado": (extra or {}).get("estado"),
        # Período
        "periodo_tipo": (extra or {}).get("periodo_tipo"),
        "tempo_aula_minutos": (extra or {}).get("tempo_aula_minutos"),
        "aulas_por_semana": (extra or {}).get("aulas_por_semana"),
        "total_aulas": total_aulas,
        # Currículo
        "habilidades": (extra or {}).get("habilidades"),
        "descritores": (extra or {}).get("descritores"),
        # Descrições completas dos descritores (para a IA usar o texto exato)
        "descritores_detalhados": (extra or {}).get("descritores_detalhados"),
        "referenciais": (extra or {}).get("referenciais"),
        "batch_start": batch_start,
        "batch_end": batch_end,
    }

    structured_data = ai.generate_structured_batch(
        task_type="planejamento",
        payload=payload,
        batch_start=batch_start,
        batch_end=batch_end,
        total_aulas=total_aulas,
        diferenciado=diferenciado,
        user=user,
    )
    return structured_data


def update_lesson_plan(
    db: Session,
    user_id: str,
    plan_id: str,
    title: str = None,
    objective: str = None,
    structured_data: Dict[str, Any] = None,
) -> LessonPlan:
    """Edita título, objetivo e/ou o conteúdo estruturado de um plano (Bloco D11b)."""
    plan = get_lesson_plan(db, user_id, plan_id)
    if not plan:
        return None
    if title is not None:
        plan.title = title
    if objective is not None:
        plan.objective = objective
    if structured_data is not None:
        plan.structured_data = structured_data
    db.commit()
    db.refresh(plan)
    return plan


def duplicate_lesson_plan(
    db: Session,
    user_id: str,
    plan_id: str,
) -> LessonPlan:
    """
    Duplica um plano. Cria uma cópia idêntica com id novo (Bloco D11).
    A cópia NÃO herda o `publico=True` — quem duplica decide depois
    se quer publicar de novo.
    """
    original = get_lesson_plan(db, user_id, plan_id)
    if not original:
        return None

    copia = LessonPlan(
        user_id=user_id,
        plan_type=original.plan_type,
        title=f"{original.title} (cópia)",
        subject=original.subject,
        grade=original.grade,
        content=original.content,
        objective=original.objective,
        structured_data=original.structured_data,
        modo=original.modo,
        periodo_tipo=original.periodo_tipo,
        periodo_inicio=original.periodo_inicio,
        periodo_fim=original.periodo_fim,
        total_aulas=original.total_aulas,
        publico=False,
    )
    db.add(copia)
    db.commit()
    db.refresh(copia)
    return copia


# ============================================================
# COMUNIDADE DE PLANEJAMENTOS SIMIDNAPE — Helpers (Bloco D12b)
# ============================================================

# Mapa nome legível → sigla (para o filtro "Componente" da Comunidade)
_MAPA_COMPONENTE_SIGLA = {
    "Língua Portuguesa": "LP", "Português": "LP",
    "Matemática": "MA",
    "Ciências": "CI", "Ciências da Natureza": "CI",
    "Geografia": "GE",
    "História": "HI",
    "Arte": "AR",
    "Educação Física": "EF",
    "Ensino Religioso": "ER",
    "Língua Inglesa": "LI", "Inglês": "LI",
    "Computação": "CO",
    "Linguagens e suas Tecnologias": "LGG", "Linguagens": "LGG",
    "Matemática e suas Tecnologias": "MAT",
    "Ciências da Natureza e suas Tecnologias": "CNT",
    "Ciências Humanas e Sociais Aplicadas": "CHS", "Ciências Humanas": "CHS",
    "O eu, o outro e o nós": "EI_EO",
    "Corpo, gestos e movimentos": "EI_CG",
    "Traços, sons, cores e formas": "EI_TS",
    "Escuta, fala, pensamento e imaginação": "EI_EF",
    "Espaços, tempos, quantidades, relações e transformações": "EI_ET",
}


def _extrair_componente_sigla(subject: Optional[str]) -> Optional[str]:
    """'Matemática' → 'MA'. Retorna None se não reconhecer."""
    if not subject:
        return None
    s = str(subject).strip()
    if s in _MAPA_COMPONENTE_SIGLA:
        return _MAPA_COMPONENTE_SIGLA[s]
    for k, v in _MAPA_COMPONENTE_SIGLA.items():
        if k.lower() == s.lower():
            return v
    return None


def _extrair_ano_etapa(grade: Optional[str]) -> Optional[str]:
    """Classifica em bucket de etapa:
       'Educação Infantil' → 'EI'
       '1º ano' … '5º ano' → 'EF1'
       '6º ano' … '9º ano' → 'EF2'
       '1ª série' … '3ª série' → 'EM'
    """
    if not grade:
        return None
    g = str(grade).lower().strip()
    if "infantil" in g:
        return "EI"
    m = re.search(r"(\d{1,2})", g)
    if not m:
        return None
    ano = int(m.group(1))
    if "série" in g or "serie" in g:
        return "EM"
    if "ano" in g:
        if 1 <= ano <= 5:
            return "EF1"
        if 6 <= ano <= 9:
            return "EF2"
    return None


def _extrair_tags(plan: LessonPlan) -> Dict[str, Any]:
    """Monta o objeto JSONB de tags estruturadas para o filtro/busca."""
    tags: Dict[str, Any] = {
        "ano": None,
        "componente_nome": plan.subject,
        "periodo_tipo": plan.periodo_tipo,
        "tipo_acao": None,
        "habilidades": [],
        "descritores": [],
        "palavras": [],
    }

    # Ano específico (5º ano → 5)
    if plan.grade:
        m = re.search(r"(\d{1,2})", str(plan.grade))
        if m:
            tags["ano"] = int(m.group(1))

    # Do JSONB do plano: tipo_acao, habilidades, descritores
    sd = plan.structured_data or {}
    if isinstance(sd, dict):
        cab = sd.get("cabecalho") or {}
        if cab.get("tipo_acao"):
            tags["tipo_acao"] = cab["tipo_acao"]
        for h in (sd.get("habilidades") or []):
            if isinstance(h, dict) and h.get("codigo"):
                tags["habilidades"].append(h["codigo"])
        for d in (sd.get("descritores_trabalhados") or []):
            if d:
                tags["descritores"].append(str(d))

    # Palavras-chave do título (para busca textual)
    if plan.title:
        for w in str(plan.title).split():
            w = w.strip(",.!?()[]{};:").lower()
            if len(w) > 4:
                tags["palavras"].append(w)

    # Deduplicar e limitar
    for k in ("habilidades", "descritores", "palavras"):
        tags[k] = list(dict.fromkeys(tags[k]))[:30]

    return tags


def _serializar_plano_publico(plan: LessonPlan) -> Dict[str, Any]:
    """Devolve o plano no formato público (respeitando as escolhas de privacidade)."""
    tags = plan.tags or {}
    mostrar_titulo = tags.get("mostrar_titulo", True)

    if mostrar_titulo:
        titulo_exibido = plan.title
    else:
        partes = []
        if plan.subject:
            partes.append(plan.subject)
        if plan.grade:
            partes.append(plan.grade)
        if plan.periodo_tipo:
            partes.append(plan.periodo_tipo)
        titulo_exibido = ("Plano de " + " · ".join(partes)) if partes else "Plano pedagógico"

    return {
        "id": str(plan.id),
        "titulo": titulo_exibido,
        "mostrar_titulo": bool(mostrar_titulo),
        "modo": plan.modo,
        "componente": plan.subject,
        "componente_sigla": plan.componente_sigla,
        "ano": plan.grade,
        "ano_etapa": plan.ano_etapa,
        "periodo_tipo": plan.periodo_tipo,
        "tipo_acao": plan.tipo_acao,
        "autor": plan.autor_nome,
        "escola": plan.autor_escola,
        "municipio": plan.autor_municipio,
        "views": plan.views or 0,
        "publicado_em": plan.publicado_em.isoformat() if plan.publicado_em else None,
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "tags": (
            (tags.get("habilidades") or [])
            + (tags.get("descritores") or [])
        ),
    }


def save_planejamento_completo(
    db: Session,
    user_id: str,
    title: str,
    subject: str = None,
    grade: str = None,
    content: str = None,
    objective: str = None,
    structured_data: Dict[str, Any] = None,
    extra: Dict[str, Any] = None,
) -> LessonPlan:
    """
    Salva no banco um planejamento COMPLETO já montado pelo frontend
    (após acumular todos os lotes). Não chama a IA.
    """
    extra = extra or {}

    MODO_POR_PLAN_TYPE = {
        "neuroaula": "aula",
        "aula_que_funciona": "aula",
        "planejamento": "planejamento",
        "coordenacao": "coordenacao",
    }
    plan_type = extra.get("plan_type", "planejamento")
    modo = extra.get("modo") or MODO_POR_PLAN_TYPE.get(plan_type, "planejamento")
    periodo_tipo = extra.get("periodo_tipo")
    total_aulas = extra.get("total_aulas")

    def _parse_data(valor):
        if not valor:
            return None
        try:
            return datetime.strptime(str(valor), "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None

    plan = LessonPlan(
        user_id=user_id,
        plan_type=plan_type,
        title=title,
        subject=subject,
        grade=grade,
        content=content,
        objective=objective,
        structured_data=structured_data or {},
        modo=modo,
        periodo_tipo=periodo_tipo,
        periodo_inicio=_parse_data(extra.get("periodo_inicio")),
        periodo_fim=_parse_data(extra.get("periodo_fim")),
        total_aulas=total_aulas,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # ============================================================
    # PUBLICAÇÃO AUTOMÁTICA NA COMUNIDADE (R4b)
    # Todo plano salvo via save-complete vai direto para o banco público.
    # O professor escolheu a privacidade no formulário ANTES de gerar.
    # As rotas /publish e /unpublish continuam existindo para casos manuais.
    # ============================================================
    mostrar_nome = extra.get("mostrar_nome", True)
    mostrar_escola = extra.get("mostrar_escola", True)
    mostrar_municipio = extra.get("mostrar_municipio", True)
    mostrar_titulo = extra.get("mostrar_titulo", True)
    publish_lesson_plan(
        db=db,
        user_id=user_id,
        plan_id=str(plan.id),
        mostrar_nome=mostrar_nome,
        mostrar_escola=mostrar_escola,
        mostrar_municipio=mostrar_municipio,
        mostrar_titulo=mostrar_titulo,
    )
    db.refresh(plan)
    return plan


# ============================================================
# COMUNIDADE DE PLANEJAMENTOS SIMIDNAPE — Publicação (Bloco D12b)
# ============================================================

def publish_lesson_plan(
    db: Session,
    user_id: str,
    plan_id: str,
    mostrar_nome: bool = True,
    mostrar_escola: bool = True,
    mostrar_municipio: bool = True,
    mostrar_titulo: bool = True,
) -> Optional[LessonPlan]:
    """
    Publica um plano no banco público.
    É IDEMPOTENTE — pode ser chamada várias vezes sem duplicar.
    Extrai automaticamente componente_sigla, ano_etapa, tipo_acao e tags.
    """
    plan = get_lesson_plan(db, user_id, plan_id)
    if not plan:
        return None

    # 1. Extração automática de classificação
    plan.componente_sigla = _extrair_componente_sigla(plan.subject)
    plan.ano_etapa = _extrair_ano_etapa(plan.grade)
    plan.tipo_acao = None

    sd = plan.structured_data or {}
    if isinstance(sd, dict):
        cab = sd.get("cabecalho") or {}
        if cab.get("tipo_acao"):
            plan.tipo_acao = cab["tipo_acao"]

    plan.tags = _extrair_tags(plan)
    plan.tags["mostrar_titulo"] = bool(mostrar_titulo)

    # 2. Dados do autor — só salva o que o usuário autorizou
    from ..models.user import User
    user = db.query(User).filter(User.id == user_id).first()

    if user and mostrar_nome and user.full_name:
        plan.autor_nome = user.full_name
    else:
        plan.autor_nome = "Professor(a) SIMIDNAPE"

    if isinstance(sd, dict):
        cab = sd.get("cabecalho") or {}

        if mostrar_escola and cab.get("nome_escola"):
            plan.autor_escola = cab["nome_escola"]
        else:
            plan.autor_escola = "Escola SIMIDNAPE"

        if mostrar_municipio and cab.get("municipio"):
            texto = cab["municipio"]
            if cab.get("estado"):
                texto += f" - {cab['estado']}"
            plan.autor_municipio = texto
        else:
            plan.autor_municipio = None

    # 3. Marca como público
    plan.publico = True
    plan.publicado_em = datetime.utcnow()

    db.commit()
    db.refresh(plan)
    return plan


def list_public_plans(
    db: Session,
    modo: Optional[str] = None,
    etapa: Optional[str] = None,
    ano: Optional[int] = None,
    componente: Optional[str] = None,
    periodo_tipo: Optional[str] = None,
    tipo_acao: Optional[str] = None,
    busca: Optional[str] = None,
    ordem: str = "recentes",
    limit: int = 60,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """Lista planos públicos já SERIALIZADOS (sem dados sensíveis)."""
    query = db.query(LessonPlan).filter(LessonPlan.publico == True)

    if modo and modo != "todos":
        query = query.filter(LessonPlan.modo == modo)
    if etapa:
        query = query.filter(LessonPlan.ano_etapa == etapa)
    if componente:
        query = query.filter(LessonPlan.componente_sigla == componente)
    if periodo_tipo:
        query = query.filter(LessonPlan.periodo_tipo == periodo_tipo)
    if tipo_acao:
        query = query.filter(LessonPlan.tipo_acao == tipo_acao)

    # Ano específico — via tags->>'ano' (Postgres JSONB)
    if ano:
        query = query.filter(LessonPlan.tags["ano"].astext == str(ano))

    # Busca textual no título, componente e ano
    if busca and busca.strip():
        termo = f"%{busca.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(LessonPlan.title).like(termo),
                func.lower(LessonPlan.subject).like(termo),
                func.lower(LessonPlan.grade).like(termo),
            )
        )

    # Ordenação
    if ordem == "recentes":
        query = query.order_by(LessonPlan.publicado_em.desc().nullslast())
    elif ordem == "antigos":
        query = query.order_by(LessonPlan.publicado_em.asc().nullslast())
    elif ordem == "mais_vistos":
        query = query.order_by(LessonPlan.views.desc())
    elif ordem == "titulo":
        query = query.order_by(LessonPlan.title.asc())
    else:
        query = query.order_by(LessonPlan.publicado_em.desc().nullslast())

    planos = query.offset(offset).limit(limit).all()
    return [_serializar_plano_publico(p) for p in planos]


def count_facetas_publicas(db: Session) -> Dict[str, Any]:
    """Contadores por faceta para a UI (mostra quantos planos existem em cada filtro)."""
    base = db.query(LessonPlan).filter(LessonPlan.publico == True)

    por_modo = {}
    for m in ("aula", "planejamento", "coordenacao"):
        por_modo[m] = base.filter(LessonPlan.modo == m).count()

    por_etapa = {}
    for e in ("EI", "EF1", "EF2", "EM"):
        por_etapa[e] = base.filter(LessonPlan.ano_etapa == e).count()

    por_componente: Dict[str, int] = {}
    rows = (
        db.query(LessonPlan.componente_sigla, func.count(LessonPlan.id))
        .filter(LessonPlan.publico == True, LessonPlan.componente_sigla.isnot(None))
        .group_by(LessonPlan.componente_sigla)
        .all()
    )
    for comp, cnt in rows:
        if comp:
            por_componente[comp] = cnt

    por_tipo_acao: Dict[str, int] = {}
    rows = (
        db.query(LessonPlan.tipo_acao, func.count(LessonPlan.id))
        .filter(LessonPlan.publico == True, LessonPlan.tipo_acao.isnot(None))
        .group_by(LessonPlan.tipo_acao)
        .all()
    )
    for tipo, cnt in rows:
        if tipo:
            por_tipo_acao[tipo] = cnt

    return {
        "total": base.count(),
        "por_modo": por_modo,
        "por_etapa": por_etapa,
        "por_componente": por_componente,
        "por_tipo_acao": por_tipo_acao,
    }


def get_public_plan(db: Session, plan_id: str) -> Optional[LessonPlan]:
    """Busca um plano público específico (para incrementar views e baixar PDF)."""
    return db.query(LessonPlan).filter(
        LessonPlan.id == plan_id,
        LessonPlan.publico == True,
    ).first()


def increment_views(db: Session, plan_id: str) -> bool:
    """Incrementa o contador de visualizações de um plano público."""
    plan = get_public_plan(db, plan_id)
    if not plan:
        return False
    plan.views = (plan.views or 0) + 1
    db.commit()
    return True


# ============================================================
# PLANO COM ROTEIRO — geração a partir de esboço (texto + arquivos)
# ============================================================
def generate_plano_from_sketch(
    db: Session,
    user_id: str,
    texto: Optional[str] = None,
    etapa: str = "EF",
    ano: Optional[str] = None,
    serie: Optional[str] = None,
    referenciais: Optional[List[str]] = None,
    arquivos: Optional[List[Dict[str, Any]]] = None,
    user=None,
) -> LessonPlan:
    """
    Gera um plano pedagógico completo a partir de um esboço.

    Args:
        texto: texto colado (opcional)
        etapa: "EI" | "EF" | "EM"
        ano: ano (opcional, ex: "5" ou "5º")
        serie: série/turma (opcional, ex: "Pré II")
        referenciais: lista (ex: ["BNCC", "Currículo do Piauí"])
        arquivos: lista de dicts {filename, mime_type, data (bytes)}
        user: instância do usuário (para multi-API key)

    Returns:
        LessonPlan salvo no banco
    """
    from google.genai import types as genai_types

    ai = get_ai_service()

    # ------------------------------------------------------------
    # 1. Converte arquivos em Parts (imagens/PDF) ou texto (DOCX)
    # ------------------------------------------------------------
    parts_anexos: List[Any] = []

    for arq in (arquivos or []):
        try:
            fname = str(arq.get("filename") or "arquivo")
            mime = str(arq.get("mime_type") or "").lower().strip()
            data = arq.get("data") or b""

            if not data:
                continue

            fname_lower = fname.lower()

            # DOCX: extrai texto e adiciona como Part de texto
            if (
                mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                or fname_lower.endswith(".docx")
            ):
                try:
                    from docx import Document as _DocxDoc
                    from io import BytesIO as _BytesIO
                    doc = _DocxDoc(_BytesIO(data))
                    texto_docx = "\n".join(
                        p.text for p in doc.paragraphs if p.text.strip()
                    )
                    if texto_docx:
                        parts_anexos.append(
                            genai_types.Part.from_text(
                                text=f"=== CONTEÚDO DO ARQUIVO '{fname}' ===\n{texto_docx}"
                            )
                        )
                except Exception as e:
                    print(f"[plano_completo] Erro ao extrair DOCX '{fname}': {e}")
                continue

            # Imagens e PDF: aceitos direto pelo Gemini
            if mime.startswith("image/") or mime == "application/pdf":
                parts_anexos.append(
                    genai_types.Part.from_bytes(data=data, mime_type=mime)
                )
                continue

            # Fallback por extensão para mime genérico (application/octet-stream)
            if fname_lower.endswith((".jpg", ".jpeg")):
                parts_anexos.append(genai_types.Part.from_bytes(data=data, mime_type="image/jpeg"))
            elif fname_lower.endswith(".png"):
                parts_anexos.append(genai_types.Part.from_bytes(data=data, mime_type="image/png"))
            elif fname_lower.endswith(".webp"):
                parts_anexos.append(genai_types.Part.from_bytes(data=data, mime_type="image/webp"))
            elif fname_lower.endswith(".pdf"):
                parts_anexos.append(genai_types.Part.from_bytes(data=data, mime_type="application/pdf"))
        except Exception as e:
            print(f"[plano_completo] Erro ao processar arquivo: {e}")
            continue

    # ------------------------------------------------------------
    # 2. Monta payload para a IA
    # ------------------------------------------------------------
    payload: Dict[str, Any] = {
        "texto": (texto or "").strip(),
        "etapa": etapa,
        "ano": ano or None,
        "serie": serie or None,
        "referenciais": referenciais or ["BNCC"],
        "total_paginas": len(parts_anexos),
    }

    # ------------------------------------------------------------
    # 3. Chama a IA (multimodal)
    # ------------------------------------------------------------
    structured_data = ai.generate_structured_multimodal(
        task_type="plano_completo",
        payload=payload,
        parts_anexos=parts_anexos if parts_anexos else None,
        user=user,
    )

    if isinstance(structured_data, dict) and structured_data.get("erro"):
        raise Exception(structured_data["erro"])

    # ------------------------------------------------------------
    # 4. Salva em lesson_plans
    # ------------------------------------------------------------
    cab = (structured_data or {}).get("cabecalho", {}) or {}
    titulo_final = cab.get("titulo") or (texto[:80] if texto else "Plano com Roteiro")

    plan = LessonPlan(
        user_id=user_id,
        plan_type="plano_completo",
        title=titulo_final,
        subject=None,
        grade=cab.get("turma") or serie,
        content=(texto[:500] if texto else None),
        objective=structured_data.get("objetivo_geral"),
        structured_data=structured_data,
        modo="plano_completo",
        periodo_tipo=None,
        periodo_inicio=None,
        periodo_fim=None,
        total_aulas=len((structured_data or {}).get("dias", [])),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan