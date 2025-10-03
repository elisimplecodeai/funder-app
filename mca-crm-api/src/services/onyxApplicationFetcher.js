const axios = require('axios');

const BASE_URL = "https://services.onyxiq.com/api/applications/";
const CONCURRENT_LIMIT = 50; // Reduced to avoid 503 errors
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

class OnyxApplicationFetcher {
    constructor(bearerToken) {
        this.headers = {
            'Authorization': `Bearer ${bearerToken}`,
            'Accept': 'application/json, text/plain, */*'
        };
        this.axiosInstance = axios.create({
            baseURL: BASE_URL,
            headers: this.headers,
            timeout: 30000 // 30 seconds timeout for individual requests
        });
    }

    /**
     * Step 1: Fetch all application IDs sequentially
     */
    async fetchAllApplicationIds() {
        console.log("--- Step 1: Fetching all application IDs ---");
        const applicationIds = [];
        let currentPage = 0;
        let totalFound = 0;

        while (true) {
            const params = { 
                'page': currentPage, 
                'size': 10000, 
                'sortDir': 'DESC', 
                'isoIds': '' 
            };
            
            try {
                const response = await this.axiosInstance.get('/', { params });
                const data = response.data;
                const results = data.content || [];

                if (results.length > 0) {
                    for (const application of results) {
                        if (application.id) applicationIds.push(application.id);
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
                return { applicationIds: [], totalFound: 0, error: err };
            }
        }
        
        console.log(`\nFinished Step 1. Found ${totalFound} application IDs.`);
        return { applicationIds, totalFound, error: null };
    }

    /**
     * Step 2: Fetch application details with concurrency control
     */
    async fetchApplicationDetail(applicationId, semaphore) {
        const detailUrl = `/${applicationId}`;
        await semaphore.acquire();
        
        try {
            for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
                try {
                    const response = await this.axiosInstance.get(detailUrl);
                    return { data: response.data, error: null };
                } catch (e) {
                    if (e.response && e.response.status === 404) {
                        return { data: null, error: { applicationId, message: `Failed with status 404 (Not Found)` } };
                    }
                    console.warn(`Application ${applicationId}: Failed with status ${e.response ? e.response.status : 'N/A'}, attempt ${attempt + 1}/${RETRY_ATTEMPTS}`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            }
            return { data: null, error: { applicationId, message: `Failed after ${RETRY_ATTEMPTS} attempts` } };
        } finally {
            semaphore.release();
        }
    }

    /**
     * Main execution method
     */
    async fetchAllApplications() {
        const startTime = process.hrtime.bigint();
        
        try {
            // Step 1: Get all application IDs
            const { applicationIds, totalFound, error: fetchIdsError } = await this.fetchAllApplicationIds();
            if (fetchIdsError) {
                return { applications: [], totalFound: 0, errorCount: 1, errors: [{ applicationId: 'N/A', message: fetchIdsError.message }], totalTime: 0 };
            }

            console.log(`\n--- Step 2: Fetching details for ${applicationIds.length} applications (Concurrency: ${CONCURRENT_LIMIT}) ---`);
            
            // Step 2: Fetch all application details with concurrency
            const fullApplicationDetails = [];
            const failedApplications = [];
            const { Semaphore } = require('async-mutex');
            const semaphore = new Semaphore(CONCURRENT_LIMIT);

            const tasks = applicationIds.map(appId => this.fetchApplicationDetail(appId, semaphore));

            for (let i = 0; i < tasks.length; i++) {
                const { data, error } = await tasks[i];
                if (data) {
                    fullApplicationDetails.push(data);
                } else if (error) {
                    failedApplications.push(error);
                }
                process.stdout.write(`-> Progress: ${i + 1}/${applicationIds.length} applications processed.\r`);
            }
            
            console.log("\n\nFinished Step 2. All tasks complete.");

            const endTime = process.hrtime.bigint();
            const totalTime = Number(endTime - startTime) / 1_000_000_000 / 60; // Convert to minutes

            return {
                applications: fullApplicationDetails,
                totalFound: totalFound,
                errorCount: failedApplications.length,
                errors: failedApplications,
                totalTime: totalTime
            };
            
        } catch (error) {
            console.error('Error in fetchAllApplications:', error);
            throw error;
        }
    }
}

module.exports = OnyxApplicationFetcher;
