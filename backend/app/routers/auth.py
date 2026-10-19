from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User
from app.config import settings
from app.utils.security import verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class WaldoClickRequest(BaseModel):
    x_percent: float
    y_percent: float

class LoginRequest(BaseModel):
    username: str
    password: str
    gate_token: str  # 윌리를 맞힌 사람만 받을 수 있는 임시 통과 토큰

@router.post("/verify-waldo")
def verify_waldo(req: WaldoClickRequest):
    """
    프론트엔드에서 클릭한 (x%, y%) 좌표가 .env에 설정된 정답 범위 안인지 백엔드에서 몰래 계산합니다.
    개발자 도구(F12)에 정답 좌표가 절대 노출되지 않습니다!
    """
    is_x_valid = settings.WALDO_X_MIN <= req.x_percent <= settings.WALDO_X_MAX
    is_y_valid = settings.WALDO_Y_MIN <= req.y_percent <= settings.WALDO_Y_MAX

    if is_x_valid and is_y_valid:
        # 정답일 경우 10분간 유효한 '로그인 페이지 입장권(gate_token)' 발급
        gate_token = create_access_token(
            data={"gate": "passed"},
            expires_delta=timedelta(minutes=10)
        )
        return {"success": True, "gate_token": gate_token}
    
    return {"success": False, "message": "Who Are You? 👀"}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error: OE: 016F : BFF9B3D4" # Figma 시안의 리눅스 에러 코드!
        )

    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "name": user.name,
            "bio": user.bio,
            "profile_image": user.profile_image
        }
    }