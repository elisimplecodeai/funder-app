const mongoose = require('mongoose');

const Document = require('../models/Document');
const Upload = require('../models/Upload');
const uploadService = require('./uploadService');
const Funder = require('../models/Funder');
const ISO = require('../models/ISO');
const Merchant = require('../models/Merchant');
const Syndicator = require('../models/Syndicator');
const Admin = require('../models/Admin');
const Bookkeeper = require('../models/Bookkeeper');
const User = require('../models/User');
const Representative = require('../models/Representative');
const Contact = require('../models/Contact');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Create a new document
 * @param {Object} data - The document data 
 * @param {Object} file - The file object (optional)
 * @param {Array} populate - Fields to populate
 * @param {string} select - Fields to select
 * @returns {Promise<Object>} - The created document
 */
exports.createDocument = async (data, file, populate = [], select = '') => {
    // Convert the accross-related fields to the proper object structure using parallel execution
    const conversions = await Promise.all([
        data.funder ? Funder.convertToEmbeddedFormat(data.funder) : Promise.resolve(null),
        data.iso ? ISO.convertToEmbeddedFormat(data.iso) : Promise.resolve(null),
        data.merchant ? Merchant.convertToEmbeddedFormat(data.merchant) : Promise.resolve(null),
        data.syndicator ? Syndicator.convertToEmbeddedFormat(data.syndicator) : Promise.resolve(null),
        data.upload_admin ? Admin.convertToEmbeddedFormat(data.upload_admin) : Promise.resolve(null),
        data.upload_bookkeeper ? Bookkeeper.convertToEmbeddedFormat(data.upload_bookkeeper) : Promise.resolve(null),
        data.upload_user ? User.convertToEmbeddedFormat(data.upload_user) : Promise.resolve(null),
        data.upload_representative ? Representative.convertToEmbeddedFormat(data.upload_representative) : Promise.resolve(null),
        data.upload_contact ? Contact.convertToEmbeddedFormat(data.upload_contact) : Promise.resolve(null),
        data.upload_syndicator ? Syndicator.convertToEmbeddedFormat(data.upload_syndicator) : Promise.resolve(null)
    ]);

    // Assign converted values back to documentData
    if (data.funder) data.funder = conversions[0];
    if (data.iso) data.iso = conversions[1];
    if (data.merchant) data.merchant = conversions[2];
    if (data.syndicator) data.syndicator = conversions[3];
    if (data.upload_admin) data.upload_admin = conversions[4];
    if (data.upload_bookkeeper) data.upload_bookkeeper = conversions[5];
    if (data.upload_user) data.upload_user = conversions[6];
    if (data.upload_representative) data.upload_representative = conversions[7];
    if (data.upload_contact) data.upload_contact = conversions[8];
    if (data.upload_syndicator) data.upload_syndicator = conversions[9];

    // Create document first (without file)
    const document = await Document.create({
        ...data
    });

    Validators.checkResourceCreated(document, 'Document');

    // If file is provided, upload it and update document
    if (file) {
        const uploadData = {
            file,
            file_name: data.file_name || file.originalname,
            upload_contact: data.upload_contact,
            upload_representative: data.upload_representative,
            upload_user: data.upload_user,
            upload_syndicator: data.upload_syndicator,
            upload_admin: data.upload_admin,
            upload_bookkeeper: data.upload_bookkeeper
        };

        await uploadService.createUpload(document._id, uploadData);
    }

    return await this.getDocumentById(document._id, populate, select);
};

/**
 * Create multiple documents in batch
 * @param {Array} data - Array of document data objects
 * @param {Array} files - Array of file objects
 * @param {Array} populate - Fields to populate
 * @param {string} select - Fields to select
 * @returns {Promise<Object>} - Object with created documents and errors
 */
