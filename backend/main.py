import os
from fastapi import FastAPI, HTTPException
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
            }
        }
        await db.users.insert_one(new_user)
        username = name
    else:
        username = db_user["username"]
        
    access_token = create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer", "username": username}

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
    
    return {
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "profile": profile,
        "progress": progress
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
            
            # XP Weight: Easy = 100, Medium = 200, Hard = 300
            xp_to_award = 100
            if "medium" in prob_id.lower() or "water" in prob_id.lower():
                xp_to_award = 200
            elif "hard" in prob_id.lower():
                xp_to_award = 300
                
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
    
    if len(progress["solved_problems"]) >= 1 and "first_success" not in badges:
        badges.append("first_success")
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
            activity_log.append({
                "type": "badge",
                "description": "Unlocked Badge: Speed Demon (<100ms)!",
                "timestamp": datetime.utcnow().isoformat()
            })
    except Exception:
        pass
        
    if progress["daily_streak"] >= 3 and "streak_master" not in badges:
        badges.append("streak_master")
        activity_log.append({
            "type": "badge",
            "description": "Unlocked Badge: Streak Master (3 days consecutive)!",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    if len(progress["solved_problems"]) >= 5 and "algorithm_alchemist" not in badges:
        badges.append("algorithm_alchemist")
        activity_log.append({
            "type": "badge",
            "description": "Unlocked Badge: Algorithm Alchemist (Solved 5 unique problems)!",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    progress["badges"] = badges
    progress["activity_log"] = activity_log
    
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

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    print(f"Starting CodeGravity FastAPI Compiler Server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
