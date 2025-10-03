const Joi = require('joi');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * (process.env.MAX_FILE_SIZE || 5) // Max file size in MB
    }
});

const DocumentService = require('../services/documentService');
const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_TYPES } = require('../utils/constants');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');

const default_populate = [
    { path: 'upload_count' },
    { path: 'upload_history_list' }
];

// Query schema for document
const querySchema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    merchant: Joi.string().optional(),
    funder: Joi.string().optional(),
    iso: Joi.string().optional(),
    syndicator: Joi.string().optional(),
    include_archived: Joi.boolean().optional(),
    file_type: Joi.string().optional(),
    upload_contact: Joi.string().optional(),
    upload_representative: Joi.string().optional(),
    upload_user: Joi.string().optional(),
    upload_admin: Joi.string().optional(),
    upload_bookkeeper: Joi.string().optional(),
    upload_syndicator: Joi.string().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];
    
    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);
    const isoFilter = Helpers.buildIsoFilter(req, query.iso);
    const syndicatorFilter = Helpers.buildSyndicatorFilter(req, query.syndicator);

    if (funderFilter) dbQuery.$and.push({ 'funder.id': funderFilter });
    if (merchantFilter) dbQuery.$and.push({ 'merchant.id': merchantFilter });
    if (isoFilter) dbQuery.$and.push({ 'iso.id': isoFilter });
    if (syndicatorFilter) dbQuery.$and.push({ 'syndicator.id': syndicatorFilter });

    // File type filter
    if (query.file_type) dbQuery.$and.push({ file_type: query.file_type });

    // Upload admin filter
    if (query.upload_admin) dbQuery.$and.push({ 'upload_admin.id': query.upload_admin });

    // Upload bookkeeper filter
    if (query.upload_bookkeeper) dbQuery.$and.push({ 'upload_bookkeeper.id': query.upload_bookkeeper });

    // Upload user filter
    if (query.upload_user) dbQuery.$and.push({ 'upload_user.id': query.upload_user });

    // Upload contact filter
    if (query.upload_contact) dbQuery.$and.push({ 'upload_contact.id': query.upload_contact });

    // Upload representative filter
    if (query.upload_representative) dbQuery.$and.push({ 'upload_representative.id': query.upload_representative });

    // Upload syndicator filter
    if (query.upload_syndicator) dbQuery.$and.push({ 'upload_syndicator.id': query.upload_syndicator });

    // Archived filter (default: show non-archived)
    if (!query.include_archived) dbQuery.$and.push({ archived: { $ne: true } });

    // Search
    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { file_name: { $regex: query.search, $options: 'i' } },
                { file_type: { $regex: query.search, $options: 'i' } },
                { 'funder.name': { $regex: query.search, $options: 'i' } },
                { 'funder.email': { $regex: query.search, $options: 'i' } },
                { 'funder.phone': { $regex: query.search, $options: 'i' } },
                { 'iso.name': { $regex: query.search, $options: 'i' } },
                { 'iso.email': { $regex: query.search, $options: 'i' } },
                { 'iso.phone': { $regex: query.search, $options: 'i' } },
                { 'merchant.name': { $regex: query.search, $options: 'i' } },
                { 'merchant.dba_name': { $regex: query.search, $options: 'i' } },
                { 'merchant.email': { $regex: query.search, $options: 'i' } },
                { 'merchant.phone': { $regex: query.search, $options: 'i' } },
                { 'syndicator.name': { $regex: query.search, $options: 'i' } },
                { 'syndicator.first_name': { $regex: query.search, $options: 'i' } },
                { 'syndicator.last_name': { $regex: query.search, $options: 'i' } },
                { 'syndicator.email': { $regex: query.search, $options: 'i' } },
                { 'syndicator.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_admin.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_admin.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_admin.email': { $regex: query.search, $options: 'i' } },
                { 'upload_admin.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_bookkeeper.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_bookkeeper.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_bookkeeper.email': { $regex: query.search, $options: 'i' } },
                { 'upload_bookkeeper.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_user.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_user.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_user.email': { $regex: query.search, $options: 'i' } },
                { 'upload_user.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_contact.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_contact.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_contact.email': { $regex: query.search, $options: 'i' } },
                { 'upload_contact.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_representative.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_representative.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_representative.email': { $regex: query.search, $options: 'i' } },
                { 'upload_representative.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.name': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.email': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.phone_mobile': { $regex: query.search, $options: 'i' } },
            ]
        });
    }

    return dbQuery;
};

