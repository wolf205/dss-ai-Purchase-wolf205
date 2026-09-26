FROM python:3.12-slim

# Ngăn Python tạo bytecode .pyc và bật log unbuffered
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Cài đặt dependencies trước để tận dụng Docker layer cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn ứng dụng
COPY . .

# Cổng lắng nghe mặc định
EXPOSE 8000

# Health check định kỳ kiểm tra trạng thái sống của dịch vụ
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

# Khởi chạy dịch vụ FastAPI
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
