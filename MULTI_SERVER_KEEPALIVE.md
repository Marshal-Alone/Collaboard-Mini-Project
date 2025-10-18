# Multi-Server Keep-Alive Configuration

## 🎯 Overview

The keep-alive system now supports **pinging multiple backend servers simultaneously**. This is perfect when you have multiple Render services that all need to stay alive.

---

## ⚙️ How It Works

### Primary Server
- Your main application server (Collaboard)
- Receives POST requests to `/api/ping`
- Controls the ping interval logic (2min aggressive → 4min maintenance)
- Determines when to switch intervals

### Additional Servers
- Secondary backend services you want to keep alive
- Receive GET requests to `/api/health`
- Pinged in parallel (non-blocking)
- Don't affect the primary server's interval logic

---

## 🔧 Configuration

### In `keepalive.js`

The additional servers are configured in the service initialization:

```javascript
window.keepAliveService = new KeepAliveService({
    shortInterval: 2 * 60 * 1000,  // 2 minutes
    longInterval: 4 * 60 * 1000,   // 4 minutes
    additionalServers: [
        'https://farm-connnect.onrender.com',  // ← Your additional server
        // Add more servers here:
        // 'https://your-other-app.onrender.com',
        // 'https://another-service.onrender.com'
    ]
});
```

### Adding More Servers

To add more servers to keep alive, simply add them to the `additionalServers` array:

```javascript
additionalServers: [
    'https://farm-connnect.onrender.com',
    'https://my-api-server.onrender.com',
    'https://my-websocket-server.onrender.com',
    'https://my-image-service.onrender.com'
]
```

### Removing Servers

To remove a server, delete its line from the array:

```javascript
// Before:
additionalServers: [
    'https://farm-connnect.onrender.com',
    'https://unwanted-server.onrender.com'  // Remove this
]

// After:
additionalServers: [
    'https://farm-connnect.onrender.com'
]
```

---

## 📊 Ping Flow

### Single Ping Cycle

```
1. Timer triggers ping()
   ↓
2. Send POST to primary server /api/ping
   ↓
3. Wait for response
   ↓
4. Update interval logic based on response
   ↓
5. Send GET to all additional servers /api/health (parallel)
   ↓
6. Don't wait - let them complete in background
   ↓
7. Schedule next ping
```

### Timing Diagram

```
Time: 0s
├─ Ping Primary Server → Response in 450ms
│  └─ Success! (consecutiveSuccesses++)
│
├─ Ping farm-connnect.onrender.com → Response in 12.3s
│  └─ Success (cold start)
│
Time: 120s (2 minutes later)
├─ Ping Primary Server → Response in 380ms
│  └─ Success! (consecutiveSuccesses++)
│
├─ Ping farm-connnect.onrender.com → Response in 420ms
│  └─ Success (now warm)
│
Time: 240s (2 more minutes)
├─ Ping Primary Server → Response in 390ms
│  └─ Success! (consecutiveSuccesses = 3)
│  └─ Switch to 4-minute interval
│
├─ Ping farm-connnect.onrender.com → Response in 380ms
│  └─ Success
│
Time: 480s (4 minutes later)
└─ Repeat...
```

---

## 🔍 Console Logs

### Expected Logs on Page Load

```javascript
[KeepAlive] Service initialized
[KeepAlive] Primary API URL: https://collaborative-whiteboard-i6ri.onrender.com
[KeepAlive] Additional servers: 1
[KeepAlive]   1. https://farm-connnect.onrender.com
[KeepAlive] Short interval: 120 seconds
[KeepAlive] Long interval: 240 seconds
[KeepAlive] Service started with aggressive wake-up strategy
[KeepAlive] Primary server ping successful (456ms)
[KeepAlive] Additional server 1 (https://farm-connnect.onrender.com) ping successful (was cold, took 12.3s)
[KeepAlive] Additional servers: 1/1 pinged successfully
```

### Expected Logs After Multiple Pings

