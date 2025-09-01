import React from 'react';
import { useTranslation } from '../../lib/i18n';
import styles from './DataTable.module.css';

export type Column<T> = {
  key: keyof T | string;
  title: string;
  width?: number;
  render?: (row: T) => React.ReactNode;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  headerSlot?: React.ReactNode;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
};

function SkeletonRow<T>({ columns }: { columns: Column<T>[] }) {
  return (
    <tr className={styles.skeletonRow}>
      {columns.map((col, index) => (
        <td key={index} style={{ width: col.width }}>
          <div className={styles.skeleton} />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T>({
  const { t } = useTranslation();
  columns,
  rows,
  loading = false,
  emptyText,
  headerSlot,
  onNextPage,
  onPrevPage,
  hasNext = false,
  hasPrev = false,
}: DataTableProps<T>) {
  const showPagination = onNextPage || onPrevPage;
  
  const defaultEmptyText = emptyText || t('noDataAvailable');

  return (
    <div className={styles.container}>
      {headerSlot && (
        <div className={styles.headerSlot}>
          {headerSlot}
        </div>
      )}
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={String(col.key) + index}
                  style={{ width: col.width }}
                  className={styles.header}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Show skeleton rows while loading
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} columns={columns} />
              ))
            ) : rows.length === 0 ? (
              // Show empty state
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {defaultEmptyText}
                </td>
              </tr>
            ) : (
              // Show actual data
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={styles.row}>
                  {columns.map((col, colIndex) => (
                    <td
                      key={String(col.key) + colIndex}
                      style={{ width: col.width }}
                      className={styles.cell}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as any)[col.key] ?? '')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className={styles.pagination}>
          <button
            type="button"
            onClick={onPrevPage}
            disabled={!hasPrev || loading}
            className={styles.paginationButton}
            aria-label="Previous page"
          >
            {t('previous')}
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={!hasNext || loading}
            className={styles.paginationButton}
            aria-label="Next page"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}