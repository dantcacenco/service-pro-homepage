'use client';

import { useEffect, useState } from 'react';

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Demo Banner */}
      <div className="bg-blue-600 text-white text-center py-3 px-4 text-sm font-medium shadow-md z-10">
        🎭 Interactive Demo - Explore with sample data • All data is for demonstration purposes only
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading demo...</p>
          </div>
        </div>
      )}

      {/* Iframe - will load the deployed demo */}
      <iframe
        src="https://fairairhc.service-pro.app"
        className={`flex-1 w-full border-0 ${isLoading ? 'hidden' : 'block'}`}
        title="ServicePro+ Demo Dashboard"
        allow="clipboard-write"
      />

      {/* Instructions overlay - remove after demo is deployed */}
      <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-md shadow-lg">
        <p className="text-sm text-yellow-900 font-semibold mb-2">
          ⚠️ Temporary: Showing production dashboard
        </p>
        <p className="text-xs text-yellow-800">
          This iframe currently points to fairairhc.service-pro.app (real data).
          Update the src URL to your deployed demo once ready.
        </p>
      </div>
    </div>
  );
}
