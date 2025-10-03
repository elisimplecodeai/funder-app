const axios = require('axios');

/**
 * Efficient OnyxIQ Client Fetcher
 * Adapted from Python script to work with MCA system
 */
class OnyxClientFetcher {
    constructor(bearerToken) {
        this.baseURL = 'https://services.onyxiq.com/api/clients/';
        this.bearerToken = bearerToken;
        this.headers = {
            'Authorization': `Bearer ${bearerToken}`,
            'Accept': 'application/json, text/plain, */*'
        };
        
        // Configuration
        this.CONCURRENT_LIMIT = 150;
        this.RETRY_ATTEMPTS = 3;
        this.RETRY_DELAY = 2000; // 2 seconds
        this.REQUEST_TIMEOUT = 30000; // 30 seconds
    }

    /**
     * Step 1: Fetch all client IDs sequentially
     */
    async fetchAllClientIds() {
        console.log('--- Step 1: Fetching all client IDs ---');
        const clientIds = [];
        let currentPage = 0;
        
        while (true) {
            try {
                const params = {
                    page: currentPage,
                    size: 100000,
                    sortDir: 'DESC',
                    isoIds: ''
                };
                
                const response = await axios.get(this.baseURL, {
                    headers: this.headers,
                    params: params,
                    timeout: this.REQUEST_TIMEOUT
                });
                
                const data = response.data;
                if (data.content && data.content.length > 0) {
                    const results = data.content;
                    for (const client of results) {
                        if (client.id) {
                            clientIds.push(client.id);
                        }
                    }
                    console.log(`-> Found ${clientIds.length} total IDs... (Page: ${currentPage})`);
                    
                    if (results.length < 100) break;
                    currentPage++;
                } else {
                    break;
                }
            } catch (error) {
                console.error(`Error during Step 1: ${error.message}`);
                return [];
            }
        }
        
        console.log(`Finished Step 1. Found ${clientIds.length} client IDs.`);
        return clientIds;
    }

    /**
     * Fetch client details with retry logic
     */
    async fetchClientDetail(clientId, attempt = 1) {
        const detailUrl = `${this.baseURL}${clientId}`;
        
        try {
            const response = await axios.get(detailUrl, {
                headers: this.headers,
                timeout: this.REQUEST_TIMEOUT
            });
            
            return { data: response.data, error: null };
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return { data: null, error: { clientId, message: `Client not found (404)`, status: 404 } };
            }
            
            if (attempt < this.RETRY_ATTEMPTS) {
                console.log(`Retrying client ${clientId}, attempt ${attempt + 1}/${this.RETRY_ATTEMPTS}`);
                await this.delay(this.RETRY_DELAY);
                return this.fetchClientDetail(clientId, attempt + 1);
            }
            
            return { 
                data: null, 
                error: { 
                    clientId, 
                    message: `Failed after ${this.RETRY_ATTEMPTS} attempts: ${error.message}`,
                    status: error.response?.status || 'unknown'
                } 
            };
        }
    }

    /**
     * Process clients in batches with concurrency control
     */
    async processClientsBatch(clientIds, batchSize = this.CONCURRENT_LIMIT) {
        const results = [];
        const errors = [];
        
        for (let i = 0; i < clientIds.length; i += batchSize) {
            const batch = clientIds.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clientIds.length / batchSize)} (${batch.length} clients)`);
            
            const batchPromises = batch.map(clientId => this.fetchClientDetail(clientId));
            const batchResults = await Promise.all(batchPromises);
            
            for (const result of batchResults) {
                if (result.data) {
                    results.push(result.data);
                } else if (result.error) {
                    errors.push(result.error);
                }
            }
            
            console.log(`-> Progress: ${Math.min(i + batchSize, clientIds.length)}/${clientIds.length} clients processed`);
        }
        
        return { results, errors };
    }

    /**
     * Main execution method
     */
    async fetchAllClients(progressCallback = null) {
        const startTime = Date.now();
        
        try {
            // Step 1: Get all client IDs
            const clientIds = await this.fetchAllClientIds();
            if (!clientIds.length) {
                console.log('No client IDs found.');
                return { clients: [], errors: [], totalTime: 0 };
            }

            // Update progress after fetching IDs
            if (progressCallback) {
                progressCallback({
                    currentStep: 'fetching',
                    progress: 25,
                    totalItems: clientIds.length,
                    processedItems: 0,
                    message: `Found ${clientIds.length} clients from OnyxIQ`
                });
            }

            console.log(`\n--- Step 2: Fetching details for ${clientIds.length} clients (Concurrency: ${this.CONCURRENT_LIMIT}) ---`);
            
            // Step 2: Fetch all client details
            const { results: fullClientDetails, errors: failedClients } = await this.processClientsBatch(clientIds);
            
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000 / 60; // Convert to minutes
            
            console.log(`\nFinished Step 2. All tasks complete.`);
            console.log(`SUCCESS: Fetched complete data for ${fullClientDetails.length} clients`);
            
            if (failedClients.length > 0) {
                console.log(`WARNING: Failed to fetch details for ${failedClients.length} client IDs.`);
            }
            
            console.log(`Total execution time: ${duration.toFixed(2)} minutes.`);
            
            return {
                clients: fullClientDetails,
                errors: failedClients,
                totalTime: duration,
                totalFound: clientIds.length,
                successCount: fullClientDetails.length,
                errorCount: failedClients.length
            };
            
        } catch (error) {
            console.error('Error in fetchAllClients:', error);
            throw error;
        }
    }

    /**
     * Utility method for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = OnyxClientFetcher;
