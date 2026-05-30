import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from judge0 import Judge0Client
import uvicorn
from dotenv import load_dotenv

from database import client, db
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from models import UserCreate, UserLogin, Token, GoogleLoginRequest, SubmissionCreate, SubmissionResponse, ProfileUpdate
from fastapi import status, Depends
import requests
from bson import ObjectId
from discussion_models import DiscussionCreate, CommentCreate, ReplyCreate
import re


# Load env variables
load_dotenv()

app = FastAPI(
    title="CodeGravity Code Execution Terminal Backend",
    version="1.0.0",
    description="Microservice providing isolated programming sandbox compilations via Judge0 API"
)

# Configure CORS permissions to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow any origin (including localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and mount Peer Chat router
from chat import router as chat_router
app.include_router(chat_router)

# Instantiate Judge0 API Client
judge_client = Judge0Client()

@app.on_event("startup")
async def startup_db_client():
    try:
        await client.admin.command('ping')
        print("Connected to MongoDB!")
        
        # Enforce uniqueness at the database level
        import pymongo
        await db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
        print("MongoDB unique index applied for email.")
        
        # Add index for fast leaderboard sorting by XP
        await db.users.create_index([("progress.xp", pymongo.DESCENDING)])
        print("MongoDB descending index applied for progress.xp.")
        
        # Seed topic chat rooms for Peer Learning
        from datetime import datetime
        chat_rooms = [
            {
                "name": "General Chat",
                "slug": "general-chat",
                "description": "Discuss coding, share ideas, and socialize with peers.",
                "category": "General",
                "created_at": datetime.utcnow()
            },
            {
                "name": "Ask for Hints",
                "slug": "ask-for-hints",
                "description": "Stuck on a problem? Ask peers for clues and visual hints rather than copying code!",
                "category": "Peer Learning",
                "created_at": datetime.utcnow()
            },
            {
                "name": "Discuss Algorithms",
                "slug": "discuss-algorithms",
                "description": "Analyze complexity, logic, data structures, and mathematical proofs.",
                "category": "Algorithms",
                "created_at": datetime.utcnow()
            },
            {
                "name": "React & Web Dev",
                "slug": "react-web-dev",
                "description": "Share tips and tricks about React, tailwind styling, next.js and frontend stacks.",
                "category": "Development",
                "created_at": datetime.utcnow()
            },
            {
                "name": "Pythonistas",
                "slug": "pythonistas",
                "description": "Talk about elegant Python, list comprehensions, standard libs, and motor collections.",
                "category": "Languages",
                "created_at": datetime.utcnow()
            }
        ]
        for room in chat_rooms:
            await db.chat_rooms.update_one(
                {"slug": room["slug"]},
                {"$setOnInsert": room},
                upsert=True
            )
        print("MongoDB chat rooms pre-seeded.")
        
    except Exception as e:
        print(f"Unable to connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Request body validation model
class RunCodeRequest(BaseModel):
    code: str
    language: str
    stdin: str = None
    problem_id: str = None

class TestCase(BaseModel):
    id: int
    input: str
    expected: str

class SubmitCodeRequest(BaseModel):
    code: str
    language: str
    problem_id: str
    testcases: List[TestCase]

@app.get("/")
def read_root():
    return {
        "status": "active",
        "system": "CodeGravity Sandbox Compiler Core",
        "endpoints": ["POST /run-code", "POST /submit-code", "POST /register", "POST /login"]
    }

@app.post("/register")
async def register(user: UserCreate):
    existing_email = await db.users.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_dict = user.dict()
    user_dict["password"] = get_password_hash(user.password)
    
    # Initialize profile and progress fields to defaults
    user_dict["profile"] = {
        "display_name": user.username,
        "college_name": "",
        "bio": "",
        "github_url": "",
        "linkedin_url": "",
        "profile_pic": "",
        "interested_domains": [],
        "skills": []
    }
    user_dict["progress"] = {
        "xp": 0,
        "level": 1,
        "solved_problems": [],
        "attempted_problems": [],
        "daily_streak": 0,
        "longest_streak": 0,
        "last_activity_date": "",
        "badges": [],
        "activity_log": [],
        "contribution_heatmap": {}
    }
    user_dict["followers"] = []
    user_dict["following"] = []
    
    new_user = await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

@app.post("/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username = db_user["username"]
    access_token = create_access_token(data={"sub": db_user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "username": username}

@app.post("/auth/google")
async def google_auth(request: GoogleLoginRequest):
    token = request.credential
    if not token:
        raise HTTPException(status_code=400, detail="Missing Google credential token")
    
    firebase_key = os.getenv("FIREBASE_API_KEY")
    if not firebase_key:
        raise HTTPException(status_code=500, detail="Firebase API Key not configured in backend Environment.")
        
    try:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={firebase_key}"
        payload = {"idToken": token}
        response = requests.post(url, json=payload, timeout=5)
    except Exception:
        raise HTTPException(status_code=503, detail="Failed to connect to Firebase authentication service")
        
    if response.status_code != 200:
        err_msg = "Invalid Firebase credential"
        try:
            err_data = response.json()
            if "error" in err_data:
                err_msg = err_data["error"].get("message", err_msg)
        except Exception:
            pass
        raise HTTPException(status_code=401, detail=f"Firebase Verification Failed: {err_msg}")
        
    res_json = response.json()
    users_list = res_json.get("users")
    if not users_list or len(users_list) == 0:
        raise HTTPException(status_code=401, detail="No user profile retrieved from Firebase ID Token")
        
    firebase_user = users_list[0]
    email = firebase_user.get("email")
    name = firebase_user.get("displayName") or email.split("@")[0]
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Firebase identity profile")
        
    db_user = await db.users.find_one({"email": email})
    
    if not db_user:
        new_user = {
            "username": name,
            "email": email,
            "password": "",  # Placeholder, signed in via Firebase Google OAuth
            "created_via": "google-firebase",
            "profile": {
                "display_name": name,
                "college_name": "",
                "bio": "",
                "github_url": "",
                "linkedin_url": "",
                "profile_pic": "",
                "interested_domains": [],
                "skills": []
            },
            "progress": {
                "xp": 0,
                "level": 1,
                "solved_problems": [],
                "attempted_problems": [],
                "daily_streak": 0,
                "longest_streak": 0,
                "last_activity_date": "",
                "badges": [],
                "activity_log": [],
                "contribution_heatmap": {}
            },
            "followers": [],
            "following": []
        }
        await db.users.insert_one(new_user)
        username = name
    else:
        username = db_user["username"]
        
    access_token = create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer", "username": username}

async def resolve_usernames(usernames: list) -> list:
    if not usernames:
        return []
    cursor = db.users.find({"username": {"$in": usernames}}, {
        "username": 1,
        "profile.display_name": 1,
        "profile.profile_pic": 1
    })
    resolved = []
    async for u in cursor:
        prof = u.get("profile") or {}
        resolved.append({
            "username": u["username"],
            "display_name": prof.get("display_name") or u["username"],
            "profile_pic": prof.get("profile_pic") or ""
        })
    return resolved

@app.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    profile = current_user.get("profile") or {
        "display_name": current_user.get("username"),
        "college_name": "",
        "bio": "",
        "github_url": "",
        "linkedin_url": "",
        "profile_pic": "",
        "interested_domains": [],
        "skills": []
    }
    
    progress = current_user.get("progress") or {
        "xp": 0,
        "level": 1,
        "solved_problems": [],
        "attempted_problems": [],
        "daily_streak": 0,
        "longest_streak": 0,
        "last_activity_date": "",
        "badges": [],
        "activity_log": [],
        "contribution_heatmap": {}
    }
    
    followers_resolved = await resolve_usernames(current_user.get("followers", []))
    following_resolved = await resolve_usernames(current_user.get("following", []))
    
    return {
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "profile": profile,
        "progress": progress,
        "followers": followers_resolved,
        "following": following_resolved
    }

@app.put("/profile")
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    existing_profile = current_user.get("profile") or {
        "display_name": current_user.get("username"),
        "college_name": "",
        "bio": "",
        "github_url": "",
        "linkedin_url": "",
        "profile_pic": "",
        "interested_domains": [],
        "skills": []
    }
    
    data = profile_data.dict(exclude_unset=True)
    for k, v in data.items():
        existing_profile[k] = v
        
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": {"profile": existing_profile}}
    )
    
    return {"status": "success", "profile": existing_profile}

def get_topic_title(topic_id: str) -> str:
    mapping = {
        "python-basics": "Python Basics",
        "js-basics": "JavaScript Basics",
        "cpp-basics": "C++ Basics",
        "java-basics": "Java Basics",
        "operators": "Operators",
        "conditionals": "Conditionals",
        "loops": "Loops",
        "functions": "Functions",
        "strings": "Strings",
        "lists": "Arrays & Lists",
        "tuples": "Objects & Pointers",
        "sets": "Sets & Maps",
        "dictionaries": "Key-Value Maps",
        "list-comprehension": "Traversals & Streams",
        "exceptions": "Exception Handling",
        "file-handling": "File Streams",
        "oops": "Object-Oriented Programming",
        "searching": "Searching Algorithms",
        "sorting": "Sorting Algorithms",
        "stack": "Stack",
        "queue": "Queue",
        "linked-list": "Linked List",
        "trees": "Trees",
        "graphs": "Graphs",
        "dynamic-programming": "Dynamic Programming"
    }
    return mapping.get(topic_id.lower(), topic_id.title())

@app.get("/profile/{username}")
async def get_public_profile(username: str, request: Request):
    from jose import jwt
    from auth import SECRET_KEY, ALGORITHM
    
    target_user = await db.users.find_one({"username": username})
    if not target_user:
        target_user = await db.users.find_one({"profile.display_name": username})
        if not target_user:
            raise HTTPException(status_code=404, detail="User profile not found in orbit.")
            
    profile = target_user.get("profile") or {
        "display_name": target_user.get("username"),
        "college_name": "",
        "bio": "",
        "github_url": "",
        "linkedin_url": "",
        "profile_pic": "",
        "interested_domains": [],
        "skills": []
    }
    
    progress = target_user.get("progress") or {
        "xp": 0,
        "level": 1,
        "solved_problems": [],
        "attempted_problems": [],
        "daily_streak": 0,
        "longest_streak": 0,
        "last_activity_date": "",
        "badges": [],
        "activity_log": [],
        "contribution_heatmap": {}
    }
    
    domains = profile.get("interested_domains", [])
    faction = "Singularity"
    if domains:
        primary_domain = domains[0].lower()
        if any(x in primary_domain for x in ["web", "front", "back", "app", "dev", "design", "full"]):
            faction = "Orbital"
        elif any(x in primary_domain for x in ["ai", "ml", "machine", "data", "science", "deep", "learn"]):
            faction = "Quark"
            
    solved_problems = progress.get("solved_problems", [])
    topic_counts = {}
    for prob_id in solved_problems:
        parts = prob_id.split('_')
        if len(parts) >= 3:
            topic_id = parts[1]
        else:
            if prob_id in ['two-sum', 'container-with-most-water']:
                topic_id = 'lists'
            elif prob_id == 'valid-parentheses':
                topic_id = 'stack'
            else:
                topic_id = 'basics'
        topic_title = get_topic_title(topic_id)
        topic_counts[topic_title] = topic_counts.get(topic_title, 0) + 1
        
    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
    strongest_topics = [t[0] for t in sorted_topics[:3]]
    
    followers = target_user.get("followers", [])
    following = target_user.get("following", [])
    
    is_following = False
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            viewer_email = payload.get("sub")
            if viewer_email:
                viewer = await db.users.find_one({"email": viewer_email})
                if viewer and viewer.get("username") in followers:
                    is_following = True
        except Exception:
            pass
            
    followers_resolved = await resolve_usernames(followers)
    following_resolved = await resolve_usernames(following)
            
    return {
        "username": target_user.get("username"),
        "profile": profile,
        "progress": progress,
        "faction": faction,
        "strongest_topics": strongest_topics,
        "followers_count": len(followers),
        "following_count": len(following),
        "followers": followers_resolved,
        "following": following_resolved,
        "is_following": is_following
    }

@app.post("/profile/{username}/follow")
async def follow_user(username: str, current_user: dict = Depends(get_current_user)):
    target_username = username
    follower_username = current_user.get("username")
    
    if target_username == follower_username:
        raise HTTPException(status_code=400, detail="Gravitational forces prevent you from following yourself.")
        
    target = await db.users.find_one({"username": target_username})
    if not target:
        raise HTTPException(status_code=404, detail="Target developer not found in orbit.")
        
    followers = target.get("followers", [])
    
    if follower_username in followers:
        await db.users.update_one({"username": target_username}, {"$pull": {"followers": follower_username}})
        await db.users.update_one({"username": follower_username}, {"$pull": {"following": target_username}})
        status_action = "unfollowed"
        new_count = len(followers) - 1
    else:
        await db.users.update_one({"username": target_username}, {"$addToSet": {"followers": follower_username}})
        await db.users.update_one({"username": follower_username}, {"$addToSet": {"following": target_username}})
        status_action = "followed"
        new_count = len(followers) + 1
        
        # Trigger follow notification in DB & WS
        from chat import manager, serialize_doc
        new_notif = {
            "recipient_username": target_username,
            "sender_username": follower_username,
            "type": "follower",
            "title": "New Follower",
            "text": f"@{follower_username} started following your orbital logic!",
            "link": { "view": "public-profile", "param": follower_username },
            "is_read": False,
            "created_at": datetime.utcnow()
        }
        res_notif = await db.notifications.insert_one(new_notif)
        new_notif["_id"] = res_notif.inserted_id
        await manager.send_to_user(target_username, {
            "type": "global_notification",
            **serialize_doc(new_notif)
        })
        
    return {
        "status": status_action,
        "followers_count": new_count
    }

# In-memory leaderboard cache to prevent database load
LEADERBOARD_CACHE = {
    "data": None,
    "last_updated": None
}
CACHE_TTL_SECONDS = 30

@app.get("/leaderboard")
async def get_leaderboard():
    global LEADERBOARD_CACHE
    from datetime import datetime
    
    now = datetime.utcnow()
    
    # Check if cache is still fresh
    if LEADERBOARD_CACHE["data"] is not None and LEADERBOARD_CACHE["last_updated"] is not None:
        elapsed = (now - LEADERBOARD_CACHE["last_updated"]).total_seconds()
        if elapsed < CACHE_TTL_SECONDS:
            return LEADERBOARD_CACHE["data"]

    # If cache is stale or empty, retrieve top 200 records using the indexed cursor
    cursor = db.users.find({}, {
        "username": 1,
        "profile.display_name": 1,
        "profile.profile_pic": 1,
        "profile.interested_domains": 1,
        "profile.skills": 1,
        "progress.xp": 1,
        "progress.level": 1,
        "progress.solved_problems": 1,
        "progress.badges": 1
    }).sort("progress.xp", -1).limit(200)
    
    leaderboard = []
    rank = 1
    async for user in cursor:
        profile = user.get("profile") or {}
        progress = user.get("progress") or {}
        
        solved_count = len(progress.get("solved_problems", []))
        badges = progress.get("badges", [])
        
        active_badge = "Apprentice"
        if badges:
            active_badge = badges[-1].replace("_", " ").title()
        elif solved_count >= 5:
            active_badge = "Alchemist"
        elif solved_count >= 1:
            active_badge = "Achiever"
            
        domains = profile.get("interested_domains", [])
        faction = "Singularity"
        if domains:
            primary_domain = domains[0].lower()
            if any(x in primary_domain for x in ["web", "front", "back", "app", "dev", "design", "full"]):
                faction = "Orbital"
            elif any(x in primary_domain for x in ["ai", "ml", "machine", "data", "science", "deep", "learn"]):
                faction = "Quark"
            else:
                faction = "Singularity"
        
        leaderboard.append({
            "rank": rank,
            "username": user.get("username"),
            "display_name": profile.get("display_name") or user.get("username"),
            "profile_pic": profile.get("profile_pic") or "",
            "xp": progress.get("xp", 0),
            "level": progress.get("level", 1),
            "solved": solved_count,
            "badge": active_badge,
            "faction": faction
        })
        rank += 1
        
    # Update cache
    LEADERBOARD_CACHE["data"] = leaderboard
    LEADERBOARD_CACHE["last_updated"] = now
    
    return leaderboard

from datetime import datetime


@app.post("/submissions", status_code=201)
async def create_submission(submission: SubmissionCreate, current_user: dict = Depends(get_current_user)):
    submission_dict = submission.dict()
    submission_dict["username"] = current_user["username"]
    submission_dict["email"] = current_user["email"]
    submission_dict["submitted_at"] = datetime.utcnow()
    
    result = await db.submissions.insert_one(submission_dict)
    submission_dict["id"] = str(result.inserted_id)
    
    # Gamification Progress Updates
    progress = current_user.get("progress") or {
        "xp": 0,
        "level": 1,
        "solved_problems": [],
        "attempted_problems": [],
        "daily_streak": 0,
        "longest_streak": 0,
        "last_activity_date": "",
        "badges": [],
        "activity_log": [],
        "contribution_heatmap": {}
    }
    
    prob_id = submission.problem_id
    verdict = submission.verdict
    
    if prob_id not in progress.get("attempted_problems", []):
        progress["attempted_problems"].append(prob_id)
        
    if verdict.lower() == "accepted":
        if prob_id not in progress.get("solved_problems", []):
            progress["solved_problems"].append(prob_id)
            
            # XP Weight: Easy = 15, Medium = 20, Hard = 25
            xp_to_award = 15
            if "medium" in prob_id.lower() or "water" in prob_id.lower():
                xp_to_award = 20
            elif "hard" in prob_id.lower():
                xp_to_award = 25
                
            progress["xp"] = progress.get("xp", 0) + xp_to_award
            
            # Level check: every 500 XP is a level
            new_level = (progress["xp"] // 500) + 1
            if new_level > progress.get("level", 1):
                progress["level"] = new_level
                progress["activity_log"].append({
                    "type": "level_up",
                    "description": f"Reached Level {new_level}!",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Trigger Level Up Notification in DB & WS
                from chat import manager, serialize_doc
                new_notif = {
                    "recipient_username": current_user["username"],
                    "sender_username": "System",
                    "type": "badge",
                    "title": "Level Up!",
                    "text": f"Congratulations! You reached Level {new_level}!",
                    "link": { "view": "profile", "param": "" },
                    "is_read": False,
                    "created_at": datetime.utcnow()
                }
                res_notif = await db.notifications.insert_one(new_notif)
                new_notif["_id"] = res_notif.inserted_id
                await manager.send_to_user(current_user["username"], {
                    "type": "global_notification",
                    **serialize_doc(new_notif)
                })
            
            progress["activity_log"].append({
                "type": "solved",
                "description": f"Solved {submission.problem_title} (+{xp_to_award} XP)",
                "timestamp": datetime.utcnow().isoformat()
            })
            
    # Heatmap increment
    today_str = datetime.utcnow().date().isoformat()
    heatmap = progress.get("contribution_heatmap") or {}
    heatmap[today_str] = heatmap.get(today_str, 0) + 1
    progress["contribution_heatmap"] = heatmap
    
    # Streaks calculation
    last_active = progress.get("last_activity_date") or ""
    if last_active:
        try:
            last_date = datetime.strptime(last_active, "%Y-%m-%d").date()
            today_date = datetime.utcnow().date()
            delta = (today_date - last_date).days
            
            if delta == 1:
                progress["daily_streak"] = progress.get("daily_streak", 0) + 1
                if progress["daily_streak"] > progress.get("longest_streak", 0):
                    progress["longest_streak"] = progress["daily_streak"]
            elif delta > 1:
                progress["daily_streak"] = 1
        except Exception:
            progress["daily_streak"] = 1
    else:
        progress["daily_streak"] = 1
        progress["longest_streak"] = 1
        
    progress["last_activity_date"] = today_str
    
    # Achievements Badges awarding logic
    badges = progress.get("badges") or []
    activity_log = progress.get("activity_log") or []
    newly_unlocked_badges = []
    
    if len(progress["solved_problems"]) >= 1 and "first_success" not in badges:
        badges.append("first_success")
        newly_unlocked_badges.append("First Success")
        activity_log.append({
            "type": "badge",
            "description": "Unlocked Badge: First Success!",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    try:
        runtime_str = submission.runtime.replace("ms", "").strip()
        runtime_val = float(runtime_str)
        if verdict.lower() == "accepted" and runtime_val < 100.0 and "speed_demon" not in badges:
            badges.append("speed_demon")
            newly_unlocked_badges.append("Speed Demon")
            activity_log.append({
                "type": "badge",
                "description": "Unlocked Badge: Speed Demon (<100ms)!",
                "timestamp": datetime.utcnow().isoformat()
            })
    except Exception:
        pass
        
    if progress["daily_streak"] >= 3 and "streak_master" not in badges:
        badges.append("streak_master")
        newly_unlocked_badges.append("Streak Master")
        activity_log.append({
            "type": "badge",
            "description": "Unlocked Badge: Streak Master (3 days consecutive)!",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    if len(progress["solved_problems"]) >= 5 and "algorithm_alchemist" not in badges:
        badges.append("algorithm_alchemist")
        newly_unlocked_badges.append("Algorithm Alchemist")
        activity_log.append({
            "type": "badge",
            "description": "Unlocked Badge: Algorithm Alchemist (Solved 5 unique problems)!",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    progress["badges"] = badges
    progress["activity_log"] = activity_log
    
    # Trigger notifications for newly unlocked badges
    from chat import manager, serialize_doc
    for badge_name in newly_unlocked_badges:
        new_notif = {
            "recipient_username": current_user["username"],
            "sender_username": "System",
            "type": "badge",
            "title": "Badge Unlocked!",
            "text": f"You unlocked the badge: {badge_name}! Outstanding!",
            "link": { "view": "profile", "param": "" },
            "is_read": False,
            "created_at": datetime.utcnow()
        }
        res_notif = await db.notifications.insert_one(new_notif)
        new_notif["_id"] = res_notif.inserted_id
        await manager.send_to_user(current_user["username"], {
            "type": "global_notification",
            **serialize_doc(new_notif)
        })
    
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": {"progress": progress}}
    )
    
    return submission_dict

@app.get("/submissions")
async def get_submissions(current_user: dict = Depends(get_current_user)):
    cursor = db.submissions.find({"email": current_user["email"]}).sort("submitted_at", -1)
    submissions = []
    async for doc in cursor:
        submissions.append({
            "id": str(doc["_id"]),
            "problem_id": doc["problem_id"],
            "problem_title": doc["problem_title"],
            "language": doc["language"],
            "verdict": doc["verdict"],
            "runtime": doc["runtime"],
            "memory": doc["memory"],
            "source_code": doc["source_code"],
            "submitted_at": doc["submitted_at"],
            "username": doc["username"]
        })
    return submissions

@app.post("/run-code")
async def run_code(request: RunCodeRequest):
    """
    Asynchronously accept a code block, submit to Judge0, poll execution 
    queues, and return final output metrics.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Cannot compile empty source code.")
    
    try:
        # Run code execution pipeline
        result = judge_client.run_pipeline(
            code=request.code,
            language=request.language,
            stdin=request.stdin,
            problem_id=request.problem_id
        )
        return result
    except ValueError as val_err:
        # Unsupported language
        return {
            "error": True,
            "message": str(val_err),
            "time": "0.0ms",
            "memory": "0 KB"
        }
    except Exception as e:
        # Sandbox timeouts or network glitches
        return {
            "error": True,
            "message": f"Sandbox Exception: {str(e)}",
            "time": "0.0ms",
            "memory": "0 KB"
        }

@app.post("/submit-code")
async def submit_code(request: SubmitCodeRequest):
    """
    Asynchronously accept code and a list of test cases, execute them via Judge0,
    and return strict expected vs actual evaluation metrics.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Cannot compile empty source code.")
    
    testcase_results = []
    overall_verdict = "Accepted"
    total_time = 0.0
    max_memory = 0
    
    try:
        for tc in request.testcases:
            # Run code execution pipeline for this testcase
            result = judge_client.run_pipeline(
                code=request.code,
                language=request.language,
                stdin=tc.input,
                problem_id=request.problem_id
            )
            
            if result.get("error"):
                # If there's a compile error, runtime error, etc., short-circuit or log it.
                # Usually we want to capture it as the verdict.
                testcase_results.append({
                    "id": tc.id,
                    "input": tc.input,
                    "expected": tc.expected,
                    "got": result.get("message", ""),
                    "passed": False,
                    "time": result.get("time", "0.0ms"),
                    "memory": result.get("memory", "0 KB")
                })
                overall_verdict = result.get("status_description", "Error")
                # Add time and memory for partial runs
                t_str = result.get("time", "0").replace("ms", "")
                m_str = result.get("memory", "0").replace(" KB", "")
                try:
                    total_time += float(t_str)
                    max_memory = max(max_memory, int(m_str))
                except:
                    pass
                break # Short circuit on Compile Error / Runtime Error
                
            # If no error, compare output strictly
            actual_out = (result.get("stdout") or "").strip()
            expected_out = (tc.expected or "").strip()
            
            # Additional safety: handle \r\n vs \n
            actual_clean = actual_out.replace('\\r\\n', '\\n')
            expected_clean = expected_out.replace('\\r\\n', '\\n')
            
            passed = (actual_clean == expected_clean)
            
            testcase_results.append({
                "id": tc.id,
                "input": tc.input,
                "expected": tc.expected,
                "got": actual_out,
                "passed": passed,
                "time": result.get("time", "0.0ms"),
                "memory": result.get("memory", "0 KB")
            })
            
            if not passed and overall_verdict == "Accepted":
                overall_verdict = "Wrong Answer"
                break # Short circuit on first WA
                
            # Accumulate metrics
            t_str = result.get("time", "0").replace("ms", "")
            m_str = result.get("memory", "0").replace(" KB", "")
            try:
                total_time += float(t_str)
                max_memory = max(max_memory, int(m_str))
            except:
                pass
                
        return {
            "verdict": overall_verdict,
            "error": overall_verdict != "Accepted",
            "time": f"{total_time:.1f}ms",
            "memory": f"{max_memory} KB",
            "testcaseResults": testcase_results
        }
        
    except Exception as e:
        return {
            "verdict": "Internal Error",
            "error": True,
            "message": f"Sandbox Exception: {str(e)}",
            "time": "0.0ms",
            "memory": "0 KB"
        }

def check_code_dump_and_spam(content: str):
    clean_text = content.strip()
    
    # 1. Detect code blocks
    code_blocks = re.findall(r'```[\s\S]*?```|`[\s\S]*?`', clean_text)
    total_code_len = sum(len(block) for block in code_blocks)
    
    if len(clean_text) > 0 and (total_code_len / len(clean_text)) > 0.45:
        raise HTTPException(
            status_code=400, 
            detail="Strict Policy: Please do not dump raw full code solutions. Focus on explaining your core logic, approach, and pseudo-code."
        )
    
    # 2. Check for long continuous unformatted code-like syntax (heuristics)
    code_keywords = [
        r'\bdef\b.*\(.*\):', 
        r'\bpublic\s+static\s+void\b', 
        r'\bclass\b.*\bextends\b', 
        r'#include\s+<.*>', 
        r'\bint\s+main\s*\(.*\)', 
        r'const\s+\w+\s*=\s*\(.*\)\s*=>'
    ]
    for pattern in code_keywords:
        if re.search(pattern, clean_text):
            text_without_code = re.sub(r'```[\s\S]*?```|`[\s\S]*?`', '', clean_text)
            if len(text_without_code.strip()) < 150:
                raise HTTPException(
                    status_code=400,
                    detail="Anti-Code Dumping Alert: Expose your logic first! Please expand your theoretical explanation to help others learn."
                )

@app.post("/problems/{problem_id}/discussions", status_code=201)
async def create_discussion(problem_id: str, discussion: DiscussionCreate, current_user: dict = Depends(get_current_user)):
    check_code_dump_and_spam(discussion.content)
    
    user_profile = current_user.get("profile") or {}
    user_progress = current_user.get("progress") or {}
    
    doc = {
        "problem_id": problem_id,
        "author": current_user["username"],
        "author_email": current_user["email"],
        "author_level": user_progress.get("level", 1),
        "author_xp": user_progress.get("xp", 0),
        "author_pic": user_profile.get("profile_pic", ""),
        "title": discussion.title,
        "content": discussion.content,
        "category": discussion.category,
        "created_at": datetime.utcnow(),
        "upvotes": [],
        "is_pinned": False,
        "is_resolved": False,
        "helpful_comment_id": None,
        "is_spam": False
    }
    
    result = await db.discussions.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.get("/problems/{problem_id}/discussions")
async def get_discussions(problem_id: str, current_user: dict = Depends(get_current_user)):
    cursor = db.discussions.find({"problem_id": problem_id, "is_spam": False}).sort([("is_pinned", -1), ("created_at", -1)])
    discussions = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        doc["upvote_count"] = len(doc.get("upvotes", []))
        doc["has_upvoted"] = current_user["email"] in doc.get("upvotes", [])
        discussions.append(doc)
    return discussions

@app.get("/discussions/{discussion_id}/thread")
async def get_discussion_thread(discussion_id: str, current_user: dict = Depends(get_current_user)):
    discussion_doc = await db.discussions.find_one({"_id": ObjectId(discussion_id)})
    if not discussion_doc:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
        
    discussion_doc["id"] = str(discussion_doc["_id"])
    del discussion_doc["_id"]
    discussion_doc["upvote_count"] = len(discussion_doc.get("upvotes", []))
    discussion_doc["has_upvoted"] = current_user["email"] in discussion_doc.get("upvotes", [])
    
    comments_cursor = db.comments.find({"discussion_id": discussion_id, "is_spam": False}).sort("created_at", 1)
    comments = []
    async for comment in comments_cursor:
        comment["id"] = str(comment["_id"])
        del comment["_id"]
        comment["upvote_count"] = len(comment.get("upvotes", []))
        comment["has_upvoted"] = current_user["email"] in comment.get("upvotes", [])
        
        replies_cursor = db.replies.find({"comment_id": comment["id"], "is_spam": False}).sort("created_at", 1)
        replies = []
        async for reply in replies_cursor:
            reply["id"] = str(reply["_id"])
            del reply["_id"]
            replies.append(reply)
            
        comment["replies"] = replies
        comments.append(comment)
        
    return {
        "discussion": discussion_doc,
        "comments": comments
    }

@app.post("/discussions/{discussion_id}/upvote")
async def upvote_discussion(discussion_id: str, current_user: dict = Depends(get_current_user)):
    discussion = await db.discussions.find_one({"_id": ObjectId(discussion_id)})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
        
    upvotes = discussion.get("upvotes", [])
    email = current_user["email"]
    
    if email in upvotes:
        upvotes.remove(email)
    else:
        upvotes.append(email)
        
    await db.discussions.update_one(
        {"_id": ObjectId(discussion_id)},
        {"$set": {"upvotes": upvotes}}
    )
    return {"status": "success", "has_upvoted": email in upvotes, "upvote_count": len(upvotes)}

@app.post("/discussions/{discussion_id}/resolve")
async def resolve_discussion(discussion_id: str, current_user: dict = Depends(get_current_user)):
    discussion = await db.discussions.find_one({"_id": ObjectId(discussion_id)})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
        
    is_author = discussion.get("author_email") == current_user["email"]
    is_admin = current_user.get("role") == "admin" or current_user["email"] == "kunibillisairam@gmail.com"
    
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="Unauthorized to resolve this thread")
        
    new_resolved = not discussion.get("is_resolved", False)
    await db.discussions.update_one(
        {"_id": ObjectId(discussion_id)},
        {"$set": {"is_resolved": new_resolved}}
    )
    return {"status": "success", "is_resolved": new_resolved}

@app.post("/discussions/{discussion_id}/comments", status_code=201)
async def create_comment(discussion_id: str, comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    check_code_dump_and_spam(comment.content)
    
    discussion = await db.discussions.find_one({"_id": ObjectId(discussion_id)})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
        
    user_profile = current_user.get("profile") or {}
    user_progress = current_user.get("progress") or {}
    
    doc = {
        "discussion_id": discussion_id,
        "author": current_user["username"],
        "author_email": current_user["email"],
        "author_level": user_progress.get("level", 1),
        "author_xp": user_progress.get("xp", 0),
        "author_pic": user_profile.get("profile_pic", ""),
        "content": comment.content,
        "created_at": datetime.utcnow(),
        "upvotes": [],
        "is_helpful": False,
        "is_spam": False
    }
    
    result = await db.comments.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.post("/comments/{comment_id}/upvote")
async def upvote_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    upvotes = comment.get("upvotes", [])
    email = current_user["email"]
    
    if email in upvotes:
        upvotes.remove(email)
    else:
        upvotes.append(email)
        
    await db.comments.update_one(
        {"_id": ObjectId(comment_id)},
        {"$set": {"upvotes": upvotes}}
    )
    return {"status": "success", "has_upvoted": email in upvotes, "upvote_count": len(upvotes)}

@app.post("/comments/{comment_id}/helpful")
async def mark_comment_helpful(comment_id: str, current_user: dict = Depends(get_current_user)):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    discussion = await db.discussions.find_one({"_id": ObjectId(comment["discussion_id"])})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
        
    is_author = discussion.get("author_email") == current_user["email"]
    is_admin = current_user.get("role") == "admin" or current_user["email"] == "kunibillisairam@gmail.com"
    
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="Unauthorized to mark helpful answers for this discussion")
        
    new_helpful = not comment.get("is_helpful", False)
    
    await db.comments.update_one(
        {"_id": ObjectId(comment_id)},
        {"$set": {"is_helpful": new_helpful}}
    )
    
    await db.discussions.update_one(
        {"_id": ObjectId(comment["discussion_id"])},
        {"$set": {"helpful_comment_id": comment_id if new_helpful else None}}
    )
    
    if new_helpful:
        helper_user = await db.users.find_one({"email": comment["author_email"]})
        if helper_user:
            progress = helper_user.get("progress") or {
                "xp": 0, "level": 1, "solved_problems": [], "attempted_problems": [],
                "daily_streak": 0, "longest_streak": 0, "last_activity_date": "",
                "badges": [], "activity_log": [], "contribution_heatmap": {}
            }
            progress["xp"] = progress.get("xp", 0) + 50
            
            new_level = (progress["xp"] // 500) + 1
            if new_level > progress.get("level", 1):
                progress["level"] = new_level
                progress["activity_log"].append({
                    "type": "level_up",
                    "description": f"Reached Level {new_level}!",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
            progress["activity_log"].append({
                "type": "helpful_answer",
                "description": f"Comment marked helpful on '{discussion['title']}' (+50 XP)",
                "timestamp": datetime.utcnow().isoformat()
            })
            
            await db.users.update_one(
                {"email": comment["author_email"]},
                {"$set": {"progress": progress}}
            )
            
    return {"status": "success", "is_helpful": new_helpful}

@app.post("/comments/{comment_id}/replies", status_code=201)
async def create_reply(comment_id: str, reply: ReplyCreate, current_user: dict = Depends(get_current_user)):
    check_code_dump_and_spam(reply.content)
    
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    user_profile = current_user.get("profile") or {}
    user_progress = current_user.get("progress") or {}
    
    doc = {
        "comment_id": comment_id,
        "author": current_user["username"],
        "author_email": current_user["email"],
        "author_level": user_progress.get("level", 1),
        "author_xp": user_progress.get("xp", 0),
        "author_pic": user_profile.get("profile_pic", ""),
        "content": reply.content,
        "created_at": datetime.utcnow(),
        "is_spam": False
    }
    
    result = await db.replies.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.delete("/discussions/{discussion_id}")
async def delete_discussion(discussion_id: str, current_user: dict = Depends(get_current_user)):
    discussion = await db.discussions.find_one({"_id": ObjectId(discussion_id)})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
        
    is_author = discussion.get("author_email") == current_user["email"]
    is_admin = current_user.get("role") == "admin" or current_user["email"] == "kunibillisairam@gmail.com"
    
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="Unauthorized moderation delete")
        
    await db.discussions.delete_one({"_id": ObjectId(discussion_id)})
    await db.comments.delete_many({"discussion_id": discussion_id})
    return {"status": "success", "detail": "Discussion thread successfully deleted"}

@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    is_author = comment.get("author_email") == current_user["email"]
    is_admin = current_user.get("role") == "admin" or current_user["email"] == "kunibillisairam@gmail.com"
    
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="Unauthorized moderation delete")
        
    await db.comments.delete_one({"_id": ObjectId(comment_id)})
    await db.replies.delete_many({"comment_id": comment_id})
    return {"status": "success", "detail": "Comment successfully deleted"}

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    print(f"Starting CodeGravity FastAPI Compiler Server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
