import sys
import os

# Add the backend directory to sys.path so app modules can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app

# Export app for Vercel Serverless Functions
__all__ = ["app"]