exports.createDocumentsBatch = async (data, files, populate = [], select = '') => {
    // Validate input
    if (!Array.isArray(data) || !Array.isArray(files) || data.length !== files.length) {
        throw new ErrorResponse('Invalid batch document data or files', 400);
    }

    // Initialize results object
    const results = {
        successCount: 0,
        errorCount: 0,
        documents: [],
        errors: []
    };
    
    // Process all documents in parallel using Promise.allSettled for better error handling
    const documentPromises = data.map((doc, index) => 
        exports.createDocument(doc, files[index], populate, select)
            .then(document => ({ status: 'fulfilled', value: document, index }))
            .catch(error => ({ status: 'rejected', reason: error, index, fileName: files[index].originalname }))
    );
    
    const settledResults = await Promise.allSettled(documentPromises);
    
    // Process results
    settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
            results.documents.push(result.value.value);
            results.successCount++;
        } else {
            const error = result.status === 'rejected' ? result.reason : result.value.reason;
            const fileName = result.status === 'rejected' ? files[index].originalname : result.value.fileName;
            
            results.errors.push({
                index,
                fileName,
                error: error.message || error
            });
            results.errorCount++;
            console.error(`Error creating document for file ${fileName}:`, error);
        }
    });
    
    return results;
};

/**
 * Update a document without file upload
 * @param {string} id - Document ID
 * @param {Object} updateData - Data to update
 * @param {Array} populate - Fields to populate
 * @param {string} select - Fields to select
 * @returns {Promise<Object>} - Updated document
 */
exports.updateDocument = async (id, updateData, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Document ID');

    // Create a new object without file-related fields
    const data = { ...updateData };
    
    // Delete file-related fields
    delete data.file;
    delete data.file_type;
    delete data.file_size;
    
    // Delete upload-related fields
    delete data.upload_contact;
    delete data.upload_representative;
    delete data.upload_user;
    delete data.upload_syndicator;
    delete data.upload_admin;
    delete data.upload_bookkeeper;

    // Convert the accross-related fields to the proper object structure using parallel execution
    const conversions = await Promise.all([
        data.funder ? Funder.convertToEmbeddedFormat(data.funder) : Promise.resolve(null),
        data.iso ? ISO.convertToEmbeddedFormat(data.iso) : Promise.resolve(null),
        data.merchant ? Merchant.convertToEmbeddedFormat(data.merchant) : Promise.resolve(null),
        data.syndicator ? Syndicator.convertToEmbeddedFormat(data.syndicator) : Promise.resolve(null)
    ]);

    // Assign converted values back to data
    if (data.funder) data.funder = conversions[0];
    if (data.iso) data.iso = conversions[1];
    if (data.merchant) data.merchant = conversions[2];
    if (data.syndicator) data.syndicator = conversions[3];

    const document = await Document.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );

    return await this.getDocumentById(document._id, populate, select);
};

/**
 * Update document with file upload
 * @param {string} id - Document ID
 * @param {Object} data - Data to update
 * @param {Object} file - File to upload
 * @param {Array} populate - Fields to populate
 * @param {string} select - Fields to select
 * @returns {Promise<Object>} - Updated document
 */
exports.updateDocumentFile = async (id, data, file, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Document ID');

    if (!file) {
        throw new ErrorResponse('File is required', 400);
    }

    const document = await Document.findById(id);
    Validators.checkResourceNotFound(document, 'Document');

    // Convert the accross-related fields to the proper object structure using parallel execution
    const conversions = await Promise.all([
        data.upload_admin ? Admin.convertToEmbeddedFormat(data.upload_admin) : Promise.resolve(null),
        data.upload_bookkeeper ? Bookkeeper.convertToEmbeddedFormat(data.upload_bookkeeper) : Promise.resolve(null),
        data.upload_user ? User.convertToEmbeddedFormat(data.upload_user) : Promise.resolve(null),
        data.upload_representative ? Representative.convertToEmbeddedFormat(data.upload_representative) : Promise.resolve(null),
        data.upload_contact ? Contact.convertToEmbeddedFormat(data.upload_contact) : Promise.resolve(null),
        data.upload_syndicator ? Syndicator.convertToEmbeddedFormat(data.upload_syndicator) : Promise.resolve(null)
    ]);

    // Assign converted values back to updateData
    if (data.upload_admin) data.upload_admin = conversions[0];
    if (data.upload_bookkeeper) data.upload_bookkeeper = conversions[1];
    if (data.upload_user) data.upload_user = conversions[2];
    if (data.upload_representative) data.upload_representative = conversions[3];
    if (data.upload_contact) data.upload_contact = conversions[4];
    if (data.upload_syndicator) data.upload_syndicator = conversions[5];

    // Create upload data
    const uploadData = {
        file,
        file_name: data.file_name || file.originalname,
        upload_contact: data.upload_contact,
        upload_representative: data.upload_representative,
        upload_user: data.upload_user,
        upload_syndicator: data.upload_syndicator,
        upload_admin: data.upload_admin,
        upload_bookkeeper: data.upload_bookkeeper
    };

    // Upload file and let createUpload update the document
    await uploadService.createUpload(document._id, uploadData);

    return await this.getDocumentById(document._id, populate, select);
};

