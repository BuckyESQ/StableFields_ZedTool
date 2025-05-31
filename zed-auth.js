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
     * Parses JWT token to extract payload
     */
    parseJwt(token) {
        try {
            // Remove Bearer prefix if present
            if (token.startsWith('Bearer ')) {
                token = token.substring(7);
            }
            
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing JWT:', e);
            throw e;
        }
    }
    /**
     * Sets the auth token and stores it securely.
     * 
     * @param {string} token - The JWT token to be stored.
     * @returns {boolean} - Returns `true` if the token is successfully validated and stored, 
     *                      `false` if the token is invalid or an error occurs during validation/storage.
     */
    setToken(token) {
        try {
            // Validate token format
            if (!token) {
                console.error("Token is empty or invalid");
                return false;
            }
            
            // Parse JWT token
            const payload = this.parseJwt(token);
            
            // Validate expiration
            if (!payload.exp || isNaN(payload.exp)) {
                console.warn("Token does not contain a valid expiration time");
                return false;
            }
            
            // Store token and expiry information
            localStorage.setItem(this.tokenKey, token);
            
            const expiryDate = new Date(payload.exp * 1000);
            if (isNaN(expiryDate.getTime())) {
                console.error("Invalid expiration timestamp in token");
                return false;
            }
            
            localStorage.setItem(this.tokenExpiryKey, expiryDate.toISOString());
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
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.tokenExpiryKey);
    }

    formatRemainingTime(remaining) {
        if (remaining <= 0) return "Expired";
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
}

// Create global instance
window.zedAuth = new ZedAuthManager();