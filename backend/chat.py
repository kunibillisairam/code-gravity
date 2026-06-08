from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from database import db
from auth import get_current_user, SECRET_KEY, ALGORITHM
from chat_models import MessageSend, ConversationCreate, CodeSnippet
from jose import jwt, JWTError
from datetime import datetime
from typing import Dict, List, Optional
from bson import ObjectId
import re

router = APIRouter(prefix="/chat", tags=["chat"])

# --- HELPER FUNCTIONS ---
def serialize_doc(doc):
    if not doc:
        return None
    doc = dict(doc)
    doc["id"] = str(doc["_id"])
    if "_id" in doc:
        del doc["_id"]
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc

# --- WS USER AUTHENTICATION ---
async def get_ws_user(token: str):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = await db.users.find_one({"email": email})
        return user
    except JWTError:
        return None

# --- REAL-TIME CONNECTION MANAGER ---
class ConnectionManager:
    def __init__(self):
        # Maps username -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Simple tracking of user online status
        self.user_statuses: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, username: str):
        print(f"[WS CONNECT] Connection requested by user: {username}")
        await websocket.accept()
        self.active_connections[username] = websocket
        self.user_statuses[username] = "online"
        print(f"[WS CONNECT] Connection accepted successfully. Active users online: {list(self.active_connections.keys())}")
        
        # Update user status in DB
        await db.users.update_one(
            {"username": username},
            {"$set": {"online_status": "online", "last_active_at": datetime.utcnow()}}
        )
        
        # Broadcast presence
        await self.broadcast_status(username, "online")

    async def disconnect(self, username: str):
        print(f"[WS DISCONNECT] Disconnecting user: {username}")
        if username in self.active_connections:
            del self.active_connections[username]
        self.user_statuses[username] = "offline"
        print(f"[WS DISCONNECT] Disconnected successfully. Remaining users online: {list(self.active_connections.keys())}")
        
        # Update DB status
        await db.users.update_one(
            {"username": username},
            {"$set": {"online_status": "offline", "last_active_at": datetime.utcnow()}}
        )
        
        # Broadcast absence
        await self.broadcast_status(username, "offline")

    async def broadcast_status(self, username: str, status: str):
        payload = {
            "type": "status",
            "username": username,
            "status": status
        }
        await self.broadcast(payload)

    async def broadcast(self, message: dict):
        disconnected = []
        for username, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(username)
        for username in disconnected:
            await self.disconnect(username)

    async def send_to_user(self, username: str, message: dict):
        connection = self.active_connections.get(username)
        if connection:
            try:
                await connection.send_json(message)
                return True
            except Exception:
                await self.disconnect(username)
        return False

    async def broadcast_to_room(self, room_id: str, message: dict):
        # Broadcast to all active users, client-side will filter by room
        # In a real heavy-weight app, we would only send to subscribed room users,
        # but for peer learning, global notification of updates is highly responsive!
        await self.broadcast(message)

manager = ConnectionManager()

# --- SPAM & MODERATION PIPELINE ---
# In-memory tracking for rate limiting (spam prevention)
# Maps username -> list of recent message timestamps
user_message_logs: Dict[str, List[datetime]] = {}

# Profanity word list
PROFANITY_WORDS = [
    "fuck", "shit", "asshole", "bitch", "crap", "bastard", "idiot", "dumbass", 
    "dick", "pussy", "cunt", "faggot", "nigger", "motherfuck"
]

def check_toxicity(text: str) -> bool:
    if not text:
        return False
    # Normalize and strip characters for scanning
    normalized = re.sub(r'[^a-zA-Z\s]', '', text.lower())
    words = normalized.split()
    for word in words:
        if word in PROFANITY_WORDS:
            return True
    return False

