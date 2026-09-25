import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Ensure sqlite database parent directory exists if using SQLite
if "sqlite" in settings.DATABASE_URL:
    db_file_path = settings.DATABASE_URL.replace("sqlite:///", "")
    os.makedirs(os.path.dirname(os.path.abspath(db_file_path)), exist_ok=True)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    """Create tables and ensure all new schema columns exist in SQLite."""
    Base.metadata.create_all(bind=engine)
    
    if "sqlite" in settings.DATABASE_URL:
        with engine.connect() as conn:
            # chat_messages migrations
            res = conn.exec_driver_sql("PRAGMA table_info(chat_messages)").fetchall()
            cols = [r[1] for r in res]
            if "thread_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE chat_messages ADD COLUMN thread_id VARCHAR")
                conn.commit()

            # documents migrations
            res_doc = conn.exec_driver_sql("PRAGMA table_info(documents)").fetchall()
            cols_doc = [r[1] for r in res_doc]
            if "status" not in cols_doc:
                conn.exec_driver_sql("ALTER TABLE documents ADD COLUMN status VARCHAR DEFAULT 'ready'")
                conn.commit()
            if "summary" not in cols_doc:
                conn.exec_driver_sql("ALTER TABLE documents ADD COLUMN summary TEXT")
                conn.commit()
            if "error_message" not in cols_doc:
                conn.exec_driver_sql("ALTER TABLE documents ADD COLUMN error_message VARCHAR")
                conn.commit()

def get_db():
    """Dependency for obtaining database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
