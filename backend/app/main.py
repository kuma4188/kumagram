from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
from contextlib import asynccontextmanager
import os

from app.database import engine, SessionLocal, Base
from app.models import User
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_initial_users():
    """서버 시작 시 .env에 정의된 2명의 유저가 DB에 없으면 자동으로 생성합니다."""
    db = SessionLocal()
    try:
        users_to_seed = [
            {
                "username": settings.USER1_USERNAME,
                "password": settings.USER1_PASSWORD,
                "name": settings.USER1_NAME,
                "bio": settings.USER1_BIO,
            },
            {
                "username": settings.USER2_USERNAME,
                "password": settings.USER2_PASSWORD,
                "name": settings.USER2_NAME,
                "bio": settings.USER2_BIO,
            },
        ]
        for u in users_to_seed:
            exists = db.query(User).filter(User.username == u["username"]).first()
            if not exists:
                new_user = User(
                    username=u["username"],
                    password_hash=pwd_context.hash(u["password"]),
                    name=u["name"],
                    bio=u["bio"],
                )
                db.add(new_user)
                print(f"✅ 초기 유저 생성 완료: {u['name']} ({u['username']})")
        db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. DB 테이블 자동 생성
    Base.metadata.create_all(bind=engine)
    # 2. 2인 유저 자동 시딩
    seed_initial_users()
    yield

app = FastAPI(title="Kumastagram API", lifespan=lifespan)

# 프론트엔드(React)에서 백엔드로 요청을 보낼 수 있도록 CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드된 이미지를 URL(/uploads/파일명)로 바로 볼 수 있도록 정적 폴더 연결
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Kumastagram 백엔드 정상 작동 중!"}

# (기존 main.py 코드 아래에 추가)
from app.routers import auth, users, posts
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)