/**
 * Get documents with pagination
 * @param {Object} query - Query filters
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @param {Object} sort - Sort criteria
 * @param {Array} populate - Fields to populate
 * @param {string} select - Fields to select
 * @returns {Promise<Object>} - Documents with pagination info
 */
exports.getDocuments = async (query = {}, page = 1, limit = 10, sort = { createdAt: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [documents, count] = await Promise.all([
        Document.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .select(select)
            .lean(),
        Document.countDocuments(query)
    ]);

    return {
        docs: documents,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a document by ID
 * @param {string} id - Document ID
 * @param {Array} populate - Fields to populate
 * @param {string} select - Fields to select
 * @returns {Promise<Object>} - The document
 */
exports.getDocumentById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Document ID');

    const document = await Document
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();
    
    Validators.checkResourceNotFound(document, 'Document');
    
    return document;
};

/**
 * Get a list of documents without pagination
 * @param {Object} query - Query filters
 * @param {Object} sort - Sort criteria
 * @param {Array} populate - Fields to populate
 * @param {string} select - Fields to select
 * @returns {Promise<Array>} - List of documents
 */
exports.getDocumentList = async (query = {}, sort = { createdAt: -1 }, populate = [], select = '') => {
    return await Document.find(query)
        .sort(sort)
        .populate(populate)
        .select(select)
        .lean();
};

/**
 * Delete a document (mark as archived)
 * @param {string} id - Document ID
 * @param {Array} populate - Fields to populate
 * @param {string} select - Fields to select
 * @returns {Promise<Object>} - The deleted document
 */
exports.deleteDocument = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Document ID');

    // Soft delete by setting archived flag
    const document = await Document.findByIdAndUpdate(
        id,
        { archived: true },
        { new: true }
    );

    Validators.checkResourceNotFound(document, 'Document');

    return await this.getDocumentById(document._id, populate, select);
};

/**
 * Hard delete a document and its associated file
 * @param {string} id - Document ID
 * @returns {Promise<boolean>} - Success indicator
 */
exports.hardDeleteDocument = async (id) => {
    Validators.checkValidateObjectId(id, 'Document ID');

    const document = await Document.findById(id);
    Validators.checkResourceNotFound(document, 'Document');

    // Delete file from GridFS if it exists
    if (document.file) {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });
        
        try {
            await bucket.delete(document.file);
        } catch (error) {
            console.error('Error deleting file from GridFS:', error);
            // Continue with document deletion even if file deletion fails
        }
    }

    // Delete related uploads
    await Upload.deleteMany({ document: id });
    
    // Delete the document
    await Document.findByIdAndDelete(id);
    
    return true;
};

/**
 * Download a document file
 * @param {string} id - Document ID
 * @returns {Promise<Object>} - Stream and file info
 */
exports.downloadDocumentFile = async (id) => {
    Validators.checkValidateObjectId(id, 'Document ID');
    
    const document = await Document.findById(id);
    Validators.checkResourceNotFound(document, 'Document');
    
    if (!document.file) {
        throw new ErrorResponse('Document has no associated file', 404);
    }
    
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
    
    try {
        const downloadStream = bucket.openDownloadStream(document.file);
        
        return {
            stream: downloadStream,
            filename: document.file_name,
            contentType: document.file_type
        };
    } catch (error) {
        throw new ErrorResponse('File not found or cannot be downloaded', 404);
    }
};



