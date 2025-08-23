import React from 'react';
import styles from './Toast.module.css';

export type ToastProps = {
  kind: 'ok' | 'warn' | 'error';
  message: string;
  onClose?: () => void;
};

export default function Toast({ kind, message, onClose }: ToastProps) {
  return (
    <div className={`${styles.toast} ${styles[kind]}`}>
      <span>{message}</span>
      {onClose && (
        <button className={styles.close} onClick={onClose} aria-label="close">
          ×
        </button>
      )}
    </div>
  );
}