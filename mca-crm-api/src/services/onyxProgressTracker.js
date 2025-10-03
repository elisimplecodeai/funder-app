/**
 * Progress tracker for OnyxIQ sync operations
 * Provides real-time progress updates for long-running operations
 */
class OnyxProgressTracker {
    constructor() {
        this.operations = new Map();
    }

    /**
     * Start tracking a new operation
     * @param {string} operationId - Unique operation identifier
     * @param {Object} initialData - Initial operation data
     */
    startOperation(operationId, initialData = {}) {
        this.operations.set(operationId, {
            id: operationId,
            status: 'running',
            startTime: Date.now(),
            progress: 0,
            currentStep: 'fetching',
            totalItems: 0,
            processedItems: 0,
            errors: [],
            results: null,
            ...initialData
        });
    }

    /**
     * Update operation progress
     * @param {string} operationId - Operation identifier
     * @param {Object} updates - Progress updates
     */
    updateProgress(operationId, updates) {
        const operation = this.operations.get(operationId);
        if (operation) {
            Object.assign(operation, updates);
            operation.lastUpdate = Date.now();
        }
    }

    /**
     * Complete an operation
     * @param {string} operationId - Operation identifier
     * @param {Object} results - Final results
     */
    completeOperation(operationId, results) {
        const operation = this.operations.get(operationId);
        if (operation) {
            operation.status = 'completed';
            operation.progress = 100;
            operation.results = results;
            operation.endTime = Date.now();
            operation.duration = operation.endTime - operation.startTime;
        }
    }

    /**
     * Fail an operation
     * @param {string} operationId - Operation identifier
     * @param {string} error - Error message
     */
    failOperation(operationId, error) {
        const operation = this.operations.get(operationId);
        if (operation) {
            operation.status = 'failed';
            operation.error = error;
            operation.endTime = Date.now();
            operation.duration = operation.endTime - operation.startTime;
        }
    }

    /**
     * Get operation progress
     * @param {string} operationId - Operation identifier
     * @returns {Object|null} - Operation progress or null if not found
     */
    getProgress(operationId) {
        return this.operations.get(operationId) || null;
    }

    /**
     * Clean up completed operations older than specified time
     * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
     */
    cleanup(maxAge = 60 * 60 * 1000) {
        const now = Date.now();
        for (const [id, operation] of this.operations.entries()) {
            if (operation.endTime && (now - operation.endTime) > maxAge) {
                this.operations.delete(id);
            }
        }
    }

    /**
     * Get all active operations
     * @returns {Array} - Array of active operations
     */
    getActiveOperations() {
        return Array.from(this.operations.values()).filter(op => op.status === 'running');
    }
}

// Export singleton instance
module.exports = new OnyxProgressTracker();