def moderate_message(sender: str, payload: MessageSend) -> tuple[str, str, Optional[dict]]:
    """
    Evaluates message for spam, toxic text, and unrestricted code dumping.
    Returns: (moderation_status, content, optional_snippet)
    """
    # 1. SPAM CHECK: max 3 messages within 3 seconds
    now = datetime.utcnow()
    if sender not in user_message_logs:
        user_message_logs[sender] = []
    
    # Filter logs older than 3 seconds
    user_message_logs[sender] = [t for t in user_message_logs[sender] if (now - t).total_seconds() <= 3.0]
    user_message_logs[sender].append(now)
    
    if len(user_message_logs[sender]) > 3:
        return "blocked", "⚠️ [SPAM PROTECTION] You are typing too fast. Please slow down to maintain a clean, collaborative learning space!", None

    content_text = payload.content or ""
    snippet_dict = payload.code_snippet.dict() if payload.code_snippet else None

    # 2. TOXICITY CHECK
    is_toxic = check_toxicity(content_text) or (snippet_dict and check_toxicity(snippet_dict.get("explanation", "")))
    if is_toxic:
        return "blocked", "❌ [AutoMod Alert] Your message was flagged for potentially offensive language. CodeGravity encourages friendly, inclusive, and cooperative peer support. Please edit your message.", None

    # 3. UNRESTRICTED CODE DUMPING CHECK
    # Enforces reasoning: User cannot dump code without explaining it
    # We inspect if the text contains code markdown blocks or code keywords,
    # or if the user passed a code snippet payload with insufficient explanation.
    has_code_syntax = "```" in content_text or bool(re.search(
        r'(def\s+\w+\(|function\s+\w+\(|class\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|\bpublic\s+class\b|\bimport\s+\w+\b|\binclude\s+<\w+>)',
        content_text
    ))

    if has_code_syntax or snippet_dict:
        # Check explanation length. We require at least 30 characters of description
        explanation = ""
        if snippet_dict:
            explanation = snippet_dict.get("explanation", "").strip()
        else:
            # Try to extract explanation text that is outside code fences
            clean_text = re.sub(r'```.*?```', '', content_text, flags=re.DOTALL).strip()
            explanation = clean_text

        if len(explanation) < 30:
            return "blocked", (
                "💡 **[AutoMod Advice: Reason before Coding!]**\n"
                "CodeGravity encourages logical discussions and collaborative reasoning! To post a code snippet, "
                "please provide a detailed explanation of your thought process (at least 30 characters) describing "
                "your approach, what you have tried, or where you are stuck. Let's solve it together instead of "
                "blindly dumping code!"
            ), None

    # Approved
    return "approved", content_text, snippet_dict


# --- REST API ENDPOINTS ---

@router.get("/rooms")
async def get_rooms(current_user: dict = Depends(get_current_user)):
    rooms = []
    cursor = db.chat_rooms.find().sort("name", 1)
    async for room in cursor:
        rooms.append(serialize_doc(room))
    return rooms

@router.get("/rooms/{room_id}/messages")
async def get_room_messages(room_id: str, current_user: dict = Depends(get_current_user)):
    messages = []
    # Fetch last 50 messages
    cursor = db.chat_messages.find({"room_id": room_id}).sort("created_at", -1).limit(50)
    async for msg in cursor:
        messages.append(serialize_doc(msg))
    # Reverse to return chronological order
    messages.reverse()
    return messages

@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    my_username = current_user["username"]
    conversations = []
    cursor = db.conversations.find({"participants": my_username}).sort("last_message_at", -1)
    async for conv in cursor:
        serialized = serialize_doc(conv)
        # Determine status of other participant
        other_participant = next((p for p in serialized["participants"] if p != my_username), None)
        status = "offline"
        if other_participant:
            # Check active manager connections first
            if other_participant in manager.active_connections:
                status = "online"
            else:
                other_user = await db.users.find_one({"username": other_participant})
                if other_user:
                    status = other_user.get("online_status", "offline")
        serialized["other_participant_status"] = status
        conversations.append(serialized)
    return conversations

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    messages = []
    cursor = db.chat_messages.find({"conversation_id": conversation_id}).sort("created_at", -1).limit(50)
    async for msg in cursor:
        messages.append(serialize_doc(msg))
    messages.reverse()
    
    # Mark messages as read by resetting unread count for current user
    my_username = current_user["username"]
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {f"unread_counts.{my_username}": 0}}
    )
    
    # Mark individual messages in this conversation as read
    await db.chat_messages.update_many(
        {"conversation_id": conversation_id, "sender_username": {"$ne": my_username}},
        {"$set": {"is_read": True}}
    )
    
    return messages

