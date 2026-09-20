"""
Entrypoint shim for backward compatibility.
The actual service application is defined in src/main.py according to the architectural standards.
"""
from src.main import app, settings

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=settings.PORT, reload=(settings.NODE_ENV == "development"))
