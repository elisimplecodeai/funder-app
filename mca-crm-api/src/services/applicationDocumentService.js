const ApplicationDocument = require('../models/ApplicationDocument');
const ApplicationStipulation = require('../models/ApplicationStipulation');
const Document = require('../models/Document');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { APPLICATION_STIPULATION_STATUS } = require('../utils/constants');

/**
 * Create a application document
 * @param {Object} data - The data to create the application document
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Promise<Object>} - The created application document
*/
exports.createApplicationDocument = async (data, populate = [], select = '') => {
    const existingDocument = await ApplicationDocument.findOne({
        application: data.application,
        'document.id': data.document
    });

    Validators.ensureResourceNotExists(existingDocument, 'Document already exists in this application');

    // Convert stipulation to embedded format
    if (data.document) data.document = await Document.convertToEmbeddedFormat(data.document);

    const applicationDocument = await ApplicationDocument.create(data);

    Validators.checkResourceCreated(applicationDocument, 'ApplicationDocument');

    // Update application stipulation status
    if (applicationDocument.application_stipulation) {
        await ApplicationStipulation.findOneAndUpdate(
            { 
                _id: applicationDocument.application_stipulation, 
                status: APPLICATION_STIPULATION_STATUS.REQUESTED,
            },
            { $set: { status: APPLICATION_STIPULATION_STATUS.RECEIVED } }
        );
    }

    return await this.getApplicationDocumentById(applicationDocument._id, populate, select);
};

/**
 * Get a application document by ID
 * @param {String} id - The ID of the application document
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Promise<Object>} - The application document
*/
exports.getApplicationDocumentById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application document ID');
    
    const applicationDocument = await ApplicationDocument
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();
    
    Validators.checkResourceNotFound(applicationDocument, 'ApplicationDocument');

    return applicationDocument;
};

/**
 * Get all application documents
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Promise<Object>} - The application documents
 */
exports.getApplicationDocuments = async (query, page = 1, limit = 10, sort = { 'document.file_name': 1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [applicationDocuments, count] = await Promise.all([
        ApplicationDocument.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ApplicationDocument.countDocuments(query)
    ]);

    return {
        docs: applicationDocuments,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get List of Application Documents
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Promise<Object>} - The application documents
 */
exports.getApplicationDocumentsList = async (query, sort = { 'document.file_name': 1 }, populate = [], select = '') => {
    return await ApplicationDocument.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Update a application document
 * @param {String} id - The ID of the application document
 * @param {Object} data - The data to update the application document
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Promise<Object>} - The updated application document
 */
exports.updateApplicationDocument = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application document ID');
    
    const updatedApplicationDocument = await ApplicationDocument.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedApplicationDocument, 'ApplicationDocument');
    
    // Update application stipulation status
    if (data.application_stipulation) {
        await ApplicationStipulation.findOneAndUpdate(
            { 
                _id: updatedApplicationDocument.application_stipulation, 
                status: APPLICATION_STIPULATION_STATUS.REQUESTED,
            },
            { $set: { status: APPLICATION_STIPULATION_STATUS.RECEIVED } }
        );
    }
    
    return await this.getApplicationDocumentById(updatedApplicationDocument._id, populate, select);
};

/**
 * Delete a application document
 * @param {String} id - The ID of the application document
 * @returns {Promise<Boolean>} - The result of the deletion
 */
exports.deleteApplicationDocument = async (id) => {
    Validators.checkValidateObjectId(id, 'application document ID');
    
    const result = await ApplicationDocument.findByIdAndDelete(id);

    // Check if the document was deleted
    if (!result) {
        throw new ErrorResponse('Application document not found', 404);
    } else {
        return true;
    }
};