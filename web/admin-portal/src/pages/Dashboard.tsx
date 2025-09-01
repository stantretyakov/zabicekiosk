import React, { useEffect, useState } from 'react';
import { getStats } from '../lib/api';
import type { Stats } from '../types';
import { useTranslation } from '../lib/i18n';
import styles from './Dashboard.module.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  icon: string;
  color: string;
  onClick?: () => void;
  expandable?: boolean;
}

function KpiCard({ title, value, subtitle, trend, trendValue, icon, color, onClick, expandable }: KpiCardProps) {
  return (
    <div 
      className={`${styles.kpiCard} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className={styles.kpiHeader}>
        <div className={styles.kpiIcon} style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </div>
        {expandable && <span className={styles.expandIcon}>→</span>}
      </div>
      
      <div className={styles.kpiContent}>
        <div className={styles.kpiValue}>{value}</div>
        <div className={styles.kpiTitle}>{title}</div>
        {subtitle && <div className={styles.kpiSubtitle}>{subtitle}</div>}
        
        {trend && trendValue && (
          <div className={`${styles.kpiTrend} ${styles[trend]}`}>
            <span className={styles.trendIcon}>
              {trend === 'up' && '↗'}
              {trend === 'down' && '↘'}
              {trend === 'flat' && '→'}
            </span>
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function DetailModal({ title, isOpen, onClose, children }: DetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // In dev mode, use comprehensive mock data
      if (import.meta.env.DEV) {
        const mockStats: Stats = {
          activePasses: 127,
          redeems7d: 89,
          dropInRevenue: 45000,
          expiring14d: 23,
          totalClients: 156,
          activeClients: 134,
          clientRetention: 87.5,
          mrr: 285000,
          grr: 312000,
          visitStats: {
            thisMonth: 342,
            lastMonth: 298,
            growth: 14.8
          },
          revenueBreakdown: {
            passes: 240000,
            dropIns: 45000,
            total: 285000
          },
          passTypeDistribution: [
            { type: '5-Session', count: 34, percentage: 26.8 },
            { type: '10-Session', count: 67, percentage: 52.7 },
            { type: '20-Session', count: 26, percentage: 20.5 }
          ],
          upcomingExpirations: {
            next7Days: 12,
            next14Days: 23,
            next30Days: 41
          },
          redeemsByDay: [
            { date: '2024-01-01', count: 12 },
            { date: '2024-01-02', count: 15 },
            { date: '2024-01-03', count: 18 },
            { date: '2024-01-04', count: 14 },
            { date: '2024-01-05', count: 22 },
            { date: '2024-01-06', count: 19 },
            { date: '2024-01-07', count: 16 }
          ],
          recentRedeems: [
            { id: '1', ts: new Date().toISOString(), kind: 'pass', clientId: 'client1' },
            { id: '2', ts: new Date().toISOString(), kind: 'dropin', clientId: 'client2' }
          ]
        };
        
        setTimeout(() => {
          setStats(mockStats);
          setLoading(false);
        }, 1000);
        return;
      }
      
      // Production API call
      const data = await getStats();
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('dashboardTitle')}</h1>
        <p className={styles.subtitle}>{t('dashboardSubtitle')}</p>
      </div>

      {/* Primary KPIs */}
      <div className={styles.primaryKpis}>
        <KpiCard
          title={t('monthlyRecurringRevenue')}
          value={formatCurrency(stats.mrr)}
          subtitle={t('currentMonth')}
          trend="up"
          trendValue="+12.5%"
          icon="💰"
          color="var(--accent)"
          onClick={() => setActiveModal('revenue')}
          expandable
        />
        
        <KpiCard
          title={t('activeClients')}
          value={stats.activeClients}
          subtitle={`${stats.totalClients} ${t('totalClients').toLowerCase()}`}
          trend="up"
          trendValue="+8"
          icon="👥"
          color="var(--accent-2)"
          onClick={() => setActiveModal('clients')}
          expandable
        />
        
        <KpiCard
          title={t('clientRetention')}
          value={`${stats.clientRetention}%`}
          subtitle="За 3 месяца"
          trend="up"
          trendValue="+2.3%"
          icon="🎯"
          color="var(--ok)"
        />
        
        <KpiCard
          title={t('monthlyVisits')}
          value={stats.visitStats.thisMonth}
          subtitle={t('thisMonth')}
          trend="up"
          trendValue={formatPercentage(stats.visitStats.growth)}
          icon="🏊‍♀️"
          color="var(--warn)"
          onClick={() => setActiveModal('visits')}
          expandable
        />
      </div>

      {/* Secondary KPIs */}
      <div className={styles.secondaryKpis}>
        <KpiCard
          title={t('activePasses')}
          value={stats.activePasses}
          icon="🎫"
          color="var(--accent)"
          onClick={() => setActiveModal('passes')}
          expandable
        />
        
        <KpiCard
          title={t('expiringSoon')}
          value={stats.expiring14d}
          subtitle={t('next14Days')}
          icon="⏰"
          color="var(--error)"
          onClick={() => setActiveModal('expiring')}
          expandable
        />
        
        <KpiCard
          title={t('weeklyVisits')}
          value={stats.redeems7d}
          subtitle="За 7 дней"
          icon="📊"
          color="var(--accent-2)"
        />
        
        <KpiCard
          title={t('dropInRevenue')}
          value={formatCurrency(stats.dropInRevenue)}
          subtitle={t('thisMonth')}
          icon="💳"
          color="var(--warn)"
        />
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>{t('quickActions')}</h2>
        <div className={styles.actionGrid}>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>👤</span>
            <span className={styles.actionText}>{t('addClient')}</span>
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>🎫</span>
            <span className={styles.actionText}>{t('createPass')}</span>
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>📊</span>
            <span className={styles.actionText}>{t('viewReports')}</span>
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>⚙️</span>
            <span className={styles.actionText}>{t('settings')}</span>
          </button>
        </div>
      </div>

      {/* Detail Modals */}
      <DetailModal
        title={t('revenueBreakdown')}
        isOpen={activeModal === 'revenue'}
        onClose={() => setActiveModal(null)}
      >
        <div className={styles.revenueBreakdown}>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>{t('passSales')}</span>
            <span className={styles.breakdownValue}>{formatCurrency(stats.revenueBreakdown.passes)}</span>
            <span className={styles.breakdownPercentage}>
              {((stats.revenueBreakdown.passes / stats.revenueBreakdown.total) * 100).toFixed(1)}%
            </span>
          </div>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>{t('dropInSessions')}</span>
            <span className={styles.breakdownValue}>{formatCurrency(stats.revenueBreakdown.dropIns)}</span>
            <span className={styles.breakdownPercentage}>
              {((stats.revenueBreakdown.dropIns / stats.revenueBreakdown.total) * 100).toFixed(1)}%
            </span>
          </div>
          <div className={`${styles.breakdownItem} ${styles.total}`}>
            <span className={styles.breakdownLabel}>{t('totalRevenue')}</span>
            <span className={styles.breakdownValue}>{formatCurrency(stats.revenueBreakdown.total)}</span>
            <span className={styles.breakdownPercentage}>100%</span>
          </div>
        </div>
      </DetailModal>

      <DetailModal
        title={t('clientOverview')}
        isOpen={activeModal === 'clients'}
        onClose={() => setActiveModal(null)}
      >
        <div className={styles.clientOverview}>
          <div className={styles.clientStat}>
            <span className={styles.clientStatValue}>{stats.totalClients}</span>
            <span className={styles.clientStatLabel}>{t('totalClients')}</span>
          </div>
          <div className={styles.clientStat}>
            <span className={styles.clientStatValue}>{stats.activeClients}</span>
            <span className={styles.clientStatLabel}>{t('activeClients')}</span>
          </div>
          <div className={styles.clientStat}>
            <span className={styles.clientStatValue}>{stats.totalClients - stats.activeClients}</span>
            <span className={styles.clientStatLabel}>{t('inactiveClients')}</span>
          </div>
          <div className={styles.clientStat}>
            <span className={styles.clientStatValue}>{stats.clientRetention}%</span>
            <span className={styles.clientStatLabel}>{t('retentionRate')}</span>
          </div>
        </div>
      </DetailModal>

      <DetailModal
        title={t('passDistribution')}
        isOpen={activeModal === 'passes'}
        onClose={() => setActiveModal(null)}
      >
        <div className={styles.passDistribution}>
          {stats.passTypeDistribution.map((pass, index) => (
            <div key={index} className={styles.passTypeItem}>
              <div className={styles.passTypeHeader}>
                <span className={styles.passTypeName}>{pass.type} Pass</span>
                <span className={styles.passTypeCount}>{pass.count}</span>
              </div>
              <div className={styles.passTypeBar}>
                <div 
                  className={styles.passTypeProgress}
                  style={{ width: `${pass.percentage}%` }}
                />
              </div>
              <span className={styles.passTypePercentage}>{pass.percentage}%</span>
            </div>
          ))}
        </div>
      </DetailModal>

      <DetailModal
        title={t('upcomingExpirations')}
        isOpen={activeModal === 'expiring'}
        onClose={() => setActiveModal(null)}
      >
        <div className={styles.expirationBreakdown}>
          <div className={styles.expirationItem}>
            <span className={styles.expirationPeriod}>{t('next7Days')}</span>
            <span className={styles.expirationCount}>{stats.upcomingExpirations.next7Days}</span>
            <span className={styles.expirationUrgency}>{t('highPriority')}</span>
          </div>
          <div className={styles.expirationItem}>
            <span className={styles.expirationPeriod}>{t('next14Days')}</span>
            <span className={styles.expirationCount}>{stats.upcomingExpirations.next14Days}</span>
            <span className={styles.expirationUrgency}>{t('mediumPriority')}</span>
          </div>
          <div className={styles.expirationItem}>
            <span className={styles.expirationPeriod}>{t('next30Days')}</span>
            <span className={styles.expirationCount}>{stats.upcomingExpirations.next30Days}</span>
            <span className={styles.expirationUrgency}>{t('lowPriority')}</span>
          </div>
        </div>
      </DetailModal>

      <DetailModal
        title={t('visitStatistics')}
        isOpen={activeModal === 'visits'}
        onClose={() => setActiveModal(null)}
      >
        <div className={styles.visitStats}>
          <div className={styles.visitComparison}>
            <div className={styles.visitMonth}>
              <span className={styles.visitValue}>{stats.visitStats.thisMonth}</span>
              <span className={styles.visitLabel}>{t('thisMonth')}</span>
            </div>
            <div className={styles.visitGrowth}>
              <span className={`${styles.growthValue} ${styles.positive}`}>
                {formatPercentage(stats.visitStats.growth)}
              </span>
              <span className={styles.growthLabel}>{t('growth')}</span>
            </div>
            <div className={styles.visitMonth}>
              <span className={styles.visitValue}>{stats.visitStats.lastMonth}</span>
              <span className={styles.visitLabel}>{t('lastMonth')}</span>
            </div>
          </div>
        </div>
      </DetailModal>
    </div>
  );
}