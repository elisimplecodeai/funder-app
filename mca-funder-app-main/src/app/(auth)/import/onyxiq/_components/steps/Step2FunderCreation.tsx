'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Step2FunderCreationProps {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export default function Step2FunderCreation({ 
  importState, 
  updateImportState, 
  nextStep 
}: Step2FunderCreationProps) {
  const [funders, setFunders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFunderName, setNewFunderName] = useState('');

  useEffect(() => {
    fetchFunders();
  }, []);

  const fetchFunders = async () => {
    try {
      // Fetch funders from OnyxIQ via MCA CRM API
      const response = await fetch('http://localhost:5001/api/v1/onyx/funders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch funders from OnyxIQ');
      }

      const result = await response.json();
      setFunders(result.data || []);
    } catch (error) {
      console.error('Error fetching funders:', error);
      toast.error('Failed to load funders from OnyxIQ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFunderSelect = (funder: any) => {
    updateImportState({ selectedFunder: funder });
    toast.success(`Selected funder: ${funder.name}`);
    nextStep();
  };

  const handleCreateFunder = async () => {
    if (!newFunderName.trim()) {
      toast.error('Please enter a funder name');
      return;
    }

    setIsCreating(true);
    
    try {
      // This would typically create a funder via your MCA CRM API
      const newFunder = {
        id: Date.now().toString(),
        name: newFunderName,
        email: `${newFunderName.toLowerCase().replace(/\s+/g, '')}@example.com`
      };
      
      setFunders(prev => [...prev, newFunder]);
      updateImportState({ selectedFunder: newFunder, funderCreated: true });
      toast.success('Funder created successfully!');
      nextStep();
    } catch (error) {
      console.error('Error creating funder:', error);
      toast.error('Failed to create funder');
    } finally {
      setIsCreating(false);
      setShowCreateForm(false);
      setNewFunderName('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading funders from OnyxIQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select or Create Funder
        </h2>
        <p className="text-gray-600">
          Choose which funder will be associated with the imported OnyxIQ data, or create a new one.
        </p>
      </div>

      <div className="space-y-4">
        {/* Existing Funders */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">OnyxIQ Funders</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select a funder from your OnyxIQ system to associate with the imported data.
          </p>
          <div className="space-y-2">
            {funders.map((funder) => (
              <div
                key={funder.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleFunderSelect(funder)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{funder.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      funder.type === 'syndicator' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {funder.type === 'syndicator' ? 'Syndicator' : 'ISO'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{funder.email}</p>
                  {funder.phone && (
                    <p className="text-xs text-gray-500">{funder.phone}</p>
                  )}
                </div>
                <div className="text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create New Funder */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Funder
          </button>

          {showCreateForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label htmlFor="funderName" className="block text-sm font-medium text-gray-700 mb-2">
                    Funder Name
                  </label>
                  <input
                    type="text"
                    id="funderName"
                    value={newFunderName}
                    onChange={(e) => setNewFunderName(e.target.value)}
                    placeholder="Enter funder name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFunder}
                    disabled={!newFunderName.trim() || isCreating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? 'Creating...' : 'Create Funder'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
