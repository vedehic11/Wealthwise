# Deploying Frontend and Backend Separately on Vercel

This guide shows how to deploy the frontend and backend as **two separate Vercel projects**.

## Why Deploy Separately?

✅ **Advantages:**
- Independent deployments (deploy frontend without redeploying backend)
- Better separation of concerns
- Can scale independently
- Separate domains (e.g., `app.yourdomain.com` and `api.yourdomain.com`)
- Independent environment variables management
- Better for team collaboration (frontend and backend teams work independently)

## Deployment Steps

### 1. Deploy Backend (Flask API)

1. **Create a new Vercel project for backend:**
   ```bash
   # In your project root
   vercel --cwd backend
   ```
   
   Or via Dashboard:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your repository
   - **Important Settings:**
     - **Root Directory**: Set to `backend`
     - **Framework Preset**: Other (or Python)
     - **Build Command**: Leave empty (no build needed for Flask)
     - **Output Directory**: Leave empty
     - **Install Command**: Leave empty (will use root requirements.txt)

2. **Create `backend/vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "../api/index.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/api/index.py"
       }
     ]
   }
   ```

3. **Set Backend Environment Variables:**
   - `MONGODB_URI` - Your MongoDB connection string
   - `GEMINI_API_KEY` - Optional, for AI features

4. **Deploy:**
   ```bash
   vercel --prod
   ```
   
   Or just push to Git and Vercel will auto-deploy.

5. **Note your backend URL:**
   - Example: `https://wealthwise-api.vercel.app`
   - You'll need this for frontend configuration

### 2. Deploy Frontend (React/Vite)

1. **Create a new Vercel project for frontend:**
   ```bash
   vercel --cwd frontend
   ```
   
   Or via Dashboard:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import the same repository
   - **Important Settings:**
     - **Root Directory**: Set to `frontend`
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build` (auto-detected)
     - **Output Directory**: `dist` (auto-detected)

2. **Set Frontend Environment Variables:**
   - `VITE_API_URL` - Your backend URL
     - Example: `https://wealthwise-api.vercel.app`
     - This will override the default `/api` path

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### 3. Update Frontend to Use Backend URL

The frontend is already configured to use environment variables. Just set:
- `VITE_API_URL=https://your-backend-url.vercel.app`

## Alternative: Using Vercel Monorepo Feature

Vercel supports monorepos with separate deployments:

1. **Single Repository, Multiple Projects:**
   - Create two projects from the same repo
   - Set different "Root Directory" for each
   - Vercel will handle dependencies automatically

2. **Configure Ignored Build Step:**
   - For **Backend project**: Only build when `backend/` changes
   - For **Frontend project**: Only build when `frontend/` changes
   - Settings → Git → Ignored Build Step:
     - Backend: `git diff HEAD^ HEAD --quiet frontend/`
     - Frontend: `git diff HEAD^ HEAD --quiet backend/`

## Project Structure for Separate Deployments

```
Wealthwise/
├── api/
│   └── index.py          # Backend serverless adapter
├── backend/
│   ├── app.py            # Flask app
│   ├── vercel.json       # Backend-specific config
│   └── ...
├── frontend/
│   ├── src/              # React app
│   ├── package.json
│   └── dist/             # Build output
└── requirements.txt      # Python deps for backend
```

## CORS Configuration

If deploying separately, ensure CORS is configured in your Flask app:

```python
# backend/app.py
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://your-frontend-domain.vercel.app",
            "http://localhost:5173"  # For local dev
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

## Recommended Setup

For best results, I recommend:

1. **Backend**: Deploy as separate project
   - URL: `wealthwise-api.vercel.app`
   - Domain: `api.yourdomain.com` (optional)

2. **Frontend**: Deploy as separate project
   - URL: `wealthwise-app.vercel.app`
   - Domain: `yourdomain.com` or `app.yourdomain.com`
   - Environment variable: `VITE_API_URL=https://api.yourdomain.com`

This gives you:
- Clean separation
- Independent deployments
- Professional setup
- Easy to scale

