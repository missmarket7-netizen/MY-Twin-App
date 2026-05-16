# ─── MyTwin Backend Dockerfile ─────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# تثبيت المكتبات أولاً (للاستفادة من طبقات Docker cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ باقي الكود
COPY . .

# المنفذ الافتراضي
EXPOSE 8000

# تشغيل الخادم مع احتمالية تغيير المنفذ عبر متغير البيئة
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
