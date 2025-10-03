'use client';

import { useEffect } from 'react';

interface Step6OverallProgressProps {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export default function Step6OverallProgress({ 
  importState 
}: Step6OverallProgressProps) {
  const totalRecords = (importState.syncResults?.clients?.total || 0) + 
                      (importState.syncResults?.applications?.total || 0) + 
                      (importState.syncResults?.fundings?.total || 0);

  const totalCreated = (importState.syncResults?.clients?.created || 0) + 
                      (importState.syncResults?.applications?.created || 0) + 
                      (importState.syncResults?.fundings?.created || 0);

  const totalUpdated = (importState.syncResults?.clients?.updated || 0) + 
                      (importState.syncResults?.applications?.updated || 0) + 
                      (importState.syncResults?.fundings?.updated || 0);

  const totalErrors = (importState.syncResults?.clients?.errors?.length || 0) + 
                     (importState.syncResults?.applications?.errors?.length || 0) + 
                     (importState.syncResults?.fundings?.errors?.length || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Import Complete!
        </h2>
        <p className="text-gray-600">
          Your OnyxIQ data has been successfully imported into your MCA CRM system.
        </p>
      </div>

      {/* Overall Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{totalRecords}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{totalCreated}</div>
            <div className="text-sm text-gray-600">Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{totalUpdated}</div>
            <div className="text-sm text-gray-600">Updated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{totalErrors}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clients Results */}
        {importState.syncResults?.clients && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Clients</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-medium">{importState.syncResults.clients.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="font-medium text-green-600">{importState.syncResults.clients.created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Updated:</span>
                <span className="font-medium text-yellow-600">{importState.syncResults.clients.updated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Errors:</span>
                <span className="font-medium text-red-600">{importState.syncResults.clients.errors.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Applications Results */}
        {importState.syncResults?.applications && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Applications</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-medium">{importState.syncResults.applications.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="font-medium text-green-600">{importState.syncResults.applications.created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Updated:</span>
                <span className="font-medium text-yellow-600">{importState.syncResults.applications.updated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Errors:</span>
                <span className="font-medium text-red-600">{importState.syncResults.applications.errors.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fundings Results */}
        {importState.syncResults?.fundings && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Fundings</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-medium">{importState.syncResults.fundings.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="font-medium text-green-600">{importState.syncResults.fundings.created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Updated:</span>
                <span className="font-medium text-yellow-600">{importState.syncResults.fundings.updated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Errors:</span>
                <span className="font-medium text-red-600">{importState.syncResults.fundings.errors.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-md p-6">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-green-800">Import Successful!</h3>
            <p className="text-green-700 mt-1">
              Your OnyxIQ data has been successfully imported. You can now access all your data in the MCA CRM system.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">What's next?</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Review your imported data in the MCA CRM dashboard</li>
          <li>Set up automated syncs to keep data up-to-date</li>
          <li>Configure your funder settings and preferences</li>
          <li>Train your team on the new system</li>
        </ul>
      </div>
    </div>
  );
}
