const express = require('express');
const router = express.Router();

const {
    syncClients,
    syncApplications,
    syncFundings,
    performFullSync,
    getSyncStatus,
    getFunders,
    getProgress
} = require('../controllers/onyxController');

const { autoLogin } = require('../controllers/onyxAutoLoginController');

const { protect } = require('../middleware/auth');

// Most routes are protected, but auto-login needs to be public
// router.use(protect);

// @route   POST /api/v1/onyx/auto-login
// @desc    Automatically login to OnyxIQ and get bearer token
// @access  Public (no auth required for initial login)
router.post('/auto-login', autoLogin);

// @route   GET /api/v1/onyx/funders
// @desc    Get funders from OnyxIQ
// @access  Public (for import flow)
router.get('/funders', getFunders);

// @route   POST /api/v1/onyx/sync/clients
// @desc    Sync clients from OnyxIQ
// @access  Public (for import flow)
router.post('/sync/clients', syncClients);

// @route   POST /api/v1/onyx/sync/applications
// @desc    Sync applications from OnyxIQ
// @access  Public (for import flow)
router.post('/sync/applications', syncApplications);

// @route   POST /api/v1/onyx/sync/fundings
// @desc    Sync fundings from OnyxIQ
// @access  Public (for import flow)
router.post('/sync/fundings', syncFundings);

// @route   POST /api/v1/onyx/sync/full
// @desc    Perform full sync from OnyxIQ
// @access  Public (for import flow)
router.post('/sync/full', performFullSync);

// @route   GET /api/v1/onyx/progress/:operationId
// @desc    Get progress for a specific operation
// @access  Public (for import flow)
router.get('/progress/:operationId', getProgress);

// All other routes require authentication
router.use(protect);

// @route   GET /api/v1/onyx/status
// @desc    Get OnyxIQ sync status
// @access  Private
router.get('/status', getSyncStatus);

module.exports = router;
