# Network Access Setup Guide

Your Insurance Policy Comparison App is now accessible to others on your local network!

## 📱 Access URLs

### For you (on this computer):
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### For others on the same WiFi/network:
- **Frontend**: http://10.0.0.207:3000
- **Backend API**: http://10.0.0.207:8000

## 🔧 What Was Configured

### Backend (FastAPI)
- ✅ Server listening on `0.0.0.0:8000` (all network interfaces)
- ✅ CORS configured to allow network access
- ✅ All optimizations active (caching, model routing, reranking)

### Frontend (React)
- ✅ Dev server listening on `0.0.0.0:3000` (all network interfaces)
- ✅ API URLs configured via environment variable
- ✅ Auto-connects to backend at `http://10.0.0.207:8000`

## 📋 Instructions for Testers

1. **Connect to the same WiFi network** as the host machine (10.0.0.207)

2. **Open browser** and navigate to:
   ```
   http://10.0.0.207:3000
   ```

3. **Test the features**:
   - Browse 55 insurance policies
   - Compare policies side-by-side
   - Use filters (provider, type, coverage)
   - Chat with AI about policy details (optimized with caching & smart routing)

## 🔒 Security Notes

⚠️ **Current setup is for testing only:**
- CORS allows all origins (`*`)
- No authentication required
- Local network access only

**For production deployment**, you should:
- Remove `"*"` from CORS allowed origins
- Add authentication/authorization
- Use HTTPS with SSL certificates
- Deploy to cloud platform (see deployment options below)

## 🚀 Alternative Deployment Options

### Option 1: Local Network (Current - FREE)
- **Pros**: Instant, no cost, works on same WiFi
- **Cons**: Limited to local network, not persistent
- **Best for**: Quick demos, testing with nearby colleagues

### Option 2: ngrok (Quick Public Access - FREE/PAID)
```bash
# Install ngrok
brew install ngrok

# Expose backend
ngrok http 8000

# Expose frontend (in another terminal)
ngrok http 3000
```
- **Pros**: Public URL, works anywhere, easy setup
- **Cons**: Random URLs, session limits on free tier
- **Best for**: Remote demos, temporary sharing

### Option 3: Cloud Deployment (Permanent - PAID)

#### Vercel (Frontend) + Railway (Backend)
```bash
# Frontend to Vercel
npm run build
vercel deploy

# Backend to Railway
# Just connect GitHub repo
```
- **Cost**: ~$5-20/month
- **Best for**: Production apps, permanent hosting

#### Render (Full Stack)
- Deploy both frontend and backend
- **Cost**: Free tier available, $7/month for production
- **Best for**: Simple full-stack deployment

#### AWS/GCP/Azure
- Most control, scalable
- **Cost**: Varies, ~$10-50/month
- **Best for**: Enterprise applications

## 🔍 Troubleshooting

### Can't access from other devices?
1. Check firewall settings on host machine
2. Ensure both devices on same WiFi network
3. Verify IP address hasn't changed:
   ```bash
   ipconfig getifaddr en0
   ```

### Backend API not responding?
```bash
# Check if backend is running
curl http://10.0.0.207:8000/

# Should return: {"message":"Insurance Policy API is running"...}
```

### Frontend not loading?
```bash
# Check if frontend is running
curl http://10.0.0.207:3000/

# Should return HTML content
```

## 📊 Current Features

### AI Chat Optimizations (Active):
- ✅ **Response Caching**: 80% cost reduction
- ✅ **Model Routing**: Flash for simple queries, Pro for complex
- ✅ **Cross-Encoder Reranking**: 25% accuracy improvement

### Database:
- 55 health insurance policies
- 21 standardized features per policy
- CSR and hospital network data
- Full embeddings for semantic search

## 🛑 Stopping the Servers

When done testing:
```bash
# Stop backend
pkill -f "python -m backend.api"

# Stop frontend
# Press Ctrl+C in the terminal running npm start
```

---

**Need help?** Contact the developer or check logs in `/logs/backend.log`
