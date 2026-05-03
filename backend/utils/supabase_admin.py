import json
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "Supabase admin credentials not found. Set SUPABASE_URL and "
        "SUPABASE_SERVICE_ROLE_KEY in backend/.env."
    )


ADMIN_USERS_URL = f"{SUPABASE_URL}/auth/v1/admin/users"


def _perform_request(method: str, path: str = "", payload: dict | None = None):
    request_body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(f"{ADMIN_USERS_URL}{path}", data=request_body, method=method)
    request.add_header("apikey", SUPABASE_SERVICE_ROLE_KEY)
    request.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_ROLE_KEY}")
    request.add_header("Content-Type", "application/json")

    try:
        with urlopen(request) as response:
            raw_body = response.read().decode("utf-8")
            return json.loads(raw_body) if raw_body else None
    except HTTPError as exc:
        raw_error = exc.read().decode("utf-8")
        try:
            error_payload = json.loads(raw_error) if raw_error else {}
        except json.JSONDecodeError:
            error_payload = {}

        message = (
            error_payload.get("msg")
            or error_payload.get("message")
            or error_payload.get("error_description")
            or raw_error
            or exc.reason
        )
        raise RuntimeError(message) from exc


def create_auth_user(email: str, password: str, name: str):
    return _perform_request(
        "POST",
        payload={
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": name},
        },
    )


def update_auth_user(
    user_id: str,
    *,
    email: str | None = None,
    password: str | None = None,
    name: str | None = None,
):
    payload = {}

    if email is not None:
        payload["email"] = email
    if password:
        payload["password"] = password
    if name is not None:
        payload["user_metadata"] = {"name": name}

    if not payload:
        return None

    return _perform_request("PUT", path=f"/{user_id}", payload=payload)


def delete_auth_user(user_id: str):
    return _perform_request("DELETE", path=f"/{user_id}")
