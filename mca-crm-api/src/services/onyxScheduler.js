const cron = require('node-cron');
const OnyxService = require('./onyxService');

class OnyxScheduler {
    constructor() {
        this.isRunning = false;
        this.lastSync = null;
        this.syncInterval = process.env.ONYX_SYNC_INTERVAL || '0 */6 * * *'; // Every 6 hours by default
        this.scheduler = null;
    }

    /**
     * Start the scheduled sync
     */
    start() {
        if (this.scheduler) {
            console.log('OnyxIQ scheduler is already running');
            return;
        }

        console.log(`Starting OnyxIQ scheduler with interval: ${this.syncInterval}`);
        
        this.scheduler = cron.schedule(this.syncInterval, async () => {
            await this.performScheduledSync();
        }, {
            scheduled: true,
            timezone: 'America/New_York'
        });

        console.log('OnyxIQ scheduler started successfully');
    }

    /**
     * Stop the scheduled sync
     */
    stop() {
        if (this.scheduler) {
            this.scheduler.stop();
            this.scheduler = null;
            console.log('OnyxIQ scheduler stopped');
        }
    }

    /**
     * Perform scheduled sync
     */
    async performScheduledSync() {
        if (this.isRunning) {
            console.log('OnyxIQ sync is already running, skipping this cycle');
            return;
        }

        this.isRunning = true;
        const startTime = new Date();

        try {
            console.log('🔄 Starting scheduled OnyxIQ sync...');
            
            const results = await OnyxService.performFullSync();
            
            this.lastSync = {
                timestamp: new Date(),
                duration: Date.now() - startTime.getTime(),
                results: results
            };

            console.log('✅ Scheduled OnyxIQ sync completed successfully');
            console.log(`Sync took ${this.lastSync.duration}ms`);
            console.log('Results:', JSON.stringify(results, null, 2));

        } catch (error) {
            console.error('❌ Error during scheduled OnyxIQ sync:', error);
            
            this.lastSync = {
                timestamp: new Date(),
                duration: Date.now() - startTime.getTime(),
                error: error.message,
                results: null
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isScheduled: !!this.scheduler,
            syncInterval: this.syncInterval,
            lastSync: this.lastSync
        };
    }

    /**
     * Update sync interval
     */
    updateInterval(newInterval) {
        if (this.scheduler) {
            this.stop();
        }
        
        this.syncInterval = newInterval;
        
        if (this.scheduler) {
            this.start();
        }
    }

    /**
     * Force immediate sync
     */
    async forceSync() {
        console.log('🔄 Forcing immediate OnyxIQ sync...');
        await this.performScheduledSync();
    }
}

module.exports = new OnyxScheduler();
