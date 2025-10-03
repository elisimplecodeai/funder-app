'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { syncOnyxClients, syncOnyxApplications } from '@/lib/api/onyx';

interface Step4CombinedSyncProps {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
}

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  errors: any[];
  fetchTime?: number;
}

export default function Step4CombinedSync({ 
  importState, 
  updateImportState, 
  nextStep 
}: Step4CombinedSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    clients: SyncResult | null;
    applications: SyncResult | null;
  }>({ clients: null, applications: null });
  const [selectedSyncs, setSelectedSyncs] = useState({
    clients: true,
    applications: true
  });

  const handleCombinedSync = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    
    const results: { clients: SyncResult | null; applications: SyncResult | null } = {
      clients: null,
      applications: null
    };
    
    try {
      // Create array of sync operations to run in parallel
      const syncOperations = [];
      
      if (selectedSyncs.clients) {
        syncOperations.push({
          type: 'clients',
          operation: () => syncOnyxClients(importState.bearerToken),
          toastId: 'clients-sync'
        });
      }
      
      if (selectedSyncs.applications) {
        syncOperations.push({
          type: 'applications',
          operation: () => syncOnyxApplications(importState.bearerToken),
          toastId: 'applications-sync'
        });
      }
      
      // Show loading toasts for all operations
      syncOperations.forEach(op => {
        toast.loading(`Syncing ${op.type} from OnyxIQ...`, { id: op.toastId });
      });
      
      // Execute all sync operations in parallel
      const syncPromises = syncOperations.map(async (op) => {
        try {
          const response = await op.operation();
          const data = response.data;
          
          // Update results
          if (op.type === 'clients') {
            results.clients = data;
          } else if (op.type === 'applications') {
            results.applications = data;
          }
          
          // Show success toast
          toast.success(`Successfully fetched ${data.total} ${op.type} from OnyxIQ!`, { id: op.toastId });
          
          return { type: op.type, success: true, data };
        } catch (error) {
          console.error(`Error syncing ${op.type}:`, error);
          toast.error(`Failed to sync ${op.type}`, { id: op.toastId });
          return { type: op.type, success: false, error };
        }
      });
      
      // Wait for all operations to complete
      const syncResults = await Promise.all(syncPromises);
      
      // Check if any operations failed
      const failedOperations = syncResults.filter(result => !result.success);
      if (failedOperations.length > 0) {
        console.warn('Some sync operations failed:', failedOperations);
      }

      setSyncResults(results);
      
      // Update import state
      const updates: any = {
        combinedSyncCompleted: true,
        syncResults: { ...importState.syncResults }
      };
      
      if (selectedSyncs.clients) {
        updates.clientsSynced = true;
        updates.syncResults.clients = results.clients;
      }
      
      if (selectedSyncs.applications) {
        updates.applicationsSynced = true;
        updates.syncResults.applications = results.applications;
      }
      
      updateImportState(updates);
      
      toast.success('Data sync completed successfully!');
      
    } catch (error) {
      console.error('Error during combined sync:', error);
      toast.error('Failed to sync data. Please try again.');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const handleSyncTypeChange = (type: 'clients' | 'applications') => {
    setSelectedSyncs(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getTotalStats = () => {
    const total = (syncResults.clients?.total || 0) + (syncResults.applications?.total || 0);
    const created = (syncResults.clients?.created || 0) + (syncResults.applications?.created || 0);
    const updated = (syncResults.clients?.updated || 0) + (syncResults.applications?.updated || 0);
    const errors = [
      ...(syncResults.clients?.errors || []),
      ...(syncResults.applications?.errors || [])
    ];
    
    return { total, created, updated, errors };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step 4: Sync Data from OnyxIQ
        </h2>
        <p className="text-gray-600">
          Choose which data to sync from your OnyxIQ account. You can select clients, applications, or both. 
          When both are selected, they will be fetched simultaneously for faster processing.
        </p>
      </div>

      {/* Reminder Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center">
          <svg className="h-4 w-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-yellow-800">
            <strong>Important:</strong> Please do not sign into OnyxIQ elsewhere during this scraping process to avoid session conflicts.
          </span>
        </div>
      </div>

      {/* Sync Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Data to Sync</h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSyncs.clients}
              onChange={() => handleSyncTypeChange('clients')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          <div>
            <span className="text-sm font-medium text-gray-900">Sync Clients</span>
            <p className="text-xs text-gray-500">Import client data from OnyxIQ</p>
          </div>
        </label>
        
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedSyncs.applications}
            onChange={() => handleSyncTypeChange('applications')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Sync Applications</span>
            <p className="text-xs text-gray-500">Import application data from OnyxIQ</p>
          </div>
        </label>
        
        {/* Parallel Processing Info */}
        {selectedSyncs.clients && selectedSyncs.applications && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-800">
                <strong>Parallel Processing:</strong> Both clients and applications will be fetched simultaneously for faster results.
              </span>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Sync Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCombinedSync}
          disabled={isSyncing || (!selectedSyncs.clients && !selectedSyncs.applications)}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            isSyncing || (!selectedSyncs.clients && !selectedSyncs.applications)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSyncing ? 'Syncing Data...' : 'Start Sync'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">
                {selectedSyncs.clients && selectedSyncs.applications 
                  ? 'Fetching clients and applications simultaneously from OnyxIQ...'
                  : selectedSyncs.clients 
                    ? 'Fetching clients from OnyxIQ...'
                    : 'Fetching applications from OnyxIQ...'
                }
              </span>
            </div>
          </div>
          
          {/* Show progress for multiple operations */}
          {(selectedSyncs.clients && selectedSyncs.applications) && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Clients</span>
                <span className="text-blue-600">⏳ In Progress</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Applications</span>
                <span className="text-blue-600">⏳ In Progress</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sync Results */}
      {(syncResults.clients || syncResults.applications) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Results</h3>
          
          {/* Overall Stats */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Overall Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md">
                <span className="text-2xl font-bold text-gray-800">{getTotalStats().total.toLocaleString()}</span>
                <span className="text-sm text-gray-500">Total Records</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md">
                <span className="text-2xl font-bold text-green-600">{getTotalStats().created.toLocaleString()}</span>
                <span className="text-sm text-gray-500">Created</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md">
                <span className="text-2xl font-bold text-yellow-600">{getTotalStats().updated.toLocaleString()}</span>
                <span className="text-sm text-gray-500">Updated</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md">
                <span className="text-2xl font-bold text-red-600">{getTotalStats().errors.length.toLocaleString()}</span>
                <span className="text-sm text-gray-500">Errors</span>
              </div>
            </div>
          </div>

          {/* Individual Results */}
          <div className="grid md:grid-cols-2 gap-6">
            {syncResults.clients && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Clients</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total: <span className="font-medium">{syncResults.clients.total}</span></div>
                  <div>Created: <span className="font-medium text-green-600">{syncResults.clients.created}</span></div>
                  <div>Updated: <span className="font-medium text-yellow-600">{syncResults.clients.updated}</span></div>
                  <div>Errors: <span className="font-medium text-red-600">{syncResults.clients.errors?.length || 0}</span></div>
                </div>
              </div>
            )}

            {syncResults.applications && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">Applications</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total: <span className="font-medium">{syncResults.applications.total}</span></div>
                  <div>Created: <span className="font-medium text-green-600">{syncResults.applications.created}</span></div>
                  <div>Updated: <span className="font-medium text-yellow-600">{syncResults.applications.updated}</span></div>
                  <div>Errors: <span className="font-medium text-red-600">{syncResults.applications.errors?.length || 0}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Errors Display */}
          {getTotalStats().errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Errors encountered:</h4>
              <div className="max-h-32 overflow-y-auto">
                {getTotalStats().errors.map((error: any, index: number) => (
                  <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded mb-1">
                    {error.clientId && `Client ${error.clientId}: `}
                    {error.applicationId && `Application ${error.applicationId}: `}
                    {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {importState.combinedSyncCompleted && (
        <div className="flex justify-end">
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue to Next Step
          </button>
        </div>
      )}
    </div>
  );
}
