from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    username: str
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleLoginRequest(BaseModel):
    credential: str

class SubmissionCreate(BaseModel):
    problem_id: str
    problem_title: str
    language: str
    verdict: str
    runtime: str
    memory: str
    source_code: str

class SubmissionResponse(BaseModel):
    id: str
    problem_id: str
    problem_title: str
    language: str
    verdict: str
    runtime: str
    memory: str
    source_code: str
    submitted_at: datetime
    username: str

