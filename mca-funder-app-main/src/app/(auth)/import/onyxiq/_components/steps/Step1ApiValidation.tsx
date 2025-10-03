'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Step1ApiValidationProps {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export default function Step1ApiValidation({ 
  importState, 
  updateImportState, 
  nextStep 
}: Step1ApiValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');


  const validateApiToken = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your OnyxIQ email and password');
      return;
    }

    setIsValidating(true);
    setProgress(0);
    setProgressText('Logging in and obtaining API key...');
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          const newProgress = prev + Math.random() * 10;
          return Math.min(newProgress, 90);
        }
        return prev;
      });
    }, 500);

    // Update progress text based on progress
    const textInterval = setInterval(() => {
      setProgressText(prev => {
        if (progress < 20) return 'Logging in and obtaining API key...';
        if (progress < 40) return 'Navigating to OnyxIQ...';
        if (progress < 60) return 'Entering credentials...';
        if (progress < 80) return 'Submitting login form...';
        if (progress < 95) return 'Extracting API token...';
        return 'Finalizing login...';
      });
    }, 1000);
    
    try {
      // Call the automated login endpoint
      const response = await fetch('http://localhost:5001/api/v1/onyx/auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProgress(100);
        setProgressText('Login successful!');
        
        updateImportState({ 
          bearerToken: result.bearerToken,
          apiValidated: true 
        });
        toast.success('Successfully logged in and obtained API token!');
        
        // Small delay to show completion
        setTimeout(() => {
          nextStep();
        }, 1000);
      } else {
        toast.error(result.message || 'Failed to login to OnyxIQ. Please check your credentials.');
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      toast.error('Failed to connect to OnyxIQ. Please try again.');
    } finally {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      setIsValidating(false);
      setProgress(0);
      setProgressText('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Login to OnyxIQ
        </h2>
        <p className="text-gray-600">
          Enter your OnyxIQ credentials to automatically obtain your API token.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            OnyxIQ Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your OnyxIQ email address..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            OnyxIQ Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your OnyxIQ password..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            We'll automatically log you in and obtain your API token securely.
          </p>
        </div>

        {/* Progress Bar */}
        {isValidating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-800">Automated Login in Progress</h3>
              <span className="text-sm text-blue-600 font-medium">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
              <div 
                className="progress-bar bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">{progressText}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={validateApiToken}
            disabled={!email.trim() || !password.trim() || isValidating}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? 'Logging in...' : 'Login & Get Token'}
          </button>
        </div>
      </div>
    </div>
  );
}
