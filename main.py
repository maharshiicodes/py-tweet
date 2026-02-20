from fastapi import FastAPI
from contextlib import contextmanager, asynccontextmanager
from app.db.main import init_db
from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.tweet import router as tweet_router
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware




@asynccontextmanager
async def lifespan(app : FastAPI) :
    print("creating tables...")
    await init_db()
    print("tables created")
    yield
    print("Server is closing");


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (good for testing)
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, DELETE, etc.
    allow_headers=["*"],  # Allows all headers
)


app.include_router(auth_router , prefix="/auth" , tags=["auth"])
app.include_router(profile_router, prefix="/profile", tags=["Profile"])
app.include_router(tweet_router, tags=["Tweets"])
app.mount("/",StaticFiles(directory= "static" , html = True) , name = "static")

