import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str = "sqlite:///./kumastagram.db"

    USER1_USERNAME: str
    USER1_PASSWORD: str
    USER1_NAME: str
    USER1_BIO: str

    USER2_USERNAME: str
    USER2_PASSWORD: str
    USER2_NAME: str
    USER2_BIO: str

    WALDO_X_MIN: float
    WALDO_X_MAX: float
    WALDO_Y_MIN: float
    WALDO_Y_MAX: float

    # 상위 폴더(../.env)에 있는 .env 파일을 읽어오도록 설정
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()