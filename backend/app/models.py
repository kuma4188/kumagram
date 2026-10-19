from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False) # 로그인 ID 겸 계정명 (soopin, elle)
    password_hash = Column(String(255), nullable=False)                    # 암호화된 비밀번호
    name = Column(String(50), nullable=False)                              # 표시 이름 (Lucas, Cherish)
    bio = Column(String(500), default="")                                  # 소개글 (Introduction)
    profile_image = Column(String(500), nullable=True)                     # 프로필 사진 경로

    posts = relationship("Post", back_populates="author")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 게시물 유형: "text" | "photo" | "music" | "dictionary" | "balance"
    post_type = Column(String(20), nullable=False, index=True)
    
    # 공개 여부 (True: 전체 공개 / False: 내 프로필에서만 나에게 보임)
    is_public = Column(Boolean, default=True, nullable=False)
    
    # 공통 본문 설명 (Text 본문, Photo 설명, Music 설명 등最大 2,000자)
    content = Column(Text, nullable=True)
    
    # ★ 핵심 설계: 유형별로 달라지는 데이터(키워드, 사진 배열, 음악 정보, 단어장, 밸런스게임 선택지)를 JSON으로 유연하게 저장
    extra_data = Column(JSON, nullable=False, default=dict)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("BalanceVote", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    post = relationship("Post", back_populates="comments")
    author = relationship("User")


class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    post = relationship("Post", back_populates="likes")


class BalanceVote(Base):
    __tablename__ = "balance_votes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    selected_option = Column(Integer, nullable=False) # 1 (Opinion 1) 또는 2 (Opinion 2)

    post = relationship("Post", back_populates="votes")