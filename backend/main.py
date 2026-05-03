from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import attendance, admin, auth

app = FastAPI(title="GeoVerify API", description="API for GeoVerify Attendance System")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"message": "Welcome to GeoVerify API"}
