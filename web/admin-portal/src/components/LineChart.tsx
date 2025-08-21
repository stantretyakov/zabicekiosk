import styles from './LineChart.module.css';

interface Point {
  date: string;
  count: number;
}

interface Props {
  data: Point[];
}

export default function LineChart({ data }: Props) {
  if (data.length === 0) return <div className={styles.placeholder}>No data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.count / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chart}>
      <polyline
        fill="none"
        stroke="var(--accent-2)"
        strokeWidth="3"
        points={points}
      />
    </svg>
  );
}
