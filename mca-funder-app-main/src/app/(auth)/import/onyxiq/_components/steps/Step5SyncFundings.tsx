'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { syncOnyxFundings } from '@/lib/api/onyx';

interface Step5SyncFundingsProps {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
}

export default function Step5SyncFundings({
  importState,
  updateImportState,
  nextStep
}: Step5SyncFundingsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSyncFundings = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    
    try {
      const results = await syncOnyxFundings(importState.bearerToken);
      
      console.log('Funding sync results:', results);
      console.log('Results data:', results.data);
      
      setSyncResults(results.data);
      updateImportState({ 
        fundingsSynced: true,
        syncResults: { ...importState.syncResults, fundings: results.data }
      });
      toast.success(`Successfully fetched ${results.data.total} fundings from OnyxIQ!`);
      
    } catch (error) {
      console.error('Error syncing fundings:', error);
      toast.error('Failed to sync fundings. Please try again.');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step 4: Sync Fundings
        </h2>
        <p className="text-gray-600">
          Initiate the synchronization of funding data from OnyxIQ to your CRM.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Funding Data Sync</h3>
          <button
            onClick={handleSyncFundings}
            disabled={isSyncing || importState.fundingsSynced}
            className={`px-6 py-2 rounded-md text-white font-medium transition-colors duration-200
              ${isSyncing || importState.fundingsSynced
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
          >
            {isSyncing ? 'Syncing Fundings...' : importState.fundingsSynced ? 'Fundings Synced ✓' : 'Sync Fundings'}
          </button>
        </div>

        {/* Simple Loading State */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">Fetching fundings from OnyxIQ...</span>
              </div>
            </div>
          </div>
        )}

        {syncResults && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Results</h3>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">Debug Info:</p>
              <p className="text-xs text-yellow-700">Total: {syncResults.total}</p>
              <p className="text-xs text-yellow-700">Created: {syncResults.created}</p>
              <p className="text-xs text-yellow-700">Updated: {syncResults.updated}</p>
              <p className="text-xs text-yellow-700">Errors: {syncResults.errors?.length}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md">
                <span className="text-2xl font-bold text-gray-800">{syncResults.total?.toLocaleString() || 0}</span>
                <span className="text-sm text-gray-500">Total Fetched</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md">
                <span className="text-2xl font-bold text-green-600">{syncResults.created?.toLocaleString() || 0}</span>
                <span className="text-sm text-gray-500">Created</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md">
                <span className="text-2xl font-bold text-yellow-600">{syncResults.updated?.toLocaleString() || 0}</span>
                <span className="text-sm text-gray-500">Updated</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md">
                <span className="text-2xl font-bold text-red-600">{syncResults.errors?.length.toLocaleString() || 0}</span>
                <span className="text-sm text-gray-500">Errors</span>
              </div>
            </div>
            {syncResults.errors && syncResults.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Errors encountered:</h4>
                <ul className="list-disc list-inside text-xs text-red-700 max-h-24 overflow-y-auto">
                  {syncResults.errors.map((error: any, index: number) => (
                    <li key={index}>{error.fundingId || 'Unknown ID'}: {error.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={nextStep}
          disabled={!importState.fundingsSynced}
          className={`px-6 py-2 rounded-md text-white font-medium transition-colors duration-200
            ${!importState.fundingsSynced
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }`}
        >
          Next: Progress Summary
        </button>
      </div>
    </div>
  );
}