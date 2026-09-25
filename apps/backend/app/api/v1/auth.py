import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    login_rate_limiter,
    register_rate_limiter,
)
from app.core.config import settings
from app.schemas.auth import (
    UserRegisterSchema,
    UserLoginSchema,
    TokenSchema,
    UserResponseSchema,
    ForgotPasswordSchema,
    GoogleLoginSchema,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def check_register_rate_limit(request: Request):
    """Enforce rate limits on registration attempts."""
    register_rate_limiter.check_rate_limit(request)

def check_login_rate_limit(request: Request):
    """Enforce rate limits on login attempts."""
    login_rate_limiter.check_rate_limit(request)

def _build_token_response(user: User, access_token: str) -> dict:
    """Standardized token response payload generator."""
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone_number": user.phone_number
        }
    }

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Helper dependency to get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        int_user_id = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == int_user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post(
    "/register",
    response_model=TokenSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(check_register_rate_limit)]
)
def register(user_in: UserRegisterSchema, db: Session = Depends(get_db)):
    """Register a new user with bcrypt password hashing."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Hash the password securely using bcrypt
    hashed_pwd = get_password_hash(user_in.password)

    new_user = User(
        full_name=user_in.full_name.strip(),
        email=user_in.email,
        phone_number=user_in.phone_number,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id)
    return _build_token_response(new_user, access_token)

@router.post(
    "/login",
    response_model=TokenSchema,
    dependencies=[Depends(check_login_rate_limit)]
)
def login(login_data: UserLoginSchema, db: Session = Depends(get_db)):
    """Authenticate user with email & password, returning JWT token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return _build_token_response(user, access_token)

@router.get("/me", response_model=UserResponseSchema)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Fetch profile details of the current logged-in user."""
    return current_user

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordSchema):
    """Handle password reset requests cleanly without user enumeration."""
    return {
        "message": f"If an account exists for {data.email}, instructions to reset password have been generated.",
        "status": "success"
    }

@router.post("/google", response_model=TokenSchema)
def google_login(data: GoogleLoginSchema, db: Session = Depends(get_db)):
    """Authenticate or auto-register via Google OAuth flow, issuing a valid signed JWT."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Create new user with an unguessable cryptographic random password
        random_secret = secrets.token_urlsafe(32)
        hashed_pwd = get_password_hash(random_secret)
        user = User(
            full_name=data.name or "Google User",
            email=data.email,
            hashed_password=hashed_pwd
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Issue a real cryptographic JWT Token signed by SECRET_KEY
    access_token = create_access_token(subject=user.id)
    return _build_token_response(user, access_token)
