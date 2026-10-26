FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# ارتقای ابزارهای نصب پایتون
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# نصب پیش‌نیازهای پایتون بدون نیاز به build-essential
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# کپی سورس کد
COPY . /app/

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]