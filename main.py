from fastapi import FastAPI
from contextlib import contextmanager, asynccontextmanager
from app.db.main import init_db
from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.tweet import router as tweet_router
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app : FastAPI) :
    print("creating tables...")
    await init_db()
    print("tables created")
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(auth_router , prefix="/auth" , tags=["auth"])
app.include_router(profile_router, prefix="/profile", tags=["Profile"])
app.include_router(tweet_router, tags=["Tweets"])
app.mount("/",StaticFiles(directory= "static" , html = True) , name = "static")

