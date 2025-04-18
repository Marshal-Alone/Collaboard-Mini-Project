// Keep-Alive Service for maintaining server activity
class KeepAliveService {
    constructor(config = {}) {
        this.interval = config.interval || 10 * 60 * 1000; // Default: 10 minutes
        this.apiUrl = config.apiUrl || window.location.origin;
        this.pingEndpoint = `${this.apiUrl}/api/ping`;
        this.healthEndpoint = `${this.apiUrl}/api/health`;
        this.timerId = null;
        this.isActive = false;
        this.lastPingTime = null;
        this.nextPingTime = null;
        this.callbacks = {
            onPing: [],
            onError: [],
            onHealthUpdate: []
        };
        
        console.log('[KeepAlive] Service initialized with interval:', this.interval / 1000, 'seconds');
    }

    // Start the keep-alive pings
    start() {
        if (this.isActive) {
            console.log('[KeepAlive] Service already running');
            return;
        }

        this.isActive = true;
        console.log('[KeepAlive] Service started');

        // Send initial ping immediately
        this.ping();

        // Set up recurring pings
        this.timerId = setInterval(() => {
            this.ping();
        }, this.interval);
    }

    // Stop the keep-alive pings
    stop() {
        if (!this.isActive) {
            console.log('[KeepAlive] Service already stopped');
            return;
        }

        this.isActive = false;
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        console.log('[KeepAlive] Service stopped');
    }

    // Send a ping to the server
    async ping() {
        try {
            const response = await fetch(this.pingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Ping failed with status: ${response.status}`);
            }

            const data = await response.json();
            this.lastPingTime = Date.now();
            this.nextPingTime = data.nextPing || (Date.now() + this.interval);

            console.log('[KeepAlive] Ping successful:', data.message);

            // Trigger callbacks
            this.callbacks.onPing.forEach(callback => callback(data));

        } catch (error) {
            console.error('[KeepAlive] Ping failed:', error);
            
            // Trigger error callbacks
            this.callbacks.onError.forEach(callback => callback(error));
        }
    }

    // Get current health status from server
    async getHealth() {
        try {
            const response = await fetch(this.healthEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Health check failed with status: ${response.status}`);
            }

            const healthData = await response.json();
            
            // Trigger health update callbacks
            this.callbacks.onHealthUpdate.forEach(callback => callback(healthData));

            return healthData;

        } catch (error) {
            console.error('[KeepAlive] Health check failed:', error);
            this.callbacks.onError.forEach(callback => callback(error));
            return null;
        }
    }

    // Register callback for ping events
    onPing(callback) {
        this.callbacks.onPing.push(callback);
    }

    // Register callback for error events
    onError(callback) {
        this.callbacks.onError.push(callback);
    }

    // Register callback for health updates
    onHealthUpdate(callback) {
        this.callbacks.onHealthUpdate.push(callback);
    }

    // Get service status
    getStatus() {
        return {
            isActive: this.isActive,
            interval: this.interval,
            lastPingTime: this.lastPingTime,
            nextPingTime: this.nextPingTime
        };
    }
}

// Create a global instance
window.keepAliveService = new KeepAliveService();

// Auto-start when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Start keep-alive service
    window.keepAliveService.start();
    console.log('[KeepAlive] Auto-started on page load');
});

// Also start immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.keepAliveService.start();
    console.log('[KeepAlive] Started immediately');
}

// Restart on page visibility change (when user comes back to the tab)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.keepAliveService) {
        if (!window.keepAliveService.isActive) {
            window.keepAliveService.start();
            console.log('[KeepAlive] Restarted on visibility change');
        } else {
            // Send an immediate ping when user returns
            window.keepAliveService.ping();
            console.log('[KeepAlive] Immediate ping on visibility change');
        }
    }
});
