'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { 
  syncOnyxClients, 
  syncOnyxApplications, 
  syncOnyxFundings, 
  performOnyxFullSync 
} from '@/lib/api/onyx';

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  errors: Array<{ error: string; clientId?: string; applicationId?: string; fundingId?: string }>;
}

export default function OnyxPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    clients?: SyncResult;
    applications?: SyncResult;
    fundings?: SyncResult;
    fullSync?: SyncResult;
  }>({});

  const handleSync = async (syncType: string, syncFunction: () => Promise<any>) => {
    setIsLoading(true);
    try {
      const result = await syncFunction();
      setSyncResults(prev => ({
        ...prev,
        [syncType]: result.data
      }));
      toast.success(`${syncType} sync completed successfully!`);
    } catch (error) {
      console.error(`${syncType} sync error:`, error);
      toast.error(`Failed to sync ${syncType}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const SyncButton = ({ 
    syncType, 
    label, 
    syncFunction 
  }: { 
    syncType: string; 
    label: string; 
    syncFunction: () => Promise<any> 
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>
      <p className="text-gray-600 mb-4">
        {syncType === 'clients' && 'Import client/merchant data from OnyxIQ'}
        {syncType === 'applications' && 'Import application data from OnyxIQ'}
        {syncType === 'fundings' && 'Import funding data from OnyxIQ'}
        {syncType === 'full' && 'Perform complete data synchronization from OnyxIQ'}
      </p>
      <button
        onClick={() => handleSync(syncType, syncFunction)}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Syncing...' : `Sync ${label}`}
      </button>
    </div>
  );

  const SyncResults = ({ results, title }: { results: SyncResult; title: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title} Results</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{results.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{results.created}</div>
          <div className="text-sm text-gray-600">Created</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{results.updated}</div>
          <div className="text-sm text-gray-600">Updated</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>
      
      {results.errors.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
          <div className="max-h-32 overflow-y-auto">
            {results.errors.map((error, index) => (
              <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded mb-1">
                {error.clientId && `Client ${error.clientId}: `}
                {error.applicationId && `Application ${error.applicationId}: `}
                {error.fundingId && `Funding ${error.fundingId}: `}
                {error.error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/import')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Import Options
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OnyxIQ Data Import</h1>
          <p className="mt-2 text-gray-600">
            Import and sync your loan management data from OnyxIQ to your MCA CRM system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SyncButton
            syncType="clients"
            label="Sync Clients"
            syncFunction={syncOnyxClients}
          />
          <SyncButton
            syncType="applications"
            label="Sync Applications"
            syncFunction={syncOnyxApplications}
          />
          <SyncButton
            syncType="fundings"
            label="Sync Fundings"
            syncFunction={syncOnyxFundings}
          />
          <SyncButton
            syncType="full"
            label="Full Sync"
            syncFunction={performFullSync}
          />
        </div>

        {/* Sync Results */}
        {Object.keys(syncResults).length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Sync Results</h2>
            {syncResults.clients && (
              <SyncResults results={syncResults.clients} title="Clients" />
            )}
            {syncResults.applications && (
              <SyncResults results={syncResults.applications} title="Applications" />
            )}
            {syncResults.fundings && (
              <SyncResults results={syncResults.fundings} title="Fundings" />
            )}
            {syncResults.fullSync && (
              <SyncResults results={syncResults.fullSync} title="Full Sync" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}