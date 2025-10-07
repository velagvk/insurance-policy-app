# Public Access Options for Your Insurance App

Ngrok requires account setup. Here are your best options for public access:

## Option 1: ngrok (Recommended - Requires Free Account)

**Steps:**
1. Sign up for free account: https://dashboard.ngrok.com/signup
2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure ngrok:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```
4. Start tunnels:
   ```bash
   # Terminal 1: Expose backend
   ngrok http 8000

   # Terminal 2: Expose frontend
   ngrok http 3000
   ```
5. Update frontend `.env` with the ngrok backend URL
6. Share the frontend ngrok URL with testers

**Pros**:
- Free tier available
- HTTPS included
- Easy setup after registration
- Works globally

**Cons**:
- Requires account signup
- URLs change on restart (paid tier gets static URLs)

---

## Option 2: localtunnel (No Account Required - Easiest)

**Install and run:**
```bash
# Install localtunnel
npm install -g localtunnel

# Terminal 1: Expose backend
lt --port 8000 --subdomain insurance-backend

# Terminal 2: Expose frontend
lt --port 3000 --subdomain insurance-app
```

Then get the public URLs and update your frontend config.

**Pros**:
- No account needed
- Free
- Works immediately

**Cons**:
- Less reliable than ngrok
- May have bandwidth limits
- Warning page on first visit

---

## Option 3: Cloudflare Tunnel (Free, Production-Ready)

**Setup:**
```bash
# Install cloudflared
brew install cloudflared

# Login (one-time)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create insurance-app

# Configure tunnel (create config.yml)
cloudflared tunnel route dns insurance-app insurance-app.yourdomain.com

# Run tunnel
cloudflared tunnel run insurance-app
```

**Pros**:
- Production-ready
- Free tier
- HTTPS included
- Custom domains

**Cons**:
- More complex setup
- Requires Cloudflare account

---

## Option 4: Deploy to Cloud (Permanent Solution)

### A. Vercel (Frontend) + Railway (Backend)

**Frontend to Vercel:**
```bash
cd ui
npm install -g vercel
vercel
```

**Backend to Railway:**
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Railway auto-detects Python
5. Add environment variables (GOOGLE_API_KEY)

**Cost**: Free tier available, ~$5-10/month for production

### B. Render (Full Stack - Easiest Cloud Deploy)

1. Go to https://render.com
2. New → Web Service → Connect GitHub
3. Deploy backend:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python -m backend.api`
4. Deploy frontend:
   - Build Command: `npm install && npm run build`
   - Start Command: `serve -s build`

**Cost**: Free tier available (with sleep), $7/month for 24/7

### C. Fly.io (Docker-based)

```bash
# Install flyctl
brew install flyctl

# Login
fly auth login

# Deploy backend
fly launch --name insurance-backend

# Deploy frontend
fly launch --name insurance-frontend
```

**Cost**: Free tier (3 shared VMs)

---

## Quick Comparison

| Solution | Setup Time | Cost | Reliability | Best For |
|----------|-----------|------|-------------|----------|
| **ngrok** | 5 min | Free/Paid | ⭐⭐⭐⭐⭐ | Quick demos |
| **localtunnel** | 2 min | Free | ⭐⭐⭐ | Immediate testing |
| **Cloudflare** | 15 min | Free | ⭐⭐⭐⭐⭐ | Production |
| **Vercel+Railway** | 30 min | Free/$5 | ⭐⭐⭐⭐⭐ | Production apps |
| **Render** | 20 min | Free/$7 | ⭐⭐⭐⭐ | Full stack deploy |
| **Fly.io** | 15 min | Free | ⭐⭐⭐⭐ | Docker apps |

---

## Recommended Next Steps

### For Quick Testing (Today):
1. **Use localtunnel** (no account needed)
2. Takes 2 minutes to set up
3. Works immediately

### For Persistent Access (This Week):
1. **Sign up for ngrok** (5 min setup)
2. Or deploy to **Render** (20 min, permanent URLs)

### For Production (Long-term):
1. **Vercel + Railway** - Professional, scalable
2. Or **Cloudflare Tunnel** - Free, secure, fast

---

## Need Help Choosing?

**Answer these questions:**

1. **How long do you need public access?**
   - Few hours → localtunnel
   - Few days → ngrok
   - Permanent → Cloud deploy

2. **Who are the testers?**
   - Internal team → ngrok/localtunnel
   - External clients → Cloud deploy

3. **What's your budget?**
   - $0 → localtunnel, ngrok free, Render free tier
   - $5-10/month → Railway, Render paid
   - Enterprise → AWS/GCP/Azure

**Tell me your preference and I'll help you set it up!**
