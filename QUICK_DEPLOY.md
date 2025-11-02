# 🚀 Quick Deploy Guide - Separate Projects

## Deploy in 3 Steps

### Step 1: Deploy Backend
1. Go to [vercel.com](https://vercel.com) → Add Project
2. Import your repository
3. Settings:
   - **Root Directory**: Leave as `.` (root)
   - **Framework**: Other
   - Copy `vercel-backend.json` to `vercel.json` (or Vercel will use it)
4. Add Environment Variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `FRONTEND_URL` = (set after frontend is deployed)
   - `GEMINI_API_KEY` = (optional)
5. Deploy & **copy the backend URL**

### Step 2: Deploy Frontend
1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import the **same repository**
3. Settings:
   - **Root Directory**: `frontend` ⚠️
   - **Framework**: Vite (auto-detects)
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-url.vercel.app`
5. Deploy & **copy the frontend URL**

### Step 3: Link Them
1. Go back to **Backend project**
2. Update `FRONTEND_URL` = your frontend URL
3. Redeploy backend (or just push a commit)

## ✅ Done!

Visit your frontend URL - everything should work!

For detailed instructions, see `DEPLOYMENT_GUIDE.md`

