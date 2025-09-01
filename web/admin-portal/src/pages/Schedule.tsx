import React, { useState, useEffect } from 'react';
import { useTranslation } from '../lib/i18n';
import styles from './Schedule.module.css';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  instructor?: string;
  type: 'regular' | 'private' | 'group';
  active: boolean;
}

interface DaySchedule {
  day: string;
  dayIndex: number;
  slots: TimeSlot[];
}

interface BookingSet {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  capacity: number;
  price: number;
  color: string;
  active: boolean;
}

export default function Schedule() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'booking-sets'>('schedule');

  // Schedule state
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([
    { day: 'Monday', dayIndex: 1, slots: [] },
    { day: 'Tuesday', dayIndex: 2, slots: [] },
    { day: 'Wednesday', dayIndex: 3, slots: [] },
    { day: 'Thursday', dayIndex: 4, slots: [] },
    { day: 'Friday', dayIndex: 5, slots: [] },
    { day: 'Saturday', dayIndex: 6, slots: [] },
    { day: 'Sunday', dayIndex: 0, slots: [] },
  ]);

  // Booking sets state
  const [bookingSets, setBookingSets] = useState<BookingSet[]>([
    {
      id: '1',
      name: 'Baby Swimming',
      description: 'Swimming lessons for babies 6-18 months',
      duration: 30,
      capacity: 6,
      price: 2000,
      color: '#FFD166',
      active: true
    },
    {
      id: '2',
      name: 'Toddler Swimming',
      description: 'Swimming lessons for toddlers 18 months - 3 years',
      duration: 45,
      capacity: 8,
      price: 2500,
      color: '#2BE090',
      active: true
    },
    {
      id: '3',
      name: 'Kids Swimming',
      description: 'Swimming lessons for children 3-6 years',
      duration: 60,
      capacity: 10,
      price: 3000,
      color: '#4AD6FF',
      active: true
    },
    {
      id: '4',
      name: 'Private Lesson',
      description: 'One-on-one swimming instruction',
      duration: 60,
      capacity: 1,
      price: 5000,
      color: '#FF6B6B',
      active: true
    }
  ]);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      
      // Mock data for development
      if (import.meta.env.DEV) {
        const mockSchedule = weekSchedule.map(day => ({
          ...day,
          slots: day.dayIndex >= 1 && day.dayIndex <= 5 ? [
            {
              id: `${day.dayIndex}-1`,
              startTime: '09:00',
              endTime: '09:30',
              capacity: 6,
              instructor: 'Ana Petrović',
              type: 'regular' as const,
              active: true
            },
            {
              id: `${day.dayIndex}-2`,
              startTime: '10:00',
              endTime: '10:45',
              capacity: 8,
              instructor: 'Marko Jovanović',
              type: 'group' as const,
              active: true
            },
            {
              id: `${day.dayIndex}-3`,
              startTime: '16:00',
              endTime: '17:00',
              capacity: 10,
              instructor: 'Jelena Nikolić',
              type: 'regular' as const,
              active: true
            }
          ] : day.dayIndex === 6 ? [
            {
              id: `${day.dayIndex}-1`,
              startTime: '10:00',
              endTime: '11:00',
              capacity: 12,
              instructor: 'Ana Petrović',
              type: 'group' as const,
              active: true
            }
          ] : []
        }));
        
        setWeekSchedule(mockSchedule);
        setTimeout(() => setLoading(false), 800);
        return;
      }
      
      // TODO: Load from API
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Save to API
      
      setSuccess('Schedule saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSlot: TimeSlot = {
      id: `${dayIndex}-${Date.now()}`,
      startTime: '09:00',
      endTime: '10:00',
      capacity: 8,
      instructor: '',
      type: 'regular',
      active: true
    };

    setWeekSchedule(schedule => 
      schedule.map(day => 
        day.dayIndex === dayIndex 
          ? { ...day, slots: [...day.slots, newSlot] }
          : day
      )
    );
  };

  const updateTimeSlot = (dayIndex: number, slotId: string, updates: Partial<TimeSlot>) => {
    setWeekSchedule(schedule => 
      schedule.map(day => 
        day.dayIndex === dayIndex 
          ? {
              ...day,
              slots: day.slots.map(slot => 
                slot.id === slotId ? { ...slot, ...updates } : slot
              )
            }
          : day
      )
    );
  };

  const deleteTimeSlot = (dayIndex: number, slotId: string) => {
    if (confirm('Are you sure you want to delete this time slot?')) {
      setWeekSchedule(schedule => 
        schedule.map(day => 
          day.dayIndex === dayIndex 
            ? { ...day, slots: day.slots.filter(slot => slot.id !== slotId) }
            : day
        )
      );
    }
  };

  const addBookingSet = () => {
    const newBookingSet: BookingSet = {
      id: Date.now().toString(),
      name: 'New Booking Set',
      description: 'Description for new booking set',
      duration: 60,
      capacity: 8,
      price: 2500,
      color: '#2BE090',
      active: true
    };
    setBookingSets([...bookingSets, newBookingSet]);
  };

  const updateBookingSet = (id: string, updates: Partial<BookingSet>) => {
    setBookingSets(sets => 
      sets.map(set => set.id === id ? { ...set, ...updates } : set)
    );
  };

  const deleteBookingSet = (id: string) => {
    if (confirm('Are you sure you want to delete this booking set?')) {
      setBookingSets(sets => sets.filter(set => set.id !== id));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'regular': return '🏊‍♀️';
      case 'private': return '👤';
      case 'group': return '👥';
      default: return '🏊‍♀️';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} />
          <p>Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('scheduleTitle')}</h1>
        <p className={styles.subtitle}>{t('scheduleSubtitle')}</p>
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

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'schedule' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <span className={styles.tabIcon}>📅</span>
          {t('weeklySchedule')}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'booking-sets' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('booking-sets')}
        >
          <span className={styles.tabIcon}>🎯</span>
          {t('bookingSets')}
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'schedule' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📅</span>
                {t('weeklySchedule')}
              </h2>
              <p className={styles.sectionDescription}>
                {t('weeklyScheduleDescription')}
              </p>
            </div>

            <div className={styles.scheduleGrid}>
              {weekSchedule.map((day) => (
                <div key={day.day} className={styles.dayCard}>
                  <div className={styles.dayHeader}>
                    <h3 className={styles.dayTitle}>{day.day}</h3>
                    <button
                      onClick={() => addTimeSlot(day.dayIndex)}
                      className={styles.addSlotButton}
                      type="button"
                    >
                      <span className={styles.addIcon}>+</span>
                      {t('addSlot')}
                    </button>
                  </div>

                  <div className={styles.slotsList}>
                    {day.slots.length === 0 ? (
                      <div className={styles.noSlots}>
                        <span className={styles.noSlotsIcon}>📭</span>
                        {t('noTimeSlotsConfigured')}
                      </div>
                    ) : (
                      day.slots.map((slot) => (
                        <div key={slot.id} className={styles.slotItem}>
                          <div className={styles.slotForm}>
                            <div className={styles.slotFormGrid}>
                              <div className={styles.formGroup}>
                                <label className={styles.label}>{t('startTime')}</label>
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => updateTimeSlot(day.dayIndex, slot.id, { startTime: e.target.value })}
                                  className={styles.input}
                                />
                              </div>

                              <div className={styles.formGroup}>
                                <label className={styles.label}>{t('endTime')}</label>
                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => updateTimeSlot(day.dayIndex, slot.id, { endTime: e.target.value })}
                                  className={styles.input}
                                />
                              </div>

                              <div className={styles.formGroup}>
                                <label className={styles.label}>{t('capacity')}</label>
                                <input
                                  type="number"
                                  value={slot.capacity}
                                  onChange={(e) => updateTimeSlot(day.dayIndex, slot.id, { capacity: parseInt(e.target.value) || 1 })}
                                  className={styles.input}
                                  min="1"
                                  max="50"
                                />
                              </div>

                              <div className={styles.formGroup}>
                                <label className={styles.label}>{t('type')}</label>
                                <select
                                  value={slot.type}
                                  onChange={(e) => updateTimeSlot(day.dayIndex, slot.id, { type: e.target.value as TimeSlot['type'] })}
                                  className={styles.select}
                                >
                                  <option value="regular">{t('regular')}</option>
                                  <option value="private">{t('private')}</option>
                                  <option value="group">{t('group')}</option>
                                </select>
                              </div>

                              <div className={styles.formGroup}>
                                <label className={styles.label}>{t('instructor')}</label>
                                <input
                                  type="text"
                                  value={slot.instructor || ''}
                                  onChange={(e) => updateTimeSlot(day.dayIndex, slot.id, { instructor: e.target.value })}
                                  className={styles.input}
                                  placeholder={t('instructorName')}
                                />
                              </div>
                            </div>

                            <div className={styles.slotActions}>
                              <div className={styles.slotInfo}>
                                <span className={styles.slotType}>
                                  {getTypeIcon(slot.type)} {t(slot.type)}
                                </span>
                                <span className={styles.slotDuration}>
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>

                              <div className={styles.slotControls}>
                                <label className={styles.toggleLabel}>
                                  <input
                                    type="checkbox"
                                    checked={slot.active}
                                    onChange={(e) => updateTimeSlot(day.dayIndex, slot.id, { active: e.target.checked })}
                                    className={styles.toggleInput}
                                  />
                                  <span className={styles.toggleSlider}></span>
                                  <span className={styles.toggleText}>{t('active')}</span>
                                </label>

                                <button
                                  onClick={() => deleteTimeSlot(day.dayIndex, slot.id)}
                                  className={styles.deleteButton}
                                  type="button"
                                >
                                  <span className={styles.deleteIcon}>🗑️</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'booking-sets' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🎯</span>
                {t('bookingSets')}
              </h2>
              <p className={styles.sectionDescription}>
                {t('bookingSetsDescription')}
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.bookingSetsHeader}>
                <h3 className={styles.bookingSetsTitle}>{t('availableBookingSets')}</h3>
                <button
                  onClick={addBookingSet}
                  className={styles.addButton}
                  type="button"
                >
                  <span className={styles.addIcon}>+</span>
                  {t('addBookingSet')}
                </button>
              </div>

              <div className={styles.bookingSetsList}>
                {bookingSets.map((set) => (
                  <div key={set.id} className={styles.bookingSetItem}>
                    <div className={styles.bookingSetForm}>
                      <div className={styles.bookingSetHeader}>
                        <div 
                          className={styles.colorIndicator}
                          style={{ backgroundColor: set.color }}
                        ></div>
                        <input
                          type="text"
                          value={set.name}
                          onChange={(e) => updateBookingSet(set.id, { name: e.target.value })}
                          className={styles.nameInput}
                          placeholder="Название набора бронирования"
                        />
                      </div>

                      <div className={styles.bookingSetGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>{t('description')}</label>
                          <textarea
                            value={set.description}
                            onChange={(e) => updateBookingSet(set.id, { description: e.target.value })}
                            className={styles.textarea}
                            rows={2}
                            placeholder="Описание этого набора бронирования"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>{t('durationMinutes')}</label>
                          <input
                            type="number"
                            value={set.duration}
                            onChange={(e) => updateBookingSet(set.id, { duration: parseInt(e.target.value) || 30 })}
                            className={styles.input}
                            min="15"
                            max="180"
                            step="15"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>{t('capacity')}</label>
                          <input
                            type="number"
                            value={set.capacity}
                            onChange={(e) => updateBookingSet(set.id, { capacity: parseInt(e.target.value) || 1 })}
                            className={styles.input}
                            min="1"
                            max="50"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>{t('priceRsd')}</label>
                          <input
                            type="number"
                            value={set.price}
                            onChange={(e) => updateBookingSet(set.id, { price: parseInt(e.target.value) || 0 })}
                            className={styles.input}
                            min="0"
                            step="100"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>{t('color')}</label>
                          <input
                            type="color"
                            value={set.color}
                            onChange={(e) => updateBookingSet(set.id, { color: e.target.value })}
                            className={styles.colorInput}
                          />
                        </div>
                      </div>

                      <div className={styles.bookingSetStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Продолжительность:</span>
                          <span className={styles.statValue}>{set.duration} {t('duration')}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Вместимость:</span>
                          <span className={styles.statValue}>{set.capacity} {t('people')}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Цена:</span>
                          <span className={styles.statValue}>{formatPrice(set.price)}</span>
                        </div>
                      </div>

                      <div className={styles.bookingSetActions}>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={set.active}
                            onChange={(e) => updateBookingSet(set.id, { active: e.target.checked })}
                            className={styles.toggleInput}
                          />
                          <span className={styles.toggleSlider}></span>
                          <span className={styles.toggleText}>{t('active')}</span>
                        </label>

                        <button
                          onClick={() => deleteBookingSet(set.id)}
                          className={styles.deleteButton}
                          type="button"
                        >
                          <span className={styles.deleteIcon}>🗑️</span>
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Save Button */}
      <div className={styles.footer}>
        <button
          onClick={saveSchedule}
          disabled={saving}
          className={styles.saveButton}
          type="button"
        >
          {saving ? (
            <>
              <div className={styles.saveSpinner} />
              {t('saving')}
            </>
          ) : (
            <>
              <span className={styles.saveIcon}>💾</span>
              {t('saveSchedule')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}