@router.post("/conversations")
async def create_conversation(req: ConversationCreate, current_user: dict = Depends(get_current_user)):
    my_username = current_user["username"]
    recipient = req.recipient_username
    
    if my_username == recipient:
        raise HTTPException(status_code=400, detail="Cannot start a conversation with yourself")
        
    # Check if recipient exists
    target = await db.users.find_one({"username": recipient})
    if not target:
        raise HTTPException(status_code=404, detail="Recipient user not found")
        
    # Check if DM already exists
    existing = await db.conversations.find_one({
        "participants": {"$all": [my_username, recipient]}
    })
    
    if existing:
        return serialize_doc(existing)
        
    # Create new conversation
    new_conv = {
        "participants": [my_username, recipient],
        "last_message_at": datetime.utcnow(),
        "last_message_text": "Conversation started.",
        "unread_counts": {
            my_username: 0,
            recipient: 0
        }
    }
    
    res = await db.conversations.insert_one(new_conv)
    new_conv["_id"] = res.inserted_id
    return serialize_doc(new_conv)

@router.post("/conversations/{conversation_id}/messages")
async def send_rest_message(conversation_id: str, payload: MessageSend, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    
    # 1. Verify user is a participant of the conversation
    conv = await db.conversations.find_one({"_id": ObjectId(conversation_id), "participants": username})
    if not conv:
        raise HTTPException(status_code=403, detail="Not authorized to participate in this conversation")
        
    # 2. Moderate message for spam/toxicity/reasoning
    moderation_status, final_content, final_snippet = moderate_message(username, payload)
    
    if moderation_status == "blocked":
        raise HTTPException(status_code=400, detail=final_content)
        
    # 3. Store message in DB
    db_message = {
        "sender_username": username,
        "sender_avatar": current_user.get("profile", {}).get("profile_pic", ""),
        "content": final_content,
        "type": payload.type,
        "moderation_status": "approved",
        "created_at": datetime.utcnow(),
        "conversation_id": conversation_id
    }
    if final_snippet:
        db_message["code_snippet"] = final_snippet
        
    res = await db.chat_messages.insert_one(db_message)
    db_message["_id"] = res.inserted_id
    
    serialized_msg = serialize_doc(db_message)
    
    # 4. Update conversation status and increment unread counts
    update_unread = {}
    for p in conv["participants"]:
        if p != username:
            update_unread[f"unread_counts.{p}"] = conv.get("unread_counts", {}).get(p, 0) + 1
            
            # Write notification in DB
            new_notif = {
                "recipient_username": p,
                "sender_username": username,
                "type": "message",
                "title": "New Message",
                "text": f"@{username} sent you a message: {final_content[:30]}..." if final_content else f"@{username} shared code logic.",
                "link": { "view": "chat", "param": username },
                "is_read": False,
                "created_at": datetime.utcnow()
            }
            res_notif = await db.notifications.insert_one(new_notif)
            new_notif["_id"] = res_notif.inserted_id
            
            # Dispatch WebSocket global notification
            await manager.send_to_user(p, {
                "type": "global_notification",
                **serialize_doc(new_notif)
            })
            
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$set": {
                "last_message_at": datetime.utcnow(),
                "last_message_text": final_content[:50] if final_content else "Shared code logic."
            },
            "$inc": update_unread
        }
    )
    
    # Send message event to other participants if they are online in chat
    for p in conv["participants"]:
        await manager.send_to_user(p, {"type": "message", **serialized_msg})
        if p != username:
            await manager.send_to_user(p, {
                "type": "notification",
                "conversation_id": conversation_id,
                "sender": username,
                "text": final_content[:60] if final_content else "Shared code logic."
            })
            
    return serialized_msg

