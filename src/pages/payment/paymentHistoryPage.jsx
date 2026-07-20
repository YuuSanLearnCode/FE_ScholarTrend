import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPaymentHistory } from '../../services/paymentService';
import Skeleton from '../../components/Skeleton';
import styles from './paymentHistoryPage.module.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  let dateStr = dateString;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
    dateStr += 'Z';
  }
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function getStatusBadge(status) {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'PAID':
    case 'SUCCESS':
      return <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>Success</span>;
    case 'PENDING':
      return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pending</span>;
    case 'CANCELLED':
      return <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>Cancelled</span>;
    case 'FAILED':
    case 'ERROR':
      return <span className={`${styles.statusBadge} ${styles.statusFailed}`}>Failed</span>;
    default:
      return <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>{status}</span>;
  }
}

const PaymentHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getPaymentHistory();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load payment history.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Billing</span>
        <h1 className={styles.title}>Payment History</h1>
        <p className={styles.subtitle}>Review your past transactions and subscription upgrades.</p>
      </header>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingRow}><Skeleton width="20%" height="24px" /><Skeleton width="30%" height="24px" /><Skeleton width="15%" height="24px" /></div>
            <div className={styles.loadingRow}><Skeleton width="25%" height="24px" /><Skeleton width="20%" height="24px" /><Skeleton width="20%" height="24px" /></div>
            <div className={styles.loadingRow}><Skeleton width="15%" height="24px" /><Skeleton width="35%" height="24px" /><Skeleton width="25%" height="24px" /></div>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Could not load history</h3>
            <p>{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3>No Transactions Found</h3>
            <p>You haven't made any payments yet. Upgrade to ScholarTrend Premium to access advanced features.</p>
            <Link to="/pricing" className={styles.upgradeButton}>
              Upgrade Now
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx, idx) => (
                  <tr key={tx.id || idx}>
                    <td className={styles.date}>{formatDate(tx.createdAt)}</td>
                    <td>
                      <div className={styles.planName}>
                        <div className={styles.planIcon}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        {tx.planName || 'Unknown Plan'}
                      </div>
                    </td>
                    <td className={styles.amount}>{formatCurrency(tx.amount)}</td>
                    <td>{getStatusBadge(tx.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default PaymentHistoryPage;
