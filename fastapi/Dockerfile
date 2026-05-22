FROM python:3.13.13-slim

WORKDIR /app

COPY chroma_db chroma_db
COPY services services
COPY routers routers
COPY app.py app.py
COPY rag_chatbot.py rag_chatbot.py
COPY vector_store.py vector_store.py
COPY config.py config.py
COPY document_loader.py document_loader.py

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "app.py"]
