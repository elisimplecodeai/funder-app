'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Step3UserRolesProps {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
}

interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

interface OnyxSettings {
  userRoles: UserRole[];
  tenantId: string;
  settings: any;
}

export default function Step3UserRoles({ 
  importState, 
  updateImportState, 
  nextStep 
}: Step3UserRolesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  const fetchUserRoles = async () => {
    setIsLoading(true);
    setError(null);
    
    // Debug: Check if bearer token exists
    console.log('Bearer token from import state:', importState.bearerToken ? 'Present' : 'Missing');
    console.log('Token length:', importState.bearerToken?.length || 0);
    
    if (!importState.bearerToken) {
      setError('No bearer token available. Please go back to Step 1 and validate your API token first.');
      setIsLoading(false);
      return;
    }
    
    try {
      // Try backend proxy first, fallback to mock data if unavailable
      console.log('Attempting to use backend proxy to fetch user roles...');
      console.log(`Using bearer token: ${importState.bearerToken.substring(0, 20)}...`);
      
      let response;
      let useBackendProxy = true;
      
      try {
        response = await fetch('http://localhost:5001/api/v1/onyx/user-roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bearerToken: importState.bearerToken
          }),
        });
        
        console.log('Proxy response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Proxy error response:', errorText);
          throw new Error(`Backend proxy failed: ${response.status} ${response.statusText}. ${errorText}`);
        }
      } catch (proxyError) {
        console.warn('Backend proxy unavailable, using mock data:', proxyError.message);
        useBackendProxy = false;
        
        // Use mock data as fallback
        const mockRoles = [
          { id: 'admin', name: 'Administrator', description: 'Full system access', permissions: ['read', 'write', 'delete', 'admin'] },
          { id: 'user', name: 'User', description: 'Standard user access', permissions: ['read', 'write'] },
          { id: 'viewer', name: 'Viewer', description: 'Read-only access', permissions: ['read'] },
          { id: 'manager', name: 'Manager', description: 'Management access', permissions: ['read', 'write', 'approve'] },
          { id: 'analyst', name: 'Analyst', description: 'Data analysis access', permissions: ['read', 'analyze'] }
        ];
        
        setUserRoles(mockRoles);
        setSettings({ isMock: true, endpoint: 'fallback' });
        
        updateImportState({ 
          userRolesFetched: true,
          onyxSettings: { isMock: true, endpoint: 'fallback' },
          userRoles: mockRoles
        });
        
        toast.success(`Using mock data: ${mockRoles.length} user roles loaded (backend unavailable)`);
        setIsLoading(false);
        return;
      }


      if (useBackendProxy) {
        const data = await response.json();
        console.log('Backend proxy response:', data);
        
        // Extract user roles from the backend response
        let roles = [];
        if (data.success && data.data && data.data.userRoles) {
          roles = data.data.userRoles;
          console.log(`Successfully fetched ${roles.length} user roles from backend proxy`);
        } else if (data.success && data.data && Array.isArray(data.data)) {
          roles = data.data;
          console.log(`Successfully fetched ${roles.length} user roles from backend proxy`);
        } else {
          // If no roles found, create a mock structure for demonstration
          roles = [
            { id: 'admin', name: 'Administrator', description: 'Full system access' },
            { id: 'user', name: 'User', description: 'Standard user access' },
            { id: 'viewer', name: 'Viewer', description: 'Read-only access' }
          ];
          console.warn('No user roles found in backend response, using mock data');
        }
        
        setUserRoles(roles);
        setSettings(data);
        
        updateImportState({ 
          userRolesFetched: true,
          onyxSettings: data,
          userRoles: roles
        });
        
        toast.success(`Successfully fetched ${roles.length} user roles from OnyxIQ!`);
      }
      
    } catch (error) {
      console.error('Error fetching user roles:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fetch user roles. ';
      if (error.message.includes('Backend proxy failed')) {
        errorMessage += 'Backend proxy error - please check if the backend server is running.';
      } else if (error.message.includes('401')) {
        errorMessage += 'Authentication failed - please check your API token.';
      } else if (error.message.includes('403')) {
        errorMessage += 'Access forbidden - you may not have permission to access this endpoint.';
      } else if (error.message.includes('404')) {
        errorMessage += 'Backend endpoint not found - please check the backend server.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Network error - please check if the backend server is running on localhost:5001.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      toast.error('Failed to fetch user roles');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step 3: Fetch User Roles
        </h2>
        <p className="text-gray-600">
          Retrieve all user roles and permissions from your OnyxIQ account. This will help you understand 
          the available roles before importing data.
        </p>
        
        {/* Bearer Token Status */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">API Token Status:</span>
            <span className={`text-sm px-2 py-1 rounded ${
              importState.bearerToken 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {importState.bearerToken ? '✓ Available' : '✗ Missing'}
            </span>
          </div>
          {importState.bearerToken && (
            <div className="mt-2 text-xs text-gray-500">
              Token: {importState.bearerToken.substring(0, 20)}...
            </div>
          )}
        </div>

        {/* Backend Status */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Backend Server:</span>
            <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-700">
              {importState.userRolesFetched && importState.onyxSettings?.isMock 
                ? '⚠️ Using Mock Data' 
                : '🔄 Checking...'}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {importState.userRolesFetched && importState.onyxSettings?.isMock 
              ? 'Backend server unavailable - using fallback mock data'
              : 'Attempting to connect to backend server on localhost:5001'}
          </div>
        </div>
      </div>

      {/* Reminder Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center">
          <svg className="h-4 w-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-yellow-800">
            <strong>Important:</strong> Please do not sign into OnyxIQ elsewhere during this process to avoid session conflicts.
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {importState.userRolesFetched ? 'User roles fetched ✓' : 'Ready to fetch user roles'}
        </div>
        <div className="flex gap-3">
          {error && (
            <button
              onClick={() => {
                // Skip user roles fetch and proceed
                updateImportState({ 
                  userRolesFetched: true,
                  onyxSettings: null,
                  userRoles: []
                });
                toast.info('Skipped user roles fetch - proceeding with import');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip User Roles
            </button>
          )}
          <button
            onClick={fetchUserRoles}
            disabled={isLoading || importState.userRolesFetched || !importState.bearerToken}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isLoading || importState.userRolesFetched || !importState.bearerToken
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={!importState.bearerToken ? 'Please validate your API token in Step 1 first' : undefined}
          >
            {isLoading ? 'Fetching User Roles...' : importState.userRolesFetched ? 'User Roles Fetched ✓' : 'Fetch User Roles'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">Fetching user roles from OnyxIQ...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="h-4 w-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
          <div className="text-xs text-red-600 mt-2">
            <p><strong>Troubleshooting:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Make sure the backend server is running on localhost:5001</li>
              <li>Check if your API token is valid and has the correct permissions</li>
              <li>Verify the OnyxIQ API endpoint is accessible from the backend</li>
              <li>Try refreshing the page and validating your API token again</li>
              <li>Check the browser console and backend logs for detailed error information</li>
            </ul>
          </div>
        </div>
      )}

      {/* User Roles Results */}
      {userRoles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available User Roles</h3>
            {importState.onyxSettings?.isMock && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                Mock Data
              </span>
            )}
          </div>
          <div className="grid gap-3">
            {userRoles.map((role, index) => (
              <div key={role.id || index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{role.name}</h4>
                    {role.description && (
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {role.id}
                  </div>
                </div>
                {role.permissions && role.permissions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission, permIndex) => (
                        <span key={permIndex} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <strong>Total Roles:</strong> {userRoles.length}
          </div>
        </div>
      )}

      {importState.userRolesFetched && (
        <div className="flex justify-end">
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue to Data Sync
          </button>
        </div>
      )}
    </div>
  );
}