@router.get("/users")
async def get_chat_users(current_user: dict = Depends(get_current_user)):
    my_username = current_user["username"]
    users = []
    cursor = db.users.find({"username": {"$ne": my_username}}, {
        "username": 1,
        "profile.display_name": 1,
        "profile.profile_pic": 1,
        "online_status": 1
    }).limit(100)
    
    async for user in cursor:
        uname = user["username"]
        status = "offline"
        if uname in manager.active_connections:
            status = "online"
        else:
            status = user.get("online_status", "offline")
            
        profile = user.get("profile") or {}
        
        users.append({
            "username": uname,
            "display_name": profile.get("display_name") or uname,
            "profile_pic": profile.get("profile_pic") or "",
            "online_status": status
        })
    return users

@router.post("/conversations/{conversation_id}/read")
async def mark_as_read(conversation_id: str, current_user: dict = Depends(get_current_user)):
    my_username = current_user["username"]
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {f"unread_counts.{my_username}": 0}}
    )
    # Mark individual messages as read in DB
    await db.chat_messages.update_many(
        {"conversation_id": conversation_id, "sender_username": {"$ne": my_username}},
        {"$set": {"is_read": True}}
    )
    return {"status": "success"}


# --- GLOBAL NOTIFICATIONS REST ENDPOINTS ---

@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    notifications = []
    cursor = db.notifications.find({"recipient_username": username}).sort("created_at", -1).limit(20)
    async for notif in cursor:
        notifications.append(serialize_doc(notif))
    return notifications

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "recipient_username": username},
        {"$set": {"is_read": True}}
    )
    return {"status": "success"}

