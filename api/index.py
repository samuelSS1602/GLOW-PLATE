"""
Vercel serverless entry point: serves the FastAPI app in backend/main.py at /api/*.
vercel.json sends every /api/... request here, and FastAPI routes it by its full path.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: E402,F401
