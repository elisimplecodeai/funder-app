const Joi = require('joi');
const PaybackPlan = require('../models/PaybackPlan');

const PaybackPlanService = require('../services/paybackPlanService');
const FundingService = require('../services/fundingService');
const ErrorResponse = require('../utils/errorResponse');

const { accessControl } = require('../middleware/auth');
const Helpers = require('../utils/helpers');
const { PORTAL_TYPES, PAYBACK_PLAN_STATUS } = require('../utils/constants');

const default_populate = [
    { path: 'funding', select: 'merchant funder iso name type' },
    { path: 'funder', select: 'name email phone' },
    { path: 'lender', select: 'name email phone' },
    { path: 'merchant', select: 'name email phone' },
    { path: 'merchant_account', select: 'merchant name' },
    { path: 'funder_account', select: 'funder name' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' }
];

// query schema for payback plans
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    funding: Joi.string().optional(),
    funder: Joi.string().optional(),
    lender: Joi.string().optional(),
    merchant: Joi.string().optional(),
    payment_method: Joi.string().optional(),
    ach_processor: Joi.string().optional(),
    frequency: Joi.string().optional(),
    status: Joi.string().optional()
};

// build db query for payback plans
const buildDbQuery = async (req, query) => {
    let dbQuery = {};
    dbQuery.$and = [];

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    const lenderFilter = Helpers.buildLenderFilter(req, query.lender);
    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);

    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });
    if (lenderFilter) dbQuery.$and.push({ lender: lenderFilter });
    if (merchantFilter) dbQuery.$and.push({ merchant: merchantFilter });

    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { note: { $regex: query.search, $options: 'i' } },
            ]
        });
    }

    if (query.funding) {
        const funding = await FundingService.getFundingById(query.funding);
        accessControl(req, funding, 'funding');

        dbQuery.$and.push({ funding: query.funding });
    }

    if (query.payment_method) dbQuery.$and.push({ payment_method: query.payment_method });
    if (query.ach_processor) dbQuery.$and.push({ ach_processor: query.ach_processor });
    if (query.frequency) dbQuery.$and.push({ frequency: query.frequency });
    if (query.status) dbQuery.$and.push({ status: query.status });

    return dbQuery;
};

// @desc    Get all payback plans
// @route   GET /api/v1/payback-plans
// @access  Private
exports.getPaybackPlans = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        const dbQuery = await buildDbQuery(req, query);
        
        const dbSort = Helpers.buildSort(sort, { start_date: -1 });

        const paybackPlans = await PaybackPlanService.getPaybackPlans(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate,
            '',
            true
        );

        res.status(200).json({
            success: true,
            data: paybackPlans
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new payback plan
// @route   POST /api/v1/payback-plans
// @access  Private
exports.createPaybackPlan = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            merchant_account: Joi.string().optional(),
            funder_account: Joi.string().optional(),
            payment_method: Joi.string().required(),
            ach_processor: Joi.string().optional(),
            total_amount: Joi.number().required(),
            payback_count: Joi.number().required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().optional(),
            next_payback_date: Joi.date().optional(),
            frequency: Joi.string().optional(),
            payday_list: Joi.array().items(Joi.number()).optional(),
            avoid_holiday: Joi.boolean().optional(),
            distribution_priority: Joi.string().optional(),
            note: Joi.string().optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const data = { ...value };

        const funding = await FundingService.getFundingById(value.funding);
        accessControl(req, funding, 'funding');

        data.funder = Helpers.extractIdString(funding.funder);
        data.lender = Helpers.extractIdString(funding.lender);
        data.merchant = Helpers.extractIdString(funding.merchant);

        if (req.portal == PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }

        if (!value.status) {
            data.status = PAYBACK_PLAN_STATUS.ACTIVE;
        }

        const paybackPlan = await PaybackPlanService.createPaybackPlan(data, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: paybackPlan
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get payback plan list without pagination
// @route   GET /api/v1/payback-plans/list
// @access  Private
exports.getPaybackPlanList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        const dbQuery = await buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { start_date: -1 });

        const paybackPlans = await PaybackPlanService.getPaybackPlanList(dbQuery, dbSort);

        res.status(200).json({
            success: true,
            data: paybackPlans
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single payback plan
// @route   GET /api/v1/payback-plans/:id
// @access  Private
exports.getPaybackPlan = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const paybackPlan = await PaybackPlanService.getPaybackPlanById(id, default_populate, '', true);
        accessControl(req, paybackPlan, 'payback_plan');

        res.status(200).json({
            success: true,
            data: paybackPlan
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update payback plan
// @route   PUT /api/v1/payback-plans/:id
// @access  Private
exports.updatePaybackPlan = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            merchant_account: Joi.string().optional(),
            funder_account: Joi.string().optional(),
            payment_method: Joi.string().optional(),
            ach_processor: Joi.string().optional(),
            total_amount: Joi.number().optional(),
            payback_count: Joi.number().optional(),
            start_date: Joi.date().optional(),
            end_date: Joi.date().optional(),
            next_payback_date: Joi.date().optional(),
            frequency: Joi.string().optional(),
            payday_list: Joi.array().items(Joi.number()).optional(),
            avoid_holiday: Joi.boolean().optional(),
            distribution_priority: Joi.string().optional(),
            note: Joi.string().optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const paybackPlan = await PaybackPlanService.getPaybackPlanById(id);
        accessControl(req, paybackPlan, 'payback_plan');

        if (req.portal == PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedPaybackPlan = await PaybackPlanService.updatePaybackPlan(id, data, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: updatedPaybackPlan
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Generate Next one or more paybacks
// @route   POST /api/v1/payback-plans/:id/generate
// @access  Private
exports.generateNextPaybacks = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const paybackPlan = await PaybackPlanService.getPaybackPlanById(id);
        accessControl(req, paybackPlan, 'payback_plan');

        const paybacks = await PaybackPlanService.generateNextPaybacks(id);

        res.status(200).json({
            success: true,
            data: paybacks
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Generate payback list
// @route   GET /api/v1/payback-plans/generate
// @access  Private
exports.generatePaybackList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            total_amount: Joi.number().required(),
            payback_count: Joi.number().required(),
            start_date: Joi.date().required(),
            next_payback_date: Joi.date().optional(),
            frequency: Joi.string().optional(),
            payday_list: Joi.array().items(Joi.number()).optional(),
            avoid_holiday: Joi.boolean().optional(),
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { total_amount, payback_count, start_date, next_payback_date, frequency, payday_list, avoid_holiday } = value;

        const paybackPlan = { total_amount: Helpers.dollarsToCents(total_amount), payback_count, start_date, next_payback_date, frequency, payday_list, avoid_holiday };

        const paybackList = PaybackPlan.generatePaybackList(paybackPlan).map(payback => ({
            date: payback.date,
            amount: Helpers.centsToDollars(payback.amount)
        }));

        res.status(200).json({
            success: true,
            data: paybackList
        });
    } catch (err) {
        next(err);
    }
};