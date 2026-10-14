import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from main import app

# Create in-memory SQLite database for test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Seed users
    admin = User(id=1, name="Admin", email="admin@test.com", password_hash=hash_password("admin123"), role=UserRole.ADMIN, is_active=True)
    manager1 = User(id=2, name="Manager One", email="mgr1@test.com", password_hash=hash_password("mgr123"), role=UserRole.MANAGER, is_active=True)
    manager2 = User(id=3, name="Manager Two", email="mgr2@test.com", password_hash=hash_password("mgr123"), role=UserRole.MANAGER, is_active=True)
    member1 = User(id=4, name="Member One", email="mem1@test.com", password_hash=hash_password("mem123"), role=UserRole.MEMBER, is_active=True)
    member2 = User(id=5, name="Member Two", email="mem2@test.com", password_hash=hash_password("mem123"), role=UserRole.MEMBER, is_active=True)
    db.add_all([admin, manager1, manager2, member1, member2])
    db.commit()

    # Seed teams
    team1 = Team(id=1, name="Team Alpha", description="Alpha Team", manager_id=2)
    team2 = Team(id=2, name="Team Beta", description="Beta Team", manager_id=3)
    db.add_all([team1, team2])
    db.commit()

    # Seed team memberships
    tm1 = TeamMember(team_id=1, user_id=4)  # Member 1 is in Team 1
    tm2 = TeamMember(team_id=2, user_id=5)  # Member 2 is in Team 2
    db.add_all([tm1, tm2])
    db.commit()
    db.close()


@pytest.fixture
def client():
    return TestClient(app)


def login(client, email, password):
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp
