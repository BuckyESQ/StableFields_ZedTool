// ZED Champions API Service and UI Components   
/**
 * ZED Champions API Service
 */
class ZedApiService {
    constructor() {
        // Detect if we're on the production domain
        this.isProduction = window.location.hostname.includes('stablefields.com');
        
        // Configure API settings based on environment
        this.apiBase = 'https://api.zedchampions.com';
        this.authManager = window.zedAuth;
        
        // Only use proxy in development environments
        this.useProxy = !this.isProduction;
        this.proxyUrl = 'http://localhost:3000/proxy/';
        
        console.log(`Running in ${this.isProduction ? 'production' : 'development'} mode`);
    }
    /**
     * Test connection to the ZED Champions API
     */
    async testConnection() {
        try {
            if (!this.authManager.getToken()) {
                return { 
                    success: false, 
                    message: "No API token set. Please enter your ZED Champions API token." 
                };
            }
            
            if (this.authManager.isTokenExpired()) {
                return { 
                    success: false, 
                    message: "Your API token has expired. Please obtain a new token." 
                };
            }
            
            // Try a simpler endpoint for testing
            try {
                const response = await this.fetchFromApi('/v1/user/me');
                if (response.ok) {
                    const data = await response.json();
                    return { 
                        success: true, 
                        message: `Connection successful! Welcome, ${data.name || 'Challenger'}` 
                    };
                } else {
                    return { 
                        success: false, 
                        message: `Connection failed: ${response.status} ${response.statusText}` 
                    };
                }
            } catch (networkError) {
                // Special case for CORS errors
                if (networkError.message.includes("CORS") || networkError.message.includes("Failed to fetch")) {
                    return { 
                        success: false, 
                        message: "Connection blocked by CORS policy. Try using this app from a different environment." 
                    };
                }
                
                return { 
                    success: false, 
                    message: `Connection error: ${networkError.message}` 
                };
            }
        } catch (error) {
            console.error("Error testing connection:", error);
            return { 
                success: false, 
                message: `Connection error: ${error.message}` 
            };
        }
    }

    /**
    * Fetch a single horse by ID
    */
    async fetchHorse(horseId) {
        try {
            const response = await this.fetchFromApi(`/v1/horses/${horseId}`);
            if (!response.ok) {
                return { success: false, message: `Error ${response.status}: ${response.statusText}` };
            }
            
            const data = await response.json();
            return { success: true, data: data };
        } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
        }
    }
    
    /**
     * Fetch all horses (racing or breeding)
     */
    async fetchAllHorses(type = 'racing') {
        try {
            // Different endpoint based on horse type
            const endpoint = type === 'racing' ? '/v1/stables/racing' : '/v1/stables/breeding';
            
            const response = await this.fetchFromApi(endpoint);
            if (!response.ok) {
                return { success: false, message: `Error ${response.status}: ${response.statusText}` };
            }
            
            const data = await response.json();
            return { success: true, data: data.horses || [] };
        } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
        }
    }
    
    /**
     * Fetch from the ZED Champions API with authorization
     */
    async fetchFromApi(endpoint, method = 'GET', data = null) {
        try {
            // Ensure the endpoint starts with a slash
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }
                
                // Build the URL - don't use proxy in production
                const baseUrl = this.useProxy ? 'http://localhost:3000/proxy' : this.apiBase;
                // Fix double slash by ensuring endpoint starts with slash only if baseUrl doesn't end with one
                const url = `${baseUrl}${endpoint.startsWith('/') && baseUrl.endsWith('/') ? endpoint.slice(1) : endpoint}`;
                        
                console.log("Attempting API request to:", url);
                
                const token = this.authManager.getToken();
                const options = {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };
                
                if (data) {
                    options.body = JSON.stringify(data);
                }
                
                return await fetch(url, options);
            } catch (error) {
                console.error(`Network request failed: ${endpoint}`, error);
                throw new Error("Network request failed. Please check your internet connection.");
            }
        }
} // <-- Close ZedApiService class here

    /**
     * ZED Champions Auth Token UI Components
     */
class ZedAuthUI {
        constructor() {
            this.apiService = window.zedApi;
            this.statusContainerId = 'test-api-connection-status'; // Define the status container ID
        }    
            
        /**
         * Initialize the auth UI
         */
        initialize() {
            this.createTokenInput();
            this.updateTokenStatus();
            this.populateHorseTypeOptions();
            
            // Check token status every minute
            setInterval(() => this.updateTokenStatus(), 60000);
        }
    
