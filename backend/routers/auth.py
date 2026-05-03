from fastapi import APIRouter, Depends, HTTPException
from database import supabase
from utils.dependencies import require_admin
from models.schemas import EmployeeCreate
from utils.supabase_admin import create_auth_user

router = APIRouter(prefix="/admin", tags=["auth"])

@router.post("/add-employee")
async def add_employee(employee: EmployeeCreate, user=Depends(require_admin)):
    try:
        auth_user = create_auth_user(employee.email, employee.password, employee.name)
        auth_user_id = auth_user.get("id")

        if not auth_user_id:
            raise HTTPException(status_code=400, detail="Failed to create auth user")
            
        emp_data = {
            "id": auth_user_id,
            "name": employee.name,
            "email": employee.email,
            "role": employee.role,
            "department": employee.department,
            "job_title": employee.job_title,
            "phone": employee.phone,
            "status": employee.status,
        }

        supabase.table("employees").upsert(emp_data).execute()
        return {"message": "Employee created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
