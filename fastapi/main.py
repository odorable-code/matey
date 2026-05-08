from google import genai
from google.genai import types
from fastapi import FastAPI, Query, File, UploadFile
from pydantic import BaseModel
from chromadb.config import Settings
import uvicorn
import os
import sys
import pypdf
import time
import chromadb
import io
import cv2
import numpy as np
import json 
import re
import base64

app = FastAPI()

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_MODEL_NAME = "gemini-2.5-flash-lite"
GOOGLE_SUMMARY_MODEL_NAME = "gemini-3.1-flash-lite-preview"
GOOGLE_EMBED_MODEL_NAME = "gemini-embedding-2-preview"
CHROMA_PATH = "./chroma_db"
client = genai.Client(api_key=GOOGLE_API_KEY)


chroma_client = chromadb.PersistentClient(
	path=CHROMA_PATH,
	settings=Settings(
		# 우리가 사용한 데이터를 크로마db 본사 서버에 익명으로 보낼건지 말지
		anonymized_telemetry=False, 
		# 명령어로 db 내용을 초기화 권한을 부여할건지 말건지. 배포할 땐 False
		allow_reset=True)
)
collection = chroma_client.get_or_create_collection(name="class_knowledge")