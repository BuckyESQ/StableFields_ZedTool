/**
 * ZED Champions API Service
 * Handles all API interactions with proper authentication
 */
class ZedApiService {
    constructor() {
        this.baseUrl = 'https://api.zedchampions.com/v1';
        this.endpointsUrl = 'https://pcast.phenixrts.com/pcast/endPoints';
    }

    /**
     * Test the API connection and token validity
     */
    async testConnection() {
        try {
            if (!window.zedAuth.getToken()) {
                return { success: false, message: "No authentication token set" };
            }
            
            if (window.zedAuth.isTokenExpired()) {
                const expiry = window.zedAuth.getTokenExpiry();
                return { 
                    success: false, 
                    message: "Authentication token has expired. Please obtain a new token from ZED Champions."
                };
            }
            
            const response = await this.authenticatedFetch('/account');
            
            if (response.ok) {
                const data = await response.json();
                const expiry = window.zedAuth.getTokenExpiry();
                
                let expiryMsg = '';
                if (expiry) {
                    expiryMsg = ` Token ${window.zedAuth.formatRemainingTime(expiry.remaining)}.`;
                }
                
                return { 
                    success: true, 
                    message: `Connected to ZED Champions API as ${data.username || 'authenticated user'}.${expiryMsg}`,
                    data: data
                };
            } else {
                let errorMsg;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.error || `API Error: ${response.status} ${response.statusText}`;
                } catch (e) {
                    errorMsg = `API Error: ${response.status} ${response.statusText}`;
                }
                
                if (response.status === 401) {
                    window.zedAuth.clearToken(); // Clear invalid token
                    errorMsg = "Authentication token is invalid. Please obtain a new token.";
                }
                
                return { success: false, message: errorMsg };
            }
        } catch (error) {
            console.error("API connection error:", error);
            return { 
                success: false, 
                message: `Connection error: ${error.message}. Please check your internet connection.`
            };
        }
    }

    /**
     * Helper method for authenticated API requests
     */
    async authenticatedFetch(endpoint, options = {}) {
        const token = window.zedAuth.getToken();
        
        if (!token) {
            throw new Error("No authentication token available");
        }
        
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        if (options.body) {
            defaultOptions.body = JSON.stringify(options.body);
        }
        
        return fetch(url, defaultOptions);
    }

    /**
     * Fetch all horses from stable (racing or breeding)
     */
    async fetchAllHorses(type = 'racing') {
        try {
            const endpoint = type === 'racing' ? '/stable/racing' : '/stable/breeding';
            const response = await this.authenticatedFetch(endpoint);
            
            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.error || `API Error: ${response.status} ${response.statusText}`;
                } catch (e) {
                    errorMsg = `API Error: ${response.status} ${response.statusText}`;
                }
                return { success: false, message: errorMsg };
            }
            
            const data = await response.json();
            return { success: true, data: data.horses || [] };
            
        } catch (error) {
            console.error("Error fetching horses:", error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    /**
     * Fetch a specific horse by ID
     */
    async fetchHorse(horseId) {
        try {
            if (!horseId) {
                return { success: false, message: "No horse ID provided" };
            }
            
            const response = await this.authenticatedFetch(`/horses/${horseId}`);
            
            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.error || `API Error: ${response.status} ${response.statusText}`;
                } catch (e) {
                    errorMsg = `API Error: ${response.status} ${response.statusText}`;
                }
                return { success: false, message: errorMsg };
            }
            
            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error("Error fetching horse:", error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    /**
     * Search for horses by name or other criteria
     */
    async searchHorses(query) {
        try {
            if (!query) {
                return { success: false, message: "No search query provided" };
            }
            
            const response = await this.authenticatedFetch(`/horses/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.error || `API Error: ${response.status} ${response.statusText}`;
                } catch (e) {
                    errorMsg = `API Error: ${response.status} ${response.statusText}`;
                }
                return { success: false, message: errorMsg };
            }
            
            const data = await response.json();
            return { success: true, data: data.results || [] };
            
        } catch (error) {
            console.error("Error searching horses:", error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }
}

// Create global instance
window.zedApi = new ZedApiService();