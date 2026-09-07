FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

RUN addgroup --system app \
    && adduser --system --ingroup app app \
    && chown app:app /app

COPY --chown=app:app app ./app
COPY --chown=app:app extensions ./extensions
COPY --chown=app:app helpers ./helpers
COPY --chown=app:app static ./static
COPY --chown=app:app templates ./templates
COPY --chown=app:app config.py main.py wsgi.py ./

USER app

RUN python -m compileall -q app extensions helpers main.py config.py wsgi.py

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8081/', timeout=2)"]

# CMD ["python", "main.py"]
CMD ["gunicorn", "--bind=0.0.0.0:8081", "--workers=2", "--threads=4", "--timeout=120", "--access-logfile=-", "--error-logfile=-", "wsgi:app"]