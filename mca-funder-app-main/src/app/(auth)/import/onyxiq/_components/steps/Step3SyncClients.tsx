'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { syncOnyxClients, getOnyxProgress } from '@/lib/api/onyx';

interface Step3SyncClientsProps {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export default function Step3SyncClients({ 
  importState, 
  updateImportState, 
  nextStep 
}: Step3SyncClientsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSyncClients = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    
    try {
      // Start the sync operation
      const results = await syncOnyxClients(importState.bearerToken);
      
      setSyncResults(results.data);
      updateImportState({ 
        clientsSynced: true,
        syncResults: { ...importState.syncResults, clients: results.data }
      });
      toast.success(`Successfully fetched ${results.data.total} clients from OnyxIQ!`);
      
    } catch (error) {
      console.error('Error syncing clients:', error);
      toast.error('Failed to sync clients. Please try again.');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sync Clients from OnyxIQ
        </h2>
        <p className="text-gray-600">
          Import client/merchant data from OnyxIQ to your MCA CRM system.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">What will be synced:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Client business information (name, email, phone)</li>
          <li>Business details (industry, revenue, years in business)</li>
          <li>Address information</li>
          <li>Contact details</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSyncClients}
          disabled={isSyncing || importState.clientsSynced}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium"
        >
          {isSyncing ? 'Syncing Clients...' : importState.clientsSynced ? 'Clients Synced ✓' : 'Sync Clients'}
        </button>
      </div>

          {/* Simple Loading State */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700">Fetching clients from OnyxIQ...</span>
                </div>
              </div>
            </div>
          )}

      {syncResults && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{syncResults.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncResults.created}</div>
              <div className="text-sm text-gray-600">Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{syncResults.updated}</div>
              <div className="text-sm text-gray-600">Updated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{syncResults.errors.length}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>
          
          {syncResults.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
              <div className="max-h-32 overflow-y-auto">
                {syncResults.errors.map((error: any, index: number) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded mb-1">
                    {error.clientId && `Client ${error.clientId}: `}
                    {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {importState.clientsSynced && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">Clients successfully synced! You can proceed to the next step.</span>
          </div>
        </div>
      )}
    </div>
  );
}
