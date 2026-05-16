from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .models import TaskStatus


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserRead(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginForm(BaseModel):
    email: EmailStr
    password: str


# ── Tasks ─────────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    team_id: Optional[int] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskRead(BaseModel):
    id: int
    title: str
    description: str
    status: TaskStatus
    owner_id: int
    team_id: Optional[int]
    assigned_to: Optional[int]
    due_date: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Teams ─────────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str

class TeamInvite(BaseModel):
    email: EmailStr

class MemberRead(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}

class TeamRead(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    members: List[MemberRead] = []

    model_config = {"from_attributes": True}
