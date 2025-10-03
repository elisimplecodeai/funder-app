const Transaction = require('../models/Transaction');
const Funding = require('../models/Funding');
const Syndication = require('../models/Syndication');
const Payout = require('../models/Payout');
const FundingFee = require('../models/FundingFee');
const FundingExpense = require('../models/FundingExpense');
const Payback = require('../models/Payback');
const mongoose = require('mongoose');
const { TRANSACTION_TYPES, SYNDICATION_STATUS } = require('../utils/constants');

// Define which transaction types are outflows (negative values)
const OUTFLOW_TRANSACTION_TYPES = [
    TRANSACTION_TYPES.DISBURSEMENT,
    TRANSACTION_TYPES.COMMISSION,
    TRANSACTION_TYPES.EXPENSE,
    TRANSACTION_TYPES.CREDIT,
    TRANSACTION_TYPES.PAYOUT,
    TRANSACTION_TYPES.FUNDER_WITHDRAW,
    TRANSACTION_TYPES.SYNDICATOR_WITHDRAW
];

/**
 * Helper function to create date aggregation
 * @param {string} aggregation - 'day', 'week', or 'month'
 * @returns {Object} Date grouping object for MongoDB aggregation
 */
const getDateGrouping = (aggregation) => {
    switch (aggregation) {
    case 'day':
        return {
            year: { $year: '$transaction_date' },
            month: { $month: '$transaction_date' },
            day: { $dayOfMonth: '$transaction_date' }
        };
    case 'week':
        return {
            year: { $year: '$transaction_date' },
            week: { $week: '$transaction_date' }
        };
    case 'month':
    default:
        return {
            year: { $year: '$transaction_date' },
            month: { $month: '$transaction_date' }
        };
    }
};

/**
 * Helper function to format period string
 * @param {Object} group - Period group object
 * @param {string} aggregation - 'day', 'week', or 'month'
 * @returns {string} Formatted period string
 */
const formatPeriod = (group, aggregation) => {
    switch (aggregation) {
    case 'day':
        return `${new Date(group.year, group.month - 1, group.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} '${group.year.toString().slice(-2)}`;
    case 'week':
        return `Week ${group.week} '${group.year.toString().slice(-2)}`;
    case 'month':
    default:
        return `${new Date(group.year, group.month - 1).toLocaleDateString('en-US', { month: 'short' })} '${group.year.toString().slice(-2)}`;
    }
};

/**
 * Helper function to calculate week number like MongoDB's $week
 * @param {Date} date - Date to calculate week number for
 * @returns {number} Week number
 */
const getWeekNumber = (date) => {
    const year = date.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const days = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
};

/**
 * Helper function to generate all periods between start and end date
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} aggregation - 'day', 'week', or 'month'
 * @returns {Array} Array of period keys
 */
const generateAllPeriods = (startDate, endDate, aggregation) => {
    const periods = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        let periodKey;
        let weekNumber;
        let year;
        
        switch (aggregation) {
        case 'day':
            periodKey = {
                year: current.getUTCFullYear(),
                month: current.getUTCMonth() + 1,
                day: current.getUTCDate()
            };
            current.setUTCDate(current.getUTCDate() + 1);
            break;
        case 'week':
            // Use the helper function for more accurate week calculation
            year = current.getUTCFullYear();
            weekNumber = getWeekNumber(current);
            
            periodKey = {
                year: year,
                week: weekNumber
            };
            current.setUTCDate(current.getUTCDate() + 7);
            break;
        case 'month':
        default:
            periodKey = {
                year: current.getUTCFullYear(),
                month: current.getUTCMonth() + 1
            };
            current.setUTCMonth(current.getUTCMonth() + 1);
            break;
        }
        periods.push(periodKey);
    }
    return periods;
};

/**
 * Get financial report data for a funder
 * @param {string} funderId - The funder ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} aggregation - 'day', 'week', or 'month'
 * @param {string[]} categories - Categories to include
 * @returns {Object} Aggregated financial data
 */
