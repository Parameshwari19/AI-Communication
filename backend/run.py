"""
Convenience launcher so the backend can be started with:

    python run.py

instead of remembering the full uvicorn invocation.
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
