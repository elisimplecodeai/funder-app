export const env = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    endpoints: {
      funder: {
        login: '/auth/login/funder',
        logout: '/auth/logout/funder',
        getFunderById: '/funders/:funderId',
        getFunderList: '/funders/list',
        getFunders: '/funders',
        addFunder: '/funders',
        updateFunder: '/funders/:funderId',
        deleteFunder: '/funders/:funderId',

        // TODO: Remove this
        iso: {
          getISOs: '/funders/:funderId/isos',
          getISOList: '/funders/:funderId/isos/list',
          addISO: '/funders/:funderId/isos',
          removeISO: '/funders/:funderId/isos/:isoId',
        },
        getSelectedFunder: '/funders/select',
        setSelectedFunder: '/funders/select',
      },
      lender: {
        getLenders: '/lenders',
        getLenderList: '/lenders/list',
        getLenderById: '/lenders/:lenderId',
        createLender: '/lenders',
        updateLender: '/lenders/:lenderId',
        deleteLender: '/lenders/:lenderId',

        getLenderUsers: '/lenders/:lenderId/users',
        getLenderUserList: '/lenders/:lenderId/users/list',
        addLenderUser: '/lenders/:lenderId/users',
        removeLenderUser: '/lenders/:lenderId/users/:userId',
      },
      isoFunder: {
        getISOFunders: '/iso-funders',
        getISOFunderList: '/iso-funders/list',
        getISOFunderById: '/iso-funders/:isoFunderId',
        addISOFunder: '/iso-funders',
        updateISOFunder: '/iso-funders/:isoFunderId',
        deleteISOFunder: '/iso-funders/:isoFunderId',
      },

      isoMerchant: {
        getISOMerchants: '/iso-merchants',
        getISOMerchantList: '/iso-merchants/list',
        getISOMerchantById: '/iso-merchants/:isoMerchantId',
        addISOMerchant: '/iso-merchants',
        updateISOMerchant: '/iso-merchants/:isoMerchantId',
        deleteISOMerchant: '/iso-merchants/:isoMerchantId',
      },

      isoRepresentative: {
        getISORepresentatives: '/isos/:isoId/representatives',
        getISORepresentativeList: '/isos/:isoId/representatives/list',
        addISORepresentative: '/isos/:isoId/representatives',
        deleteISORepresentative: '/isos/:isoId/representatives/:isoRepresentativeId',
      },
      merchantFunder: {
        getMerchantFunders: '/merchant-funders',  
        getMerchantFunderList: '/merchant-funders/list',
        getMerchantFunderById: '/merchant-funders/:merchantFunderId',
        addMerchantFunder: '/merchant-funders',
        updateMerchantFunder: '/merchant-funders/:merchantFunderId',
        deleteMerchantFunder: '/merchant-funders/:merchantFunderId',
      },
      applicationOffer: {
        getApplicationOffers: '/application-offers',
        getApplicationOfferList: '/application-offers/list',
        getApplicationOfferById: '/application-offers/:applicationOfferId',
        createApplicationOffer: '/application-offers',
        updateApplicationOffer: '/application-offers/:applicationOfferId',
        deleteApplicationOffer: '/application-offers/:applicationOfferId',
        acceptApplicationOffer: '/application-offers/:applicationOfferId/accept',
        declineApplicationOffer: '/application-offers/:applicationOfferId/decline',
      },
      syndicationOffer: {
        getSyndicationOffers: '/syndication-offers',
        getSyndicationOfferList: '/syndication-offers/list',
        getSyndicationOfferById: '/syndication-offers/:syndicationOfferId',
        createSyndicationOffer: '/syndication-offers',
        updateSyndicationOffer: '/syndication-offers/:syndicationOfferId',
        deleteSyndicationOffer: '/syndication-offers/:syndicationOfferId',
      },
      merchant: {
        getMerchants: '/merchants',
        getMerchantList: '/merchants/list',
        getMerchantById: '/merchants/:merchantId',
      },
      iso: {
        getISOById: '/isos/:ISOId',
        getISOs: '/isos',
        getISOList: '/isos/list',
        createISO: '/isos',
        updateISO: '/isos/:isoId',
        deleteISO: '/isos/:isoId',

        // ISO Funder
        getISOFunderList: '/isos/:isoId/funders/list',

        // ISO Representative 
        getISORepresentativeList: '/isos/:isoId/representatives/list',
        getISORepresentatives: '/isos/:isoId/representatives',
        addISORepresentative: '/isos/:isoId/representatives',
        deleteISORepresentative: '/isos/:isoId/representatives/:representativeId',
        getISOApplicationList: '/isos/:isoId/applications/list',

        // ISO Accounts
        getISOAccounts: '/iso-accounts',
        getISOAccountById: '/iso-accounts/:accountId',
        createISOAccount: '/iso-accounts',
        updateISOAccount: '/iso-accounts/:accountId',
        deleteISOAccount: '/iso-accounts/:accountId',
        getISOAccountsList: '/iso-accounts/list',
      },

      document: {
        getDocumentById: '/documents/:documentId',
        getDocuments: '/documents',
        getDocumentList: '/documents/list',
        downloadDocument: '/documents/:documentId/download',
        createDocument: '/documents',
        createDocumentBulk: '/documents/bulk',
        updateDocument: '/documents/:documentId',
        uploadExistingDocument: '/documents/:documentId/upload',
        deleteDocument: '/documents/:documentId',
      },
      syndicator: {
        getSyndicators: '/syndicators',
        getSyndicatorList: '/syndicators/list',
        getSyndicatorById: '/syndicators/:syndicatorId',
        deleteSyndicator: '/syndicators/:syndicatorId',
        createSyndicator: '/syndicators',

        addSyndicator: '/syndicators',
        updateSyndicator: '/syndicators/:syndicatorId',

        // SyndicatorFunder
        getSyndicatorFunders: '/syndicator-funders',
        getSyndicatorFunderList: '/syndicator-funders/list',
        getSyndicatorFunderById: '/syndicator-funders/:syndicatorFunderId',
        createSyndicatorFunder: '/syndicator-funders',
        updateSyndicatorFunder: '/syndicator-funders/:syndicatorFunderId',
        deleteSyndicatorFunder: '/syndicator-funders/:syndicatorFunderId',
      },
      application: {
        getApplications: '/applications',
        getApplicationById: '/applications/:applicationId',
        getApplicationList: '/applications/list',
        createApplication: '/applications',
        updateApplication: '/applications/:applicationId', 
        deleteApplication: '/applications/:applicationId',
        // documents
        getApplicationDocuments: '/applications/:applicationId/documents',
        getApplicationDocumentList: '/applications/:applicationId/documents/list',
        getApplicationDocumentById: '/applications/:applicationId/documents/:documentId',
        createApplicationDocument: '/applications/:applicationId/documents',
        updateApplicationDocument: '/applications/:applicationId/documents/:documentId',
        checkApplicationDocument: '/applications/:applicationId/documents/check/:documentId',
        deleteApplicationDocument: '/applications/:applicationId/documents/:documentId',
        // stipulations
        getApplicationStipulations: '/applications/:applicationId/stipulations',
        getApplicationStipulationList: '/applications/:applicationId/stipulations/list',
        getApplicationStipulationById: '/applications/:applicationId/stipulations/:stipulationId',
        createApplicationStipulation: '/applications/:applicationId/stipulations',
        updateApplicationStipulation: '/applications/:applicationId/stipulations/:stipulationId',
        deleteApplicationStipulation: '/applications/:applicationId/stipulations/:stipulationId',
        toggleApplicationStipulation: '/applications/:applicationId/stipulations/:stipulationId/toggle',
      },
      applicationStatus: {
        getApplicationStatuses: '/application-statuses',
        getApplicationStatusById: '/application-statuses/:statusId',
        getApplicationStatusList: '/application-statuses/list',
        createApplicationStatus: '/application-statuses',
        updateApplicationStatus: '/application-statuses/:statusId',
        deleteApplicationStatus: '/application-statuses/:statusId',
      },
      fundingStatus: {
        getFundingStatuses: '/funding-statuses',
        getFundingStatusById: '/funding-statuses/:statusId',
        getFundingStatusList: '/funding-statuses/list',
        createFundingStatus: '/funding-statuses',
        updateFundingStatus: '/funding-statuses/:statusId',
        deleteFundingStatus: '/funding-statuses/:statusId',
        updateFundingStatusIndex: '/funding-statuses',
      },
      feeType: {
        getFeeTypes: '/fee-types',
        getFeeTypeById: '/fee-types/:feeTypeId',
        getFeeTypeList: '/fee-types/list',
        createFeeType: '/fee-types',
        updateFeeType: '/fee-types/:feeTypeId',
        deleteFeeType: '/fee-types/:feeTypeId',
      },
      formula: {
        getFormulas: '/formulas',
        getFormulaById: '/formulas/:formulaId',
        getFormulaList: '/formulas/list',
        createFormula: '/formulas',
        updateFormula: '/formulas/:formulaId',
        deleteFormula: '/formulas/:formulaId',
        calculateFormula: '/formulas/:formulaId/calculate',
      },
      stipulationType: {
        getStipulationTypes: '/stipulation-types',
        getStipulationTypeById: '/stipulation-types/:stipulationTypeId',
        getStipulationTypeList: '/stipulation-types/list',
        createStipulationType: '/stipulation-types',
        updateStipulationType: '/stipulation-types/:stipulationTypeId',
        deleteStipulationType: '/stipulation-types/:stipulationTypeId',
      },
      stipulation: {
        getStipulations: '/stipulation-types',
        getStipulationById: '/stipulation-types/:stipulationId',
        getStipulationList: '/stipulation-types/list',
        createStipulation: '/stipulation-types',
        updateStipulation: '/stipulation-types/:stipulationId',
        deleteStipulation: '/stipulation-types/:stipulationId',
      },
      representative: {
        getRepresentatives: '/representatives',
        getRepresentativeList: '/representatives/list',
        getRepresentativeById: '/representatives/:representativeId',
        createRepresentative: '/representatives',
        updateRepresentative: '/representatives/:representativeId',
        deleteRepresentative: '/representatives/:representativeId',
      },
      user: {
        getUserList: '/users/list',

        getUserLenders: '/users/:userId/lenders',
        getUserLenderList: '/users/:userId/lenders/list',
        addUserLender: '/users/:userId/lenders',
        removeUserLender: '/users/:userId/lenders/:lenderId',

        getUserFunders: '/users/:userId/funders',
        getUserFunderList: '/users/:userId/funders/list',
        addUserFunder: '/users/:userId/funders',
        removeUserFunder: '/users/:userId/funders/:funderId',
      },
      funding: {
        getFundings: '/fundings',
        getFundingById: '/fundings/:fundingId',
        getFundingList: '/fundings/list',
        createFunding: '/fundings',
        updateFunding: '/fundings/:fundingId',
        deleteFunding: '/fundings/:fundingId',
      },
      // fundingStatus: {
      //   getFundingStatuses: '/funding-statuses',
      //   getFundingStatusById: '/funding-statuses/:fundingStatusId',
      //   getFundingStatusList: '/funding-statuses/list',
      //   createFundingStatus: '/funding-statuses',
      //   updateFundingStatus: '/funding-statuses/:fundingStatusId',
      //   deleteFundingStatus: '/funding-statuses/:fundingStatusId',
      // },
      paybackPlan: {
        getPaybackPlans: '/api/v1/payback-plans',
        getPaybackPlanById: '/api/v1/payback-plans/:paybackPlanId',
        createPaybackPlan: '/api/v1/payback-plans',
        updatePaybackPlan: '/api/v1/payback-plans/:paybackPlanId',
        deletePaybackPlan: '/api/v1/payback-plans/:paybackPlanId',
      },
      payout: {
        getPayouts: '/payouts',
        getPayoutById: '/payouts/:payoutId',
        getPayoutList: '/payouts/list',
        createPayout: '/payouts',
        updatePayout: '/payouts/:payoutId',
        deletePayout: '/payouts/:payoutId',
      },
      fundingFee: {
        getFundingFees: '/funding-fees',
        getFundingFeeById: '/funding-fees/:fundingFeeId',
        getFundingFeeList: '/funding-fees/list',
        createFundingFee: '/funding-fees',
        updateFundingFee: '/funding-fees/:fundingFeeId',
        deleteFundingFee: '/funding-fees/:fundingFeeId',
      },
      fundingCredit: {
        getFundingCredits: '/funding-credits',
        getFundingCreditById: '/funding-credits/:fundingCreditId',
        getFundingCreditList: '/funding-credits/list',
        createFundingCredit: '/funding-credits',
        updateFundingCredit: '/funding-credits/:fundingCreditId',
        deleteFundingCredit: '/funding-credits/:fundingCreditId',
      },
      contact: {
        getContacts: '/contacts',
        getContactList: '/contacts/list',
        getContactById: '/contacts/:contactId',
        createContact: '/contacts',
      },
      import: {
        orgmeter: {
          validateApi: '/import/orgmeter/validate',
          createFunder: '/import/orgmeter/create-funder',
          getOverallProgress: '/import/orgmeter/progress',
          getStepInfo: '/import/orgmeter/step-info/:entityType',
          startImport: '/import/orgmeter/import/:entityType',
          getProgressStream: '/import/orgmeter/progress/:entityType',
          syncAllPendingRecords: '/import/orgmeter/sync-all'
        },
      },
      upload: {
        orgmeter: {
          createUploadJob: '/upload/orgmeter/:entityType',
          getUploadJobStatus: '/upload/orgmeter/job/:jobId/status',
          cancelUploadJob: '/upload/orgmeter/job/:jobId/cancel',
          getUploadJobs: '/upload/orgmeter/jobs'
        },
      },
      sync: {
        orgmeter: {
          // Sync job management routes
          getOverallProgress: '/sync/orgmeter/progress',
          startEntitySync: '/sync/orgmeter/start/:entityType',
          getSyncJobStatus: '/sync/orgmeter/job/:jobId/status',
          cancelSyncJob: '/sync/orgmeter/job/:jobId/cancel',
          getSyncJobs: '/sync/orgmeter/jobs',
          continueSyncJob: '/sync/orgmeter/job/:jobId/continue',
          
          // Sync review and selection routes
          getImportedDataForReview: '/sync/orgmeter/review/:entityType',
          updateSyncSelection: '/sync/orgmeter/selection/:entityType'
        }
      },
      dashboard: {
        financialReport: '/dashboard/financial-report',
      },
      expenseType: {
        getExpenseTypes: '/expense-types',
        getExpenseTypeList: '/expense-types/list',
        getExpenseTypeById: '/expense-types/:expenseTypeId',
        createExpenseType: '/expense-types',
        updateExpenseType: '/expense-types/:expenseTypeId',
        deleteExpenseType: '/expense-types/:expenseTypeId',
      },
    },
  },
  auth: {
    refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || 'refreshToken',
    accessTokenName: process.env.ACCESS_TOKEN_NAME || 'accessToken',
  },
  storageKeys: {
    auth: 'auth-storage', // LocalStorage key for persisted auth data
  }
};