```javascript
[KeepAlive] Primary server ping successful (389ms)
[KeepAlive] Additional server 1 (https://farm-connnect.onrender.com) ping successful (410ms)
[KeepAlive] Additional servers: 1/1 pinged successfully
[KeepAlive] Primary server ping successful (401ms)
[KeepAlive] Additional server 1 (https://farm-connnect.onrender.com) ping successful (385ms)
[KeepAlive] Additional servers: 1/1 pinged successfully
[KeepAlive] Server warmed up, switching to maintenance interval: 240 seconds
```

### Logs with Multiple Additional Servers

```javascript
[KeepAlive] Primary server ping successful (423ms)
[KeepAlive] Additional server 1 (https://farm-connnect.onrender.com) ping successful (401ms)
[KeepAlive] Additional server 2 (https://my-api-server.onrender.com) ping successful (523ms)
[KeepAlive] Additional server 3 (https://my-websocket-server.onrender.com) ping successful (was cold, took 14.2s)
[KeepAlive] Additional servers: 3/3 pinged successfully
```

---

## 🚨 Error Handling

### If Additional Server Fails

The keep-alive system continues to function normally even if additional servers fail:

```javascript
[KeepAlive] Primary server ping successful (412ms)
[KeepAlive] Additional server 1 (https://farm-connnect.onrender.com) ping failed: Failed to fetch
[KeepAlive] Additional servers: 0/1 pinged successfully
// Primary server keeps working, interval logic unaffected
```

### If Primary Server Fails

If the primary server fails, additional servers are still pinged:

```javascript
[KeepAlive] Primary server ping failed after 30.0s: AbortError: The operation was aborted
// Still tries to ping additional servers
[KeepAlive] Additional server 1 (https://farm-connnect.onrender.com) ping successful (425ms)
[KeepAlive] Additional servers: 1/1 pinged successfully
```

---

## 🎛️ Health Dashboard

### Continuous Ping with Multiple Servers

When you enable "Continuous Ping" in the health dashboard (`/health.html`), it will ping:
1. **Primary server** (`collaborative-whiteboard-i6ri.onrender.com`) via `/api/ping`
2. **Additional server** (`farm-connnect.onrender.com`) via `/api/health`

**Console output:**
```javascript
[Continuous Ping] #1 Primary server successful (456ms)
[Continuous Ping] Additional server (https://farm-connnect.onrender.com) successful (421ms)
```

---

## 📝 Backend Requirements

### For Primary Server

**Must have** `/api/ping` POST endpoint:
```javascript
app.post("/api/ping", (req, res) => {
    serverHealth.lastPing = Date.now();
    serverHealth.pingCount++;
    serverHealth.status = 'active';
    
    res.status(200).json({
        message: "Pong",
        timestamp: serverHealth.lastPing
    });
});
```

### For Additional Servers

**Must have** `/api/health` GET endpoint:
```javascript
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: 'active',
        timestamp: Date.now()
    });
});
```

**Important:** Additional servers ONLY need `/api/health` (GET). They don't need `/api/ping` (POST).

---

## ⚡ Performance Impact

### Network Requests Per Ping Cycle

With 1 additional server:
- **2 HTTP requests** per ping cycle
  - 1 POST to primary server
  - 1 GET to additional server

With 3 additional servers:
- **4 HTTP requests** per ping cycle
  - 1 POST to primary server
  - 3 GET requests to additional servers

### Timing Impact

- Additional server pings are **non-blocking**
- Primary server's response time determines interval switching
- Total ping time ≈ max(primary response time, slowest additional server)
- But the script doesn't wait for additional servers before scheduling next ping

---

## 🧪 Testing

### Test Multi-Server Configuration

1. **Open browser console** (F12)
2. **Visit any page** on your frontend
3. **Check for initialization logs:**
   ```javascript
   [KeepAlive] Primary API URL: https://collaborative-whiteboard-i6ri.onrender.com
   [KeepAlive] Additional servers: 1
   [KeepAlive]   1. https://farm-connnect.onrender.com
   ```
4. **Check for successful pings:**
   ```javascript
   [KeepAlive] Primary server ping successful (456ms)
   [KeepAlive] Additional server 1 (...) ping successful (421ms)
   [KeepAlive] Additional servers: 1/1 pinged successfully
   ```

### Test Additional Server Response

Manually test the additional server's health endpoint:
```bash
curl https://farm-connnect.onrender.com/api/health
```

