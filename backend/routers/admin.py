from fastapi import APIRouter, Depends, HTTPException
from database import supabase
from utils.dependencies import require_admin
from models.schemas import EmployeeUpdate, LocationUpdate, HolidayCreate
from utils.supabase_admin import delete_auth_user, update_auth_user

router = APIRouter(prefix="/admin", tags=["admin"])

def ensure_admin_guardrails(employee_id: str, next_role: str | None = None, deleting: bool = False):
    admins = supabase.table("employees").select("id, role").eq("role", "admin").execute()
    admin_rows = admins.data or []

    is_target_admin = any(admin["id"] == employee_id for admin in admin_rows)
    removing_admin_access = deleting or (is_target_admin and next_role != "admin")

    if is_target_admin and removing_admin_access and len(admin_rows) <= 1:
        raise HTTPException(status_code=400, detail="At least one admin account must remain.")

@router.get("/attendance")
async def get_all_attendance(date: str = None, user=Depends(require_admin)):
    query = supabase.table("attendance").select("*, employees(name, email)")
    if date:
        query = query.eq("date", date)
    records = query.execute()
    return records.data

@router.patch("/employees/{employee_id}")
async def update_employee(employee_id: str, employee: EmployeeUpdate, user=Depends(require_admin)):
    current = supabase.table("employees").select("*").eq("id", employee_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Employee not found")

    if user.id == employee_id and employee.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own admin access.")

    ensure_admin_guardrails(employee_id, next_role=employee.role)

    try:
        update_auth_user(
            employee_id,
            email=employee.email,
            password=employee.password,
            name=employee.name,
        )

        supabase.table("employees").update(
            {
                "name": employee.name,
                "email": employee.email,
                "role": employee.role,
                "department": employee.department,
                "job_title": employee.job_title,
                "phone": employee.phone,
                "status": employee.status,
            }
        ).eq("id", employee_id).execute()

        return {"message": "Employee updated successfully"}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.delete("/employees/{employee_id}")
async def remove_employee(employee_id: str, user=Depends(require_admin)):
    current = supabase.table("employees").select("id, role").eq("id", employee_id).limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Employee not found")

    if user.id == employee_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account while signed in.")

    ensure_admin_guardrails(employee_id, deleting=True)

    try:
        delete_auth_user(employee_id)
        return {"message": "Employee deleted successfully"}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/set-office-location")
async def set_office_location(location: LocationUpdate, user=Depends(require_admin)):
    # Assuming single row office setting
    # Fetch existing
    existing = supabase.table("office_settings").select("id").limit(1).execute()
    if existing.data:
        res = supabase.table("office_settings").update(location.dict()).eq("id", existing.data[0]["id"]).execute()
    else:
        res = supabase.table("office_settings").insert(location.dict()).execute()
    return {"message": "Office location updated"}

@router.post("/add-holiday")
async def add_holiday(holiday: HolidayCreate, user=Depends(require_admin)):
    data = holiday.dict()
    data["date"] = data["date"].isoformat()
    res = supabase.table("holidays").insert(data).execute()
    return {"message": "Holiday added"}

@router.delete("/holidays/{holiday_id}")
async def delete_holiday(holiday_id: str, user=Depends(require_admin)):
    supabase.table("holidays").delete().eq("id", holiday_id).execute()
    return {"message": "Holiday deleted"}
