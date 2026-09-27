"""
Serviço de geração de arquivos Word (.docx) para o Motor 9.
Usa python-docx (https://python-docx.readthedocs.io/).

Suporta imagens em PNG, JPG, WEBP, GIF, BMP, TIFF.
SVGs são ignorados silenciosamente (limitação do python-docx).
"""
from io import BytesIO
import base64
import re

from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


# ============================================================
# HELPERS
# ============================================================
def _decodificar_data_url(data_url):
    """Extrai (bytes, mime_type) de uma data URL base64."""
    if not data_url or not isinstance(data_url, str):
        return None, None
    match = re.match(r'^data:([^;]+);base64,(.+)$', data_url)
    if not match:
        return None, None
    mime = match.group(1)
    try:
        dados = base64.b64decode(match.group(2))
        return dados, mime
    except Exception:
        return None, None


def _suporta_no_word(mime):
    """Retorna True se o formato pode ser inserido via python-docx."""
    return mime in (
        'image/png', 'image/jpeg', 'image/jpg',
        'image/gif', 'image/bmp', 'image/tiff',
    )


def _adicionar_imagem_se_possivel(doc, data_url, largura_cm=11):
    """Adiciona uma imagem ao documento se o formato for suportado."""
    dados, mime = _decodificar_data_url(data_url)
    if not dados or not mime:
        return False
    if not _suporta_no_word(mime):
        # Formato não suportado (ex: SVG) — pula silenciosamente
        return False
    try:
        stream = BytesIO(dados)
        doc.add_picture(stream, width=Cm(largura_cm))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
        return True
    except Exception as e:
        print(f"[Word] Erro ao inserir imagem: {e}")
        return False


def _adicionar_linha_separadora(doc):
    """Adiciona uma linha horizontal."""
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '000000')
    pBdr.append(bottom)
    pPr.append(pBdr)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)


def _adicionar_cabecalho(doc, cabecalho):
    """Adiciona o cabeçalho da prova (mesmo padrão do PDF)."""
    if not cabecalho:
        return

    tipo_escola = cabecalho.get('tipo_escola') or 'ESCOLA MUNICIPAL'
    nome_escola = cabecalho.get('nome_escola') or ''
    label_escola = nome_escola if tipo_escola == 'OUTRO' else f"{tipo_escola}: {nome_escola}"

    # Secretaria
    if cabecalho.get('secretaria'):
        p = doc.add_paragraph()
        run = p.add_run(cabecalho['secretaria'])
        run.bold = True
        run.font.size = Pt(10)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Endereço / CEP / Cidade
    linhas_centrais = []
    if cabecalho.get('endereco'):
        linhas_centrais.append(cabecalho['endereco'])
    cep_cidade = []
    if cabecalho.get('cep'):
        cep_cidade.append(f"CEP: {cabecalho['cep']}")
    if cabecalho.get('cidade_estado'):
        cep_cidade.append(cabecalho['cidade_estado'])
    if cep_cidade:
        linhas_centrais.append(' - '.join(cep_cidade))
    fone_email = []
    if cabecalho.get('telefone'):
        fone_email.append(f"FONE: {cabecalho['telefone']}")
    if cabecalho.get('email'):
        fone_email.append(cabecalho['email'])
    if fone_email:
        linhas_centrais.append(' • '.join(fone_email))

    for linha in linhas_centrais:
        p = doc.add_paragraph()
        run = p.add_run(linha)
        run.font.size = Pt(9)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Escola
    if nome_escola:
        p = doc.add_paragraph()
        run = p.add_run(label_escola)
        run.bold = True
        run.font.size = Pt(10)

    # Diretor / Coordenador
    p = doc.add_paragraph()
    p.add_run('DIRETOR(A): ').bold = True
    p.add_run(cabecalho.get('diretor') or '___________________________')
    p.add_run('     ')
    p.add_run('COORDENADOR(A): ').bold = True
    p.add_run(cabecalho.get('coordenador') or '___________________________')

    # Professor / Turma
    p = doc.add_paragraph()
    p.add_run('PROFESSOR(A): ').bold = True
    p.add_run(cabecalho.get('professor') or '___________________________')
    p.add_run('     ')
    p.add_run('TURMA: ').bold = True
    p.add_run(cabecalho.get('turma') or '__________')

    # Turno
    p = doc.add_paragraph()
    p.add_run('TURNO: ( ) MANHÃ   ( ) TARDE')

    # Nome do aluno
    p = doc.add_paragraph()
    p.add_run('NOME DO ALUNO: ').bold = True
    p.add_run('_____________________________________________________________')

    # Data
    p = doc.add_paragraph()
    p.add_run('DATA: ').bold = True
    p.add_run('____/_____/__________')

    # Separador
    _adicionar_linha_separadora(doc)


