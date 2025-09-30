'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Step1ApiValidation from './steps/Step1ApiValidation';
import Step3SyncClients from './steps/Step3SyncClients';
import Step4SyncApplications from './steps/Step4SyncApplications';
import Step5SyncFundings from './steps/Step5SyncFundings';
import Step6OverallProgress from './steps/Step6OverallProgress';

interface ImportState {
  currentStep: number;
  bearerToken: string;
  selectedFunder: any | null;
  stepData: Record<string, unknown>;
  syncResults: Record<string, unknown>;
  clientsSynced: boolean;
  applicationsSynced: boolean;
  fundingsSynced: boolean;
  apiValidated: boolean;
  funderCreated: boolean;
  allSyncsComplete: boolean;
}

const IMPORT_STEPS = [
  { id: 1, title: 'API Validation', component: Step1ApiValidation },
  { id: 2, title: 'Sync Clients', component: Step3SyncClients },
  { id: 3, title: 'Sync Applications', component: Step4SyncApplications },
  { id: 4, title: 'Sync Fundings', component: Step5SyncFundings },
  { id: 5, title: 'Progress Summary', component: Step6OverallProgress },
];

export default function OnyxIQImportClient() {
  const router = useRouter();
  
  const [importState, setImportState] = useState<ImportState>({
    currentStep: 1,
    bearerToken: '',
    selectedFunder: null,
    stepData: {},
    syncResults: {},
    clientsSynced: false,
    applicationsSynced: false,
    fundingsSynced: false,
    apiValidated: false,
    funderCreated: false,
    allSyncsComplete: false
  });

  const handleBackToImport = () => {
    router.push('/import');
  };

  const updateImportState = (updates: Partial<ImportState>) => {
    setImportState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    // Validate step requirements before allowing navigation
    if (!canProceedToNextStep()) {
      return;
    }
    
    if (importState.currentStep < IMPORT_STEPS.length) {
      setImportState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const canProceedToNextStep = () => {
    switch (importState.currentStep) {
      case 1: // API Validation step
        return importState.apiValidated;
      case 2: // Sync Clients step
        return importState.clientsSynced;
      case 3: // Sync Applications step
        return importState.applicationsSynced;
      case 4: // Sync Fundings step
        return importState.fundingsSynced;
      case 5: // Progress Summary step
        return true; // Final step
      default:
        return true;
    }
  };

  const getStepRequirementMessage = () => {
    switch (importState.currentStep) {
      case 1:
        return 'Please validate your OnyxIQ API token before proceeding';
      case 2:
        return 'Please complete client sync before proceeding';
      case 3:
        return 'Please complete application sync before proceeding';
      case 4:
        return 'Please complete funding sync before proceeding';
      case 5:
        return 'Please complete the current step requirements';
      default:
        return 'Please complete the current step requirements';
    }
  };

  const previousStep = () => {
    if (importState.currentStep > 1) {
      setImportState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const getCurrentStep = () => {
    return IMPORT_STEPS.find(step => step.id === importState.currentStep);
  };

  const currentStep = getCurrentStep();
  const CurrentStepComponent = currentStep?.component;

  return (
    <main className="flex flex-col min-h-screen w-full bg-custom-blue">
      {/* Header */}
      <div className="w-full bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToImport}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Import Options
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-800">
                OnyxIQ Import
              </h1>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Step {importState.currentStep} of {IMPORT_STEPS.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importState.currentStep / IMPORT_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation Breadcrumb */}
      <div className="w-full bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            {IMPORT_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <span 
                  className={`px-2 py-1 rounded ${
                    step.id === importState.currentStep 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : step.id < importState.currentStep 
                        ? 'text-green-600' 
                        : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
                {index < IMPORT_STEPS.length - 1 && (
                  <span className="text-gray-400">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {CurrentStepComponent && (
            <CurrentStepComponent
              importState={importState}
              updateImportState={updateImportState}
              nextStep={nextStep}
              previousStep={previousStep}
            />
          )}
        </div>
      </div>

      {/* Sync Status */}
      {(importState.currentStep >= 2 && importState.currentStep <= 4) && (
        <div className="w-full bg-gray-50 border-t border-b">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${importState.allSyncsComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  Sync Status: {importState.allSyncsComplete ? 'All syncs completed' : 'Syncs in progress'}
                </span>
              </div>
              <div className="flex gap-4 text-xs">
                <span className={`px-2 py-1 rounded ${importState.clientsSynced ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  Clients: {importState.clientsSynced ? 'Synced' : 'Pending'}
                </span>
                <span className={`px-2 py-1 rounded ${importState.applicationsSynced ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  Applications: {importState.applicationsSynced ? 'Synced' : 'Pending'}
                </span>
                <span className={`px-2 py-1 rounded ${importState.fundingsSynced ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  Fundings: {importState.fundingsSynced ? 'Synced' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="w-full bg-white border-t">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={previousStep}
              disabled={importState.currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Previous Step
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {currentStep?.title}
              </span>
              {importState.currentStep === IMPORT_STEPS.length ? (
                <button
                  onClick={handleBackToImport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete Import
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  title={!canProceedToNextStep() ? getStepRequirementMessage() : undefined}
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
