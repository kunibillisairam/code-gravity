from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict

class CodeSnippet(BaseModel):
    code: str
    language: str
    explanation: str

class MessageSend(BaseModel):
    content: Optional[str] = None
    type: str = "text"  # "text" | "hint_request" | "algorithm_discuss"
    code_snippet: Optional[CodeSnippet] = None

class ConversationCreate(BaseModel):
    recipient_username: str

class ChatRoomResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    category: str
    created_at: datetime

class ChatMessageResponse(BaseModel):
    id: str
    room_id: Optional[str] = None
    conversation_id: Optional[str] = None
    sender_username: str
    sender_avatar: Optional[str] = None
    content: Optional[str] = None
    type: str
    code_snippet: Optional[CodeSnippet] = None
    moderation_status: str
    flagged_reason: Optional[str] = None
    created_at: datetime

class ConversationResponse(BaseModel):
    id: str
    participants: List[str]
    last_message_at: datetime
    last_message_text: Optional[str] = None
    unread_counts: Dict[str, int]
    other_participant_status: Optional[str] = "offline" # Tracked at runtime
