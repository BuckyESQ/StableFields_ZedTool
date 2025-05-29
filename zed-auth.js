/**
 * ZED Champions Auth Token Management
 * Handles secure storage, validation, and refresh of API tokens
 */
class ZedAuthManager {
    constructor() {
        this.tokenKey = 'zedTrackerAuthToken';
        this.tokenExpiryKey = 'zedTrackerAuthTokenExpiry';
        this.refreshing = false;
    }

    /**
     * Sets the auth token and stores it securely
     */
    setToken(token) {
        if (!token) return false;
        
        try {
            // Validate the token is a proper JWT
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error("Invalid JWT format");
                return false;
            }
            
            // Extract expiration time
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (!payload.exp) {
                console.warn("Token does not contain expiration time");
            }
            
            // Store token and expiry time
            localStorage.setItem(this.tokenKey, token);
            
            if (payload.exp) {
                const expiryDate = new Date(payload.exp * 1000);
                localStorage.setItem(this.tokenExpiryKey, expiryDate.toISOString());
                console.log("Token expires at:", expiryDate.toLocaleString());
            }
            
            return true;
        } catch (e) {
            console.error("Error setting token:", e);
            return false;
        }
    }

    /**
     * Gets the stored auth token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Checks if the token is expired
     */
    isTokenExpired() {
        if (!this.getToken()) return true;
        
        try {
            const token = this.getToken();
            const payload = this.parseJwt(token);
            
            // Get expiry from payload (exp is in seconds since epoch)
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            
            // Store expiry time for reference
            localStorage.setItem(this.tokenExpiryKey, new Date(expiryTime).toISOString());
            
            console.log('Token expiry check:', {
                now: new Date(now).toISOString(),
                expiryTime: new Date(expiryTime).toISOString(),
                timeLeft: Math.round((expiryTime - now) / (60 * 1000)) + ' minutes',
                expired: now >= expiryTime
            });
            
            // Simple check: is current time past expiration? (removed buffer)
            return now >= expiryTime;
        } catch (e) {
            console.error('Error checking token expiration:', e);
            return true; // Assume expired on error
        }
    }
    /**
     * Gets token expiry details
     */
    getTokenExpiry() {
        const expiryStr = localStorage.getItem(this.tokenExpiryKey);
        if (!expiryStr) return null;
        
        return {
            date: new Date(expiryStr),
            remaining: Math.max(0, new Date(expiryStr).getTime() - Date.now()),
            expired: this.isTokenExpired()
        };
    }

    /**
     * Formats remaining time in a human-readable format
     */
    formatRemainingTime(remaining) {
        if (remaining <= 0) return "Expired";
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m remaining`;
    }

    /**
     * Clears the stored token
     */
    clearToken() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.tokenExpiryKey);
    }
}

// Create global instance
window.zedAuth = new ZedAuthManager();