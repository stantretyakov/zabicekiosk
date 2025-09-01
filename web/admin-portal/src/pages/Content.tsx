import React, { useState, useEffect } from 'react';
import { useTranslation } from '../lib/i18n';
import styles from './Content.module.css';

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

export default function Content() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<PromoContent | null>(null);

  // Content state
  const [promoContents, setPromoContents] = useState<PromoContent[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as PromoContent['type'],
    priority: 1,
    expiresAt: '',
    targetAudience: 'all' as PromoContent['targetAudience']
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Mock data for development
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
            targetAudience: 'active'
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
          },
          {
            id: '4',
            title: 'Renewal Reminder',
            message: 'Your pass is expiring soon. Renew now to continue enjoying our services!',
            type: 'info',
            active: false,
            priority: 4,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            targetAudience: 'expiring'
          }
        ];
        
        setPromoContents(mockContent);
        setTimeout(() => setLoading(false), 800);
        return;
      }
      
      // TODO: Load from API
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
      setLoading(false);
    }
  };

  const saveContent = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const contentData: Omit<PromoContent, 'id' | 'createdAt'> = {
        ...formData,
        active: true,
      };

      if (editingContent) {
        // Update existing content
        setPromoContents(contents => 
          contents.map(content => 
            content.id === editingContent.id 
              ? { ...content, ...contentData }
              : content
          )
        );
      } else {
        // Create new content
        const newContent: PromoContent = {
          ...contentData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        setPromoContents(contents => [newContent, ...contents]);
      }
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: 1,
        expiresAt: '',
        targetAudience: 'all'
      });
      setShowForm(false);
      setEditingContent(null);
      
      setSuccess('Content saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const toggleContentStatus = async (id: string) => {
    setPromoContents(contents => 
      contents.map(content => 
        content.id === id 
          ? { ...content, active: !content.active }
          : content
      )
    );
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    setPromoContents(contents => contents.filter(content => content.id !== id));
  };

  const startEdit = (content: PromoContent) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      message: content.message,
      type: content.type,
      priority: content.priority,
      expiresAt: content.expiresAt ? content.expiresAt.split('T')[0] : '',
      targetAudience: content.targetAudience
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingContent(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 1,
      expiresAt: '',
      targetAudience: 'all'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} />
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('contentTitle')}</h1>
        <p className={styles.subtitle}>{t('contentSubtitle')}</p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✅</span>
          {success}
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{promoContents.filter(c => c.active).length}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{promoContents.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className={styles.addButton}
          type="button"
        >
          <span className={styles.addIcon}>+</span>
          {t('createContent')}
        </button>
      </div>

      {showForm && (
        <div className={styles.formModal}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {editingContent ? 'Edit Content' : 'Create New Content'}
              </h2>
              <button
                onClick={cancelEdit}
                className={styles.closeButton}
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveContent(); }} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('title')}</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={styles.input}
                    placeholder="Введите заголовок контента"
                    required
                    maxLength={50}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PromoContent['type'] }))}
                    className={styles.select}
                  >
                    <option value="info">{t('information')}</option>
                    <option value="promotion">{t('promotion')}</option>
                    <option value="announcement">{t('announcement')}</option>
                    <option value="warning">{t('warning')}</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('priority')}</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className={styles.select}
                  >
                    <option value={1}>{t('high')}</option>
                    <option value={2}>{t('medium')}</option>
                    <option value={3}>{t('low')}</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('targetAudience')}</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as PromoContent['targetAudience'] }))}
                    className={styles.select}
                  >
                    <option value="all">{t('allClients')}</option>
                    <option value="active">{t('activePassHolders')}</option>
                    <option value="expiring">{t('expiringPasses')}</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('expiresAt')}</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className={styles.input}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('message')}</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className={styles.textarea}
                  placeholder="Введите ваше рекламное сообщение..."
                  required
                  maxLength={200}
                  rows={4}
                />
                <div className={styles.charCount}>
                  {formData.message.length}/200 {t('characters')}
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving || !formData.title.trim() || !formData.message.trim()}
                >
                  {saving ? (
                    <>
                      <div className={styles.saveSpinner} />
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <span className={styles.saveIcon}>💾</span>
                      {editingContent ? t('updateContent') : t('createContent')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.contentList}>
        {promoContents.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3 className={styles.emptyTitle}>{t('noContentCreated')}</h3>
            <p className={styles.emptyDescription}>
              {t('noContentDescription')}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className={styles.emptyButton}
              type="button"
            >
              {t('createContent')}
            </button>
          </div>
        ) : (
          promoContents.map((content) => (
            <div key={content.id} className={styles.contentCard}>
              <div className={styles.contentHeader}>
                <div className={styles.contentMeta}>
                  <div 
                    className={styles.typeIndicator}
                    style={{ backgroundColor: getTypeColor(content.type) }}
                  >
                    {getTypeIcon(content.type)}
                  </div>
                  <div className={styles.contentInfo}>
                    <h3 className={styles.contentTitle}>{content.title}</h3>
                    <div className={styles.contentDetails}>
                      <span className={styles.contentType}>{content.type}</span>
                      <span className={styles.contentPriority}>Priority {content.priority}</span>
                      <span className={styles.contentAudience}>{content.targetAudience}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.contentStatus}>
                  {isExpired(content.expiresAt) && (
                    <span className={styles.expiredBadge}>Expired</span>
                  )}
                  <span className={`${styles.statusBadge} ${content.active ? styles.active : styles.inactive}`}>
                    {content.active ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>

              <div className={styles.contentBody}>
                <p className={styles.contentMessage}>{content.message}</p>
              </div>

              <div className={styles.contentFooter}>
                <div className={styles.contentDates}>
                  <div className={styles.dateItem}>
                    <span className={styles.dateLabel}>Created:</span>
                    <span className={styles.dateValue}>{formatDate(content.createdAt)}</span>
                  </div>
                  {content.expiresAt && (
                    <div className={styles.dateItem}>
                      <span className={styles.dateLabel}>{t('expired')}:</span>
                      <span className={`${styles.dateValue} ${isExpired(content.expiresAt) ? styles.expired : ''}`}>
                        {formatDate(content.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.contentActions}>
                  <button
                    onClick={() => toggleContentStatus(content.id)}
                    className={`${styles.toggleButton} ${content.active ? styles.deactivate : styles.activate}`}
                    type="button"
                  >
                    {content.active ? t('deactivate') : t('activate')}
                  </button>
                  <button
                    onClick={() => startEdit(content)}
                    className={styles.editButton}
                    type="button"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => deleteContent(content.id)}
                    className={styles.deleteButton}
                    type="button"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}