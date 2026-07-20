import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import styles from './PaymentResultPage.module.css';

const PaymentResultPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get('status');
  const code = queryParams.get('code');
  const cancel = queryParams.get('cancel');

  // PayOS appends its own parameters when redirecting back.
  // code="00", status="PAID", or cancel="false" means success.
  // We keep status="success" as a fallback for our hardcoded returnUrl.
  const isSuccess = 
    cancel !== 'true' && 
    (
      status === 'success' || 
      status === 'PAID' || 
      code === '00' || 
      cancel === 'false'
    );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {isSuccess ? (
          <>
            <div className={`${styles.icon} ${styles.success}`}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className={styles.title}>Payment Successful!</h1>
            <p className={styles.message}>
              Thank you for subscribing to ScholarTrend Premium. Your transaction has been completed successfully and your new features are now unlocked.
            </p>
            <div className={styles.actions}>
              <Link to="/dashboard" className={`${styles.btn} ${styles.btnPrimary}`}>
                Go to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className={`${styles.icon} ${styles.error}`}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className={styles.title}>Payment Cancelled</h1>
            <p className={styles.message}>
              Your payment process was cancelled or failed. No charges were made to your account. Please try again if you wish to upgrade.
            </p>
            <div className={styles.actions}>
              <Link to="/pricing" className={`${styles.btn} ${styles.btnPrimary}`}>
                Try Again
              </Link>
              <Link to="/dashboard" className={`${styles.btn} ${styles.btnSecondary}`}>
                Return to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
