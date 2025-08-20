import styles from './Toast.module.css';

interface Props {
  kind: 'pass' | 'dropin' | 'cooldown' | 'out' | 'error';
  message: string;
}

export default function Toast({ kind, message }: Props) {
  return <div className={`${styles.toast} ${styles[kind]}`}>{message}</div>;
}
