# 🗄️ Database Setup for Cloud Deployment

## Overview

Your app uses **SQLite** (`policies.db` - 1.6MB) containing:
- 55 insurance policies
- 330 policy chunks with embeddings
- 330 section summaries
- CSR data and hospital networks

## How Database Works in Deployment

### **Local Development** ✅
- Database: `./policies.db` (committed to Git)
- Works perfectly with backend API

### **Cloud Deployment (Render)**
The database gets deployed in **3 ways**:

---

## ✅ **Solution 1: Bundle Database with Code (RECOMMENDED)**

**How it works:**
- Commit `policies.db` to Git
- Render downloads it during deployment
- **Read-only** (fine for your use case - no user writes)

**Pros:**
- ✅ Simplest setup
- ✅ No configuration needed
- ✅ Works immediately on deployment
- ✅ Free (no extra cost)

**Cons:**
- ⚠️ Ephemeral storage - resets on redeploy
- ⚠️ Can't add new policies via API (would need database persistence)

**Current Status:** Already configured! ✅
- `.gitignore` updated to allow `.db` files
- Database will be automatically deployed with code

---

## 📦 **Solution 2: Render Persistent Disk (If you need writes)**

**Use if:** You plan to add new policies via the app

**Setup:**
1. In Render dashboard → Your service → "Disks"
2. Add Disk:
   - Name: `policy-data`
   - Mount Path: `/data`
   - Size: 1 GB
3. Update `backend/database.py` to use `/data/policies.db`
4. Upload `policies.db` to disk via Render shell

**Cost:** $1/month for persistent disk

---

## 🔄 **Solution 3: PostgreSQL (Production Grade)**

**Use if:** You want a production-ready, scalable database

**Setup:**
1. Render → New PostgreSQL database (Free tier available)
2. Install psycopg2: Add to `requirements.txt`
3. Migrate SQLite → PostgreSQL using script
4. Update connection string in environment variables

**Pros:**
- ✅ True database persistence
- ✅ Better for concurrent users
- ✅ Backups included
- ✅ Can scale up

**Cons:**
- Requires migration effort
- Free tier has 90-day limit

---

## 🚀 **Recommended Approach for Your App**

### **For Testing/Demo:** Solution 1 (Bundle with code) ✅

**Why:**
- Your app is **read-only** (users don't create/modify policies)
- Database is small (1.6MB)
- No setup needed
- Free

**Limitations:**
- Database resets if you redeploy
- Can't add policies through the app (would need to redeploy)

### **For Production:** Solution 2 or 3

If you later need to:
- Add new policies via admin panel
- Let users favorite/bookmark policies
- Store user preferences

Then upgrade to persistent disk or PostgreSQL.

---

## 📊 **Current Database Contents**

```bash
# Verify database before deployment
cd "/Users/jayanthiboddu/Documents/Sartup Applications/Insurance Application"
.venv/bin/python -c "
from backend.database import PolicyDatabase
db = PolicyDatabase()
policies = db.get_all_policies()
print(f'Total policies: {len(policies)}')
print(f'Database file: policies.db (1.6MB)')
"
```

**Output:**
```
Total policies: 55
Database file: policies.db (1.6MB)
```

---

## 🔍 **Verify Database After Deployment**

After deploying to Render, test the database connection:

```bash
# Test API endpoint
curl https://your-app.onrender.com/api/policies?limit=5

# Should return 5 policies with full data
```

Expected response:
```json
[
  {
    "id": "MAGHLIP20101V021920_ONEHEALTH",
    "provider_name": "MAGMA HDI",
    "plan_name": "OneHealth",
    ...
  },
  ...
]
```

---

## 🛠️ **Troubleshooting**

### **"Database not found" error**

**Cause:** Database file not committed to Git

**Fix:**
```bash
# Verify database is in repo
git status policies.db

# If "untracked", add it:
git add policies.db
git commit -m "Add policy database"
git push
```

### **"Database is empty" error**

**Cause:** Render couldn't find/read the database

**Fix:**
1. Check Render build logs for errors
2. Verify file path in `backend/database.py`
3. Ensure `policies.db` is in root directory

### **"Permission denied" on database**

**Cause:** Render trying to write to read-only filesystem

**Fix:**
Your app only reads from the database, so this shouldn't happen. But if it does:
- Check that `get_connection()` opens in read-only mode
- Or switch to persistent disk (Solution 2)

---

## 📝 **Database Schema**

Your database has these tables:

```sql
-- Policies table (55 rows)
CREATE TABLE policies (
    id TEXT PRIMARY KEY,
    provider_name TEXT,
    plan_name TEXT,
    policy_category TEXT,
    ...
    raw_json TEXT
);

-- Policy chunks for RAG (330 rows)
CREATE TABLE policy_chunks (
    id INTEGER PRIMARY KEY,
    policy_id TEXT,
    section_name TEXT,
    chunk_text TEXT,
    embedding BLOB
);

-- Section summaries (330 rows)
CREATE TABLE section_summaries (
    id INTEGER PRIMARY KEY,
    policy_id TEXT,
    section_name TEXT,
    summary TEXT
);
```

---

## ✅ **Next Steps**

1. **Verify database committed:**
   ```bash
   git add policies.db
   git commit -m "Add insurance policy database"
   ```

2. **Deploy to Render** (database auto-included)

3. **Test API** after deployment

4. **Monitor** - If you need to add/edit policies, upgrade to persistent storage

---

## 💡 **Future Enhancements**

### **If you want to add new policies:**

**Option A:** Redeploy with updated database
```bash
# Add new policy to local database
python backend/populate_policies.py

# Commit and push
git add policies.db
git commit -m "Add new policies"
git push

# Render auto-redeploys
```

**Option B:** Use persistent disk
- One-time setup
- Add policies via API without redeploying

**Option C:** Admin panel
- Build admin UI to manage policies
- Requires persistent database

---

## 🎯 Summary

**Current Setup (Recommended for you):**
- ✅ Database bundled with code
- ✅ Read-only (perfect for demo/testing)
- ✅ No extra configuration
- ✅ Free
- ✅ Works immediately

**Deploy and it just works!** 🚀
