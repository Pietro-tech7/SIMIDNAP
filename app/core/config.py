import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Banco de dados — força o driver psycopg v3
    _raw_url: str = os.getenv("DATABASE_URL", "")
    DATABASE_URL: str = (
        _raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
        if _raw_url.startswith("postgresql://")
        else _raw_url
    )

    # Autenticação
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

    # URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://simidnape.com.br")
    BACKEND_URL: str = os.getenv(
        "BACKEND_URL",
        f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN', 'web-production-419ca.up.railway.app')}"
    )

    # Brevo (e-mail transacional)
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_SENDER_EMAIL: str = os.getenv("BREVO_SENDER_EMAIL", "nao-responda@simidnape.com.br")
    BREVO_SENDER_NAME: str = os.getenv("BREVO_SENDER_NAME", "SIMIDNAPE PRO")
    BREVO_REPLY_TO: str = os.getenv("BREVO_REPLY_TO", "contato@simidnape.com.br")


settings = Settings()