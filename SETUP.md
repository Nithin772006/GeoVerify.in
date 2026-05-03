# GeoVerify.in Setup Instructions

## 1. Supabase Setup
1. Open your Supabase project dashboard.
2. Go to the **SQL Editor** and paste the contents of `supabase_setup.sql`.
3. Run the script to create tables, policies, and the storage bucket.
4. (Optional) Run the last commented line in `supabase_setup.sql` to manually insert an admin user using the auth user ID of a registered user.
5. In your Supabase Dashboard, make sure Email/Password auth is enabled.
6. Run `update.sql` and `admin_panel_upgrade.sql` as well to add leave management and the full admin panel schema used by the frontend.

## 2. Backend Setup (FastAPI)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   ```bash
   .\venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Mac/Linux
   ```
3. Install dependencies (if not already installed):
   ```bash
   pip install fastapi uvicorn supabase pydantic pydantic-settings python-dotenv python-multipart
   ```
4. Update the `.env` file with your exact credentials. For backend routes, prefer setting `SUPABASE_SERVICE_ROLE_KEY` so server-side admin operations can run reliably.
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## 3. Frontend Setup (React/Vite)
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` is configured properly.
4. Run the development server:
   ```bash
   npm run dev
   ```

## 4. Usage Flow
1. Sign up a user (or add them via Admin dashboard/Supabase direct).
2. Login via frontend after confirming the signup email if your Supabase project requires email confirmation.
3. If no admin exists yet, the first signed-in employee will see a one-time `Claim admin access` card on the dashboard. Use it once to bootstrap the first admin account.
4. Admin can set the office location (latitude, longitude, radius).
5. Employees can mark attendance by clicking "Start Camera" and "Mark Present", which captures a live photo and their GPS location.
