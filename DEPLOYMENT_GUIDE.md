# 🚀 WealthWise Deployment Guide - Separate Projects

This guide walks you through deploying **frontend and backend as separate Vercel projects** (recommended for production).

## 📋 Overview

- **Frontend**: React/Vite app → Deployed as separate Vercel project
- **Backend**: Flask API → Deployed as separate Vercel project
- **Benefits**: Independent deployments, better scaling, cleaner separation

---

## 🎯 Step 1: Deploy Backend (Flask API)

### Option A: Using Vercel Dashboard

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**
2. Click **"Add New..."** → **"Project"**
3. **Import your Git repository**
4. **Configure the project:**
   - **Project Name**: `wealthwise-api` (or your choice)
   - **Root Directory**: Leave as **`.`** (root)
   - **Framework Preset**: **Other** (or Python)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: Leave empty

5. **Before deploying, set environment variables:**
   - Click **"Environment Variables"**
   - Add these variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     GEMINI_API_KEY=your_gemini_key (optional)
     FRONTEND_URL=https://your-frontend-url.vercel.app (set after frontend is deployed)
     ```
   - Select all environments (Production, Preview, Development)
   - Click **"Save"**

6. **Important**: Copy `vercel-backend.json` to `vercel.json` at the root:
   ```bash
   # Or manually create vercel.json with backend config
   ```
   Actually, Vercel will auto-detect. But if needed, create a `vercel.json` in root with backend config.

7. **Click "Deploy"**

8. **Note your backend URL:**
   - It will be something like: `https://wealthwise-api.vercel.app`
   - Copy this URL - you'll need it for frontend configuration

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy backend (from project root)
cp vercel-backend.json vercel.json
vercel --prod

# Set environment variables
vercel env add MONGODB_URI
vercel env add FRONTEND_URL
vercel env add GEMINI_API_KEY  # Optional
```

---

## 🎨 Step 2: Deploy Frontend (React/Vite)

### Option A: Using Vercel Dashboard

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**
2. Click **"Add New..."** → **"Project"**
3. **Import the SAME Git repository** (as backend)
4. **Configure the project:**
   - **Project Name**: `wealthwise-app` (or your choice)
   - **Root Directory**: Set to **`frontend`** ⚠️ Important!
   - **Framework Preset**: **Vite** (should auto-detect)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

5. **Set environment variables:**
   - Click **"Environment Variables"**
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.vercel.app
     ```
     (Replace with your actual backend URL from Step 1)
   - Select all environments
   - Click **"Save"**

6. **Click "Deploy"**

7. **Note your frontend URL:**
   - It will be something like: `https://wealthwise-app.vercel.app`

### Option B: Using Vercel CLI

```bash
# From project root
cd frontend
vercel --prod

# Set environment variable
vercel env add VITE_API_URL production
# Enter: https://your-backend-url.vercel.app
```

---

## 🔄 Step 3: Link Frontend and Backend

After both are deployed:

1. **Update Backend CORS:**
   - Go to your **Backend project** on Vercel
   - **Settings** → **Environment Variables**
   - Update `FRONTEND_URL` to your frontend URL:
     ```
     FRONTEND_URL=https://wealthwise-app.vercel.app
     ```
   - **Redeploy** the backend (or just push a commit)

2. **Verify the connection:**
   - Visit your frontend URL
   - Open browser DevTools → Network tab
   - Try logging in or making an API call
   - Check that requests go to your backend URL

---

## 🔧 Configuration Files

### Backend Configuration
- **File**: `vercel-backend.json` (copy to `vercel.json` for backend project)
- **Location**: Project root (when deploying backend)
- **Routes**: All requests → `/api/index.py`

### Frontend Configuration
- **File**: `frontend/vercel.json`
- **Location**: `frontend/` directory
- **Auto-detected**: Vercel detects Vite automatically

---

## 🌍 Custom Domains (Optional)

### Backend Domain
1. Go to **Backend project** → **Settings** → **Domains**
2. Add domain: `api.yourdomain.com`
3. Update DNS as instructed
4. Update `FRONTEND_URL` env var if needed

### Frontend Domain
1. Go to **Frontend project** → **Settings** → **Domains**
2. Add domain: `yourdomain.com` or `app.yourdomain.com`
3. Update DNS as instructed
4. Update `VITE_API_URL` env var to point to backend domain

---

## ✅ Verification Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] `VITE_API_URL` points to backend
- [ ] `FRONTEND_URL` set in backend env vars
- [ ] Test frontend → Can see the app
- [ ] Test API → Visit `https://backend-url.vercel.app/health`
- [ ] Test login → Frontend can communicate with backend
- [ ] CORS working → No CORS errors in browser console

---

## 🐛 Troubleshooting

### Backend Not Deploying
- **Check**: `api/index.py` exists at root
- **Check**: `requirements.txt` at root has all dependencies
- **Check**: Environment variables are set
- **Check**: Vercel logs for Python errors

### Frontend Not Deploying
- **Check**: Root directory is set to `frontend`
- **Check**: `package.json` exists in `frontend/`
- **Check**: Build command is `npm run build`
- **Check**: Output directory is `dist`

### CORS Errors
- **Check**: `FRONTEND_URL` env var in backend matches frontend URL
- **Check**: Backend has been redeployed after setting `FRONTEND_URL`
- **Check**: Browser console shows exact error message

### API 404 Errors
- **Check**: `VITE_API_URL` is set correctly in frontend
- **Check**: Backend URL is accessible (visit `/health` endpoint)
- **Check**: Frontend is using `${SERVER_URL}` from `utils.js`

### MongoDB Connection Issues
- **Check**: `MONGODB_URI` is set correctly
- **Check**: MongoDB Atlas allows connections from anywhere (`0.0.0.0/0`)
- **Check**: MongoDB credentials are correct

---

## 🔄 Continuous Deployment

Once set up:
- **Push to `main`** → Both projects auto-deploy
- **Create PR** → Preview deployments created
- **Independent**: Changes to `frontend/` only deploy frontend
- **Independent**: Changes to `backend/` or `api/` only deploy backend

To prevent unnecessary builds:
- **Backend project**: Settings → Git → Ignored Build Step
  ```
  git diff HEAD^ HEAD --quiet frontend/
  ```
- **Frontend project**: Settings → Git → Ignored Build Step
  ```
  git diff HEAD^ HEAD --quiet backend/ api/
  ```

---

## 📝 Environment Variables Summary

### Backend Project
```
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=... (optional)
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend Project
```
VITE_API_URL=https://your-backend.vercel.app
```

---

## 🎉 You're Done!

Your application is now deployed with:
- ✅ Frontend on Vercel
- ✅ Backend on Vercel
- ✅ Separate projects for independent scaling
- ✅ Ready for production traffic

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Python Runtime](https://vercel.com/docs/functions/runtimes/python)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