@router.post("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    await db.notifications.update_many(
        {"recipient_username": username, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"status": "success"}

@router.post("/notifications/clear")
async def clear_all_notifications(current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    await db.notifications.delete_many({"recipient_username": username})
    return {"status": "success"}


# --- WEBSOCKET CHAT CONNECTION GATEWAY ---

WS_TICKETS = {}

@router.get("/ticket")
async def get_ws_ticket(current_user: dict = Depends(get_current_user)):
    import uuid
    ticket = str(uuid.uuid4())
    WS_TICKETS[ticket] = current_user["email"]
    return {"ticket": ticket}

@router.websocket("/ws")
async def chat_websocket_endpoint(websocket: WebSocket, ticket: str = None):
    print(f"[WS HANDSHAKE] Handshake initiated with ticket: {ticket}")
    if not ticket or ticket not in WS_TICKETS:
        print(f"[WS HANDSHAKE FAILED] Ticket is invalid or expired: {ticket}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    email = WS_TICKETS.pop(ticket)
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"[WS HANDSHAKE FAILED] No user found for email associated with ticket: {email}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    username = user["username"]
    await manager.connect(websocket, username)
    
    try:
        while True:
            # Expecting JSON messages
            data = await websocket.receive_json()
            event_type = data.get("type")
            
            # --- TYPING INDICATOR ROUTER ---
            if event_type == "typing":
                room_id = data.get("room_id")
                conversation_id = data.get("conversation_id")
                is_typing = data.get("is_typing", False)
                
                payload = {
                    "type": "typing",
                    "sender": username,
                    "room_id": room_id,
                    "conversation_id": conversation_id,
                    "is_typing": is_typing
                }
                
                # Relay to others
                if room_id:
                    await manager.broadcast(payload)
                elif conversation_id:
                    # Find recipient in conversation
                    conv = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
                    if conv:
                        for p in conv["participants"]:
                            if p != username:
                                await manager.send_to_user(p, payload)
                                
            # --- MESSAGE DISPATCH ROUTER ---
            elif event_type == "message":
                room_id = data.get("room_id")
                conversation_id = data.get("conversation_id")
                content = data.get("content")
                msg_type = data.get("msg_type", "text")
                snippet_raw = data.get("code_snippet")
                
                # Setup CodeSnippet model if valid snippet sent
                code_snippet = None
                if snippet_raw:
                    try:
                        code_snippet = CodeSnippet(
                            code=snippet_raw.get("code", ""),
                            language=snippet_raw.get("language", "python"),
                            explanation=snippet_raw.get("explanation", "")
                        )
                    except Exception:
                        pass
                
                # Formulate Pydantic Payload for Moderation
                payload = MessageSend(
                    content=content,
                    type=msg_type,
                    code_snippet=code_snippet
                )
                
                # Execute moderation filters
                moderation_status, final_content, final_snippet = moderate_message(username, payload)
                
                # If blocked, we override message type to system-blocked warning
                # visually alerting only the offending sender
                if moderation_status == "blocked":
                    # Send direct warning response to the sender
                    system_payload = {
                        "type": "message",
                        "room_id": room_id,
                        "conversation_id": conversation_id,
                        "id": "automod_" + str(int(datetime.utcnow().timestamp())),
                        "sender_username": "System AutoMod",
                        "sender_avatar": "system",
                        "content": final_content,
                        "type": "system_warning",
                        "moderation_status": "blocked",
                        "created_at": datetime.utcnow().isoformat()
                    }
                    await manager.send_to_user(username, system_payload)
                    continue

                # Store approved message in DB
                db_message = {
                    "sender_username": username,
                    "sender_avatar": user.get("profile", {}).get("profile_pic", ""),
                    "content": final_content,
                    "type": msg_type,
                    "moderation_status": "approved",
                    "created_at": datetime.utcnow(),
                    "is_read": False if conversation_id else True
                }
                
                if room_id:
                    db_message["room_id"] = room_id
                if conversation_id:
                    db_message["conversation_id"] = conversation_id
                if final_snippet:
                    db_message["code_snippet"] = final_snippet
                    
                res = await db.chat_messages.insert_one(db_message)
                db_message["_id"] = res.inserted_id
                
                serialized_msg = serialize_doc(db_message)
                
                # Handle room broadcast vs DM unicast/notification
                if room_id:
                    await manager.broadcast({"type": "message", **serialized_msg})
                elif conversation_id:
                    # Update conversation metrics in DB
                    conv = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
                    if conv:
                        # Increment unread counts for participants except the sender
                        update_unread = {}
                        for p in conv["participants"]:
                            if p != username:
                                update_unread[f"unread_counts.{p}"] = conv.get("unread_counts", {}).get(p, 0) + 1
                                
                                # Write persistent message notification in DB
                                new_notif = {
                                    "recipient_username": p,
                                    "sender_username": username,
                                    "type": "message",
                                    "title": "New Message",
                                    "text": f"@{username} sent you a message: {final_content[:30]}..." if final_content else f"@{username} shared code logic.",
                                    "link": { "view": "chat", "param": username },
                                    "is_read": False,
                                    "created_at": datetime.utcnow()
                                }
                                res_notif = await db.notifications.insert_one(new_notif)
                                new_notif["_id"] = res_notif.inserted_id
                                
                                # Dispatch global notification over WebSocket
                                await manager.send_to_user(p, {
                                    "type": "global_notification",
                                    **serialize_doc(new_notif)
                                })
                                
                        await db.conversations.update_one(
                            {"_id": ObjectId(conversation_id)},
                            {
                                "$set": {
                                    "last_message_at": datetime.utcnow(),
                                    "last_message_text": final_content[:50] if final_content else "Shared code logic."
                                },
                                "$inc": update_unread
                            }
                        )
                        
                        # Dispatch real-time message to participants
                        for p in conv["participants"]:
                            # Send message event
                            await manager.send_to_user(p, {"type": "message", **serialized_msg})
                            
                            # Send notification event to recipient for real-time badge counters
                            if p != username:
                                await manager.send_to_user(p, {
                                    "type": "notification",
                                    "conversation_id": conversation_id,
                                    "sender": username,
                                    "text": final_content[:60] if final_content else "Shared code logic."
                                })

    except WebSocketDisconnect:
        await manager.disconnect(username)
    except Exception as e:
        print(f"WS error: {e}")
        await manager.disconnect(username)
