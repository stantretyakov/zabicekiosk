import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './PassCard.module.css';
import { FROG_PNG } from '../assets/frog';

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

export interface PromoContent {
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

interface PassCardProps {
  data: PassData;
  promoContent?: PromoContent[];
}

export default function PassCard({ data, promoContent = [] }: PassCardProps) {
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

  // Filter and sort promo content
  const relevantPromo = promoContent
    .filter(content => {
      if (!content.active) return false;
      if (content.expiresAt && new Date(content.expiresAt) < new Date()) return false;
      
      // Filter by target audience
      if (content.targetAudience === 'active' && data.remaining === 0) return false;
      if (content.targetAudience === 'expiring' && daysUntilExpiry > 14) return false;
      
      return true;
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3); // Show max 3 items

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

      {/* Promo and News Section */}
      {relevantPromo.length > 0 && (
        <div className={styles.promoSection}>
          <h3 className={styles.promoTitle}>
            <span className={styles.promoIcon}>📢</span>
            News & Updates
          </h3>
          <div className={styles.promoList}>
            {relevantPromo.map((content) => (
              <div key={content.id} className={styles.promoItem}>
                <div className={styles.promoHeader}>
                  <div 
                    className={styles.promoTypeIcon}
                    style={{ color: getTypeColor(content.type) }}
                  >
                    {getTypeIcon(content.type)}
                  </div>
                  <h4 className={styles.promoItemTitle}>{content.title}</h4>
                  {content.type === 'promotion' && (
                    <div className={styles.promoBadge}>Special</div>
                  )}
                </div>
                <p className={styles.promoMessage}>{content.message}</p>
                {content.expiresAt && (
                  <div className={styles.promoExpiry}>
                    Valid until {formatDate(content.expiresAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={styles.qrSection}>
        <h3 className={styles.qrTitle}>Scan at Kiosk</h3>
        <div className={styles.qrContainer}>
          <QRCodeCanvas
            value={data.token}
            size={180}
            level="M"
            includeMargin={false}
            imageSettings={{
              src: FROG_PNG,
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

      {/* Contact Section */}
      <div className={styles.contactSection}>
        <h3 className={styles.contactTitle}>
          <span className={styles.contactIcon}>💬</span>
          Need Help?
        </h3>
        <p className={styles.contactDescription}>
          Have questions about your pass or need assistance?
        </p>
        <a
          href="https://t.me/Tretiakovaanny"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.telegramButton}
        >
          <span className={styles.telegramIcon}>📱</span>
          <span className={styles.telegramText}>
            <span className={styles.telegramLabel}>Contact Admin</span>
            <span className={styles.telegramHandle}>@Tretiakovaanny</span>
          </span>
          <span className={styles.telegramArrow}>→</span>
        </a>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Swimming Pass • Valid until {formatDate(data.expiresAt)}
        </p>
      </div>
    </div>
  );
}