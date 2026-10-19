from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# SQLite 사용 시 멀티스레드 충돌 방지 옵션 추가
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모든 DB 테이블 모델이 상속받을 기본 클래스
Base = declarative_base()

# API 요청이 들어올 때마다 DB 세션을 열고, 응답이 끝나면 안전하게 닫아주는 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()