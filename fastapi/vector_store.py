import uuid
import time
from google import genai
from google.genai import types
from google.genai import errors as genai_errors
import chromadb
from chromadb.config import Settings

from config import config
from document_loader import Document


class VectorStore:
    def __init__(self) -> None:
        config.validate()
        self._genai = genai.Client(
            api_key=config.GEMINI_API_KEY,
            http_options={"api_version": "v1beta"},
        )

        self._client = chromadb.PersistentClient(
            path=config.CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=config.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

    # ------------------------------------------------------------------
    # 임베딩
    # ------------------------------------------------------------------

    def _embed_one(self, text: str, task_type: str) -> list[float]:
        for attempt in range(5):
            try:
                result = self._genai.models.embed_content(
                    model=config.EMBEDDING_MODEL,
                    contents=text,
                    config=types.EmbedContentConfig(task_type=task_type),
                )
                return result.embeddings[0].values
            except genai_errors.ClientError as e:
                if e.code == 429 and attempt < 4:
                    time.sleep(60)
                else:
                    raise

    def _embed(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(text, "RETRIEVAL_DOCUMENT") for text in texts]

    def _embed_query(self, text: str) -> list[float]:
        return self._embed_one(text, "RETRIEVAL_QUERY")

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def add_documents(self, documents: list[Document], batch_size: int = 100) -> int:
        """문서를 벡터 DB에 추가합니다. 추가된 청크 수를 반환합니다."""
        added = 0
        for i in range(0, len(documents), batch_size):
            batch = documents[i : i + batch_size]
            texts = [doc.content for doc in batch]
            embeddings = self._embed(texts)
            self._collection.add(
                ids=[str(uuid.uuid4()) for _ in batch],
                embeddings=embeddings,
                documents=texts,
                metadatas=[doc.metadata for doc in batch],
            )
            added += len(batch)
        return added

    def query(self, question: str, top_k: int | None = None) -> list[dict]:
        """질문과 가장 유사한 청크를 반환합니다."""
        k = top_k or config.TOP_K
        embedding = self._embed_query(question)
        results = self._collection.query(
            query_embeddings=[embedding],
            n_results=min(k, self._collection.count() or 1),
            include=["documents", "metadatas", "distances"],
        )
        chunks = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            chunks.append({"content": doc, "metadata": meta, "score": 1 - dist})
        return chunks

    def count(self) -> int:
        return self._collection.count()

    def reset(self) -> None:
        """컬렉션을 초기화합니다 (모든 데이터 삭제)."""
        self._client.delete_collection(config.COLLECTION_NAME)
        self._collection = self._client.get_or_create_collection(
            name=config.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
