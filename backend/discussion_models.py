from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class DiscussionCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    content: str = Field(..., min_length=10, max_length=2000)
    category: str = Field(..., pattern="^(doubt|logic|approach|hint)$")

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=5, max_length=1500)

class ReplyCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=1000)

class DiscussionResponse(BaseModel):
    id: str
    problem_id: str
    author: str
    author_level: int
    author_xp: int
    author_pic: str
    title: str
    content: str
    category: str
    created_at: datetime
    upvote_count: int
    has_upvoted: bool
    is_pinned: bool
    is_resolved: bool
    helpful_comment_id: Optional[str] = None

class CommentResponse(BaseModel):
    id: str
    discussion_id: str
    author: str
    author_level: int
    author_xp: int
    author_pic: str
    content: str
    created_at: datetime
    upvote_count: int
    has_upvoted: bool
    is_helpful: bool

class ReplyResponse(BaseModel):
    id: str
    comment_id: str
    author: str
    author_level: int
    author_xp: int
    author_pic: str
    content: str
    created_at: datetime
