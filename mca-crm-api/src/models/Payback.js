const mongoose = require('mongoose');
const AccountSchema = require('./Common/Account');
const { PAYMENT_METHOD, PAYBACK_STATUS } = require('../utils/constants');
const Payout = require('./Payout');
const PaybackLog = require('./PaybackLog');

const PaybackSchema = new mongoose.Schema({
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding',
        required: true,
        index: true
    },
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lender',
        required: true,
        index: true
    },
    merchant_account: AccountSchema,
    funder_account: AccountSchema,
    payback_plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payback-Plan',
        index: true
    },
    due_date: {
        type: Date
    },
    submitted_date: {
        type: Date
    },
    processed_date: {
        type: Date
    },
    responsed_date: {
        type: Date
    },
    response: {
        type: String
    },
    payback_amount: {
        type: Number,
        required: true,
        default: 0
    },
    funded_amount: {
        type: Number,
        required: true,
        default: 0
    },
    fee_amount: {
        type: Number,
        required: true,
        default: 0
    },
    payment_method: {
        type: String,
        enum: Object.values(PAYMENT_METHOD),
        required: true
    },
    ach_processor: {
        type: String
    },
    status: {
        type: String,
        enum: Object.values(PAYBACK_STATUS),
        required: true
    },
    note: {
        type: String
    },
    created_by_user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by_user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    reconciled: {
        type: Boolean
    }
}, { 
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

PaybackSchema.virtual('payout_count', {
    ref: 'Payout',
    localField: '_id',
    foreignField: 'payback',
    count: true
});

PaybackSchema.virtual('log_count', {
    ref: 'Payback-Log',
    localField: '_id',
    foreignField: 'payback',
    count: true
});

/**
 * Helper function to calculate statistics for Payback documents
 * @param {Array} docs - The array of Payback documents to calculate statistics for
 * @returns {Array} The array of Payback documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all Payback IDs
    const paybackIds = docs.map(doc => doc._id);
    
    // Initialize stats for each payback to make sure we have stats for all paybacks, even if there are no payouts for that payback
    const statsByPayback = {};
    
    for (const paybackId of paybackIds) {
        statsByPayback[paybackId] = {
            payout_count: 0,
            log_count: 0
        };
    }
    
    // Get all payouts with their payout and log counts
    const payouts = await Payout.find({ payback: { $in: paybackIds } });
    
    // Populate stats for each payback
    for (const payout of payouts) {
        statsByPayback[payout.payback].payout_count++;
    }
    
    // Get all payback logs
    const paybackLogs = await PaybackLog.find({ payback: { $in: paybackIds } });
    
    // Populate stats for each payback
    for (const paybackLog of paybackLogs) {
        statsByPayback[paybackLog.payback].log_count++;
    }
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const paybackId = doc._id.toString();
        const stats = statsByPayback[paybackId];

        doc.payout_count = stats.payout_count;
        doc.log_count = stats.log_count;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
PaybackSchema.post('find', async function(docs) {
    await calculateStatistics(docs);
});

PaybackSchema.post('findOne', async function(doc) {
    if (doc) await calculateStatistics([doc]);
});

const Payback = mongoose.model('Payback', PaybackSchema);

module.exports = Payback;