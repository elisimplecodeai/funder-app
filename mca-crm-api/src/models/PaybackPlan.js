const mongoose = require('mongoose');
const dateHolidays = require('date-holidays');

const { PAYMENT_METHOD, PAYBACK_FREQUENCY, PAYBACK_PLAN_STATUS, PAYBACK_STATUS, PAYBACK_DISTRIBUTION_PRIORITY } = require('../utils/constants');

const PaybackPlanSchema = new mongoose.Schema({
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
    merchant_account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant-Account'
    },
    funder_account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder-Account'
    },
    payment_method: {
        type: String,
        enum: [...Object.values(PAYMENT_METHOD), null],
        default: null
    },
    ach_processor: {
        type: String,
        enum: ['ACHWorks', 'Actum', 'Manual', 'Other', null],
        default: null
    },
    total_amount: {
        type: Number,
        required: true
    },
    payback_count: {
        type: Number
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date
    },
    next_payback_date: {
        type: Date
    },
    created_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    frequency: {
        type: String,
        enum: Object.values(PAYBACK_FREQUENCY)
    },
    payday_list: {
        type: [Number]
    },
    avoid_holiday: {
        type: Boolean,
        default: false
    },
    distribution_priority: {
        type: String,
        enum: Object.values(PAYBACK_DISTRIBUTION_PRIORITY),
        default: PAYBACK_DISTRIBUTION_PRIORITY.FUND_FIRST
    },
    note: {
        type: String
    },
    status: {
        type: String,
        enum: Object.values(PAYBACK_PLAN_STATUS)
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Helper function to calculate term length for PaybackPlan document
const calculateTermLength = function(paybackPlan) {
    if (!paybackPlan.payback_count || !paybackPlan.frequency) {
        return null;
    }
    const paydayListLength = Array.isArray(paybackPlan.payday_list) ? paybackPlan.payday_list.length : 0;

    if (paybackPlan.frequency === PAYBACK_FREQUENCY.DAILY) {
        return paydayListLength ? paybackPlan.payback_count / paydayListLength / 4 : null;
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.WEEKLY) {
        return paybackPlan.payback_count / 4;
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
        return paybackPlan.payback_count;
    }
    return null;
};

// Helper function to calculate the scheduled end date for PaybackPlan document
const calculateScheduledEndDate = function(paybackPlan) {
    if (!paybackPlan || !paybackPlan.start_date || !paybackPlan.payback_count || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return null;
    }

    return calculateScheduledPaybackDate(paybackPlan, paybackPlan.start_date, paybackPlan.payback_count);
};

// Helper function to calculate the expected end date for PaybackPlan document
const calculateExpectedEndDate = function(paybackPlan) {
    if (!paybackPlan || !paybackPlan.start_date || !paybackPlan.remaining_count || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return null;
    }

    return calculateScheduledPaybackDate(paybackPlan, paybackPlan.next_payback_date, paybackPlan.remaining_count);
};

// Helper function to generate the whole list of paybacks (date and amount) for a PaybackPlan document
const generatePaybackList = function(paybackPlan) {
    const paybackList = [];

    if (!paybackPlan || !paybackPlan.start_date || !paybackPlan.total_amount || !paybackPlan.payback_count || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return paybackList;
    }
    
    let remainingAmount = paybackPlan.total_amount;
    let remainingCount = paybackPlan.payback_count;
    let nextPaybackAmount = paybackPlan.next_payback_amount || Math.round(remainingAmount / remainingCount);
    let nextPaybackDate = paybackPlan.start_date;
    
    // If the next payback amount is not set or is 0, return the empty list
    if (!nextPaybackAmount) {
        return paybackList;
    }

    while (remainingCount > 0) {
        const calculatedNextPaybackDate = calculateNthPaybackDate(paybackPlan, nextPaybackDate, 1);
        paybackList.push({
            date: calculatedNextPaybackDate,
            amount: nextPaybackAmount
        });
        remainingAmount = remainingAmount - nextPaybackAmount;
        remainingCount = remainingCount - 1;
        nextPaybackAmount = Math.round(remainingAmount / remainingCount);
        nextPaybackDate = new Date(calculatedNextPaybackDate);
        nextPaybackDate.setDate(nextPaybackDate.getDate() + 1);
    }

    return paybackList;
};

// Helper function to calculate the nth payback date from the start date
// Use recursion to calculate the next payback date
// Should avoid holidays if avoid_holiday is true
const calculateNthPaybackDate = function(paybackPlan, startDate, n) {
    if (!paybackPlan || !startDate || !n || n <= 0 || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return null;
    }
 
    const holidays = new dateHolidays('US');

    
    let nextPaybackDate = new Date(startDate);

    if (paybackPlan.frequency === PAYBACK_FREQUENCY.DAILY) {
        // If daily, based on the payday_list, find the next payday which day is greater or equal to the start day
        // If not found, use the first day of the payday_list (which means the first day of the next week)
        const startDay = startDate.getDay();
        let startIndex = paybackPlan.payday_list.findIndex(day => day >= startDay);
        if (startIndex === -1) {
            startIndex = 0;
        }
        const nextPaybackDay = paybackPlan.payday_list[startIndex];
        nextPaybackDate.setDate(nextPaybackDate.getDate() + (nextPaybackDay - startDay + 7) % 7);
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.WEEKLY) {
        // If weekly, based on the payday_list, find the next payday which day is in the first element of the payday_list
        const startDay = startDate.getDay();
        const nextPaybackDay = paybackPlan.payday_list[0];
        nextPaybackDate.setDate(nextPaybackDate.getDate() + (nextPaybackDay - startDay + 7) % 7);
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
        // If monthly, based on the payday_list, compare the date in the first element of the payday_list with the start date
        // if the start date is greater or equal to the date in the first element of the payday_list, then the next payback date is the date in the first element of the payday_list
        // otherwise, the next payback date is the date in the first element of the payday_list + 1 month
        const nextPaybackDay = paybackPlan.payday_list[0];
        if (startDate.getDate() > nextPaybackDay)  nextPaybackDate.setMonth(nextPaybackDate.getMonth() + 1);
        // If the next payback day is lager than the last day of the month, then set the last day of the month
        // Otherwise, set the next payback day
        if (nextPaybackDay > new Date(nextPaybackDate.getFullYear(), nextPaybackDate.getMonth() + 1, 0).getDate()) {
            nextPaybackDate.setDate(new Date(nextPaybackDate.getFullYear(), nextPaybackDate.getMonth() + 1, 0).getDate());
        } else {
            nextPaybackDate.setDate(nextPaybackDay);
        }
    }

    // Avoid holidays if avoid_holiday is true
    while (paybackPlan.avoid_holiday && (holidays.isHoliday(nextPaybackDate) || nextPaybackDate.getDay() === 0 || nextPaybackDate.getDay() === 6)) {
        nextPaybackDate.setDate(nextPaybackDate.getDate() + 1);
    }

    if (n > 1) {
        const nextStartDate = new Date(nextPaybackDate);
        nextStartDate.setDate(nextStartDate.getDate() + 1);
        return calculateNthPaybackDate(paybackPlan, nextStartDate, n - 1);
    } else {
        return nextPaybackDate;
    }
};

// Helper function to calculate the scheduled nth payback date
const calculateScheduledPaybackDate = function(paybackPlan, nextPaybackDate, n) {
    if (!paybackPlan || !nextPaybackDate || !n || n <= 0 || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return null;
    }

    const holidays = new dateHolidays('US');
    
    if (n === 1) {
        while (paybackPlan.avoid_holiday && holidays.isHoliday(new Date(nextPaybackDate))) {
            nextPaybackDate = new Date(nextPaybackDate);
            nextPaybackDate.setDate(nextPaybackDate.getDate() + 1);
        }
        return nextPaybackDate;
    }

    const startDate = new Date(nextPaybackDate);
    const remainingPaybacks = n - 1; // Since we start from start_date

    if (paybackPlan.frequency === PAYBACK_FREQUENCY.DAILY) {
        // Calculate the second payback date index
        const startDay = startDate.getDay();
        let startIndex = paybackPlan.payday_list.findIndex(day => day > startDay);
        if (startIndex === -1) {
            startIndex = 0;
        }

        // Calculate the day of the last payback date from the payday_list, startIndex and remainingPaybacks % daysPerCycle
        const daysPerCycle = paybackPlan.payday_list.length;
        const lastPaybackDay = paybackPlan.payday_list[(startIndex + remainingPaybacks - 1) % daysPerCycle];
        const lastDaysToAdd = (lastPaybackDay - startDay + 7) % 7;
        let lastPaybackDate = new Date(startDate);
        lastPaybackDate.setDate(lastPaybackDate.getDate() + Math.floor(remainingPaybacks / daysPerCycle) * 7 + lastDaysToAdd);
        
        while (paybackPlan.avoid_holiday && holidays.isHoliday(new Date(lastPaybackDate))) {
            lastPaybackDate = new Date(lastPaybackDate);
            lastPaybackDate.setDate(lastPaybackDate.getDate() + 1);
        }
        return lastPaybackDate;
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.WEEKLY) {
        // Find the weekday from the payday_list, where 1 = Sunday, 2 = Monday, etc.
        // We will convert to 0 = Sunday, 1 = Monday, etc.
        const weekday = paybackPlan.payday_list[0];

        // Find the next occurrence of the weekday after start_date
        // If the weekday is same as day of start_date, then we need to add 7 days
        const currentDay = startDate.getDay();
        let daysToAdd = (weekday - currentDay) % 7;
        if (daysToAdd <= 0) daysToAdd += 7;

        const nextPaybackDate = new Date(startDate);
        nextPaybackDate.setDate(nextPaybackDate.getDate() + daysToAdd);

        // Calculate the end date by adding the number of weeks to the next payback date
        let endDate = new Date(nextPaybackDate);
        endDate.setDate(endDate.getDate() + ((remainingPaybacks - 1) * 7));

        while (paybackPlan.avoid_holiday && holidays.isHoliday(new Date(endDate))) {
            endDate = new Date(endDate);
            endDate.setDate(endDate.getDate() + 1);
        }
        return endDate;
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
        // Calculate the next payback date
        const nextPaybackDate = new Date(startDate);
        let endDate = new Date(nextPaybackDate);

        if (paybackPlan.payday_list[0] <= startDate.getDate()) {
            endDate.setMonth(endDate.getMonth() + remainingPaybacks);
        } else {
            endDate.setMonth(endDate.getMonth() + remainingPaybacks - 1);
        }
        endDate.setDate(paybackPlan.payday_list[0]);

        while (paybackPlan.avoid_holiday && holidays.isHoliday(new Date(endDate))) {
            endDate = new Date(endDate);
            endDate.setDate(endDate.getDate() + 1);
        }
        return endDate;
    }
    return null;
};

// Add static methods to the schema
PaybackPlanSchema.statics.calculateScheduledPaybackDate = calculateScheduledPaybackDate;
PaybackPlanSchema.statics.calculateNthPaybackDate = calculateNthPaybackDate;
PaybackPlanSchema.statics.generatePaybackList = generatePaybackList;

// Helper function to calculate statistics for PaybackPlan documents
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    const Payback = mongoose.model('Payback');
    
    // Get all payback plan IDs
    const paybackPlanIds = docs.map(doc => doc._id);
    
    // Fetch all paybacks for these plans in one query
    const paybacks = await Payback.find({
        payback_plan: { $in: paybackPlanIds }
    }, 'payback_plan status payback_amount');
    
    // Group paybacks by plan ID and calculate statistics
    const statsByPlan = {};

    // Initialize stats for each plan
    for (const planId of paybackPlanIds) {
        statsByPlan[planId] = {
            succeed_count: 0,
            submitted_count: 0,
            processing_count: 0,
            bounced_count: 0,
            failed_count: 0,
            disputed_count: 0,

            submitted_amount: 0,
            processing_amount: 0,
            failed_amount: 0,
            succeed_amount: 0,
            bounced_amount: 0,
            disputed_amount: 0,   
        };
    }

    paybacks.forEach(payback => {
        const planId = payback.payback_plan.toString();
        
        const stats = statsByPlan[planId];
        switch (payback.status) {
        case PAYBACK_STATUS.SUBMITTED:
            stats.submitted_count += 1;
            stats.submitted_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.PROCESSING:
            stats.processing_count += 1;
            stats.processing_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.FAILED:
            stats.failed_count += 1;
            stats.failed_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.SUCCEED:
            stats.succeed_count += 1;
            stats.succeed_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.BOUNCED:
            stats.bounced_count += 1;
            stats.bounced_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.DISPUTED:
            stats.disputed_count += 1;
            stats.disputed_amount += payback.payback_amount || 0;
            break;
        }
    });
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const planId = doc._id.toString();
        const stats = statsByPlan[planId];

        doc.submitted_count = stats.submitted_count;
        doc.processing_count = stats.processing_count;
        doc.failed_count = stats.failed_count;
        doc.succeed_count = stats.succeed_count;
        doc.bounced_count = stats.bounced_count;
        doc.disputed_count = stats.disputed_count;

        doc.submitted_amount = stats.submitted_amount;
        doc.processing_amount = stats.processing_amount;
        doc.failed_amount = stats.failed_amount;
        doc.succeed_amount = stats.succeed_amount;
        doc.bounced_amount = stats.bounced_amount;
        doc.disputed_amount = stats.disputed_amount;

        doc.paid_amount = stats.succeed_amount;
        doc.pending_amount = stats.submitted_amount + stats.processing_amount;
        doc.pending_count = stats.submitted_count + stats.processing_count;
        doc.remaining_balance = (doc.total_amount || 0) - stats.succeed_amount - doc.pending_amount;
        doc.remaining_count = (doc.payback_count || 0) - stats.succeed_count - doc.pending_count;
                
        // Calculate success rate only if there are completed paybacks (succeed + bounced + disputed)
        const completedPaybacks = stats.succeed_count + stats.bounced_count + stats.disputed_count;
        doc.succeed_rate = completedPaybacks > 0 ? stats.succeed_count / completedPaybacks : 0;
        
        doc.next_payback_amount = doc.remaining_count > 0 ? doc.remaining_balance / doc.remaining_count : 0;

        // Calculate term length, scheduled end date and expected end date
        doc.term_length = calculateTermLength(doc);
        doc.scheduled_end_date = calculateScheduledEndDate(doc);
        doc.expected_end_date = calculateExpectedEndDate(doc);

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
PaybackPlanSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

PaybackPlanSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const PaybackPlan = mongoose.model('Payback-Plan', PaybackPlanSchema);

module.exports = PaybackPlan;
