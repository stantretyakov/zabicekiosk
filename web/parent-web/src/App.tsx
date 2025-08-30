import React, { useEffect, useState } from 'react';
import PassCard, { PassData, PromoContent } from './components/PassCard';
import LoadingCard from './components/LoadingCard';
import ErrorCard from './components/ErrorCard';
import { getMockDataByToken, getRandomMockData } from './lib/mockData';
import './App.css';

export default function App() {
  const [passData, setPassData] = useState<PassData | null>(null);
  const [promoContent, setPromoContent] = useState<PromoContent[]>([]);
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
          
          // Load mock promo content
          const mockPromo: PromoContent[] = [
            {
              id: '1',
              title: 'New Swimming Schedule',
              message: 'We have added new morning sessions starting from Monday! Book your spot now.',
              type: 'announcement',
              active: true,
              priority: 1,
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              targetAudience: 'all'
            },
            {
              id: '2',
              title: 'Special Discount',
              message: '20% off on all 10-session passes this month! Limited time offer.',
              type: 'promotion',
              active: true,
              priority: 2,
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              targetAudience: 'all'
            },
            {
              id: '3',
              title: 'Pass Renewal Reminder',
              message: 'Your pass is expiring soon. Renew now to continue enjoying our services!',
              type: 'info',
              active: true,
              priority: 3,
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
              targetAudience: 'expiring'
            }
          ];
          
          setPromoContent(mockPromo);
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
          childName: data.childName || 'Unknown Child',
          planSize: data.planSize || 1,
          used: data.used || 0,
          remaining: data.remaining || 0,
          expiresAt: data.expiresAt,
          token: token,
          passType: data.planSize > 1 ? 'subscription' : 'single',
          lastVisit: data.lastVisit,
        };
        
        setPassData(transformedData);
        
        // TODO: Load promo content from API
        // const promoResponse = await fetch('/api/v1/content/active');
        // const promoData = await promoResponse.json();
        // setPromoContent(promoData.items);
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
      <PassCard data={passData} promoContent={promoContent} />
      {isDev && (
        <div className="dev-info">
          <p>🚧 Development Mode - Using Mock Data</p>
          <p>Token: {token || 'No token (showing random data)'}</p>
        </div>
      )}
    </div>
  );
}
