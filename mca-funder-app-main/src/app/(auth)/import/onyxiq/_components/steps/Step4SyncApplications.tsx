'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { syncOnyxApplications } from '@/lib/api/onyx';

interface Step4SyncApplicationsProps {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
}

export default function Step4SyncApplications({ 
  importState, 
  updateImportState, 
  nextStep 
}: Step4SyncApplicationsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSyncApplications = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    
    try {
      // Start the sync operation
      const results = await syncOnyxApplications(importState.bearerToken);
      
      setSyncResults(results.data);
      updateImportState({ 
        applicationsSynced: true,
        syncResults: { ...importState.syncResults, applications: results.data }
      });
      toast.success(`Successfully fetched ${results.data.total} applications from OnyxIQ!`);
      
    } catch (error) {
      console.error('Error syncing applications:', error);
      toast.error('Failed to sync applications. Please try again.');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sync Applications
        </h2>
        <p className="text-gray-600">
          Fetch all applications from your OnyxIQ account. This will retrieve application data 
          that can be imported into your MCA system.
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

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {importState.applicationsSynced ? 'Applications synced ✓' : 'Ready to sync applications'}
        </div>
        <button
          onClick={handleSyncApplications}
          disabled={isSyncing || importState.applicationsSynced}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isSyncing || importState.applicationsSynced
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSyncing ? 'Syncing Applications...' : importState.applicationsSynced ? 'Applications Synced ✓' : 'Sync Applications'}
        </button>
      </div>

      {/* Simple Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">Fetching applications from OnyxIQ...</span>
            </div>
          </div>
        </div>
      )}

      {syncResults && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{syncResults.total}</div>
              <div className="text-sm text-blue-800">Total</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{syncResults.created}</div>
              <div className="text-sm text-green-800">Created</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{syncResults.updated}</div>
              <div className="text-sm text-yellow-800">Updated</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{syncResults.errors?.length || 0}</div>
              <div className="text-sm text-red-800">Errors</div>
            </div>
          </div>
          
          {syncResults.fetchTime && (
            <div className="mt-4 text-sm text-gray-600">
              <strong>Fetch Time:</strong> {syncResults.fetchTime.toFixed(2)} minutes
            </div>
          )}
        </div>
      )}

      {importState.applicationsSynced && (
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