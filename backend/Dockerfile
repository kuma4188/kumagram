FROM python:3.11-slim

WORKDIR /app

# 필수 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 소스코드 복사
COPY ./app ./app

# 이미지 업로드 폴더 및 DB 저장 폴더 생성
RUN mkdir -p /app/uploads /app/data

EXPOSE 8000

# FastAPI 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]