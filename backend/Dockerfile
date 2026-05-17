FROM python:3.11-slim

WORKDIR /app

# تثبيت المتطلبات
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ جميع ملفات backend
COPY . .

# التحقق من وجود الملفات الأساسية وتجميعها
RUN python -m py_compile main.py && echo "✅ main.py OK"

# تشغيل الخادم على المنفذ 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
