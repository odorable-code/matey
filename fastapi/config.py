import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "rag_collection")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")
    CHAT_MODEL: str = os.getenv("CHAT_MODEL", "gemini-3.1-flash-lite")
    # CHAT_MODEL: str = os.getenv("CHAT_MODEL", "gemini-flash-latest")
    # CHAT_MODEL: str = os.getenv("CHAT_MODEL", "gemini-1.5-flash")
    # CHAT_MODEL: str = os.getenv("CHAT_MODEL", "gemini-2.0-flash")
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))
    TOP_K: int = int(os.getenv("TOP_K", "5"))

    def validate(self) -> None:
        if not self.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")


config = Config()
