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

export default function Kiosk() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [toast, setToast] = useState<{ kind: 'pass' | 'cooldown' | 'out' | 'error'; message: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ message: string; details: string } | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
          
          if (result.type === 'pass') {
            const message = `Pass redeemed successfully!`;
            const details = `${result.remaining}/${result.planSize} visits remaining`;
            
            setSuccessData({ message, details });
            setShowSuccess(true);
            addLog(`Pass redeemed: ${result.remaining}/${result.planSize} remaining`, 'success');
            
            setTimeout(() => setShowSuccess(false), 3000);
          } else {
            setToast({ kind: 'pass', message: result.message });
            addLog(`Drop-in payment: ${result.message}`, 'success');
            setTimeout(() => setToast(null), 3000);
          }
        } else {
          beep(false);
          const kind = result.code === 'COOLDOWN' ? 'cooldown' : 
                      result.code === 'EXPIRED' ? 'out' : 'error';
          setToast({ kind, message: result.message });
          addLog(`Error: ${result.message}`, 'error');
          setTimeout(() => setToast(null), 3000);
        }
      } catch (error) {
        beep(false);
        const message = 'Network error';
        setToast({ kind: 'error', message });
        addLog(`Network error: ${error}`, 'error');
        setTimeout(() => setToast(null), 3000);
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

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Swimming Pass Scanner</h1>
        <p className={styles.subtitle}>Scan your QR code to check in</p>
      </div>

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
          </div>
          
          <div className={styles.prompt}>
            {cameraReady ? 'Position QR code in the frame' : 'Starting camera...'}
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

      <div className={styles.bottomPanel}>
        <button 
          onClick={() => setShowLogs(!showLogs)}
          className={styles.logToggle}
        >
          {showLogs ? 'Hide' : 'Show'} Activity ({logs.length})
        </button>
      </div>

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
    </div>
  );
}