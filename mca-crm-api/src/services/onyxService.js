const axios = require('axios');
const OnyxClientFetcher = require('./onyxClientFetcher');
const OnyxApplicationFetcher = require('./onyxApplicationFetcher');
const OnyxFundingFetcher = require('./onyxFundingFetcher');
const OnyxProgressTracker = require('./onyxProgressTracker');
const Application = require('../models/Application');
const Merchant = require('../models/Merchant');
const Contact = require('../models/Contact');
const Funder = require('../models/Funder');
const ISO = require('../models/ISO');
const Representative = require('../models/Representative');
const User = require('../models/User');
const ApplicationStatus = require('../models/ApplicationStatus');
const Funding = require('../models/Funding');
const FundingStatus = require('../models/FundingStatus');

const ErrorResponse = require('../utils/errorResponse');
const { dollarsToCents, centsToDollars } = require('../utils/helpers');

class OnyxService {
    constructor(bearerToken = null) {
        this.baseURL = 'https://services.onyxiq.com/api';
        this.bearerToken = bearerToken || process.env.ONYX_BEARER_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJPbnl4SVEiLCJ0ZW5hbnRJZCI6MywiZXhwIjoxODg1MTMyODMzLCJ1c2VySWQiOjM1OCwiZW1haWwiOiJBY2NvdW50aW5nQHRocm90dGxlZnVuZGluZy5jb20ifQ.2wLYkayxHibUruM0rQO3bIVXjUvsZNtKDjvl1EyqxPOkrP3E0U4NJduuIjJVgvcVA-MN5D3Yx9jIsEsxDKsl-w';
        this.headers = {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        };
    }

