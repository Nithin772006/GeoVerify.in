from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class EmployeeBase(BaseModel):
    name: str
    email: str
    role: str = "employee"
    department: str = "General"
    job_title: str = ""
    phone: Optional[str] = None
    status: str = "active"

class EmployeeCreate(EmployeeBase):
    password: str

class EmployeeUpdate(EmployeeBase):
    password: Optional[str] = None

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    allowed_radius: float

class HolidayCreate(BaseModel):
    date: date
    name: str

class AttendanceMark(BaseModel):
    latitude: float
    longitude: float

class CompanySettingsUpdate(BaseModel):
    company_name: str
    company_policies: str
    workday_start: str
    workday_end: str
    check_in_open: str
    late_after: str
    timezone: str

class RolePermissionEntry(BaseModel):
    role: str
    module: str
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False
    can_approve: bool = False
    can_export: bool = False

class RolePermissionsUpdate(BaseModel):
    permissions: List[RolePermissionEntry]

class EmployeeOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str
