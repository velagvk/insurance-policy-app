# Quick Reference - Insurance Chatbot Improvements

**Version**: 1.1.0
**Date**: October 3, 2025
**Status**: Production Ready ✅

---

## 🚀 Quick Start

```bash
# Start backend
cd "/Users/jayanthiboddu/Documents/Sartup Applications/Insurance Application"
python -m backend.api

# Start frontend (new terminal)
cd ui
npm start

# Check health
curl http://localhost:8000/health
```

---

## 📋 New Features Quick Access

### 1. **Logging**
```bash
# Watch logs
tail -f backend.log

# Search errors
grep "ERROR" backend.log

# Search rate limits
grep "Rate limit" backend.log
```

### 2. **Caching**
```bash
# Check cache stats
curl http://localhost:8000/health | jq '.services.cache'

# Clear cache
curl -X POST http://localhost:8000/admin/cache/clear
```

### 3. **Rate Limiting**
- **Limit**: 10 requests per 60 seconds
- **Applies to**: `/api/gemini/*` endpoints
- **Response**: HTTP 429 when exceeded
- **Adjust**: Edit `RATE_LIMIT_REQUESTS` in `backend/api.py`

---

## 🔍 Key Endpoints

### Health & Monitoring
```bash
GET  /                    # Basic health check
GET  /health              # Detailed service status
POST /admin/cache/clear   # Clear cache (admin)
```

### Policies
```bash
GET  /api/policies                     # List all policies (cached)
GET  /api/policies?limit=10&offset=0   # Paginated
GET  /api/policies/{id}                # Get specific policy
GET  /api/statistics                   # Database stats
GET  /api/providers                    # List providers
GET  /api/categories                   # List categories
```

### Gemini AI
```bash
POST /api/gemini          # Ask question (rate limited)
POST /api/gemini/analyze  # Get policy summary
```

---

## 🐛 Troubleshooting

### Problem: Slow responses
**Solution**:
```bash
# Check cache hit rate
curl http://localhost:8000/health | jq '.services.cache'

# If low, increase TTL in backend/api.py:
cache.set(cache_key, result, ttl=600)  # 10 min instead of 5
```

### Problem: Rate limit too strict
**Solution**:
```python
# In backend/api.py, change:
RATE_LIMIT_REQUESTS = 20  # from 10
RATE_LIMIT_WINDOW = 60    # keep at 60 seconds
```

### Problem: Database slow
**Solution**:
```bash
# Vacuum database
sqlite3 policies.db "VACUUM;"

# Verify indexes exist
sqlite3 policies.db ".indexes policies"
```

### Problem: Logs too verbose
**Solution**:
```python
# In backend/api.py, change logging level:
logging.basicConfig(level=logging.WARNING)  # from INFO
```

---

## 📊 Performance Tips

### Cache Optimization
```python
# For frequently accessed data, increase TTL
cache.set(key, value, ttl=3600)  # 1 hour

# For rarely changing data
cache.set(key, value, ttl=86400)  # 24 hours
```

### Database Optimization
```sql
-- Check query performance
EXPLAIN QUERY PLAN SELECT * FROM policies WHERE provider_name = 'Cocure';

-- Ensure indexes are used
-- Should show: "USING INDEX idx_provider_name"
```

### Rate Limit Tuning
```python
# For authenticated users, increase limit
RATE_LIMIT_REQUESTS = 50  # Higher for known users
RATE_LIMIT_WINDOW = 60

# For anonymous users, keep strict
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60
```

---

## 🔧 Configuration Files

### Updated Files:
- ✅ `backend/api.py` - Main API with improvements
- ✅ `backend/database.py` - Added indexes
- ✅ `backend/gemini_service.py` - Uses templates

### New Files:
- ✅ `backend/prompts.py` - Prompt templates
- ✅ `backend/cache.py` - Caching system
- ✅ `backend.log` - Application logs

### Config Variables (edit as needed):
```python
# backend/api.py
RATE_LIMIT_REQUESTS = 10      # Requests per window
RATE_LIMIT_WINDOW = 60        # Window in seconds

# backend/cache.py
default_ttl = 300             # Default cache TTL (5 min)

# backend/database.py
db_path = "policies.db"       # Database file path
```

---

## 📈 Monitoring Commands

### Daily Checks
```bash
# Error count
grep -c "ERROR" backend.log

# Rate limit hits
grep -c "Rate limit exceeded" backend.log

# Cache performance
curl -s http://localhost:8000/health | jq '.services.cache'
```

### Weekly Cleanup
```bash
# Clear old logs (keep last 1000 lines)
tail -1000 backend.log > backend.log.tmp && mv backend.log.tmp backend.log

# Clear cache
curl -X POST http://localhost:8000/admin/cache/clear

# Vacuum database
sqlite3 policies.db "VACUUM;"
```

