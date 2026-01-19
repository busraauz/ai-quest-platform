from fastapi import APIRouter, FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.document import router as documents_router
from app.api.routes.auth import router as auth_router
from app.api.routes.question import router as question_router
from app.api.routes.refinement import router as refinement_router
from app.api.routes.similar import router as similar_router

app = FastAPI(
    title="QuestAI Platform API",
    description="Backend API for QuestAI Platform",
    version="1.0.0",
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    openapi_schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Configure CORS for frontend communication
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Set-Cookie"],
)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(documents_router)
api_router.include_router(question_router)
api_router.include_router(refinement_router)
api_router.include_router(similar_router)

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "Welcome to QuestAI Platform API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
