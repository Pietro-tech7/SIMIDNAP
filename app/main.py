from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading

from .api.v1 import (
    auth, users, lesson_plans, bncc, reflections, materials,
    subscriptions, pedagogical_cases, admin, announcements,
    banners, images, successful_practices, feedback, questions, landing,
    exam_papers, question_ia, curriculo_estrutura, figure_bank as figure_bank_api,
    system_settings as system_settings_api,
    theme as theme_api,
)

from .core.database import engine, Base
from .models import (  # noqa: F401
    user,
    lesson_plan,
    reflection,
    material,
    subscription,
    pedagogical_case,
    announcement,
    banner,
    successful_practice,
    question_bank,
    landing_config,
    landing_asset,
    curriculo_piaui_skill,
    exam_paper,
    question_bank_fundamental,
    bncc_estrutura,
    descritor,
    habilidade_descritor,
    figure_bank,
    system_setting,
    theme_config,
)


print("[Startup] Inicializando SIMIDNAPE...")

Base.metadata.create_all(bind=engine)
print("[Startup] Tabelas verificadas/criadas.")


def _construir_rag_background():
    try:
        from .services.gemini_service import get_gemini_service
        service = get_gemini_service()
        service.construir_indice_agora()
    except Exception as e:
        print(f"[RAG] Erro ao construir índice: {e}")


threading.Thread(target=_construir_rag_background, daemon=True).start()


app = FastAPI(
    title="SIMIDNAPE API",
    description="Backend do SIMIDNAPE - Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem e Performance Educacional",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://simidnape.vercel.app",
        "https://simidnape.com.br",
        "https://www.simidnape.com.br",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(lesson_plans.router, prefix="/api/v1")
app.include_router(bncc.router, prefix="/api/v1")
app.include_router(reflections.router, prefix="/api/v1")
app.include_router(materials.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")
app.include_router(pedagogical_cases.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(announcements.router, prefix="/api/v1")
app.include_router(banners.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(successful_practices.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(questions.router, prefix="/api/v1")
app.include_router(landing.router, prefix="/api/v1")
app.include_router(exam_papers.router, prefix="/api/v1")
app.include_router(question_ia.router, prefix="/api/v1")
app.include_router(curriculo_estrutura.router, prefix="/api/v1")
app.include_router(figure_bank_api.router, prefix="/api/v1")
app.include_router(system_settings_api.router, prefix="/api/v1")
app.include_router(theme_api.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "message": "SIMIDNAPE API está funcionando!"}