---

## 🧪 Testing Commands

### Test Caching
```bash
# First call (slow, ~200ms)
time curl "http://localhost:8000/api/policies?limit=10"

# Second call (fast, ~2ms)
time curl "http://localhost:8000/api/policies?limit=10"
```

### Test Rate Limiting
```bash
# Send 15 rapid requests
for i in {1..15}; do
  curl -w "\n%{http_code}\n" \
    -X POST http://localhost:8000/api/gemini \
    -H "Content-Type: application/json" \
    -d "{\"policy_id\":\"test\",\"policy_name\":\"test\",\"policy_company\":\"test\",\"question\":\"test $i\"}"
done | grep "429" | wc -l
# Should show 5 (requests 11-15 blocked)
```

### Test Validation
```bash
# Should fail (question too short)
curl -X POST http://localhost:8000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"policy_id":"test","policy_name":"test","policy_company":"test","question":"hi"}'

# Should fail (question too long)
curl -X POST http://localhost:8000/api/gemini \
  -H "Content-Type: application/json" \
  -d "{\"policy_id\":\"test\",\"policy_name\":\"test\",\"policy_company\":\"test\",\"question\":\"$(python -c 'print("a"*1001)')\"}"
```

---

## 📝 Code Snippets

### Update a Prompt
```python
# Edit backend/prompts.py
POLICY_QA_PROMPT = """
Your new prompt here...
{policy_name}
{question}
"""
# No code changes needed, just restart server
```

### Adjust Cache TTL for Endpoint
```python
# In backend/api.py
@app.get("/api/policies")
async def get_policies(...):
    # ...
    cache.set(cache_key, result, ttl=600)  # Change from 300 to 600
```

### Add New Index
```python
# In backend/database.py, in init_database():
cursor.execute("CREATE INDEX IF NOT EXISTS idx_new_field ON policies(new_field)")
```

---

## 🔐 Security Notes

### Input Validation
- ✅ Questions: 3-1000 characters
- ✅ Policy IDs: Non-empty strings
- ✅ All inputs: Trimmed and sanitized

### Rate Limiting
- ✅ Per IP address
- ✅ Sliding window
- ✅ Gemini endpoints only

### Error Handling
- ✅ No sensitive data in errors
- ✅ Stack traces logged only
- ✅ User-friendly messages

---

## 📚 Documentation Links

### Internal Docs:
- [Improvements Summary](./IMPROVEMENTS_SUMMARY.md)
- [Next Steps](./NEXT_STEPS.md)
- [Backend Integration](./BACKEND_INTEGRATION_SUMMARY.md)

### External Resources:
- FastAPI: https://fastapi.tiangolo.com
- Pydantic: https://docs.pydantic.dev
- SQLite: https://www.sqlite.org/docs.html

---

## 🎯 Common Tasks

### Change Rate Limit
1. Edit `backend/api.py`
2. Modify `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW`
3. Restart server
4. Test with curl commands above

### Update Prompt
1. Edit `backend/prompts.py`
2. Modify `POLICY_QA_PROMPT` or `POLICY_SUMMARY_PROMPT`
3. Restart server
4. No code changes needed

### Add New Index
1. Edit `backend/database.py`
2. Add `cursor.execute("CREATE INDEX ...")`
3. Delete `policies.db` (backup first!)
4. Reload data: `python load_data.py`

### Clear All Caches
```bash
# Clear application cache
curl -X POST http://localhost:8000/admin/cache/clear

# Clear browser cache
# Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
```

---

## 🚨 Emergency Procedures

### API Down
```bash
# Check if running
curl http://localhost:8000/health

# Restart
pkill -f "python -m backend.api"
python -m backend.api

# Check logs
tail -50 backend.log
```

### High Error Rate
```bash
# Check recent errors
tail -100 backend.log | grep ERROR

# Clear cache (might help)
curl -X POST http://localhost:8000/admin/cache/clear

# Restart services
pkill -f "python -m backend.api"
python -m backend.api
```

### Database Locked
```bash
# Kill all connections
pkill -f "python -m backend.api"

# Vacuum database
sqlite3 policies.db "PRAGMA integrity_check;"
sqlite3 policies.db "VACUUM;"

# Restart
python -m backend.api
```

---

## ✅ Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Logs being monitored
- [ ] Cache hit rate > 70%
- [ ] Rate limiting tested
- [ ] Error rate < 0.1%
- [ ] Database indexed
- [ ] Frontend working
- [ ] Documentation updated

---

**Last Updated**: October 3, 2025
**Maintained By**: Development Team
**Questions?**: Check logs first, then documentation
