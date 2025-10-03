const express = require('express');
const router = express.Router();

const { 
    getDocuments, 
    createDocument, 
    getDocumentList, 
    updateDocumentFile, 
    updateDocument, 
    getDocument, 
    deleteDocument, 
    downloadDocument,
    bulkCreateDocuments
} = require('../controllers/documentController');

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Get all documents and create a new document
router.route('/')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getDocuments)
    .post(protect, authorize(PERMISSIONS.DOCUMENT.CREATE), createDocument);

// Get documents list without pagination
router.route('/list')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getDocumentList);

// Bulk create documents
router.route('/bulk')
    .post(protect, authorize(PERMISSIONS.DOCUMENT.CREATE), bulkCreateDocuments);

// Update document with file, get single document, update document, delete document
router.route('/:id')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getDocument)
    .put(protect, authorize(PERMISSIONS.DOCUMENT.UPDATE), updateDocument)
    .delete(protect, authorize(PERMISSIONS.DOCUMENT.DELETE), deleteDocument);

// Update document with file upload
router.route('/:id/upload')
    .put(protect, authorize(PERMISSIONS.DOCUMENT.UPDATE), updateDocumentFile);

// Download document file
router.route('/:id/download')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), downloadDocument);

module.exports = router;