    /**
     * Fetch data from OnyxIQ API endpoint
     * @param {string} endpoint - The API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} - API response data
     */
    async fetchFromOnyx(endpoint, params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers: this.headers,
                params: {
                    size: 10000,
                    ...params
                },
                timeout: 60000
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching from OnyxIQ endpoint ${endpoint}:`, error.message);
            throw new ErrorResponse(`Failed to fetch data from OnyxIQ: ${error.message}`, 500);
        }
    }

    /**
     * Fetch paginated data from OnyxIQ API
     * @param {string} endpoint - The API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Array>} - All records from all pages
     */
    async fetchPaginatedFromOnyx(endpoint, params = {}) {
        let allRecords = [];
        let page = 0;
        const size = 100;

        while (true) {
            try {
                const response = await axios.get(`${this.baseURL}${endpoint}`, {
                    headers: this.headers,
                    params: {
                        page,
                        size,
                        sortDir: 'DESC',
                        ...params
                    },
                    timeout: 60000
                });

                const data = response.data;
                const records = data.details || data.content || [];
                
                if (records.length === 0) {
                    break;
                }

                allRecords = allRecords.concat(records);
                page++;

                // Safety break to prevent infinite loops
                if (page > 1000) {
                    console.warn('Reached maximum page limit (1000) for endpoint:', endpoint);
                    break;
                }
            } catch (error) {
                console.error(`Error fetching page ${page} from OnyxIQ endpoint ${endpoint}:`, error.message);
                break;
            }
        }

        return allRecords;
    }

    /**
     * Sync clients from OnyxIQ to MCA system using efficient fetcher
     * @returns {Promise<Object>} - Sync results
     */
    async syncClients() {
        try {
            console.log('🔄 Starting efficient client sync from OnyxIQ...');
            
            // Use the efficient fetcher
            const fetcher = new OnyxClientFetcher(this.bearerToken);
            const fetchResults = await fetcher.fetchAllClients();
            
            const results = {
                total: fetchResults.totalFound,
                created: 0,
                updated: 0,
                errors: [],
                fetchErrors: fetchResults.errorCount,
                fetchTime: fetchResults.totalTime
            };

            console.log(`📊 Fetched ${fetchResults.clients.length} clients from OnyxIQ`);
            
            // Skip database processing for now - just return the fetched data
            results.created = 0;
            results.updated = 0;
            results.errors = fetchResults.errors || [];
            results.fetchedClients = fetchResults.clients;
            results.fetchTime = fetchResults.totalTime;

            console.log(`✅ Client fetch completed: ${fetchResults.clients.length} clients fetched, ${results.errors.length} fetch errors`);
            console.log(`📈 Fetch time: ${results.fetchTime.toFixed(2)} minutes`);
            console.log(`💾 Database saving will be done after all sync steps are complete`);
            return results;
        } catch (error) {
            console.error('❌ Error syncing clients:', error);
            throw new ErrorResponse(`Failed to sync clients: ${error.message}`, 500);
        }
    }

    /**
     * Sync applications from OnyxIQ to MCA system
     * @returns {Promise<Object>} - Sync results
     */
    async syncApplications() {
        try {
            console.log('🔄 Starting efficient application sync from OnyxIQ...');
            
            // Use the efficient fetcher
            const fetcher = new OnyxApplicationFetcher(this.bearerToken);
            const fetchResults = await fetcher.fetchAllApplications();
            
            const results = {
                total: fetchResults.totalFound,
                created: 0,
                updated: 0,
                errors: [],
                fetchErrors: fetchResults.errorCount,
                fetchTime: fetchResults.totalTime
            };

            console.log(`📊 Fetched ${fetchResults.applications.length} applications from OnyxIQ`);
            
            // Skip database processing for now - just return the fetched data
            results.created = 0;
            results.updated = 0;
            results.errors = fetchResults.errors || [];
            results.fetchedApplications = fetchResults.applications;
            results.fetchTime = fetchResults.totalTime;

            console.log(`✅ Application fetch completed: ${fetchResults.applications.length} applications fetched, ${results.errors.length} fetch errors`);
            console.log(`📈 Fetch time: ${results.fetchTime.toFixed(2)} minutes`);
            console.log(`💾 Database saving will be done after all sync steps are complete`);
            return results;
        } catch (error) {
            console.error('❌ Error syncing applications:', error);
            throw new ErrorResponse(`Failed to sync applications: ${error.message}`, 500);
        }
    }

    /**
     * Sync fundings from OnyxIQ to MCA system
     * @returns {Promise<Object>} - Sync results
     */
    async syncFundings() {
        try {
            console.log('🔄 Starting efficient funding sync from OnyxIQ...');
            
            const fetcher = new OnyxFundingFetcher(this.bearerToken);
            const fetchResults = await fetcher.fetchAllFundings();
            
            const results = {
                total: fetchResults.totalFound,
                created: 0,
                updated: 0,
                errors: [],
                fetchErrors: fetchResults.errorCount,
                fetchTime: fetchResults.totalTime
            };

            console.log(`📊 Fetched ${fetchResults.fundings.length} fundings from OnyxIQ`);
            
            // Skip database processing for now - just return the fetched data
            results.created = 0;
            results.updated = 0;
            results.errors = fetchResults.errors || [];
            results.fetchedFundings = fetchResults.fundings;
            results.fetchTime = fetchResults.totalTime;

            console.log(`✅ Funding fetch completed: ${fetchResults.fundings.length} fundings fetched, ${results.errors.length} fetch errors`);
            console.log(`📈 Fetch time: ${results.fetchTime.toFixed(2)} minutes`);
            console.log(`💾 Database saving will be done after all sync steps are complete`);
            return results;
        } catch (error) {
            console.error('❌ Error syncing fundings:', error);
            throw new ErrorResponse(`Failed to sync fundings: ${error.message}`, 500);
        }
    }

    /**
     * Map OnyxIQ client data to MCA merchant format
     * @param {Object} onyxClient - OnyxIQ client data
     * @returns {Object} - MCA merchant data
     */
    mapOnyxClientToMerchant(onyxClient) {
        return {
            name: onyxClient.businessName || onyxClient.name || 'Unknown Business',
            dba_name: onyxClient.dbaName || onyxClient.dba_name,
            email: onyxClient.email || onyxClient.businessEmail,
            phone: onyxClient.phone || onyxClient.businessPhone,
            website: onyxClient.website,
            sic_detail: onyxClient.sicCode ? {
                code: onyxClient.sicCode,
                description: onyxClient.sicDescription
            } : undefined,
            naics_detail: onyxClient.naicsCode ? {
                code: onyxClient.naicsCode,
                title: onyxClient.naicsTitle,
                description: onyxClient.naicsDescription
            } : undefined,
            business_detail: {
                industry: onyxClient.industry,
                years_in_business: onyxClient.yearsInBusiness,
                annual_revenue: onyxClient.annualRevenue,
                monthly_revenue: onyxClient.monthlyRevenue
            },
            address_list: onyxClient.addresses ? onyxClient.addresses.map(addr => ({
                type: addr.type === 'business' ? 'physical' : (addr.type || 'physical'),
                address_1: addr.street,
                city: addr.city,
                state: addr.state,
                zip: addr.zip,
                primary: true,
                verified: false
            })) : [],
            inactive: onyxClient.inactive || false
        };
    }

    /**
     * Map OnyxIQ application data to MCA application format
     * @param {Object} onyxApp - OnyxIQ application data
     * @returns {Promise<Object>} - MCA application data
     */
    async mapOnyxApplicationToMCA(onyxApp) {
        try {
            // Find or create merchant
            const merchant = await this.findOrCreateMerchant(onyxApp.clientId);
            if (!merchant) {
                console.warn(`Could not find or create merchant for client ID: ${onyxApp.clientId}`);
                return null;
            }

            // Find or create funder (use default funder if not specified)
            const funder = await this.findOrCreateFunder(onyxApp.funderId);
            if (!funder) {
                console.warn(`Could not find or create funder for funder ID: ${onyxApp.funderId}`);
                return null;
            }

            // Find or create ISO
            const iso = await this.findOrCreateISO(onyxApp.isoId);

            // Find or create contact
            const contact = await this.findOrCreateContact(onyxApp.contactId, merchant._id);

            // Find or create representative
            const representative = await this.findOrCreateRepresentative(onyxApp.representativeId, iso?._id);

            // Find or create assigned user
            const assignedUser = await this.findOrCreateUser(onyxApp.assignedUserId, funder._id);

            // Find or create application status
            const status = await this.findOrCreateApplicationStatus(onyxApp.status, funder._id);

            return {
                name: onyxApp.name || `Application ${onyxApp.id}`,
                identifier: onyxApp.id?.toString(),
                merchant: {
                    id: merchant._id,
                    name: merchant.name,
                    email: merchant.email,
                    phone: merchant.phone
                },
                contact: contact ? {
                    id: contact._id,
                    first_name: contact.first_name,
                    last_name: contact.last_name,
                    email: contact.email,
                    phone_mobile: contact.phone_mobile
                } : undefined,
                funder: {
                    id: funder._id,
                    name: funder.name,
                    email: funder.email,
                    phone: funder.phone
                },
                iso: iso ? {
                    id: iso._id,
                    name: iso.name,
                    email: iso.email,
                    phone: iso.phone
                } : undefined,
                representative: representative ? {
                    id: representative._id,
                    first_name: representative.first_name,
                    last_name: representative.last_name,
                    email: representative.email,
                    phone_mobile: representative.phone_mobile
                } : undefined,
                priority: onyxApp.priority || false,
                type: onyxApp.type || 'MCA',
                assigned_user: {
                    id: assignedUser._id,
                    first_name: assignedUser.first_name,
                    last_name: assignedUser.last_name,
                    email: assignedUser.email,
                    phone_mobile: assignedUser.phone_mobile
                },
                request_amount: dollarsToCents(onyxApp.requestAmount || onyxApp.amount || 0),
                request_date: new Date(onyxApp.requestDate || onyxApp.createdAt || Date.now()),
                status: {
                    id: status._id,
                    name: status.name,
                    bgcolor: status.bgcolor,
                    initial: status.initial,
                    closed: status.closed
                },
                status_date: new Date(onyxApp.statusDate || onyxApp.updatedAt || Date.now()),
                closed: onyxApp.closed || false,
                internal: onyxApp.internal || false
            };
        } catch (error) {
            console.error('Error mapping OnyxIQ application to MCA:', error);
            return null;
        }
    }

    /**
     * Map OnyxIQ funding data to MCA funding format
     * @param {Object} onyxFunding - OnyxIQ funding data
     * @returns {Promise<Object>} - MCA funding data
     */
    async mapOnyxFundingToMCA(onyxFunding) {
        try {
            // Find or create merchant
            const merchant = await this.findOrCreateMerchant(onyxFunding.clientId);
            if (!merchant) {
                console.warn(`Could not find or create merchant for client ID: ${onyxFunding.clientId}`);
                return null;
            }

            // Find or create funder
            const funder = await this.findOrCreateFunder(onyxFunding.funderId);
            if (!funder) {
                console.warn(`Could not find or create funder for funder ID: ${onyxFunding.funderId}`);
                return null;
            }

            // Find or create ISO
            const iso = await this.findOrCreateISO(onyxFunding.isoId);

            // Find or create funding status
            const status = await this.findOrCreateFundingStatus(onyxFunding.status, funder._id);

            return {
                name: onyxFunding.name || `Funding ${onyxFunding.id}`,
                identifier: onyxFunding.id?.toString(),
                merchant: {
                    id: merchant._id,
                    name: merchant.name,
                    email: merchant.email,
                    phone: merchant.phone
                },
                funder: {
                    id: funder._id,
                    name: funder.name,
                    email: funder.email,
                    phone: funder.phone
                },
                iso: iso ? {
                    id: iso._id,
                    name: iso.name,
                    email: iso.email,
                    phone: iso.phone
                } : undefined,
                funded_amount: dollarsToCents(onyxFunding.fundedAmount || onyxFunding.amount || 0),
                funded_date: new Date(onyxFunding.fundedDate || onyxFunding.createdAt || Date.now()),
                status: {
                    id: status._id,
                    name: status.name,
                    bgcolor: status.bgcolor,
                    closed: status.closed,
                    warning: status.warning,
                    defaulted: status.defaulted
                },
                closed: onyxFunding.closed || false,
                internal: onyxFunding.internal || false
            };
        } catch (error) {
            console.error('Error mapping OnyxIQ funding to MCA:', error);
            return null;
        }
    }

    /**
     * Find or create merchant by OnyxIQ client ID
     * @param {string} clientId - OnyxIQ client ID
     * @returns {Promise<Object>} - MCA merchant
     */
    async findOrCreateMerchant(clientId) {
        if (!clientId) return null;

        try {
            // Try to find existing merchant by OnyxIQ client ID in identifier field
            let merchant = await Merchant.findOne({
                $or: [
                    { 'business_detail.onyx_client_id': clientId },
                    { identifier: clientId.toString() }
                ]
            });

            if (!merchant) {
                // Fetch client details from OnyxIQ
                const onyxClient = await this.fetchFromOnyx(`/clients/${clientId}`);
                const merchantData = this.mapOnyxClientToMerchant(onyxClient);
                merchantData.business_detail = {
                    ...merchantData.business_detail,
                    onyx_client_id: clientId
                };
                merchant = await Merchant.create(merchantData);
            }

            return merchant;
        } catch (error) {
            console.error(`Error finding/creating merchant for client ID ${clientId}:`, error);
            return null;
        }
    }

    /**
     * Find or create funder by OnyxIQ funder ID
     * @param {string} funderId - OnyxIQ funder ID
     * @returns {Promise<Object>} - MCA funder
     */
    async findOrCreateFunder(funderId) {
        if (!funderId) {
            // Return default funder if no funder ID provided
            return await Funder.findOne({ name: 'Default Funder' }) || 
                   await Funder.create({
                       name: 'Default Funder',
                       email: 'default@funder.com',
                       phone: '000-000-0000'
                   });
        }

        try {
            let funder = await Funder.findOne({
                $or: [
                    { 'business_detail.onyx_funder_id': funderId },
                    { identifier: funderId.toString() }
                ]
            });

            if (!funder) {
                // Create a basic funder entry
                funder = await Funder.create({
                    name: `Funder ${funderId}`,
                    email: `funder${funderId}@example.com`,
                    phone: '000-000-0000',
                    business_detail: {
                        onyx_funder_id: funderId
                    }
                });
            }

            return funder;
        } catch (error) {
            console.error(`Error finding/creating funder for funder ID ${funderId}:`, error);
            return null;
        }
    }

    /**
     * Find or create ISO by OnyxIQ ISO ID
     * @param {string} isoId - OnyxIQ ISO ID
     * @returns {Promise<Object>} - MCA ISO
     */
    async findOrCreateISO(isoId) {
        if (!isoId) return null;

        try {
            let iso = await ISO.findOne({
                $or: [
                    { 'business_detail.onyx_iso_id': isoId },
                    { identifier: isoId.toString() }
                ]
            });

            if (!iso) {
                // Create a basic ISO entry
                iso = await ISO.create({
                    name: `ISO ${isoId}`,
                    email: `iso${isoId}@example.com`,
                    phone: '000-000-0000',
                    business_detail: {
                        onyx_iso_id: isoId
                    }
                });
            }

            return iso;
        } catch (error) {
            console.error(`Error finding/creating ISO for ISO ID ${isoId}:`, error);
            return null;
        }
    }

    /**
     * Find or create contact
     * @param {string} contactId - OnyxIQ contact ID
     * @param {string} merchantId - MCA merchant ID
     * @returns {Promise<Object>} - MCA contact
     */
    async findOrCreateContact(contactId, merchantId) {
        if (!contactId || !merchantId) return null;

        try {
            let contact = await Contact.findOne({
                $or: [
                    { 'business_detail.onyx_contact_id': contactId },
                    { identifier: contactId.toString() }
                ]
            });

            if (!contact) {
                // Create a basic contact entry
                contact = await Contact.create({
                    first_name: 'Contact',
                    last_name: contactId,
                    email: `contact${contactId}@example.com`,
                    phone_mobile: '000-000-0000',
                    business_detail: {
                        onyx_contact_id: contactId
                    }
                });
            }

            return contact;
        } catch (error) {
            console.error(`Error finding/creating contact for contact ID ${contactId}:`, error);
            return null;
        }
    }

    /**
     * Find or create representative
     * @param {string} representativeId - OnyxIQ representative ID
     * @param {string} isoId - MCA ISO ID
     * @returns {Promise<Object>} - MCA representative
     */
    async findOrCreateRepresentative(representativeId, isoId) {
        if (!representativeId) return null;

        try {
            let representative = await Representative.findOne({
                $or: [
                    { 'business_detail.onyx_representative_id': representativeId },
                    { identifier: representativeId.toString() }
                ]
            });

            if (!representative) {
                // Create a basic representative entry
                representative = await Representative.create({
                    first_name: 'Representative',
                    last_name: representativeId,
                    email: `rep${representativeId}@example.com`,
                    phone_mobile: '000-000-0000',
                    business_detail: {
                        onyx_representative_id: representativeId
                    }
                });
            }

            return representative;
        } catch (error) {
            console.error(`Error finding/creating representative for representative ID ${representativeId}:`, error);
            return null;
        }
    }

    /**
     * Find or create user
     * @param {string} userId - OnyxIQ user ID
     * @param {string} funderId - MCA funder ID
     * @returns {Promise<Object>} - MCA user
     */
    async findOrCreateUser(userId, funderId) {
        if (!userId) {
            // Return default user
            return await User.findOne({ email: 'default@user.com' }) ||
                   await User.create({
                       first_name: 'Default',
                       last_name: 'User',
                       email: 'default@user.com',
                       phone_mobile: '000-000-0000'
                   });
        }

        try {
            let user = await User.findOne({
                $or: [
                    { 'business_detail.onyx_user_id': userId },
                    { identifier: userId.toString() }
                ]
            });

            if (!user) {
                // Create a basic user entry
                user = await User.create({
                    first_name: 'User',
                    last_name: userId,
                    email: `user${userId}@example.com`,
                    phone_mobile: '000-000-0000',
                    business_detail: {
                        onyx_user_id: userId
                    }
                });
            }

            return user;
        } catch (error) {
            console.error(`Error finding/creating user for user ID ${userId}:`, error);
            return null;
        }
    }

    /**
     * Find or create application status
     * @param {string} statusName - Status name
     * @param {string} funderId - MCA funder ID
     * @returns {Promise<Object>} - MCA application status
     */
    async findOrCreateApplicationStatus(statusName, funderId) {
        if (!statusName) {
            // Return default status
            return await ApplicationStatus.findOne({ 
                funder: funderId, 
                initial: true 
            }) || 
            await ApplicationStatus.create({
                name: 'New',
                funder: funderId,
                initial: true,
                closed: false,
                bgcolor: '#3B82F6'
            });
        }

        try {
            let status = await ApplicationStatus.findOne({
                name: statusName,
                funder: funderId
            });

            if (!status) {
                status = await ApplicationStatus.create({
                    name: statusName,
                    funder: funderId,
                    initial: false,
                    closed: false,
                    bgcolor: '#6B7280'
                });
            }

            return status;
        } catch (error) {
            console.error(`Error finding/creating application status for status ${statusName}:`, error);
            return null;
        }
    }

    /**
     * Find or create funding status
     * @param {string} statusName - Status name
     * @param {string} funderId - MCA funder ID
     * @returns {Promise<Object>} - MCA funding status
     */
    async findOrCreateFundingStatus(statusName, funderId) {
        if (!statusName) {
            // Return default status
            return await FundingStatus.findOne({ 
                funder: funderId, 
                initial: true 
            }) || 
            await FundingStatus.create({
                name: 'Active',
                funder: funderId,
                initial: true,
                closed: false,
                warning: false,
                defaulted: false,
                bgcolor: '#10B981'
            });
        }

        try {
            let status = await FundingStatus.findOne({
                name: statusName,
                funder: funderId
            });

            if (!status) {
                status = await FundingStatus.create({
                    name: statusName,
                    funder: funderId,
                    initial: false,
                    closed: false,
                    warning: false,
                    defaulted: false,
                    bgcolor: '#6B7280'
                });
            }

            return status;
        } catch (error) {
            console.error(`Error finding/creating funding status for status ${statusName}:`, error);
            return null;
        }
    }

    /**
     * Get funders from OnyxIQ (syndicators and ISOs)
     * @returns {Promise<Array>} - List of funders
     */
    async getFunders() {
        try {
            console.log('🔄 Fetching funders from OnyxIQ...');
            
            // Fetch syndicators and ISOs from OnyxIQ
            const [syndicators, isos] = await Promise.all([
                this.fetchPaginatedFromOnyx('/syndicators/'),
                this.fetchPaginatedFromOnyx('/isos/')
            ]);

            // Combine and format the data
            const funders = [
                ...syndicators.map(syndicator => ({
                    id: syndicator.id,
                    name: syndicator.name || `Syndicator ${syndicator.id}`,
                    email: syndicator.email || `syndicator${syndicator.id}@example.com`,
                    phone: syndicator.phone || '000-000-0000',
                    type: 'syndicator',
                    onyxId: syndicator.id
                })),
                ...isos.map(iso => ({
                    id: iso.id,
                    name: iso.name || `ISO ${iso.id}`,
                    email: iso.email || `iso${iso.id}@example.com`,
                    phone: iso.phone || '000-000-0000',
                    type: 'iso',
                    onyxId: iso.id
                }))
            ];

            console.log(`✅ Found ${funders.length} funders from OnyxIQ`);
            return funders;
        } catch (error) {
            console.error('❌ Error fetching funders from OnyxIQ:', error);
            throw new ErrorResponse(`Failed to fetch funders: ${error.message}`, 500);
        }
    }

    /**
     * Perform full sync of all OnyxIQ data
     * @returns {Promise<Object>} - Full sync results
     */
    async performFullSync() {
        try {
            console.log('🚀 Starting full OnyxIQ sync...');
            
            const results = {
                clients: await this.syncClients(),
                applications: await this.syncApplications(),
                fundings: await this.syncFundings(),
                timestamp: new Date().toISOString()
            };

            console.log('✅ Full OnyxIQ sync completed');
            return results;
        } catch (error) {
            console.error('❌ Error during full sync:', error);
            throw new ErrorResponse(`Full sync failed: ${error.message}`, 500);
        }
    }
}

module.exports = OnyxService;
