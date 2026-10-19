from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
import json

from app.database import get_db
from app.models import User, Post, Comment, PostLike, BalanceVote
from app.utils.security import get_current_user
from app.utils.music_parser import parse_music_url

router = APIRouter(prefix="/api/posts", tags=["Posts"])

# --- Pydantic 요청 스키마 ---
class MusicParseRequest(BaseModel):
    url: str

class PostUpdateRequest(BaseModel):
    content: str
    is_public: bool
    extra_data: dict

class VoteRequest(BaseModel):
    selected_option: int  # 1 또는 2

class CommentRequest(BaseModel):
    content: str

# --- 공통 직렬화(Serializer) 헬퍼 함수 ---
def serialize_post(post: Post, current_user: User) -> dict:
    """
    DB에서 꺼낸 Post 객체를 프론트엔드가 쓰기 편한 JSON 형태로 변환합니다.
    좋아요 개수, 내가 좋아요를 눌렀는지 여부, 밸런스게임 투표자 명단까지 한 번에 계산합니다.
    """
    likes_count = len(post.likes)
    is_liked = any(like.user_id == current_user.id for like in post.likes)
    comments_count = len(post.comments)

    # 밸런스 게임일 경우: 1번 선택지 투표자 이름 목록, 2번 선택지 투표자 이름 목록, 내 투표 번호 계산
    option1_voters = []
    option2_voters = []
    my_vote = None

    if post.post_type == "balance":
        for v in post.votes:
            # 투표한 유저의 username (Lucas 또는 Cherish) 찾기
            voter_name = "Lucas" if v.user_id == 1 else "Cherish"
            if v.user_id == current_user.id:
                voter_name = current_user.username
                my_vote = v.selected_option
            if v.selected_option == 1:
                option1_voters.append(voter_name)
            elif v.selected_option == 2:
                option2_voters.append(voter_name)

    return {
        "id": post.id,
        "post_type": post.post_type,
        "is_public": post.is_public,
        "content": post.content,
        "extra_data": post.extra_data,
        "created_at": post.created_at,
        "author": {
            "id": post.author.id,
            "username": post.author.username,
            "name": post.author.name,
            "profile_image": post.author.profile_image,
        },
        "is_mine": post.author_id == current_user.id,
        "likes_count": likes_count,
        "is_liked": is_liked,
        "comments_count": comments_count,
        "balance_result": {
            "option1_voters": option1_voters,
            "option2_voters": option2_voters,
            "my_vote": my_vote,
        } if post.post_type == "balance" else None
    }

# 1. 유튜브 뮤직 메타데이터 파싱 API
@router.post("/parse-music")
async def preview_music_metadata(
    req: MusicParseRequest,
    current_user: User = Depends(get_current_user)
):
    if not req.url.strip():
        raise HTTPException(status_code=400, detail="Please enter a valid URL.")
    return await parse_music_url(req.url.strip())

