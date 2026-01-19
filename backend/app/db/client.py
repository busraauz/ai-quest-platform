import base64
import json
from supabase import Client, create_client

from app.core.config import settings


def get_supabase_client() -> Client:
    URL = settings.SUPABASE_URL
    KEY = settings.SUPABASE_KEY

    if not URL or not KEY:
        raise RuntimeError("Supabase URL and Key must be set in the configuration.")
    supabase = create_client(URL, KEY)

    return supabase


def get_supabase_storage_client() -> Client:

    URL = settings.SUPABASE_URL
    KEY = settings.SUPABASE_STORAGE_KEY

    if not URL or not KEY:
        raise RuntimeError(
            "Supabase Storage URL and Key must be set in the configuration."
        )
    supabase = create_client(URL, KEY)
    return supabase
