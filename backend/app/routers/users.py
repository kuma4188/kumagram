from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid
import shutil

from app.database import get_db
from app.models import User, Post
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/{username}")
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 유저(Lucas 또는 Cherish)의 프로필 정보와 그리드용 게시물 목록을 조회합니다."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 본인 프로필이면 비공개(is_public=False) 게시물도 모두 가져오고, 상대방 프로필이면 공개 게시물만 가져옴
    query = db.query(Post).filter(Post.author_id == user.id)
    if current_user.id != user.id:
        query = query.filter(Post.is_public == True)

    posts = query.order_by(Post.created_at.desc()).all()

    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "bio": user.bio,
        "profile_image": user.profile_image,
        "posts_count": len(posts),
        "followers_count": 1, # 2인 전용 커플 앱이므로 서로만 팔로우 (고정값 1)
        "following_count": 1,
        "is_me": current_user.id == user.id,
        "posts": [
            {
                "id": p.id,
                "post_type": p.post_type,
                "is_public": p.is_public,
                "content": p.content,
                "extra_data": p.extra_data,
                "created_at": p.created_at
            }
            for p in posts
        ]
    }

@router.put("/me/profile")
def update_my_profile(
    name: str = Form(...),
    username: str = Form(...),
    bio: str = Form(""),
    profile_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 프로필 정보(이름, 계정명, 소개글, 프로필 사진)를 수정합니다."""
    # 계정명(username)을 바꿨을 때 상대방 계정명과 겹치는지 확인
    if username != current_user.username:
        exists = db.query(User).filter(User.username == username).first()
        if exists:
            raise HTTPException(status_code=400, detail="This username is already taken")
        current_user.username = username

    current_user.name = name
    current_user.bio = bio

    # 새 프로필 사진을 업로드한 경우 파일 저장
    if profile_image:
        ext = os.path.splitext(profile_image.filename)[1]
        filename = f"profile_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join("uploads", filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        current_user.profile_image = f"/uploads/{filename}"

    db.commit()
    db.refresh(current_user)

    return {
        "username": current_user.username,
        "name": current_user.name,
        "bio": current_user.bio,
        "profile_image": current_user.profile_image
    }