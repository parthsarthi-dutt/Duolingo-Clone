"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import course, dev, gamification, sessions, users
from .auth.router import router as auth_router
from .seed.run import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    seed_if_empty()  # first boot creates the schema and the sample course / learner
    yield


app = FastAPI(
    title="Duolingo Clone API",
    description="Learning path, lesson sessions and gamification for the Duolingo clone.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (users, course, sessions, gamification, dev):
    app.include_router(module.router)

app.include_router(auth_router)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