const getFinancialData = async (funderId, startDate, endDate, aggregation, categories) => {
    // Build the base match filter
    const baseMatch = {
        funder: new mongoose.Types.ObjectId(funderId),
        transaction_date: { $gte: startDate, $lte: endDate },
        inactive: { $ne: true } // Exclude inactive transactions
    };

    // Process each category
    const results = {};
    for (const categoryKey of categories) {
        // Validate that the category is a valid transaction type
        if (!Object.values(TRANSACTION_TYPES).includes(categoryKey)) continue;

        // Build the aggregation pipeline for this category
        const pipeline = [
            {
                $match: {
                    ...baseMatch,
                    type: categoryKey
                }
            },
            {
                $group: {
                    _id: getDateGrouping(aggregation),
                    total: { $sum: '$amount' }
                }
            },
            {
                $addFields: {
                    total: { $divide: ['$total', 100] }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ];

        const data = await Transaction.aggregate(pipeline);
        results[categoryKey] = data;
    }

    // Generate all possible periods
    const allPeriods = generateAllPeriods(startDate, endDate, aggregation);

    // Create the final financial data with all periods and categories
    const financialData = [];
    
    allPeriods.forEach(period => {
        const periodStr = formatPeriod(period, aggregation);
        
        const periodData = {
            period: periodStr,
            periodKey: period
        };

        // Add data for each category
        categories.forEach(categoryKey => {
            const categoryData = results[categoryKey] || [];
            const matchingData = categoryData.find(item => {
                // Compare period keys
                if (aggregation === 'day') {
                    return item._id.year === period.year && 
                           item._id.month === period.month && 
                           item._id.day === period.day;
                } else if (aggregation === 'week') {
                    return item._id.year === period.year && 
                           item._id.week === period.week;
                } else {
                    return item._id.year === period.year && 
                           item._id.month === period.month;
                }
            });
            
            let value = matchingData ? matchingData.total : 0;
            
            // Make outflows negative
            if (OUTFLOW_TRANSACTION_TYPES.includes(categoryKey)) {
                value = -Math.abs(value);
            }
            
            periodData[categoryKey] = value;
        });

        financialData.push(periodData);
    });

    return financialData;
};

/**
 * Get dashboard data for a funder
 * @param {string} funderId - The funder ID
 * @returns {Object} Dashboard data
 */
const getDashboardData = async (funderId) => {
    // Base query filter
    const baseFilter = {
        'funder.id': new mongoose.Types.ObjectId(funderId),
        inactive: { $ne: true }
    };

    // Get all fundings for this funder (with statistics calculated)
    const allFundings = await Funding.find(baseFilter, null, { calculate: true });

    // Initialize totals for all groups
    const totals = {
        overall: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        performing: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        completed: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        defaulted: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 }
    };
    
    // Calculate syndication
    const syndicationData = {
        closed: { count: 0, syndication_amount: 0, payout_amount: 0 },
        active: { count: 0, syndication_amount: 0, payout_amount: 0 }
    };

    // Calculate Profit and Loss
    const profit = {
        advance_paid: 0,
        upfront_fees: 0,
        other_fees: 0,
        syndication_cafs: 0,
        total: 0
    };

    const loss = {
        advance_default: 0,
        commissions: 0,
        other_expenses: 0,
        syndication_credits: 0,
        total: 0
    };


    // Single pass through all fundings to categorize and calculate totals
    allFundings.forEach(funding => {
        // Convert from cents to dollars (assuming amounts are stored in cents)
        const fundedAmount = (funding.funded_amount || 0) / 100;
        const paybackAmount = (funding.payback_amount || 0) / 100;
        const paidAmount = (funding.paid_amount || 0) / 100;

        // Add to all category
        totals.overall.count += 1;
        totals.overall.total_funded_amount += fundedAmount;
        totals.overall.total_payback_amount += paybackAmount;
        totals.overall.total_paid_amount += paidAmount;

        // Categorize by status and add to respective groups
        if (funding.status?.performing === true) {
            totals.performing.count += 1;
            totals.performing.total_funded_amount += fundedAmount;
            totals.performing.total_payback_amount += paybackAmount;
            totals.performing.total_paid_amount += paidAmount;
        }

        if (funding.status?.closed === true && funding.status?.defaulted !== true) {
            totals.completed.count += 1;
            totals.completed.total_funded_amount += fundedAmount;
            totals.completed.total_payback_amount += paybackAmount;
            totals.completed.total_paid_amount += paidAmount;
        }

        if (funding.status?.defaulted === true) {
            totals.defaulted.count += 1;
            totals.defaulted.total_funded_amount += fundedAmount;
            totals.defaulted.total_payback_amount += paybackAmount;
            totals.defaulted.total_paid_amount += paidAmount;
        }
    });

    // Query syndication data for this funder
    const allSyndications = await Syndication.find({
        funder: funderId
    }).lean();

    // Get payout data for syndications
    const payouts = await Payout.find({
        funder: funderId
    }).lean();


    // Process syndications
    allSyndications.forEach(syndication => {
        // Convert from cents to dollars
        const participateAmount = (syndication.participate_amount || 0) / 100;
        
        // Calculate payout amount for this syndication
        const syndicationPayouts = payouts.filter(p => p.syndication.toString() === syndication._id.toString());
        const payoutAmount = syndicationPayouts.reduce((sum, payout) => {
            return sum + ((payout.payout_amount || 0) / 100);
        }, 0);

        // Add to active if status is ACTIVE
        if (syndication.status === SYNDICATION_STATUS.ACTIVE) {
            syndicationData.active.count += 1;
            syndicationData.active.syndication_amount += participateAmount;
            syndicationData.active.payout_amount += payoutAmount;
        } else {
            syndicationData.closed.count += 1;
            syndicationData.closed.syndication_amount += participateAmount;
            syndicationData.closed.payout_amount += payoutAmount;
        }

        // Calculate syndication CAFs
        if (syndication.fee_list && Array.isArray(syndication.fee_list)) {
            syndication.fee_list.forEach(fee => {
                if (fee.upfront === true) {
                    profit.syndication_cafs += (fee.amount || 0) / 100;
                }
            });
        }

        // Calculate syndication credits
        if (syndication.credit_list && Array.isArray(syndication.credit_list)) {
            syndication.credit_list.forEach(credit => {
                if (credit.upfront === true) {
                    loss.syndication_credits += (credit.amount || 0) / 100;
                }
            });
        }
    });

    // 1. Profit - Advance Paid (from fundings: completed, paid_amount - funded_amount)
    profit.advance_paid = totals.completed.total_paid_amount - totals.completed.total_funded_amount;

    // 2. Profit - Upfront fees (from funding-fees collection with upfront: true)
    const upfrontFees = await FundingFee.find({
        funder: funderId,
        upfront: true,
        inactive: { $ne: true }
    }).lean();
    profit.upfront_fees = upfrontFees.reduce((sum, fee) => sum + ((fee.amount || 0) / 100), 0);

    // 3. Profit - Other Fees (from payback collection, sum of fee_amount)
    const paybacks = await Payback.find({
        funder: funderId,
        inactive: { $ne: true }
    }).lean();
    profit.other_fees = paybacks.reduce((sum, payback) => sum + ((payback.fee_amount || 0) / 100), 0);

    // 4. Profit - Add payout fee_amount to syndication CAFs
    profit.syndication_cafs += payouts.reduce((sum, payout) => sum + ((payout.fee_amount || 0) / 100), 0);

    // Calculate total profit
    profit.total = profit.advance_paid + 
                   profit.upfront_fees + 
                   profit.other_fees + 
                   profit.syndication_cafs;

    // 1. Loss - Advance Default (from fundings: defaulted, funded_amount - paid_amount)
    loss.advance_default = totals.defaulted.total_funded_amount - totals.defaulted.total_paid_amount;

    // 2. Loss - Commissions (from funding-expense collection with commission: true)
    const commissions = await FundingExpense.find({
        funder: funderId,
        commission: true,
        inactive: { $ne: true }
    }).lean();
    loss.commissions = commissions.reduce((sum, expense) => sum + ((expense.amount || 0) / 100), 0);

    // 3. Loss - Other Expenses (from funding-expense with commission: false)
    const otherExpenses = await FundingExpense.find({
        funder: funderId,
        commission: false,
        inactive: { $ne: true }
    }).lean();
    loss.other_expenses = otherExpenses.reduce((sum, expense) => sum + ((expense.amount || 0) / 100), 0);

    // 4. Loss - Add payout credit_amount
    loss.syndication_credits += payouts.reduce((sum, payout) => sum + ((payout.credit_amount || 0) / 100), 0);

    // Calculate total loss
    loss.total = loss.advance_default + 
                 loss.commissions + 
                 loss.other_expenses + 
                 loss.syndication_credits;

    return {
        overall: totals.overall,
        performing: totals.performing,
        completed: totals.completed,
        defaulted: totals.defaulted,
        syndication: syndicationData,
        profit,
        loss
    };
};

module.exports = {
    getFinancialData,
    getDashboardData
}; 