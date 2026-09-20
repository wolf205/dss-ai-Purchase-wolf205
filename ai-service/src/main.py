import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

# Load environment variables
class Settings(BaseSettings):
    PORT: int = 8000
    NODE_ENV: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()

app = FastAPI(
    title="DSS AI Purchase - Forecasting Service",
    description="Python FastAPI service for demand forecasting and inventory optimization",
    version="1.0.0"
)

# Server-to-server or local dev CORS (explicit origins for security and compliance)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://backend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint to ensure service is running."""
    return {
        "status": "ok", 
        "service": "dss-ai-service",
        "environment": settings.NODE_ENV
    }

if __name__ == "__main__":
    import uvicorn
    # Use PORT from settings
    uvicorn.run("src.main:app", host="0.0.0.0", port=settings.PORT, reload=(settings.NODE_ENV == "development"))
