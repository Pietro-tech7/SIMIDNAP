"""
Criptografia simétrica para a chave do Gemini dos usuários.

Usa Fernet (padrão da biblioteca `cryptography`) com uma chave derivada
da SECRET_KEY do projeto.

- criptografar(texto)   → string criptografada (base64, segura para DB)
- descriptografar(token) → texto original, ou None se falhar
"""
import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from .config import settings


def _obter_chave_fernet() -> bytes:
    """
    Deriva uma chave Fernet (32 bytes, base64 url-safe) a partir da SECRET_KEY.

    Se a SECRET_KEY for alterada no futuro, os tokens antigos deixam de ser
    descriptografáveis. Nesse caso, o sistema faz fallback para a chave global.
    """
    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY não configurada em config.py.")
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def criptografar(texto: str) -> str:
    """
    Criptografa uma string. Retorna string vazia se texto for vazio.
    """
    if not texto:
        return ""
    fernet = Fernet(_obter_chave_fernet())
    return fernet.encrypt(texto.encode("utf-8")).decode("utf-8")


def descriptografar(token: str) -> Optional[str]:
    """
    Descriptografa um token Fernet. Retorna None se o token for inválido,
    expirado ou de uma chave diferente.
    """
    if not token:
        return None
    try:
        fernet = Fernet(_obter_chave_fernet())
        return fernet.decrypt(token.encode("utf-8")).decode("utf-8")
    except (InvalidToken, Exception) as e:
        print(f"[Crypto] Falha ao descriptografar: {e}")
        return None