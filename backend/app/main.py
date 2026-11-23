"""
FastAPI application entrypoint.

Wires together configuration, database initialization, CORS, and all
API routers. Run with:

    uvicorn app.main:app --reload --port 8000

or simply:

    python run.py
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routers import auth_routes, report_routes, speech_routes

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered communication coaching: speech-to-text, "
    "grammar/vocabulary/filler analysis, and progress tracking.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS - allow the React frontend (Vite dev server / production build) to
# call this API from a different origin.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup: ensure database tables exist.
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()


# ---------------------------------------------------------------------------
# Global error handling: turn unexpected exceptions into clean JSON
# responses instead of leaking stack traces to the client.
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_routes.router)
app.include_router(speech_routes.router)
app.include_router(report_routes.router)


@app.get("/", tags=["Health"])
def root():
    """Simple health check / welcome route."""
    return {
        "app": settings.APP_NAME,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """Used by the frontend (or monitoring tools) to verify the API is up."""
    return {"status": "ok"}
