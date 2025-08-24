import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './PassCard.module.css';

export interface PassData {
  name: string;
  childName: string;
  planSize: number;
  used: number;
  remaining: number;
  expiresAt: string;
  token: string;
  passType: 'subscription' | 'single';
  lastVisit?: string;
}

interface PassCardProps {
  data: PassData;
}

export default function PassCard({ data }: PassCardProps) {
  const progressPercentage = data.planSize > 0 ? (data.remaining / data.planSize) * 100 : 0;
  const expiryDate = new Date(data.expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const getStatusInfo = () => {
    if (daysUntilExpiry < 0) {
      return { status: 'expired', text: 'Expired', className: styles.expired };
    }
    if (daysUntilExpiry <= 7) {
      return { status: 'expiring', text: 'Expiring Soon', className: styles.expiring };
    }
    if (data.remaining === 0) {
      return { status: 'expired', text: 'No Visits Left', className: styles.expired };
    }
    return { status: 'active', text: 'Active', className: styles.active };
  };

  const statusInfo = getStatusInfo();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExpiryClassName = () => {
    if (daysUntilExpiry < 0) return styles.expired;
    if (daysUntilExpiry <= 7) return styles.expiringSoon;
    return '';
  };

  return (
    <div className={styles.card}>
      <div className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.text}
      </div>

      <div className={styles.header}>
        <div className={styles.avatar}>
          {getInitials(data.name)}
        </div>
        <h1 className={styles.clientName}>{data.name}</h1>
        <p className={styles.childName}>
          <span>👶</span>
          {data.childName}
        </p>
      </div>

      <div className={styles.passInfo}>
        <h2 className={styles.passTitle}>
          {data.passType === 'subscription' ? 'Swimming Pass' : 'Single Visit'}
        </h2>
        
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressText}>
              {data.remaining} / {data.planSize} visits
            </span>
            <span className={styles.progressPercentage}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Plan Size</div>
            <div className={styles.detailValue}>{data.planSize}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Used</div>
            <div className={styles.detailValue}>{data.used}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Expires</div>
            <div className={`${styles.detailValue} ${styles.expiryDate} ${getExpiryClassName()}`}>
              {formatDate(data.expiresAt)}
            </div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Days Left</div>
            <div className={`${styles.detailValue} ${getExpiryClassName()}`}>
              {daysUntilExpiry > 0 ? daysUntilExpiry : 0}
            </div>
          </div>
        </div>

        {data.lastVisit && (
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Last Visit</div>
            <div className={styles.detailValue}>{formatDate(data.lastVisit)}</div>
          </div>
        )}
      </div>

      <div className={styles.qrSection}>
        <h3 className={styles.qrTitle}>Scan at Kiosk</h3>
        <div className={styles.qrContainer}>
          <QRCodeCanvas
            value={data.token}
            size={180}
            level="M"
            includeMargin={false}
            imageSettings={{
              src: '/frog.svg',
              height: 32,
              width: 32,
              excavate: true,
            }}
          />
        </div>
        <p className={styles.qrHint}>
          Show this QR code at the swimming facility to check in
        </p>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Swimming Pass • Valid until {formatDate(data.expiresAt)}
        </p>
      </div>
    </div>
  );
}