// @desc    Get all documents
// @route   GET /api/v1/documents
// @access  Private
exports.getDocuments = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...querySchema
        });
        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Build dbQuery from query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });

        const documents = await DocumentService.getDocuments(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new document
// @route   POST /api/v1/documents
// @access  Private
exports.createDocument = async (req, res, next) => {
    const uploadMiddleware = upload.single('file');
            
    uploadMiddleware(req, res, async (err) => {
        if (err) {
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        }
        
        try {
            const schema = Joi.object({
                merchant: Joi.string().optional(),
                funder: Joi.string().optional(),
                iso: Joi.string().optional(),
                syndicator: Joi.string().optional(),
                file_name: Joi.string().optional()
            });
            
            const { value, error } = schema.validate(req.body);
            
            if (error) {
                return next(new ErrorResponse(error.message, 400));
            }
            
            const documentData = { ...value };

            if (!req.file) {
                return next(new ErrorResponse('Please upload a file', 400));
            }
            
            // If file_name not provided, use the original filename if file is uploaded
            if (!documentData.file_name) {
                documentData.file_name = req.file.originalname;
            }
            
            documentData.portal = req.portal;
            
            // Apply permission checks
            accessControl(req, documentData);
            
            // Check the portal and set the upload user info
            switch (req.portal) {
            case PORTAL_TYPES.MERCHANT:
                documentData.upload_contact = req.id;
                break;
            case PORTAL_TYPES.ISO:
                documentData.upload_representative = req.id;
                break;
            case PORTAL_TYPES.FUNDER:
                if (!documentData.funder) documentData.funder = req.filter.funder;
                documentData.upload_user = req.id;
                break;
            case PORTAL_TYPES.SYNDICATOR:
                documentData.upload_syndicator = req.id;
                break;
            case PORTAL_TYPES.ADMIN:
                documentData.upload_admin = req.id;
                break;
            case PORTAL_TYPES.BOOKKEEPER:
                documentData.upload_bookkeeper = req.id;
                break;
            }

            // Create the document - funder info will be populated automatically in the service
            const document = await DocumentService.createDocument(documentData, req.file, default_populate);
            
            res.status(201).json({
                success: true,
                data: document
            });
        } catch (error) {
            return next(new ErrorResponse(error.message, 400));
        }
    });
};

// @desc    Get document list without pagination
// @route   GET /api/v1/documents/list
// @access  Private
exports.getDocumentList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        // Build dbQuery from query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });

        const documents = await DocumentService.getDocumentList(dbQuery, dbSort, [], 'file_name file_type file_size');

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update document with file upload
// @route   PUT /api/v1/documents/:id/file
// @access  Private
exports.updateDocumentFile = async (req, res, next) => {
    const uploadMiddleware = upload.single('file');

    uploadMiddleware(req, res, async (err) => {
        if (err) {
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        }

        try{
            if (!req.file) {
                return next(new ErrorResponse('Please upload a file', 400));
            }

            const schema = Joi.object({
                id: Joi.string().required(),
                file_name: Joi.string().optional(),
            });

            const { value, error } = schema.validate({ ...req.params, ...req.body });

            if (error) {
                return next(new ErrorResponse(error.message, 400));
            }

            const { id, ...updateData } = value;

            // Check if document exists and user has permission
            const document = await DocumentService.getDocumentById(id);

            // Permission checks based on the portal type and user role
            accessControl(req, document);

            // Check the portal and set the upload user info
            switch (req.portal) {
            case PORTAL_TYPES.MERCHANT:
                updateData.upload_contact = req.id;
                break;
            case PORTAL_TYPES.ISO:
                updateData.upload_representative = req.id;
                break;
            case PORTAL_TYPES.FUNDER:
                updateData.upload_user = req.id;
                break;
            case PORTAL_TYPES.SYNDICATOR:
                updateData.upload_syndicator = req.id;
                break;
            case PORTAL_TYPES.ADMIN:
                updateData.upload_admin = req.id;
                break;
            case PORTAL_TYPES.BOOKKEEPER:
                updateData.upload_bookkeeper = req.id;
                break;
            }
            
            // If file_name not provided, use the original filename
            if (!updateData.file_name && req.file) {
                updateData.file_name = req.file.originalname;
            }

            // Update the document with the new file
            const updatedDocument = await DocumentService.updateDocumentFile(
                id, 
                updateData, 
                req.file, 
                default_populate
            );

            res.status(200).json({
                success: true,
                data: updatedDocument
            });
        } catch (error) {
            return next(new ErrorResponse(error.message, 400));
        }
    });
};

// @desc    Update document without file
// @route   PUT /api/v1/documents/:id
// @access  Private
exports.updateDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            merchant: Joi.string().optional(),
            funder: Joi.string().optional(),
            iso: Joi.string().optional(),
            syndicator: Joi.string().optional(),
            file_name: Joi.string().optional(),
            archived: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...updateData } = value;

        // Check if document exists and user has permission
        const document = await DocumentService.getDocumentById(id);

        // Permission checks based on the portal type and user role
        accessControl(req, document);

        // Update the document
        const updatedDocument = await DocumentService.updateDocument(id, updateData, default_populate);

        res.status(200).json({
            success: true,
            data: updatedDocument
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single document
// @route   GET /api/v1/documents/:id
// @access  Private
exports.getDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const document = await DocumentService.getDocumentById(value.id, default_populate);

        // Permission checks based on the portal type and user role
        accessControl(req, document);

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete document (set archived flag)
// @route   DELETE /api/v1/documents/:id
// @access  Private
exports.deleteDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if document exists and user has permission
        const document = await DocumentService.getDocumentById(value.id);

        // Permission checks based on the portal type and user role
        accessControl(req, document);

        // Soft delete the document (set archived flag)
        const deletedDocument = await DocumentService.deleteDocument(value.id);

        res.status(200).json({
            success: true,
            data: deletedDocument
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Download document file
// @route   GET /api/v1/documents/:id/download
// @access  Private
exports.downloadDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if document exists and user has permission
        const document = await DocumentService.getDocumentById(value.id);

        // Permission checks based on the portal type and user role
        accessControl(req, document);

        // Get the file stream and metadata
        const { stream, filename, contentType } = await DocumentService.downloadDocumentFile(value.id);

        // Set headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe the file stream to the response
        stream.pipe(res);
    } catch (error) {
        next(error);
    }
};

// @desc    Create multiple documents
// @route   POST /api/v1/documents/bulk
// @access  Private
exports.bulkCreateDocuments = async (req, res, next) => {
    try {
        // Use multer's array method to handle multiple files
        const uploadMiddleware = upload.array('files', process.env.MAX_FILE_COUNT || 10); // Max 10 files at once
        
        uploadMiddleware(req, res, async (err) => {
            try {
                if (err) {
                    return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
                }
                
                if (!req.files || req.files.length === 0) {
                    return next(new ErrorResponse('Please upload at least one file', 400));
                }
                
                // Validate file count against environment limit
                const maxFileCount = parseInt(process.env.MAX_FILE_COUNT) || 10;
                if (req.files.length > maxFileCount) {
                    return next(new ErrorResponse(`Maximum ${maxFileCount} files allowed per batch`, 400));
                }
                
                const schema = Joi.object({
                    merchant: Joi.string().optional(),
                    funder: Joi.string().optional(),
                    iso: Joi.string().optional(),
                    syndicator: Joi.string().optional()
                });
                
                const { value, error } = schema.validate(req.body);
                
                if (error) {
                    return next(new ErrorResponse(error.message, 400));
                }
                
                // Common data for all documents
                const data = { ...value };
                
                data.portal = req.portal;
                
                // Apply permission checks
                accessControl(req, data);
                
                // Set uploader info based on portal
                switch (req.portal) {
                case PORTAL_TYPES.MERCHANT:
                    data.upload_contact = req.id;
                    break;
                case PORTAL_TYPES.ISO:
                    data.upload_representative = req.id;
                    break;
                case PORTAL_TYPES.FUNDER:
                    if (!data.funder) data.funder = req.filter.funder;
                    data.upload_user = req.id;
                    break;
                case PORTAL_TYPES.SYNDICATOR:
                    data.upload_syndicator = req.id;
                    break;
                case PORTAL_TYPES.ADMIN:
                    data.upload_admin = req.id;
                    break;
                case PORTAL_TYPES.BOOKKEEPER:
                    data.upload_bookkeeper = req.id;
                    break;
                }
                
                // Create document data array for batch processing with optimized mapping
                const documentsData = req.files.map(file => ({
                    ...data,
                    file_name: file.originalname
                }));
                
                // Use batch processing with individual handling
                // Funder information will be auto-populated by the service
                const results = await DocumentService.createDocumentsBatch(
                    documentsData,
                    req.files,
                    default_populate
                );
                
                // Return appropriate response based on results
                const statusCode = results.errorCount > 0 && results.successCount === 0 
                    ? 500  // All operations failed
                    : 201; // At least some succeeded
                
                res.status(statusCode).json({
                    success: results.successCount > 0,
                    data: {
                        totalProcessed: documentsData.length,
                        successCount: results.successCount,
                        errorCount: results.errorCount,
                        docs: results.documents,
                        errors: results.errors
                    }
                });
            } catch (error) {
                return next(new ErrorResponse(error.message, 400));
            }
        });
    } catch (error) {
        next(error);
    }
};
