import React, { useEffect, useState } from 'react';
import PassCard, { PassData } from './components/PassCard';
import LoadingCard from './components/LoadingCard';
import ErrorCard from './components/ErrorCard';
import { getMockDataByToken, getRandomMockData } from './lib/mockData';
import './App.css';

export default function App() {
  const [passData, setPassData] = useState<PassData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    const loadPassData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // In development mode, use mock data
        if (isDev) {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!token) {
            // If no token provided in dev, show random mock data
            setPassData(getRandomMockData());
          } else {
            // Try to find mock data by token, fallback to random
            const mockData = getMockDataByToken(token);
            if (mockData) {
              setPassData(mockData);
            } else {
              setPassData(getRandomMockData());
            }
          }
          return;
        }
        
        // Production mode - fetch from API
    if (!token) {
          throw new Error('Missing token parameter');
        }
        
        const response = await fetch(`/api/v1/card?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
          throw new Error(`Failed to load pass data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform API response to match our PassData interface
        const transformedData: PassData = {
          name: data.name || 'Unknown Client',
          childName: data.childName || data.name || 'Unknown Child',
          planSize: data.planSize || 1,
          used: data.used || 0,
          remaining: data.remaining || 0,
          expiresAt: data.expiresAt,
          token: token,
          passType: data.planSize > 1 ? 'subscription' : 'single',
          lastVisit: data.lastVisit,
        };
        
        setPassData(transformedData);
      } catch (err: any) {
        console.error('Error loading pass data:', err);
        setError(err.message || 'Failed to load pass data');
      } finally {
        setLoading(false);
      }
    };
    
    loadPassData();
  }, [token, isDev]);

  if (loading) {
    return <LoadingCard />;
  }
  
  if (error) {
    return <ErrorCard message={error} />;
  }
  
  if (!passData) {
    return <ErrorCard message="No pass data available" />;
  }

  return (
    <div className="app">
      <PassCard data={passData} />
      {isDev && (
        <div className="dev-info">
          <p>🚧 Development Mode - Using Mock Data</p>
          <p>Token: {token || 'No token (showing random data)'}</p>
        </div>
      )}
    </div>
  );
}