        /**
         * Populate the "Import As" dropdown with horse types dynamically
         */
        populateHorseTypeOptions() {
            const horseTypes = ['racing', 'breeding']; // Replace with dynamic API call if needed
            const selectElement = document.getElementById('import-horse-type');
            if (!selectElement) return;
    
            selectElement.innerHTML = ''; // Clear existing options
            horseTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Horse`;
                selectElement.appendChild(option);
            });
        }
        /**
         * Create the token input form
         */
    createTokenInput() {
        const container = document.getElementById('api-import-container');
        if (!container) {
            console.warn("Warning: The 'api-import-container' element is missing. Token input form cannot be created.");
            return;
        }

        const tokenSection = this.createTokenSection();
        container.appendChild(tokenSection);

        this.addEventListeners();
        this.prefillToken();
    }

    createTokenSection() {
        const tokenSection = document.createElement('div');
        tokenSection.className = 'section';

        tokenSection.appendChild(this.createHeader());
        tokenSection.appendChild(this.createTokenInputArea());
        tokenSection.appendChild(this.createConnectionTestArea());
        tokenSection.appendChild(this.createImportArea());

        return tokenSection;
    }

    createHeader() {
        const header = document.createElement('div');
        header.innerHTML = `
            <h2>ZED Champions API Authentication - Manage Your API Tokens</h2>
            <p>Securely manage your API tokens to ensure uninterrupted access to ZED Champions services.</p>
            <ul>
                <li><strong>Note:</strong> ZED Champions API tokens expire after 24 hours, regardless of user activity.</li>
                <li>You need to obtain a new token daily to maintain access.</li>
                <li>Consider automating token renewal or setting up alerts for token expiration.</li>
            </ul>
            <p><strong>To get a token:</strong> <a href="docs/api-token-instructions.html" target="_blank" title="Learn how to obtain and manage your ZED Champions API token, including step-by-step instructions and troubleshooting tips.">Click here for detailed instructions</a>.</p>
        `;
        return header;
    }

    createTokenInputArea() {
        const tokenInputArea = document.createElement('div');
        tokenInputArea.style.marginTop = '20px';
        tokenInputArea.innerHTML = `
            <div class="form-grid" style="grid-template-columns: 1fr auto;">
                <textarea id="zed-api-token" placeholder="Enter your ZED Champions API Bearer token" 
                    class="zed-api-token-textarea"
                    autocomplete="off" data-lpignore="true"></textarea>
            </div>
            <div style="display: flex; align-items: flex-end; margin-top: 10px;">
                <button id="save-api-token-btn" class="button">Save Token</button>
            </div>
        `;
        return tokenInputArea;
    }

    createConnectionTestArea() {
        const connectionTestArea = document.createElement('div');
        connectionTestArea.style.marginTop = '15px';
        connectionTestArea.style.display = 'flex';
        connectionTestArea.style.gap = '10px';
        connectionTestArea.style.alignItems = 'center';
        connectionTestArea.innerHTML = `
            <button id="test-api-connection-btn" class="button">Test Connection</button>
            <div id="test-api-connection-status" class="api-connection-status"></div>
        `;
        return connectionTestArea;
    }

    createImportArea() {
        const importArea = document.createElement('div');
        importArea.style.marginTop = '25px';
        importArea.style.borderTop = '1px solid var(--border-color)';
        importArea.style.paddingTop = '25px';
        importArea.innerHTML = `
            <h3>Import Horses from ZED Champions</h3>
            <p>Importing horses allows you to manage your racing and breeding stables efficiently, track performance, and plan strategies for competitions or breeding programs.</p>
            <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 20px;">
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <button id="import-racing-stable-btn" class="button">Import Racing Stable</button>
                    <button id="import-breeding-stable-btn" class="button">Import Breeding Stable</button>
                </div>
                <div id="import-status" style="margin-top: 10px;"></div>
                <h4>Import Single Horse</h4>
                <p style="margin-bottom: 10px;">"Racing Horse" refers to horses actively competing in races, showcasing their speed and endurance, while "Breeding Horse" represents horses contributing to breeding programs to produce new generations of champions.</p>
                <p style="margin-bottom: 10px;">Choose "Racing Horse" for horses participating in races and "Breeding Horse" for horses used in breeding programs.</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
                    <div>
                        <label for="zed-horse-id">Horse ID:</label>
                        <input type="text" id="zed-horse-id" placeholder="Enter horse ID">
                    </div>
                    <div>
                        <select id="import-horse-type"></select>
                    </div>
                    <button id="import-single-horse-btn" class="button">Import Horse</button>
                </div>
                <div id="single-import-status" style="margin-top: 10px;"></div>
            </div>
        `;
        return importArea;
    }

    addEventListeners() {
        document.getElementById('save-api-token-btn')?.addEventListener('click', () => this.handleSaveToken());
        document.getElementById('test-api-connection-btn')?.addEventListener('click', () => this.handleTestConnection());
        document.getElementById('import-racing-stable-btn')?.addEventListener('click', () => this.handleImportRacingStable());
        document.getElementById('import-breeding-stable-btn')?.addEventListener('click', () => this.handleImportBreedingStable());
        document.getElementById('import-single-horse-btn')?.addEventListener('click', () => this.handleImportSingleHorse());
    }

    prefillToken() {
        const token = window.zedAuth.getToken();
        const expiry = window.zedAuth.getTokenExpiry();
        
        if (token) {
            if (expiry && expiry.expired) {
                document.getElementById('zed-api-token').value = ""; // Clear token input if expired
                this.showStatus("Your API token has expired. Please obtain a new token.", false);
            } else {
                document.getElementById('zed-api-token').value = "••••••••••••••••••••••"; // Mask the token if valid
            }
        }
    }
        
    /**
     * Handle saving the API token
     */
    handleSaveToken() {
        const tokenInput = document.getElementById('zed-api-token');
        if (!tokenInput) return;
        
        const token = tokenInput.value.trim();
        if (!token) {
            this.showStatus("Please enter a valid token.", false);
            return;
        }
        
        // Extract token if it starts with "Bearer "
        let cleanToken = token;
        if (token.startsWith('Bearer ')) {
            cleanToken = token.substring(7).trim();
        }
        
        const success = window.zedAuth.setToken(cleanToken);
        if (success) {
            tokenInput.value = "••••••••••••••••••••••"; // Mask the token
            this.showStatus("Token saved successfully. Testing connection...", null);
            this.handleTestConnection(); // Automatically test after saving
        } else {
            this.showStatus("Invalid token format. Please paste the entire 'Authorization' header value.", false);
        }
    }
    
    /**
     * Handle testing the API connection
     */
    async handleTestConnection() {
        this.showStatus("Testing connection to ZED Champions API...", null);
        
        const result = await window.zedApi.testConnection();
        this.showStatus(result.message, result.success);
        
        // Update token status in case it changed
        this.updateTokenStatus();
    }
    
    /**
     * Handle importing racing stable
     */
    async handleImportRacingStable() {
        if (!this.validateConnection()) return;
        
        const statusElement = document.getElementById('import-status');
        if (!statusElement) return;
        
        this.showImportStatus(statusElement, "Loading your racing stable... Please wait...", null);
        
        try {
            const result = await window.zedApi.fetchAllHorses('racing');
            if (!result.success) {
                this.showImportStatus(statusElement, `Error: ${result.message}`, false);
                return;
            }
            
            const horses = result.data;
            
            if (horses.length === 0) {
                this.showImportStatus(statusElement, "No racing horses found to import.", false);
                return;
            }
            
            // Process the horses
            let newCount = 0;
            let updateCount = 0;
            
            horses.forEach(horseData => {
                const existingHorse = window.horses.find(h => h.zedId === horseData.id);
                
                const processedHorse = {
                    id: existingHorse?.id || crypto.randomUUID(),
                    name: horseData.name,
                    bloodline: horseData.bloodline,
                    color: horseData.color || '#CCCCCC', // Default color
                    gender: horseData.gender,
                    stars: horseData.overall_rating || null,
                    speedStars: horseData.speed_rating || null,
                    sprintStars: horseData.sprint_rating || null,
                    enduranceStars: horseData.endurance_rating || null,
                    initialZedBalance: existingHorse?.initialZedBalance || 0,
                    initialMmRating: existingHorse?.initialMmRating || 1000,
                    status: 'racing',
                    zedId: horseData.id,
                    lastUpdated: new Date().toISOString()
                };
                
                if (existingHorse) {
                    // Update existing horse
                    Object.assign(existingHorse, processedHorse);
                    updateCount++;
                } else {
                    // Add new horse
                    window.horses.push(processedHorse);
                    newCount++;
                }
            });
            
            // Save and update UI
            window.saveData();
            window.renderHorsesTable();
            window.updateHorseDropdown();
            window.updateParentDropdowns();
            window.populateAugmentAnalysisHorseFilter();
            
            this.showImportStatus(
                statusElement, 
                `Successfully imported ${horses.length} racing horses (${newCount} new, ${updateCount} updated)`,
                true
            );
            
            // Switch to Racing tab
            window.activateTab('racing');
        } catch (error) {
            console.error("Error importing racing stable:", error);
            this.showImportStatus(statusElement, `Error: ${error.message}`, false);
        }
    }
    
    /**
     * Handle importing breeding stable
     */
    async handleImportBreedingStable() {
        if (!this.validateConnection()) return;
        
        const statusElement = document.getElementById('import-status');
        if (!statusElement) return;
        
        this.showImportStatus(statusElement, "Loading your breeding stable... Please wait...", null);
        
        try {
            const result = await window.zedApi.fetchAllHorses('breeding');
            if (!result.success) {
                this.showImportStatus(statusElement, `Error: ${result.message}`, false);
                return;
            }
            
            const horses = result.data;
            
            if (horses.length === 0) {
                this.showImportStatus(statusElement, "No breeding horses found to import.", false);
                return;
            }
            
            // Process the horses
            let newCount = 0;
            let updateCount = 0;
            
            horses.forEach(horseData => {
                const existingHorse = window.horses.find(h => h.zedId === horseData.id);
                
                const processedHorse = {
                    id: existingHorse?.id || crypto.randomUUID(),
                    name: horseData.name,
                    bloodline: horseData.bloodline,
                    color: horseData.color || '#CCCCCC',
                    gender: horseData.gender,
                    stars: horseData.overall_rating || null,
                    speedStars: horseData.speed_rating || null,
                    sprintStars: horseData.sprint_rating || null,
                    enduranceStars: horseData.endurance_rating || null,
                    status: 'breeding',
                    zedId: horseData.id,
                    lastUpdated: new Date().toISOString()
                };
                
                if (existingHorse) {
                    // Update existing horse
                    Object.assign(existingHorse, processedHorse);
                    updateCount++;
                } else {
                    // Add new horse
                    window.horses.push(processedHorse);
                    newCount++;
                }
            });
            
            // Save and update UI
            window.saveData();
            window.renderBreedingHorsesTable();
            window.updateParentDropdowns();
            window.updateFoalPredictorDropdowns();
            
            this.showImportStatus(
                statusElement, 
                `Successfully imported ${horses.length} breeding horses (${newCount} new, ${updateCount} updated)`,
                true
            );
            
            // Switch to Breeding tab
            window.activateTab('breeding');
        } catch (error) {
            console.error("Error importing breeding stable:", error);
            this.showImportStatus(statusElement, `Error: ${error.message}`, false);
        }
    }
    
    /**
     * Handle importing a single horse
     */
    async handleImportSingleHorse() {
        if (!this.validateConnection()) return;
        
        const horseId = document.getElementById('zed-horse-id')?.value.trim();
        const importType = document.getElementById('import-horse-type')?.value || 'racing';
        const statusElement = document.getElementById('single-import-status');
        
        if (!['racing', 'breeding'].includes(importType)) {
            this.showImportStatus(statusElement, "Invalid horse type selected. Please choose 'Racing Horse' or 'Breeding Horse'.", false);
            return;
        }
        
        if (!horseId) {
            this.showImportStatus(statusElement, "Please enter a horse ID", false);
            return;
        }
        
        this.showImportStatus(statusElement, `Importing horse ${horseId}...`, null);
        
        try {
            const result = await window.zedApi.fetchHorse(horseId);
            if (!result.success) {
                this.showImportStatus(statusElement, `Error: ${result.message}`, false);
                return;
            }
            
            const horseData = result.data;
            const existingHorse = window.horses.find(h => h.zedId === horseData.id);
            
            const processedHorse = {
                id: existingHorse?.id || crypto.randomUUID(),
                bloodline: horseData.bloodline,
                color: horseData.color || '#CCCCCC',
                gender: horseData.gender,
                stars: horseData.overall_rating || null,
                speedStars: horseData.speed_rating || null,
                sprintStars: horseData.sprint_rating || null,
                enduranceStars: horseData.endurance_rating || null,
                initialZedBalance: existingHorse?.initialZedBalance || 0,
                initialMmRating: existingHorse?.initialMmRating || 1000,
                status: importType,
                zedId: horseData.id,
                lastUpdated: new Date().toISOString()
            };
            
            if (existingHorse) {
                // Update existing horse
                Object.assign(existingHorse, processedHorse);
                this.showImportStatus(statusElement, `Updated horse: ${horseData.name}`, true);
            } else {
                // Add new horse
                window.horses.push(processedHorse);
                this.showImportStatus(statusElement, `Imported new horse: ${horseData.name}`, true);
            }
            
            // Save and update UI
            window.saveData();
            
            if (importType === 'racing') {
                window.renderHorsesTable();
                window.updateHorseDropdown();
                window.activateTab('racing');
            } else {
                window.renderBreedingHorsesTable();
                window.updateFoalPredictorDropdowns();
                window.activateTab('breeding');
            }
            
            window.updateParentDropdowns();
            
            // Clear input
            document.getElementById('zed-horse-id').value = '';
        } catch (error) {
            console.error("Error importing single horse:", error);
            this.showImportStatus(statusElement, `Error: ${error.message}`, false);
        }
    }
    
    /**
     * Validate that we have a working connection before attempting imports
     */
    validateConnection() {
        if (!window.zedAuth.getToken()) {
            this.showStatus("No API token set. Please enter your ZED Champions API token first.", false);
            return false;
        }
        
        if (window.zedAuth.isTokenExpired()) {
            this.showStatus("Your API token has expired. Please obtain a new token.", false);
            return false;
        }
        
        return true;
    }
    
    /**
     * Update token status display
     */
    updateTokenStatus() {
        const token = window.zedAuth.getToken();
        const expiry = window.zedAuth.getTokenExpiry();
        
        if (!token || (expiry && expiry.expired)) {
            document.getElementById('test-api-connection-btn')?.setAttribute('disabled', 'disabled');
            if (expiry && expiry.expired) {
                this.showStatus("Your API token has expired. Please obtain a new token.", false);
            }
            return;
        }
        
        document.getElementById('test-api-connection-btn')?.removeAttribute('disabled');
    }
    
    /**
     * Show status message
     */
    /**
     * Show status message
     */
    showStatus(message, isSuccess) {
        const statusEl = document.getElementById(this.statusContainerId);
        if (!statusEl) return;
        
        statusEl.style.display = 'block';
        statusEl.className = ''; // Clear previous classes
        statusEl.textContent = message;
        
        if (isSuccess === true) {
            statusEl.classList.add('success');
            statusEl.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            statusEl.style.color = '#4CAF50';
            statusEl.style.padding = '8px';
            statusEl.style.borderRadius = '4px';
        } else if (isSuccess === false) {
            statusEl.classList.add('error');
            statusEl.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
            statusEl.style.color = '#F44336';
            statusEl.style.padding = '8px';
            statusEl.style.borderRadius = '4px';
        } else {
            statusEl.classList.add('info');
            statusEl.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
            statusEl.style.color = '#2196F3';
            statusEl.style.padding = '8px';
            statusEl.style.borderRadius = '4px';
        }
    }

    /**
     * Show import status message
     */
    showImportStatus(element, message, isSuccess) {
        if (!element) return;
        
        element.style.display = 'block';
        element.className = '';
        element.textContent = message;
        
        if (isSuccess === true) {
            element.classList.add('success');
            element.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            element.style.color = '#4CAF50';
            element.style.padding = '8px';
            element.style.borderRadius = '4px';
        } else if (isSuccess === false) {
            element.classList.add('error');
            element.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
            element.style.color = '#F44336';
            element.style.padding = '8px';
            element.style.borderRadius = '4px';
        } else {
            element.classList.add('info');
            element.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
            element.style.color = '#2196F3';
            element.style.padding = '8px';
            element.style.borderRadius = '4px';
        }
    }
}

window.zedApi = new ZedApiService();
// Initialize the UI when the DOM is ready
// This event listener waits for the DOM content to be fully loaded before executing.
// It creates an instance of the ZedAuthUI class and calls its initialize method.
// Dependencies:
// - ZedAuthUI class: Handles the UI components for API authentication and interaction.
// - window.zedApi: An instance of ZedApiService, required for API communication.
document.addEventListener('DOMContentLoaded', () => {
    const authUI = new ZedAuthUI();
    authUI.initialize();
});