# ============================================================
# GERAÇÃO — PROVA
# ============================================================
def gerar_word_prova(titulo, cabecalho, questoes, opcoes):
    """Gera o .docx da PROVA. Retorna BytesIO."""
    mostrar_tema = (opcoes or {}).get('mostrarTemaCondutor', True)
    mostrar_descritor = (opcoes or {}).get('mostrarDescritor', False)

    doc = Document()

    # Margens
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2)
        section.right_margin = Cm(2)

    _adicionar_cabecalho(doc, cabecalho)

    # Título
    p = doc.add_paragraph()
    run = p.add_run((titulo or '').upper())
    run.bold = True
    run.font.size = Pt(13)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(12)

    # Questões
    for idx, q in enumerate(questoes, start=1):
        # Tema condutor (opcional)
        if mostrar_tema and q.get('tema_condutor'):
            p = doc.add_paragraph()
            run = p.add_run(q['tema_condutor'].upper())
            run.bold = True
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)

        # Enunciado
        p = doc.add_paragraph()
        run = p.add_run(f"{idx}) {q.get('enunciado', '')}")
        run.bold = True
        run.font.size = Pt(11)
        p.paragraph_format.space_after = Pt(6)

        # Imagem principal do enunciado (se houver)
        if q.get('imagem_url'):
            _adicionar_imagem_se_possivel(doc, q['imagem_url'])

        # Imagem da ilustração (se escolhida)
        ilust = q.get('ilustracao') or {}
        if ilust.get('imagem'):
            _adicionar_imagem_se_possivel(doc, ilust['imagem'])

        # Alternativas
        for alt in (q.get('alternativas') or []):
            p = doc.add_paragraph()
            p.add_run(f"({alt.get('letra', '')}) ").bold = True
            p.add_run(alt.get('texto', ''))
            p.paragraph_format.space_after = Pt(2)

        # Descritor (opcional)
        if mostrar_descritor and q.get('descritor'):
            texto = f"Descritor: {q['descritor']}"
            if q.get('descritor_texto'):
                texto += f" — {q['descritor_texto']}"
            p = doc.add_paragraph()
            run = p.add_run(texto)
            run.italic = True
            run.font.size = Pt(8)
            run.font.color.rgb = RGBColor(0x6B, 0x72, 0x80)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(0)

        # Espaço entre questões
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)

    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer


# ============================================================
# GERAÇÃO — GABARITO
# ============================================================
def gerar_word_gabarito(titulo, cabecalho, questoes):
    """Gera o .docx do GABARITO. Retorna BytesIO."""
    doc = Document()

    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2)
        section.right_margin = Cm(2)

    # Título
    p = doc.add_paragraph()
    run = p.add_run(f"GABARITO — {titulo}")
    run.bold = True
    run.font.size = Pt(14)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(6)

    # Dados do professor / turma
    if cabecalho:
        if cabecalho.get('professor'):
            p = doc.add_paragraph()
            run = p.add_run(f"Professor(a): {cabecalho['professor']}")
            run.font.size = Pt(10)
        if cabecalho.get('turma'):
            p = doc.add_paragraph()
            run = p.add_run(f"Turma: {cabecalho['turma']}")
            run.font.size = Pt(10)

    _adicionar_linha_separadora(doc)

    # Questões
    for idx, q in enumerate(questoes, start=1):
        # Questão + Gabarito
        p = doc.add_paragraph()
        run = p.add_run(f"Questão {idx} — Gabarito: ")
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)
        run2 = p.add_run(q.get('gabarito', ''))
        run2.bold = True
        run2.font.size = Pt(12)
        run2.font.color.rgb = RGBColor(0x05, 0x96, 0x69)
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)

        # Habilidade
        if q.get('habilidade_codigo'):
            p = doc.add_paragraph()
            run = p.add_run('Habilidade: ')
            run.bold = True
            run.font.size = Pt(9)
            r2 = p.add_run(q['habilidade_codigo'])
            r2.font.size = Pt(9)
            if q.get('habilidade_texto'):
                r3 = p.add_run(f" — {q['habilidade_texto']}")
                r3.font.size = Pt(9)
            p.paragraph_format.space_after = Pt(1)

        # Descritor
        if q.get('descritor'):
            p = doc.add_paragraph()
            run = p.add_run('Descritor: ')
            run.bold = True
            run.font.size = Pt(9)
            r2 = p.add_run(q['descritor'])
            r2.font.size = Pt(9)
            if q.get('descritor_texto'):
                r3 = p.add_run(f" — {q['descritor_texto']}")
                r3.font.size = Pt(9)
            p.paragraph_format.space_after = Pt(1)

        # Explicação
        if q.get('explicacao_gabarito'):
            p = doc.add_paragraph()
            run = p.add_run('Explicação: ')
            run.bold = True
            run.font.size = Pt(10)
            r2 = p.add_run(q['explicacao_gabarito'])
            r2.font.size = Pt(10)
            p.paragraph_format.space_before = Pt(4)

    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer