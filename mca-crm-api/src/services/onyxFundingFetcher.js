const axios = require('axios');

const BASE_URL = "https://services.onyxiq.com/api/fundings/";
const CONCURRENT_LIMIT = 150; // 150 concurrent workers
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds
const REQUEST_TIMEOUT = 30000; // 30 seconds

class OnyxFundingFetcher {
    constructor(bearerToken) {
        this.headers = {
            'Authorization': `Bearer ${bearerToken}`,
            'Accept': 'application/json, text/plain, */*'
        };
        this.axiosInstance = axios.create({
            baseURL: BASE_URL,
            headers: this.headers,
            timeout: REQUEST_TIMEOUT
        });
    }

    async fetchAllFundingIds() {
        console.log("--- Step 1: Fetching all funding IDs ---");
        const fundingIds = [];
        let currentPage = 0;
        let totalFound = 0;

        while (true) {
            const params = { 
                'page': currentPage, 
                'size': 100, 
                'sortDir': 'DESC', 
                'isoIds': '' 
            };
            
            try {
                const response = await this.axiosInstance.get('/', { params });
                const data = response.data;
                const results = data.content || [];

                if (results.length > 0) {
                    for (const funding of results) {
                        if (funding.id) fundingIds.push(funding.id);
                    }
                    totalFound += results.length;
                    process.stdout.write(`-> Found ${totalFound} total IDs... (Page: ${currentPage})\r`);
                    if (results.length < params.size) break; // Last page
                    currentPage++;
                } else {
                    break; // No more content
                }
            } catch (err) {
                console.error(`\nError during Step 1: ${err.message}`);
                return [];
            }
        }
        console.log(`\nFinished Step 1. Found a total of ${totalFound} funding IDs to process.`);
        return fundingIds;
    }

    async fetchFundingDetail(fundingId, semaphore) {
        const detailUrl = `/${fundingId}`;
        await semaphore.acquire();
        try {
            for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
                try {
                    const response = await this.axiosInstance.get(detailUrl);
                    return { data: response.data, error: null };
                } catch (e) {
                    if (e.response && e.response.status === 404) {
                        return { data: null, error: { fundingId, message: `Failed with status 404 (Not Found)` } };
                    }
                    console.warn(`Funding ${fundingId}: Failed with status ${e.response ? e.response.status : 'N/A'}, attempt ${attempt + 1}/${RETRY_ATTEMPTS}`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            }
            return { data: null, error: { fundingId, message: `Failed after ${RETRY_ATTEMPTS} attempts` } };
        } finally {
            semaphore.release();
        }
    }

    async fetchAllFundings() {
        const startTime = Date.now();
        
        try {
            // Step 1: Get all funding IDs
            const fundingIds = await this.fetchAllFundingIds();
            if (!fundingIds.length) {
                console.log('No funding IDs found.');
                return { fundings: [], errors: [], totalTime: 0, totalFound: 0, successCount: 0, errorCount: 0 };
            }

            console.log(`\n--- Step 2: Fetching details for ${fundingIds.length} fundings (Concurrency: ${CONCURRENT_LIMIT}) ---`);
            
            // Step 2: Fetch all funding details with concurrency
            const fullFundingDetails = [];
            const failedFundings = [];
            const { Semaphore } = require('async-mutex');
            const semaphore = new Semaphore(CONCURRENT_LIMIT);

            const tasks = fundingIds.map(fundingId => this.fetchFundingDetail(fundingId, semaphore));

            for (let i = 0; i < tasks.length; i++) {
                const { data, error } = await tasks[i];
                if (data) {
                    fullFundingDetails.push(data);
                } else if (error) {
                    failedFundings.push(error);
                }
                process.stdout.write(`-> Progress: ${i + 1}/${fundingIds.length} fundings processed.\r`);
            }
            console.log("\n\nFinished Step 2. All tasks complete.");

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000 / 60; // Convert to minutes

            console.log(`SUCCESS: Fetched complete data for ${fullFundingDetails.length} fundings`);
            if (failedFundings.length > 0) {
                console.log(`WARNING: Failed to fetch details for ${failedFundings.length} funding IDs.`);
            }
            console.log(`Total execution time: ${duration.toFixed(2)} minutes.`);

            return {
                fundings: fullFundingDetails,
                errors: failedFundings,
                totalTime: duration,
                totalFound: fundingIds.length,
                successCount: fullFundingDetails.length,
                errorCount: failedFundings.length
            };
            
        } catch (error) {
            console.error('Error in fetchAllFundings:', error);
            throw error;
        }
    }
}

module.exports = OnyxFundingFetcher;
