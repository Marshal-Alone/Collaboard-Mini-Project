# Keep-Alive System Documentation

## Overview
The Keep-Alive system prevents Render's free tier from spinning down your application after 10 minutes of inactivity by sending periodic ping requests to keep the server active.

## Features

### 1. Automatic Keep-Alive Pings
- **Interval**: Pings sent every 10 minutes
- **Auto-start**: Activates automatically when any page loads
- **Smart Recovery**: Resumes pinging when user returns to the tab

### 2. Health Dashboard
Access the dashboard at: `http://your-domain.com/health` or `http://localhost:5050/health`

The dashboard displays:
- **Server Status**: Real-time active/inactive indicator
- **Server Uptime**: Time since server started
- **Last Ping**: When the last keep-alive request was sent
- **Total Pings**: Count of all keep-alive requests
- **Ping Interval**: Time between automatic pings
- **Countdown Progress**: Visual progress bar showing time until next ping
- **Manual Controls**: Refresh status, send immediate ping, pause auto-refresh

### 3. Integration Points
The keep-alive service is integrated into:
- Homepage (`index.html`)
- Board page (`board.html`)
- Authentication page (`auth.html`)

## API Endpoints

### POST `/api/ping`
Send a keep-alive ping to the server.

**Request:**
```http
POST /api/ping
Content-Type: application/json
```

**Response:**
```json
{
  "message": "Pong",
  "timestamp": 1697123456789,
  "nextPing": 1697124056789
}
```

### GET `/api/health`
Get current server health and keep-alive status.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "active",
  "uptime": {
    "milliseconds": 3600000,
    "formatted": "0d 1h 0m 0s"
  },
  "lastPing": {
    "timestamp": 1697123456789,
    "ago": 30000,
    "formatted": "30s"
  },
  "nextPing": {
    "timestamp": 1697124056789,
    "in": 570000,
    "formatted": "9m 30s"
  },
  "pingCount": 42,
  "pingInterval": {
    "milliseconds": 600000,
    "formatted": "10m"
  },
  "startTime": 1697119856789
}
```

## Frontend Usage

### Using the KeepAliveService Class

```javascript
// Service is automatically started on page load
// Access the global instance
const service = window.keepAliveService;

// Get service status
const status = service.getStatus();
console.log(status);
// {
//   isActive: true,
//   interval: 600000,
//   lastPingTime: 1697123456789,
//   nextPingTime: 1697124056789
// }

// Manually send a ping
service.ping();

// Stop the service
service.stop();

// Start the service
service.start();

// Register callbacks
service.onPing((data) => {
  console.log('Ping sent successfully:', data);
});

service.onError((error) => {
  console.error('Ping failed:', error);
});

service.onHealthUpdate((health) => {
  console.log('Health update:', health);
});

// Get current health
const health = await service.getHealth();
```

### Manual Integration

To add keep-alive to a new page:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Other head content -->
  <script src="keepalive.js"></script>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

That's it! The service will automatically start when the page loads.

## Configuration

### Changing the Ping Interval

**Frontend** (`keepalive.js`):
```javascript
const keepAliveService = new KeepAliveService({
  interval: 5 * 60 * 1000  // Change to 5 minutes
});
```

**Backend** (`server.js`):
```javascript
const serverHealth = {
  // ... other properties
  pingInterval: 5 * 60 * 1000  // Change to match frontend
};
```

⚠️ **Important**: Keep both frontend and backend intervals synchronized!

## How It Works

1. **Page Load**: When any page loads, `keepalive.js` automatically starts
2. **Initial Ping**: Sends immediate ping to `/api/ping`
3. **Server Response**: Backend updates `lastPing` and `nextPing` timestamps
4. **Recurring Pings**: Timer sends ping every 10 minutes
5. **Visibility Change**: Sends immediate ping when user returns to tab
6. **Health Tracking**: All ping data tracked for dashboard display

## Benefits for Render Free Tier

- **Prevents Spin-Down**: Keeps server active 24/7
- **No Cost**: Free tier remains free
- **Automatic**: No manual intervention needed
- **Reliable**: Multiple pages ensure redundancy
- **Transparent**: Dashboard shows exactly what's happening

## Monitoring

### Check if Keep-Alive is Working

1. Visit the health dashboard at `/health`
2. Check "Last Ping" - should update every 10 minutes
3. Check "Total Pings" - should increment over time
4. Check "Server Uptime" - should show continuous uptime

### Console Logs

The service logs its activity:
```
[KeepAlive] Service initialized with interval: 600 seconds
[KeepAlive] Service started
[KeepAlive] Ping successful: Pong
[KeepAlive] Auto-started on page load
```

## Troubleshooting

### Pings Not Sending
1. Check browser console for errors
2. Verify `keepalive.js` is loaded
3. Check network tab for failed requests

### Server Still Spinning Down
1. Ensure ping interval is < 10 minutes
2. Check that at least one page is always open
3. Verify backend `/api/ping` route is working

### Dashboard Not Updating
1. Check auto-refresh is enabled (not paused)
2. Verify `/api/health` endpoint is accessible
3. Check browser console for errors

## Production Deployment on Render

The system works automatically on Render. No additional configuration needed!

### Environment Variables (Optional)
```env
# No special env vars required for keep-alive
# Standard deployment vars apply
PORT=5050
MONGODB_URI=your_mongodb_connection_string
```

## Performance Impact

- **Bandwidth**: ~1KB per ping = ~144KB per day
- **Server Load**: Minimal, simple JSON response
- **Database**: No database queries in ping endpoint
- **Cost**: Free tier limits unaffected

## Advanced Features

### Custom Health Checks
Add your own health metrics to the `/api/health` endpoint:

```javascript
app.get("/api/health", (req, res) => {
  // ... existing code
  res.status(200).json({
    // ... existing health data
    custom: {
      activeUsers: Object.keys(rooms).length,
      totalBoards: await Board.countDocuments()
    }
  });
});
```

### Alerts and Notifications
Add monitoring alerts:

```javascript
service.onError((error) => {
  // Send alert email, Slack message, etc.
  console.error('Keep-alive failed - alert sent!');
});
```

## Best Practices

1. ✅ Keep ping interval under 10 minutes
2. ✅ Monitor the dashboard regularly
3. ✅ Check server logs for ping confirmations
4. ✅ Test on staging before production
5. ❌ Don't set interval too low (< 5 minutes)
6. ❌ Don't rely on single page - use multiple

## Support

For issues or questions:
1. Check browser console for errors
2. Review server logs for ping activity
3. Verify network connectivity
4. Check Render dashboard for deployment status

---

**Last Updated**: 2025-10-18
**Version**: 1.0.0
