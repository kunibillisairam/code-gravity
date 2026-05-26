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

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    college_name: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    profile_pic: Optional[str] = None
    interested_domains: Optional[List[str]] = None
    skills: Optional[List[str]] = None


