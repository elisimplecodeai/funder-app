const express = require('express');
const {
    getApplicationOffers,
    createApplicationOffer,
    getApplicationOfferList,
    updateApplicationOffer,
    getApplicationOffer,
    deleteApplicationOffer,
    acceptApplicationOffer,
    declineApplicationOffer
} = require('../controllers/applicationOfferController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.APPLICATION_OFFER.READ), getApplicationOffers)
    .post(authorize(PERMISSIONS.APPLICATION_OFFER.CREATE), createApplicationOffer);

router.route('/list')
    .get(authorize(PERMISSIONS.APPLICATION_OFFER.READ), getApplicationOfferList);

router.route('/:id')
    .get(authorize(PERMISSIONS.APPLICATION_OFFER.READ), getApplicationOffer)
    .put(authorize(PERMISSIONS.APPLICATION_OFFER.UPDATE), updateApplicationOffer)
    .delete(authorize(PERMISSIONS.APPLICATION_OFFER.DELETE), deleteApplicationOffer);

router.route('/:id/accept')
    .put(authorize(PERMISSIONS.APPLICATION_OFFER.APPROVE), acceptApplicationOffer);

router.route('/:id/decline')
    .put(authorize(PERMISSIONS.APPLICATION_OFFER.REJECT), declineApplicationOffer);

module.exports = router; 