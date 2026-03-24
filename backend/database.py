import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# We grab the connection string from the environment (.env locally, env vars in Docker)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
	raise RuntimeError("DATABASE_URL is not set. Define it in your environment or .env file.")

# Create the engine that drives the connection
engine = create_engine(DATABASE_URL)

# Create a session factory for our API routes to use later
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# The base class that all our database models will inherit from
Base = declarative_base()