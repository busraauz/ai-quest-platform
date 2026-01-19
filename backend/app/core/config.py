from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_STORAGE_DOC_BUCKET: str = ""
    SUPABASE_STORAGE_SIMILAR_BUCKET: str = ""
    SUPABASE_STORAGE_KEY: str = ""

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = ""

    QUEST_MODEL: str = ""
    EMBEDDING_MODEL: str = ""

    FRONTEND_URL: str = ""
    PDF_CHUNK_SIZE: int = 3500
    PDF_CHUNK_OVERLAP: int = 400

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
