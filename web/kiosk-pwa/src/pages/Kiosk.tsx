import React, { useEffect, useRef, useState } from 'react';
import { scanStream } from '../lib/barcode';
import { redeem } from '../lib/api';
import beep from '../lib/beep';
import Toast from '../components/Toast';
import styles from './Kiosk.module.css';

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PromoContent {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'promotion' | 'announcement' | 'warning';
  active: boolean;
  priority: number;
  createdAt: string;
  expiresAt?: string;
  targetAudience: 'all' | 'active' | 'expiring';
}

type ScannerPosition = 'left' | 'right' | 'top';

export default function Kiosk() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [toast, setToast] = useState<{ kind: 'pass' | 'cooldown' | 'out' | 'error'; message: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ message: string; details: string } | null>(null);
  const [flashEffect, setFlashEffect] = useState<'success' | 'error' | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [scannerPosition, setScannerPosition] = useState<ScannerPosition>('left');
  const [showSettings, setShowSettings] = useState(false);
  const [promoContent, setPromoContent] = useState<PromoContent[]>([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadPromoContent();
    // Auto-rotate promo content every 10 seconds
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => 
        promoContent.length > 0 ? (prev + 1) % promoContent.length : 0
      );
    }, 10000);
    
    return () => clearInterval(interval);
  }, [promoContent.length]);

  const loadPromoContent = async () => {
    try {
      // In dev mode, use mock data
      if (import.meta.env.DEV) {
        const mockContent: PromoContent[] = [
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
            title: 'Pool Maintenance',
            message: 'Pool will be closed for maintenance on Sunday from 8-10 AM.',
            type: 'warning',
            active: true,
            priority: 3,
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            targetAudience: 'all'
          }
        ];
        
        // Filter active content and sort by priority
        const activeContent = mockContent
          .filter(content => {
            if (!content.active) return false;
            if (content.expiresAt && new Date(content.expiresAt) < new Date()) return false;
            return true;
          })
          .sort((a, b) => a.priority - b.priority);
        
        setPromoContent(activeContent);
        return;
      }
      
      // TODO: Load from API
      // const response = await fetch('/api/v1/content/active');
      // const data = await response.json();
      // setPromoContent(data.items);
    } catch (error) {
      console.error('Failed to load promo content:', error);
      addLog('Failed to load promotional content', 'error');
    }
  };

  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev.slice(0, 9)]);
  };

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          addLog(`Camera started (${facingMode})`, 'success');
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      addLog('Failed to start camera', 'error');
      setCameraReady(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCameraReady(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  useEffect(() => {
    if (!videoRef.current || !cameraReady) return;

    const cleanup = scanStream(videoRef.current, async (token) => {
      try {
        addLog(`Scanning token: ${token.slice(0, 8)}...`, 'info');
        const result = await redeem({ token });
        
        if (result.status === 'ok') {
          beep(true);
          
          // Trigger success flash effect
          setFlashEffect('success');
          setTimeout(() => setFlashEffect(null), 800);
          
          if (result.type === 'pass') {
            const message = `Pass redeemed successfully!`;
            const details = `${result.remaining}/${result.planSize} visits remaining`;
            
            setSuccessData({ message, details });
            setShowSuccess(true);
            addLog(`Pass redeemed: ${result.remaining}/${result.planSize} remaining`, 'success');
            
            setTimeout(() => setShowSuccess(false), 3000);
          } else {
            setToast({ kind: 'pass', message: `${result.message} - Drop-in payment processed` });
            addLog(`Drop-in payment: ${result.message}`, 'success');
            setTimeout(() => setToast(null), 4000);
          }
        } else {
          beep(false);
          
          // Trigger error flash effect
          setFlashEffect('error');
          setTimeout(() => setFlashEffect(null), 1000);
          
          const kind = result.code === 'COOLDOWN' ? 'cooldown' : 
                      result.code === 'EXPIRED' ? 'out' : 'error';
          
          // Enhanced error messages with admin contact suggestion
          let enhancedMessage = result.message;
          if (result.code === 'INVALID_TOKEN') {
            enhancedMessage = `${result.message}. Please contact the administrator for assistance.`;
          } else if (result.code === 'EXPIRED') {
            enhancedMessage = `${result.message}. Please renew your pass or contact the administrator.`;
          } else if (kind === 'error') {
            enhancedMessage = `${result.message}. If this persists, please contact the administrator.`;
          }
          
          setToast({ kind, message: enhancedMessage });
          addLog(`Error: ${result.message}`, 'error');
          
          // Longer timeout for errors to give users time to read
          const errorTimeout = kind === 'error' ? 6000 : 4000;
          setTimeout(() => setToast(null), errorTimeout);
        }
      } catch (error) {
        beep(false);
        
        // Trigger error flash effect
        setFlashEffect('error');
        setTimeout(() => setFlashEffect(null), 1000);
        
        const message = 'Network error. Please check your connection or contact the administrator.';
        setToast({ kind: 'error', message });
        addLog(`Network error: ${error}`, 'error');
        setTimeout(() => setToast(null), 6000);
      }
    });

    return cleanup;
  }, [cameraReady]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTypeIcon = (type: PromoContent['type']) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'promotion': return '🎉';
      case 'announcement': return '📢';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getTypeColor = (type: PromoContent['type']) => {
    switch (type) {
      case 'info': return 'var(--accent-2)';
      case 'promotion': return 'var(--accent)';
      case 'announcement': return 'var(--warn)';
      case 'warning': return 'var(--error)';
      default: return 'var(--accent-2)';
    }
  };

  return (
    <div className={`${styles.root} ${styles[`position${scannerPosition.charAt(0).toUpperCase() + scannerPosition.slice(1)}`]} ${flashEffect ? styles[`flash${flashEffect.charAt(0).toUpperCase() + flashEffect.slice(1)}`] : ''}`}>
      {/* Flash overlay for visual feedback */}
      {flashEffect && (
        <div className={`${styles.flashOverlay} ${styles[flashEffect]}`} />
      )}
      
      <div className={styles.header}>
        <h1 className={styles.title}>Swimming Pass Scanner</h1>
        <p className={styles.subtitle}>Scan your QR code to check in</p>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.scannerSection}>
          <div className={styles.cameraContainer}>
            <div className={styles.cameraWrap}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              
              <div className={styles.scanBox} />
              
              <div className={`${styles.statusIndicator} ${isOnline ? styles.online : styles.offline}`}>
                <div className={`${styles.statusDot} ${!isOnline ? styles.offline : ''}`} />
                {isOnline ? 'Online' : 'Offline'}
              </div>
              
              <div className={styles.controls}>
                <button 
                  onClick={switchCamera}
                  className={styles.switchButton}
                  title="Switch camera"
                >
                  🔄
                </button>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={styles.settingsButton}
                  title="Scanner position settings"
                >
                  ⚙️
                </button>
              </div>
              
              <div className={styles.prompt}>
                {cameraReady ? 'Position QR code in the frame' : 'Starting camera...'}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contentSection}>
          {showSettings && (
            <div className={styles.settingsPanel}>
              <h3 className={styles.settingsTitle}>Scanner Position</h3>
              <div className={styles.positionButtons}>
                <button
                  onClick={() => setScannerPosition('left')}
                  className={`${styles.positionButton} ${scannerPosition === 'left' ? styles.active : ''}`}
                >
                  <span className={styles.positionIcon}>⬅️</span>
                  Left
                </button>
                <button
                  onClick={() => setScannerPosition('right')}
                  className={`${styles.positionButton} ${scannerPosition === 'right' ? styles.active : ''}`}
                >
                  <span className={styles.positionIcon}>➡️</span>
                  Right
                </button>
                <button
                  onClick={() => setScannerPosition('top')}
                  className={`${styles.positionButton} ${scannerPosition === 'top' ? styles.active : ''}`}
                >
                  <span className={styles.positionIcon}>⬆️</span>
                  Top
                </button>
              </div>
            </div>
          )}

          {/* Promo Content Frame */}
          {promoContent.length > 0 && (
            <div className={styles.promoFrame}>
              <div className={styles.promoHeader}>
                <span className={styles.promoIcon}>📢</span>
                <span className={styles.promoTitle}>News & Updates</span>
                {promoContent.length > 1 && (
                  <div className={styles.promoIndicators}>
                    {promoContent.map((_, index) => (
                      <div
                        key={index}
                        className={`${styles.promoIndicator} ${
                          index === currentPromoIndex ? styles.active : ''
                        }`}
                        onClick={() => setCurrentPromoIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {promoContent[currentPromoIndex] && (
                <div className={styles.promoContent}>
                  <div className={styles.promoContentHeader}>
                    <div 
                      className={styles.promoTypeIcon}
                      style={{ color: getTypeColor(promoContent[currentPromoIndex].type) }}
                    >
                      {getTypeIcon(promoContent[currentPromoIndex].type)}
                    </div>
                    <h3 className={styles.promoContentTitle}>
                      {promoContent[currentPromoIndex].title}
                    </h3>
                  </div>
                  <p className={styles.promoContentMessage}>
                    {promoContent[currentPromoIndex].message}
                  </p>
                  {promoContent[currentPromoIndex].expiresAt && (
                    <div className={styles.promoExpiry}>
                      Valid until: {new Date(promoContent[currentPromoIndex].expiresAt!).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showLogs && (
            <div className={styles.history}>
              <h3 className={styles.historyTitle}>Recent Activity</h3>
              <ul className={styles.historyList}>
                {logs.map((log) => (
                  <li key={log.id} className={styles.historyItem}>
                    <div className={styles.historyText}>
                      <span className={`${styles.logType} ${styles[log.type]}`}>
                        {log.type === 'success' ? '✅' : log.type === 'error' ? '❌' : 'ℹ️'}
                      </span>
                      {log.message}
                    </div>
                    <div className={styles.historyTime}>
                      {formatTime(log.timestamp)}
                    </div>
                  </li>
                ))}
                {logs.length === 0 && (
                  <li className={styles.historyItem}>
                    <div className={styles.historyText}>No activity yet</div>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className={styles.bottomPanel}>
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className={styles.logToggle}
            >
              {showLogs ? 'Hide' : 'Show'} Activity ({logs.length})
            </button>
          </div>
        </div>
      </div>

      {showSuccess && successData && (
        <div className={styles.successOverlay}>
          <div className={styles.successIcon}>✅</div>
          <div className={styles.successMessage}>{successData.message}</div>
          <div className={styles.successDetails}>{successData.details}</div>
        </div>
      )}

      {toast && <Toast kind={toast.kind} message={toast.message} />}
    </div>
  );
}