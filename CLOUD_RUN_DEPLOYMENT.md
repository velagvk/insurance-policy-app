# Google Cloud Run Deployment Guide

This guide walks you through deploying your insurance policy app to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: Create one at https://cloud.google.com
2. **gcloud CLI**: Install from https://cloud.google.com/sdk/docs/install
3. **Docker** (optional): For local testing

## Step 1: Set Up Google Cloud Project

### 1.1 Create a New Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create insurance-policy-app --name="Insurance Policy App"

# Set the project as default
gcloud config set project insurance-policy-app

# Get your project ID
gcloud config get-value project
```

### 1.2 Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Build API (for automatic deployments)
gcloud services enable cloudbuild.googleapis.com
```

### 1.3 Set Up Billing

- Go to: https://console.cloud.google.com/billing
- Link a billing account to your project
- **Note**: Cloud Run has a generous free tier:
  - 2 million requests/month free
  - 360,000 GB-seconds of memory free
  - 180,000 vCPU-seconds free

## Step 2: Deploy Backend to Cloud Run

### Option A: Deploy from Local Machine (Quick)

```bash
# Navigate to project directory
cd "/Users/jayanthiboddu/Documents/Sartup Applications/Insurance Application"

# Set your Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# Build and deploy to Cloud Run
gcloud run deploy insurance-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars GOOGLE_API_KEY=YOUR_GEMINI_API_KEY

# You'll be prompted to:
# 1. Enable Cloud Build API (say yes)
# 2. Choose region (us-central1 recommended)
# 3. Allow unauthenticated invocations (yes)
```

**After deployment, you'll get a URL like:**
```
https://insurance-backend-xxxxxxxxxx-uc.a.run.app
```

### Option B: Deploy Using Docker (Manual)

```bash
# Set variables
PROJECT_ID=$(gcloud config get-value project)
REGION=us-central1

# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/insurance-backend:latest .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/insurance-backend:latest

# Deploy to Cloud Run
gcloud run deploy insurance-backend \
  --image gcr.io/$PROJECT_ID/insurance-backend:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --set-env-vars GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
```

### 2.1 Set Environment Variables (If not set during deployment)

```bash
# Update environment variables
gcloud run services update insurance-backend \
  --region us-central1 \
  --set-env-vars GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
```

### 2.2 Verify Backend Deployment

```bash
# Get the service URL
gcloud run services describe insurance-backend \
  --region us-central1 \
  --format 'value(status.url)'

# Test the API
curl https://YOUR-BACKEND-URL/api/policies
```

## Step 3: Deploy Frontend to Cloud Run

### 3.1 Create Dockerfile for Frontend

Create `ui/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### 3.2 Create nginx configuration

Create `ui/nginx.conf`:

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3.3 Update Frontend API URL

Update `ui/src/App.js` to use the Cloud Run backend URL:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/api'
  : 'https://YOUR-BACKEND-URL/api';  // Replace with your backend URL
```

### 3.4 Deploy Frontend

```bash
# Navigate to ui directory
cd ui

# Deploy to Cloud Run
gcloud run deploy insurance-frontend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi

# You'll get a URL like:
# https://insurance-frontend-xxxxxxxxxx-uc.a.run.app
```

## Step 4: Update CORS Settings

Update `backend/api.py` to allow your Cloud Run frontend:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://YOUR-FRONTEND-URL.run.app",  # Add your Cloud Run frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy backend:

```bash
gcloud run deploy insurance-backend \
  --source . \
  --region us-central1
```

## Step 5: Set Up Custom Domain (Optional)

### 5.1 Map Custom Domain to Cloud Run

```bash
# Map domain to backend
gcloud run domain-mappings create \
  --service insurance-backend \
  --domain api.yourdomain.com \
  --region us-central1

# Map domain to frontend
gcloud run domain-mappings create \
  --service insurance-frontend \
  --domain app.yourdomain.com \
  --region us-central1
```

### 5.2 Update DNS Records

Follow the instructions from the domain mapping command to update your DNS records.

## Step 6: Set Up Continuous Deployment (Optional)

### 6.1 Connect GitHub Repository

```bash
# Create a build trigger
gcloud builds triggers create github \
  --repo-name=insurance-policy-app \
  --repo-owner=velagvk \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml
```

This will automatically deploy to Cloud Run whenever you push to the `main` branch.

## Monitoring and Logs

### View Logs

```bash
# View backend logs
gcloud run services logs read insurance-backend \
  --region us-central1 \
  --limit 50

# View frontend logs
gcloud run services logs read insurance-frontend \
  --region us-central1 \
  --limit 50

# Stream logs in real-time
gcloud run services logs tail insurance-backend \
  --region us-central1
```

### View Metrics

Go to: https://console.cloud.google.com/run

Click on your service to see:
- Request count
- Response time
- Memory usage
- Error rate

## Cost Optimization

### Free Tier Limits (per month)
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

### Tips to Stay in Free Tier
1. **Set max instances**: Limits concurrent instances
   ```bash
   gcloud run services update insurance-backend \
     --max-instances 5 \
     --region us-central1
   ```

2. **Set min instances to 0**: Scales to zero when not in use
   ```bash
   gcloud run services update insurance-backend \
     --min-instances 0 \
     --region us-central1
   ```

3. **Reduce memory**: Use only what you need
   ```bash
   gcloud run services update insurance-backend \
     --memory 1Gi \
     --region us-central1
   ```

## Troubleshooting

### Backend not responding
```bash
# Check service status
gcloud run services describe insurance-backend --region us-central1

# View recent logs
gcloud run services logs read insurance-backend --region us-central1 --limit 100
```

### CORS errors
- Ensure frontend URL is in the `allow_origins` list in `backend/api.py`
- Redeploy backend after updating CORS settings

### Out of memory errors
- Increase memory allocation:
  ```bash
  gcloud run services update insurance-backend \
    --memory 2Gi \
    --region us-central1
  ```

### Cold start issues
- Set min instances to 1 (but costs more):
  ```bash
  gcloud run services update insurance-backend \
    --min-instances 1 \
    --region us-central1
  ```

## Cleanup (Delete Everything)

```bash
# Delete Cloud Run services
gcloud run services delete insurance-backend --region us-central1
gcloud run services delete insurance-frontend --region us-central1

# Delete container images
gcloud container images delete gcr.io/YOUR_PROJECT_ID/insurance-backend

# Delete the project (removes all resources)
gcloud projects delete YOUR_PROJECT_ID
```

## Quick Reference

### Backend URL Format
```
https://insurance-backend-[hash]-[region].a.run.app
```

### Frontend URL Format
```
https://insurance-frontend-[hash]-[region].a.run.app
```

### Update Backend
```bash
cd "/Users/jayanthiboddu/Documents/Sartup Applications/Insurance Application"
gcloud run deploy insurance-backend --source . --region us-central1
```

### Update Frontend
```bash
cd "/Users/jayanthiboddu/Documents/Sartup Applications/Insurance Application/ui"
gcloud run deploy insurance-frontend --source . --region us-central1
```

## Support

- Cloud Run Documentation: https://cloud.google.com/run/docs
- Pricing Calculator: https://cloud.google.com/products/calculator
- Community Support: https://stackoverflow.com/questions/tagged/google-cloud-run
