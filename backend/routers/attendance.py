from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime, time
import uuid
from typing import Optional

from database import supabase
from utils.dependencies import get_current_user
from utils.geolocation import haversine

router = APIRouter(prefix="/attendance", tags=["attendance"])

def parse_time_string(value: Optional[str], fallback: time) -> time:
    if not value:
        return fallback

    try:
        return datetime.strptime(value, "%H:%M:%S").time()
    except ValueError:
        try:
            return datetime.strptime(value, "%H:%M").time()
        except ValueError:
            return fallback

@router.post("/mark")
async def mark_attendance(
    latitude: float = Form(...),
    longitude: float = Form(...),
    photo: UploadFile = File(...),
    user=Depends(get_current_user)
):
    today = datetime.now().date().isoformat()
    now_time = datetime.now().time()
    
    # 1. Check if already marked today
    existing = supabase.table("attendance").select("*").eq("employee_id", user.id).eq("date", today).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Attendance already marked for today")

    company_settings = supabase.table("company_settings").select("check_in_open, late_after").limit(1).execute()
    settings_row = company_settings.data[0] if company_settings.data else {}

    # 2. Check configured work hours
    start_time = parse_time_string(settings_row.get("check_in_open"), time(8, 0))
    end_time = parse_time_string(settings_row.get("late_after"), time(10, 0))
    status = "Present"
    if now_time > end_time:
        status = "Late"
    elif now_time < start_time:
        raise HTTPException(status_code=400, detail="Too early to check in")

    # 3. Check location
    office_settings = supabase.table("office_settings").select("*").limit(1).execute()
    if not office_settings.data:
        raise HTTPException(status_code=500, detail="Office location not configured")
        
    office = office_settings.data[0]
    distance = haversine(latitude, longitude, office["latitude"], office["longitude"])
    
    if distance > office["allowed_radius"]:
        raise HTTPException(status_code=400, detail=f"Outside allowed radius. You are {distance:.2f} meters away.")

    # 4. Upload photo
    file_ext = photo.filename.split(".")[-1]
    file_name = f"{user.id}/{uuid.uuid4()}.{file_ext}"
    file_content = await photo.read()
    
    res = supabase.storage.from_("attendance_photos").upload(file_name, file_content, {"content-type": photo.content_type})
    photo_url = supabase.storage.from_("attendance_photos").get_public_url(file_name)

    # 5. Save attendance record
    record = {
        "employee_id": user.id,
        "date": today,
        "photo_url": photo_url,
        "latitude": latitude,
        "longitude": longitude,
        "status": status,
    }
    supabase.table("attendance").insert(record).execute()
    
    return {"message": "Attendance marked successfully", "status": status}

@router.get("/month/{employee_id}")
async def get_monthly_attendance(employee_id: str, month: int, year: int, user=Depends(get_current_user)):
    # Basic access check: either admin or self
    if user.id != employee_id:
        role_check = supabase.table("employees").select("role").eq("id", user.id).execute()
        if not role_check.data or role_check.data[0].get("role") != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized access")

    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-31" # Simple bounds, PG handles date filtering
    
    records = supabase.table("attendance") \
        .select("*") \
        .eq("employee_id", employee_id) \
        .gte("date", start_date) \
        .lte("date", end_date) \
        .execute()
        
    return records.data

@router.get("/percentage/{employee_id}")
async def get_attendance_percentage(employee_id: str, user=Depends(get_current_user)):
    # Calculate simplistic percentage for current month
    today = datetime.now()
    month = today.month
    year = today.year
    start_date = f"{year}-{month:02d}-01"
    
    records = supabase.table("attendance") \
        .select("status") \
        .eq("employee_id", employee_id) \
        .gte("date", start_date) \
        .execute()
        
    present_days = sum(1 for r in records.data if r['status'] in ['Present', 'Late'])
    working_days = today.day # simplify logic by considering days passed this month
    
    if working_days == 0:
        percentage = 0
    else:
        percentage = (present_days / working_days) * 100
        
    return {
        "present_days": present_days,
        "working_days": working_days,
        "percentage": round(percentage, 2)
    }