# 2. 게시물 생성 API
@router.post("")
def create_post(
    post_type: str = Form(...),
    is_public: bool = Form(True),
    content: str = Form(""),
    extra_data: str = Form("{}"),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        parsed_extra = json.loads(extra_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid extra_data format.")

    if post_type == "photo":
        if not images or len(images) == 0:
            raise HTTPException(status_code=400, detail="Please select at least 1 photo.")
        if len(images) > 5:
            raise HTTPException(status_code=400, detail="You can upload up to 5 photos.")

        saved_image_urls = []
        for img in images:
            ext = os.path.splitext(img.filename)[1]
            filename = f"post_{current_user.id}_{uuid.uuid4().hex[:10]}{ext}"
            filepath = os.path.join("uploads", filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(img.file, buffer)
            saved_image_urls.append(f"/uploads/{filename}")

        parsed_extra["images"] = saved_image_urls

    new_post = Post(
        author_id=current_user.id,
        post_type=post_type,
        is_public=is_public,
        content=content,
        extra_data=parsed_extra
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return {"message": "Post created successfully!", "post_id": new_post.id}

# 3. 메인 피드 목록 조회 API (1페이지당 10개씩 페이지네이션)
@router.get("")
def get_feed_posts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """메인 피드(/feed)에서는 공개(is_public=True) 게시물만 최신순으로 10개씩 내려줍니다."""
    query = db.query(Post).filter(Post.is_public == True).order_by(Post.created_at.desc())
    total = query.count()
    posts = query.offset((page - 1) * size).limit(size).all()

    return {
        "page": page,
        "size": size,
        "total": total,
        "has_more": (page * size) < total,
        "items": [serialize_post(p, current_user) for p in posts]
    }

# 4. 내가 좋아요 누른 게시물 목록 조회 API (/like 페이지용)
@router.get("/liked")
def get_liked_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 유저가 Like를 누른 게시물만 최신순으로 모아 보여줍니다."""
    liked_records = (
        db.query(PostLike)
        .filter(PostLike.user_id == current_user.id)
        .order_by(PostLike.created_at.desc())
        .all()
    )
    posts = []
    for record in liked_records:
        p = record.post
        # 타인의 비공개 게시물이 아니라면 목록에 포함
        if p and (p.is_public or p.author_id == current_user.id):
            posts.append(serialize_post(p, current_user))
    return {"items": posts}

# 5. 단건 게시물 상세 조회 API (/feed/[피드번호] 및 프로필 그리드 클릭 시)
@router.get("/{post_id}")
def get_post_detail(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    if not post.is_public and post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="This post is private.")
    return serialize_post(post, current_user)

# 6. 게시물 수정 API (본인 게시물만 가능)
# 6. 게시물 수정 API (모든 유형의 필드, 사진 추가/삭제, Public/Private 전환 지원)
@router.put("/{post_id}")
def update_post(
    post_id: int,
    content: str = Form(""),
    is_public: bool = Form(True),
    extra_data: str = Form("{}"),
    new_images: List[UploadFile] = File(default=[]), # 수정 시 새로 추가한 사진 파일들
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own posts.")

    try:
        parsed_extra = json.loads(extra_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid extra_data format.")

    # Photo 유형일 때: 남겨둔 기존 사진 목록(kept_images) + 새로 업로드한 사진 파일(new_images) 합치기
    if post.post_type == "photo":
        kept_images = parsed_extra.get("images", [])
        if len(kept_images) + len(new_images) == 0:
            raise HTTPException(status_code=400, detail="Please keep or upload at least 1 photo.")
        if len(kept_images) + len(new_images) > 5:
            raise HTTPException(status_code=400, detail="You can have up to 5 photos in total.")

        saved_new_urls = []
        for img in new_images:
            ext = os.path.splitext(img.filename)[1]
            filename = f"post_{current_user.id}_{uuid.uuid4().hex[:10]}{ext}"
            filepath = os.path.join("uploads", filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(img.file, buffer)
            saved_new_urls.append(f"/uploads/{filename}")

        parsed_extra["images"] = kept_images + saved_new_urls

    # 변경된 본문, 공개 여부(Public/Private), 유형별 세부 데이터 저장
    post.content = content
    post.is_public = is_public
    post.extra_data = parsed_extra

    db.commit()
    db.refresh(post)
    return serialize_post(post, current_user)

# 7. 게시물 삭제 API (본인 게시물만 가능)
@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own posts.")

    db.delete(post)
    db.commit()
    return {"message": "Post deleted."}

# 8. 좋아요(Like) 토글 API (누르면 추가, 다시 누르면 해제)
@router.post("/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    existing = (
        db.query(PostLike)
        .filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
    else:
        new_like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()

    db.refresh(post)
    return serialize_post(post, current_user)

# 9. 밸런스 게임 투표 및 재투표 API
@router.post("/{post_id}/vote")
def vote_balance_game(
    post_id: int,
    req: VoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if req.selected_option not in (1, 2):
        raise HTTPException(status_code=400, detail="Invalid option.")

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or post.post_type != "balance":
        raise HTTPException(status_code=404, detail="Balance game not found.")

    existing_vote = (
        db.query(BalanceVote)
        .filter(BalanceVote.post_id == post_id, BalanceVote.user_id == current_user.id)
        .first()
    )
    # 이미 투표한 적이 있으면 선택지 변경(재투표), 없으면 새로 생성
    if existing_vote:
        existing_vote.selected_option = req.selected_option
    else:
        new_vote = BalanceVote(
            post_id=post_id,
            user_id=current_user.id,
            selected_option=req.selected_option
        )
        db.add(new_vote)

    db.commit()
    db.refresh(post)
    return serialize_post(post, current_user)

# 10. 댓글 목록 조회 & 작성 & 수정 & 삭제 API (바텀 시트 모달용)
@router.get("/{post_id}/comments")
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comments = (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return [
        {
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at,
            "author": {
                "username": c.author.username,
                "name": c.author.name,
                "profile_image": c.author.profile_image,
            },
            "is_mine": c.author_id == current_user.id,
        }
        for c in comments
    ]

@router.post("/{post_id}/comments")
def create_comment(
    post_id: int,
    req: CommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Please enter a comment.")
    new_comment = Comment(
        post_id=post_id,
        author_id=current_user.id,
        content=req.content.strip()
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return {"id": new_comment.id, "message": "Comment added."}

@router.put("/comments/{comment_id}")
def update_comment(
    comment_id: int,
    req: CommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment or comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own comments.")
    comment.content = req.content.strip()
    db.commit()
    return {"message": "Comment updated."}

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment or comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments.")
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted."}