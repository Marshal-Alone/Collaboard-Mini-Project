# Keep-Alive Strategy for Render Deployment

## Problem
Render's free tier shuts down servers after **15 minutes of inactivity**. When a user visits the Vercel-hosted frontend after this period, the backend takes a long time (up to 15 minutes) to wake up, resulting in a poor user experience.

## Solution: Aggressive Keep-Alive Strategy

### How It Works

#### 1. **Immediate Wake-Up on Page Load**
- The keep-alive service starts automatically as soon as ANY page loads
- An immediate ping is sent to wake up the server
- Works on all pages: `index.html`, `auth.html`, `board.html`, `health.html`

#### 2. **Two-Tier Ping Interval**

**Short Interval (2 minutes):**
- Used when the server is cold or just waking up
- Sends frequent pings to keep the server responsive
- Active for the first 3 successful pings

**Long Interval (4 minutes):**
- Used once the server is confirmed warm
- Maintains server activity without overwhelming it
- Switches back to short interval on any ping failure

#### 3. **Smart Server Detection**
```javascript
// Automatic environment detection
const isLocalhost = window.location.hostname === 'localhost';
this.apiUrl = isLocalhost 
    ? 'http://localhost:5050' 
    : 'https://collaborative-whiteboard-i6ri.onrender.com';
```

#### 4. **Cold Start Detection**
- Monitors response times
- If a ping takes > 5 seconds, logs it as a cold start
- Automatically resets to aggressive short interval on failures

### Configuration

**Current Settings:**
- Short Interval: **2 minutes** (120,000 ms)
- Long Interval: **4 minutes** (240,000 ms)
- Timeout: **30 seconds** for cold starts

**Why These Intervals?**
- Render shuts down after 15 minutes of inactivity
- 4-minute pings = 3-4 pings within 15 minutes (safe buffer)
- 2-minute aggressive pings ensure faster recovery from cold starts

### Implementation Details

#### Files Modified

1. **`frontend/keepalive.js`**
   - Enhanced with two-tier interval system
   - Added cold start detection
   - Improved error handling and retry logic

2. **All HTML Pages**
   - `index.html` ✅ (already had it)
   - `auth.html` ✅ (added)
   - `board.html` ✅ (already had it)
   - `health.html` ✅ (added)
   - `page2.html` ✅ (added)

3. **Backend `server.js`**
   - Already has `/api/ping` endpoint
   - Already has `/api/health` endpoint

### How to Test

#### Test 1: Immediate Wake-Up
1. Wait for Render server to go cold (15+ minutes)
2. Visit your Vercel frontend URL
3. Open browser console
4. You should see: `[KeepAlive] Ping successful (server was cold, took X.Xs)`

#### Test 2: Interval Switching
1. Visit any page
2. Watch console logs
3. First 3 pings: every 2 minutes
4. After 3rd success: "switching to maintenance interval: 4 seconds"
5. Subsequent pings: every 4 minutes

#### Test 3: Error Recovery
1. Stop your local server (if testing locally)
2. Watch console for error
3. Service automatically resets to 2-minute interval
4. Restart server
5. Service recovers and resumes pinging

### Console Logs to Expect

```
[KeepAlive] Service initialized
[KeepAlive] API URL: https://collaborative-whiteboard-i6ri.onrender.com
[KeepAlive] Short interval: 120 seconds
[KeepAlive] Long interval: 240 seconds
[KeepAlive] Service started with aggressive wake-up strategy
[KeepAlive] Ping successful (1523ms)
[KeepAlive] Ping successful (456ms)
[KeepAlive] Ping successful (389ms)
[KeepAlive] Server warmed up, switching to maintenance interval: 240 seconds
```

### Benefits

✅ **Instant Wake-Up**: Server starts warming up the moment a user loads any page  
✅ **Smart Resource Usage**: Switches to longer intervals once server is warm  
✅ **Automatic Recovery**: Detects failures and switches back to aggressive mode  
✅ **Universal Coverage**: Works on all pages, not just the board  
✅ **Transparent**: User doesn't need to do anything special  

### Monitoring

Use the **Health Dashboard** (`/health.html`) to monitor:
- Server uptime
- Last ping time
- Next ping countdown
- Total ping count
- Current ping interval

### Future Improvements

If needed, you can further optimize by:
1. Reducing short interval to 90 seconds (more aggressive)
2. Adding exponential backoff on repeated failures
3. Using WebSockets for real-time server status
4. Implementing service workers for background pings

### Notes

- The keep-alive service runs entirely in the frontend
- No backend changes required (endpoints already exist)
- Works seamlessly across Vercel (frontend) and Render (backend)
- Does not interfere with actual application functionality
