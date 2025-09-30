import { env } from '@/config/env';

interface OnyxSyncResult {
  total: number;
  created: number;
  updated: number;
  errors: Array<{
    clientId?: string;
    applicationId?: string;
    fundingId?: string;
    error: string;
  }>;
}

interface OnyxSyncResponse {
  success: boolean;
  message: string;
  data: OnyxSyncResult;
}

interface OnyxFullSyncResponse {
  success: boolean;
  message: string;
  data: {
    clients: OnyxSyncResult;
    applications: OnyxSyncResult;
    fundings: OnyxSyncResult;
    timestamp: string;
  };
}

interface OnyxStatusResponse {
  success: boolean;
  data: {
    lastSync: string | null;
    status: string;
    endpoints: {
      clients: string;
      applications: string;
      fundings: string;
      full: string;
    };
  };
}

/**
 * Get OnyxIQ sync status
 */
export async function getOnyxSyncStatus(): Promise<OnyxStatusResponse> {
  const response = await fetch(`https://services.onyxiq.com/api/clients/?size=25&sortDir=DESC&isoIds=`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get OnyxIQ sync status');
  }

  return response.json();
}

/**
 * Sync clients from OnyxIQ
 */
export async function syncOnyxClients(bearerToken?: string): Promise<OnyxSyncResponse> {
  const response = await fetch('http://localhost:5001/api/v1/onyx/sync/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bearerToken: bearerToken
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync OnyxIQ clients');
  }

  return response.json();
}

export async function getOnyxProgress(operationId: string): Promise<any> {
  const response = await fetch(`http://localhost:5001/api/v1/onyx/progress/${operationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get progress');
  }

  return response.json();
}

/**
 * Sync applications from OnyxIQ
 */
export async function syncOnyxApplications(bearerToken?: string): Promise<OnyxSyncResponse> {
  const response = await fetch('http://localhost:5001/api/v1/onyx/sync/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bearerToken: bearerToken
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync OnyxIQ applications');
  }

  return response.json();
}

export async function syncOnyxFundings(bearerToken?: string): Promise<OnyxSyncResponse> {
  const response = await fetch('http://localhost:5001/api/v1/onyx/sync/fundings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bearerToken: bearerToken
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync OnyxIQ fundings');
  }

  return response.json();
}


/**
 * Perform full sync from OnyxIQ
 */
export async function performOnyxFullSync(): Promise<OnyxFullSyncResponse> {
  const response = await fetch('http://localhost:5001/api/v1/onyx/sync/full', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to perform full OnyxIQ sync');
  }

  return response.json();
}
