# Vercel Deployment Guide for WealthWise

This guide will help you deploy both the frontend (React/Vite) and backend (Flask) to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. MongoDB Atlas connection string
4. Google Gemini API key (optional, for AI features)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure all changes are committed and pushed to your Git repository:
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Deploy on Vercel

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to your project root
cd /path/to/Wealthwise

# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel

# For production deployment
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as root (`.`)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

### 3. Configure Environment Variables

In your Vercel project settings, add these environment variables:

#### Required Environment Variables

**For Backend (API):**
- `MONGODB_URI` - Your MongoDB Atlas connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/wealthwise?retryWrites=true&w=majority`

**Optional (for AI features):**
- `GEMINI_API_KEY` - Your Google Gemini API key (if using AI features)

#### For Frontend (Optional):
- `VITE_API_URL` - Custom API URL (defaults to `/api` in production)

**How to Add Environment Variables:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `MONGODB_URI`)
   - **Value**: Your actual value
   - **Environments**: Select Production, Preview, and Development
4. Click **Save**

### 4. Project Structure

Your project should have this structure:
```
Wealthwise/
├── api/
│   └── index.py          # Flask serverless function adapter
├── backend/
│   ├── app.py            # Flask application
│   ├── database/         # Database modules
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/              # React source code
│   ├── package.json      # Node dependencies
│   └── dist/             # Build output (auto-generated)
├── requirements.txt      # Root Python dependencies for Vercel
├── vercel.json           # Vercel configuration
└── DEPLOYMENT.md         # This file
```

### 5. How It Works

- **Frontend**: Vercel builds your React/Vite app and serves it as static files
- **Backend**: Flask app is converted to serverless functions in the `/api` directory
- **Routing**: 
  - All requests to `/api/*` are routed to the Flask backend
  - All other requests serve the React frontend
  - Frontend automatically uses `/api` as the backend URL in production

### 6. Verify Deployment

After deployment:

1. **Check Frontend**: Visit your Vercel deployment URL
   - Should show your React app
   
2. **Check Backend API**: Visit `https://your-domain.vercel.app/api/health`
   - Should return `{"status": "ok"}`

3. **Test Authentication**: 
   - Try signing in/up through the frontend
   - Check browser console for any API errors

### 7. Troubleshooting

#### Build Fails
- Check that all dependencies are in `package.json` and `requirements.txt`
- Verify Node.js and Python versions are compatible
- Check build logs in Vercel dashboard

#### API Returns 500 Errors
- Verify `MONGODB_URI` environment variable is set correctly
- Check Vercel function logs for Python errors
- Ensure MongoDB Atlas IP whitelist includes Vercel IPs (0.0.0.0/0 for all)

#### CORS Errors
- The Flask app already has CORS enabled
- If issues persist, check that requests are going to `/api/*` paths

#### Environment Variables Not Working
- Variables starting with `VITE_` are exposed to the frontend
- Backend variables (like `MONGODB_URI`) are only available to serverless functions
- Redeploy after adding/changing environment variables

### 8. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

### 9. Continuous Deployment

Once connected to Git:
- Every push to `main` branch automatically deploys to production
- Pull requests create preview deployments
- You can configure which branches trigger deployments in **Settings** → **Git**

## Local Development After Deployment

To test locally with production-like settings:

1. Create a `.env` file in the root:
```env
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_key
```

2. Run backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

3. Run frontend:
```bash
cd frontend
npm install
npm run dev
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Python Runtime](https://vercel.com/docs/functions/runtimes/python)
- [Flask on Vercel](https://vercel.com/guides/deploying-flask-with-vercel)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Vercel function logs for API errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas is accessible from Vercel's servers

