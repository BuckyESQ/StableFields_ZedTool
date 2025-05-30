/**
 * ZedApiService - Service for making API calls to ZED Champions API
 * Handles authentication token management and API response processing
 */

class ZedApiService {
    constructor() {
        // Detect if we're on the production domain
        this.isProduction = window.location.hostname.includes('stablefields.com');
        
        // Configure API settings based on environment
        this.apiBase = 'https://api.zedchampions.com';
        this.authManager = window.zedAuth;
        
       // For production, we NEED to use the proxy
        this.useProxy = true; // Changed from !this.isProduction to always use proxy
        this.proxyUrl = 'https://corsproxy.io/?';
        
        console.log(`Running in ${this.isProduction ? 'production' : 'development'} mode with proxy: ${this.useProxy}`);
    }

    /**
     * Make an API request to the ZED Champions API
     * @param {string} endpoint - API endpoint (with or without leading slash)
     * @param {object} options - Fetch options
     * @returns {Promise<Response>} - Fetch response
     */
    async fetchFromApi(endpoint, options = {}) {
        try {
            const token = this.authManager.getToken();
            if (!token) {
                throw new Error("No API token available");
            }
            console.log("Token header:", `Bearer ${token.substring(0, 10)}...`);
            
            // Ensure the endpoint starts with a slash
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }
            
            // Always use proxy in production
            const baseUrl = this.useProxy ? `${this.proxyUrl}${this.apiBase}` : this.apiBase;
            const url = `${baseUrl}${endpoint}`;
            console.log("Attempting API request to:", url);
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            console.error("Network request failed:", endpoint);
            console.error(error);
            throw error;
        }
    }

    // Rest of your ZedApiService class methods...
}

// Define UI components related to the API
class ZedAuthUI {
    constructor(authManager, apiService) {
        this.authManager = authManager;
        this.apiService = apiService;
        this.setupEventListeners();
    }
    
    // Rest of your ZedAuthUI class methods...
}

// Initialize and expose the services
window.zedApi = new ZedApiService();
window.zedAuthUI = new ZedAuthUI(window.zedAuth, window.zedApi);