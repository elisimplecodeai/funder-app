const express = require('express');
const {
    getSyndications,
    createSyndication,
    getSyndicationList,
    updateSyndication,
    getSyndication
} = require('../controllers/syndicationController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.SYNDICATION.READ), getSyndications)
    .post(authorize(PERMISSIONS.SYNDICATION.CREATE), createSyndication);

router.route('/list')
    .get(authorize(PERMISSIONS.SYNDICATION.READ), getSyndicationList);

router.route('/:id')
    .get(authorize(PERMISSIONS.SYNDICATION.READ), getSyndication)
    .put(authorize(PERMISSIONS.SYNDICATION.UPDATE), updateSyndication);



module.exports = router; 