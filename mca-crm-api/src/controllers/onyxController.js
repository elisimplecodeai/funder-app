const OnyxService = require('../services/onyxService');
const OnyxProgressTracker = require('../services/onyxProgressTracker');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Sync clients from OnyxIQ
 * @route   POST /api/v1/onyx/sync/clients
 * @access  Private
 */
exports.syncClients = async (req, res, next) => {
    try {
        // Get bearer token from request body or use default
        const bearerToken = req.body.bearerToken || null;
        
        const onyxService = new OnyxService(bearerToken);
        
        // Start the sync operation
        const results = await onyxService.syncClients();
        
        res.status(200).json({
            success: true,
            message: 'Clients synced successfully',
            data: results
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Sync applications from OnyxIQ
 * @route   POST /api/v1/onyx/sync/applications
 * @access  Private
 */
exports.syncApplications = async (req, res, next) => {
    try {
        // Get bearer token from request body or use default
        const bearerToken = req.body.bearerToken || null;
        
        const onyxService = new OnyxService(bearerToken);
        const results = await onyxService.syncApplications();
        
        res.status(200).json({
            success: true,
            message: 'Applications synced successfully',
            data: results
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Fetch user roles from OnyxIQ
 * @route   POST /api/v1/onyx/user-roles
 * @access  Private
 */
exports.getUserRoles = async (req, res, next) => {
    try {
        const { bearerToken } = req.body;
        
        if (!bearerToken) {
            return res.status(400).json({
                success: false,
                message: 'Bearer token is required'
            });
        }
        
        const onyxService = new OnyxService(bearerToken);
        const userRoles = await onyxService.getUserRoles();
        
        res.status(200).json({
            success: true,
            message: 'User roles fetched successfully',
            data: userRoles
        });
    } catch (err) {
        console.error('Error fetching user roles:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user roles',
            error: err.message
        });
    }
};

/**
 * @desc    Sync fundings from OnyxIQ
 * @route   POST /api/v1/onyx/sync/fundings
 * @access  Private
 */
exports.syncFundings = async (req, res, next) => {
    try {
        const bearerToken = req.body.bearerToken || null;
        const onyxService = new OnyxService(bearerToken);
        const results = await onyxService.syncFundings();
        
        res.status(200).json({
            success: true,
            message: 'Fundings synced successfully',
            data: results
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Perform full sync from OnyxIQ
 * @route   POST /api/v1/onyx/sync/full
 * @access  Private
 */
exports.performFullSync = async (req, res, next) => {
    try {
        const onyxService = new OnyxService();
        const results = await onyxService.performFullSync();
        
        res.status(200).json({
            success: true,
            message: 'Full sync completed successfully',
            data: results
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get OnyxIQ sync status
 * @route   GET /api/v1/onyx/status
 * @access  Private
 */
exports.getSyncStatus = async (req, res, next) => {
    try {
        // This would typically check the last sync time and status
        // For now, return a basic status
        res.status(200).json({
            success: true,
            data: {
                lastSync: null,
                status: 'ready',
                endpoints: {
                    clients: '/api/v1/onyx/sync/clients',
                    applications: '/api/v1/onyx/sync/applications',
                    fundings: '/api/v1/onyx/sync/fundings',
                    full: '/api/v1/onyx/sync/full'
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get funders from OnyxIQ
 * @route   GET /api/v1/onyx/funders
 * @access  Private
 */
exports.getFunders = async (req, res, next) => {
    try {
        const onyxService = new OnyxService();
        const funders = await onyxService.getFunders();
        
        res.status(200).json({
            success: true,
            message: 'Funders fetched successfully',
            data: funders
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get progress for a specific operation
 * @route   GET /api/v1/onyx/progress/:operationId
 * @access  Public (for import flow)
 */
exports.getProgress = async (req, res, next) => {
    try {
        const { operationId } = req.params;
        const progress = OnyxProgressTracker.getProgress(operationId);
        
        console.log(`Progress request for ${operationId}:`, progress); // Debug log
        
        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Operation not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (err) {
        next(err);
    }
};