Expected response:
```json
{
  "status": "active",
  "timestamp": 1697889123456,
  ...
}
```

---

## 🔄 Migration Guide

### From Single Server to Multi-Server

**Before** (single server):
```javascript
window.keepAliveService = new KeepAliveService({
    shortInterval: 2 * 60 * 1000,
    longInterval: 4 * 60 * 1000
});
```

**After** (multi-server):
```javascript
window.keepAliveService = new KeepAliveService({
    shortInterval: 2 * 60 * 1000,
    longInterval: 4 * 60 * 1000,
    additionalServers: [
        'https://farm-connnect.onrender.com'
    ]
});
```

**Steps:**
1. Update `keepalive.js` with new code
2. Add `additionalServers` array to configuration
3. Ensure additional server has `/api/health` endpoint
4. Deploy and test
5. Check console for successful pings

---

## 🎯 Use Cases

### Scenario 1: Multiple Independent Services

You have:
- Main app: `collaborative-whiteboard.onrender.com`
- API server: `farm-connnect.onrender.com`
- Image processing: `image-service.onrender.com`

**Solution:**
```javascript
additionalServers: [
    'https://farm-connnect.onrender.com',
    'https://image-service.onrender.com'
]
```

### Scenario 2: Microservices Architecture

You have:
- Frontend gateway: (primary)
- Auth service
- Data service
- Notification service

**Solution:**
```javascript
additionalServers: [
    'https://auth-service.onrender.com',
    'https://data-service.onrender.com',
    'https://notification-service.onrender.com'
]
```

### Scenario 3: Multi-Region Deployment

You have:
- US server (primary)
- EU server
- Asia server

**Solution:**
```javascript
additionalServers: [
    'https://app-eu.onrender.com',
    'https://app-asia.onrender.com'
]
```

---

## ⚠️ Important Notes

### 1. CORS Configuration

All additional servers must allow CORS from your frontend domain:

```javascript
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});
```

### 2. Rate Limiting

Render may have rate limits. If you have many additional servers:
- Consider increasing ping interval
- Monitor for rate limit errors
- Stagger ping requests if needed

### 3. Dependency

Primary server's health determines interval switching. Additional servers are passive - they don't affect the ping schedule.

---

## 🐛 Troubleshooting

### Issue: Additional Server Not Being Pinged

**Check:**
1. Console shows additional server in initialization logs
2. Server has `/api/health` endpoint
3. Server allows CORS
4. Server URL is correct (no trailing slash)

### Issue: "Failed to fetch" Error for Additional Server

**Causes:**
- Server is down
- CORS not configured
- Network issue
- Wrong URL

**Solution:**
```bash
# Test manually:
curl https://farm-connnect.onrender.com/api/health

# Should return JSON with status 200
```

### Issue: Pings Successful but Server Still Sleeps

**Solution:**
- Check ping interval (might be too long)
- Verify server is actually receiving requests
- Check server logs on Render dashboard
- Ensure `/api/health` endpoint doesn't just return 200 but actually keeps server active

---

## 📊 Summary

| Feature | Primary Server | Additional Servers |
|---------|---------------|-------------------|
| **Endpoint** | `/api/ping` (POST) | `/api/health` (GET) |
| **Controls Interval** | Yes | No |
| **Blocking** | Yes (waits for response) | No (fires and forgets) |
| **Affects Logic** | Yes | No |
| **Required** | Yes | Optional |
| **Error Tolerance** | Retries with aggressive interval | Continues silently |

---

## 🚀 Quick Reference

### Add a New Server
```javascript
// In keepalive.js, find this section:
additionalServers: [
    'https://farm-connnect.onrender.com',
    'https://your-new-server.onrender.com'  // Add here
]
```

### Remove a Server
```javascript
// Delete the line:
additionalServers: [
    // 'https://old-server.onrender.com',  // Removed
    'https://farm-connnect.onrender.com'
]
```

### Check Status
```javascript
// In browser console:
window.keepAliveService.additionalServers
// Returns: ['https://farm-connnect.onrender.com']
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-18  
**Feature**: Multi-Server Keep-Alive  
**Status**: Production Ready ✅
