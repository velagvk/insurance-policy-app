# 🚀 Cloud Deployment Guide

Deploy your Insurance Policy Comparison App to the cloud for permanent, global access!

## 📋 Prerequisites

- GitHub account (free)
- Render account (free) - for backend
- Vercel account (free) - for frontend
- Your Google API key

---

## 🔧 Step 1: Push Code to GitHub

### 1.1 Initialize Git Repository

```bash
cd "/Users/jayanthiboddu/Documents/Sartup Applications/Insurance Application"
git init
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `insurance-policy-app`
3. Description: `AI-powered insurance policy comparison platform`
4. **Keep it Private** (recommended - contains API keys in history)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### 1.3 Connect and Push

```bash
# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Insurance Policy Comparison App with AI chat"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/insurance-policy-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🐍 Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to https://render.com/
2. Sign up with GitHub (easiest)
3. Authorize Render to access your repositories

### 2.2 Deploy Web Service

1. Click "New +" → "Web Service"
2. Connect your `insurance-policy-app` repository
3. **Configuration**:
   - **Name**: `insurance-backend` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.api:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

### 2.3 Add Environment Variables

In the "Environment" section, add:

| Key | Value |
|-----|-------|
| `GOOGLE_API_KEY` | `your-google-api-key-here` |
| `PYTHON_VERSION` | `3.11.0` |

### 2.4 Deploy!

1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. You'll get a URL like: `https://insurance-backend-xxxx.onrender.com`
4. Test it: Visit `https://insurance-backend-xxxx.onrender.com/`
   - Should see: `{"message":"Insurance Policy API is running"...}`

### 2.5 Test Backend Endpoints

```bash
# Test health
curl https://insurance-backend-xxxx.onrender.com/

# Test policies endpoint
curl https://insurance-backend-xxxx.onrender.com/api/policies?limit=5
```

**Expected**: JSON with 55 policies

---

## ⚛️ Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend API URL

Before deploying, update the frontend to use your Render backend URL:

```bash
cd ui
```

Edit `src/App.js` line 9:

```javascript
// Change from:
const API_BASE_URL = 'https://729e38e0ac95.ngrok-free.app/api';

// To (use your actual Render URL):
const API_BASE_URL = 'https://insurance-backend-xxxx.onrender.com/api';
```

Commit this change:

```bash
cd ..
git add ui/src/App.js
git commit -m "Update API URL to use Render backend"
git push
```

### 3.2 Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to UI folder
cd ui

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project's name? insurance-app (or your choice)
# - In which directory is your code located? ./
# - Want to override settings? No

# Production deployment
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your `insurance-policy-app` repository
5. **Configuration**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `ui`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)
6. Click "Deploy"

### 3.3 Get Your Live URL

After deployment (2-3 minutes), you'll get:
- **Production URL**: `https://insurance-app-xxxx.vercel.app`

---

## ✅ Step 4: Verify Deployment

### 4.1 Test Backend

```bash
curl https://insurance-backend-xxxx.onrender.com/api/policies?limit=3
```

Should return 3 policies with all fields.

### 4.2 Test Frontend

1. Visit: `https://insurance-app-xxxx.vercel.app`
2. Open browser console (F12)
3. Should see:
   ```
   🔗 API Base URL: https://insurance-backend-xxxx.onrender.com/api
   📡 Fetching policies...
   ✅ Loaded 55 policies from backend
   ```

### 4.3 Test Full Functionality

1. ✅ Browse policies
2. ✅ Filter by provider/type
3. ✅ Compare policies
4. ✅ AI Chat (ask questions about policies)
5. ✅ All 55 policies visible

---

## 🎯 Your Live URLs

After successful deployment:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://insurance-app-xxxx.vercel.app` | **Share this with users!** |
| **Backend** | `https://insurance-backend-xxxx.onrender.com` | API (used by frontend) |

---

## 📊 Free Tier Limits

### Render (Backend)
- ✅ 750 hours/month (enough for 24/7)
- ✅ Auto-sleep after 15min inactivity
- ✅ Wake up on request (adds ~30s delay)
- ✅ 512 MB RAM
- ⚠️ Spins down when idle (first request slower)

### Vercel (Frontend)
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ No sleep/downtime

---

## 🔧 Troubleshooting

### Backend Issues

**Backend not responding?**
- Render free tier sleeps after 15min inactivity
- First request takes 30-60s to wake up
- Subsequent requests are instant

**Database not found?**
- Render uses ephemeral storage
- Upload `insurance_policies.db` to Render dashboard
- Or regenerate on first run

**Environment variable missing?**
- Check Render dashboard → Environment
- Make sure `GOOGLE_API_KEY` is set
- Redeploy if you added it after initial deployment

### Frontend Issues

**Still showing fallback data?**
- Clear browser cache: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Check console for API URL
- Verify it points to Render backend

**API errors?**
- Test backend directly: `curl https://insurance-backend-xxxx.onrender.com/`
- Check CORS settings in `backend/api.py`

---

## 🚀 Next Steps

### Optional Enhancements

1. **Custom Domain**
   - Vercel: Add custom domain for free
   - Render: $7/month for custom domain

2. **Database Persistence**
   - Use Render PostgreSQL (free tier)
   - Or mount persistent disk ($1/month)

3. **Monitoring**
   - Render provides basic metrics
   - Add Sentry for error tracking
   - Use LogRocket for session replay

4. **Performance**
   - Upgrade Render to paid tier ($7/month) for no sleep
   - Add Redis cache for API responses
   - Use Vercel Analytics

---

## 📞 Support

**Deployment fails?**
1. Check build logs in Render/Vercel dashboard
2. Verify all files committed to Git
3. Ensure requirements.txt is up to date
4. Check Python version compatibility

**Database issues?**
- The SQLite database needs to be uploaded to Render
- Or implement database initialization script

**API key issues?**
- Never commit `.env` files to Git
- Always use Render environment variables

---

## 🎉 You're Live!

Once deployed, share your app URL with the world:

**🔗 https://insurance-app-xxxx.vercel.app**

- ✅ 24/7 availability
- ✅ HTTPS secure
- ✅ Global CDN
- ✅ No setup required for users
- ✅ Professional deployment

Congratulations! 🎊
