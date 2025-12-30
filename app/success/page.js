'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchPasses } from '../../lib/api';

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const passId = searchParams.get('pass_id');

  const [order, setOrder] = useState({
    id: sessionId || 'N/A',
    passId: passId || 'N/A',
    name: '-',
    amount: '$15.00',
    status: 'Paid'
  });
  const [databaseStatus, setDatabaseStatus] = useState({
    state: 'pending',
    message: 'Verifying database record...'
  });
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [downloadEnabled, setDownloadEnabled] = useState(false);

  useEffect(() => {
    setOrder((prev) => ({
      ...prev,
      id: sessionId || 'N/A',
      passId: passId || 'N/A'
    }));
  }, [sessionId, passId]);

  useEffect(() => {
    const verifyDatabaseRecord = async () => {
      if (!passId) {
        setDatabaseStatus({
          state: 'error',
          message: 'No pass ID provided. Unable to verify database record.'
        });
        setLoadingDetails(false);
        return;
      }

      try {
        const passes = await fetchPasses({ pass_number: passId, limit: '1' });
        const ourPass = passes.find((pass) => pass.pass_number === passId);

        if (ourPass) {
          setOrder((prev) => ({
            ...prev,
            name: ourPass.name || 'N/A',
            status: ourPass.paid ? 'Paid' : 'Processing'
          }));
          setDatabaseStatus({
            state: 'success',
            message: 'Your press pass has been successfully stored in our database.'
          });
          setDownloadEnabled(true);
        } else {
          setDatabaseStatus({
            state: 'error',
            message: 'Your press pass was not found in our database. Please contact support.'
          });
        }
      } catch (error) {
        setDatabaseStatus({
          state: 'error',
          message: `Error verifying database record: ${error.message}`
        });
      } finally {
        setLoadingDetails(false);
      }
    };

    verifyDatabaseRecord();
  }, [passId]);

  return (
    <>
      <header>
        <h1>FREE PRESS PASS</h1>
      </header>

      <main>
        <div className="success-container">
          <div className="success-icon">OK</div>
          <h2>Order Successful!</h2>

          <div className="status-message status-success">
            <p>Thank you for your purchase. Your payment has been processed successfully.</p>
          </div>

          <div className="order-details">
            <h3>Order Details</h3>
            {loadingDetails ? (
              <div id="order-loading">
                <span className="loading" /> Loading order details...
              </div>
            ) : (
              <div id="order-content">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span id="order-id">{order.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span id="order-name">{order.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Press Pass ID:</span>
                  <span id="pass-id">{order.passId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span id="order-amount">{order.amount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span id="order-status">{order.status}</span>
                </div>
              </div>
            )}
          </div>

          <div className="shipping-info">
            <h3>What's Next?</h3>
            <p>Your laminated press pass will be shipped within 3-5 business days.</p>
            <p>You can continue to use your digital press pass in the meantime.</p>
          </div>

          <div id="database-status" className={`status-message status-${databaseStatus.state}`}>
            {databaseStatus.state === 'pending' ? <span className="loading" /> : null}
            {databaseStatus.message}
          </div>

          <div className="action-buttons">
            <button onClick={() => (window.location.href = '/')}>Generate Another Pass</button>
            <button
              id="download-pass"
              disabled={!downloadEnabled}
              onClick={() => {
                if (!passId) return;
                window.location.href = `/?regenerate=${encodeURIComponent(passId)}`;
              }}
            >
              Download Digital Pass
            </button>
          </div>
        </div>
      </main>

      <footer>
        <p>
          This journalist is recognized under the protections of the First Amendment of the U.S. Constitution. Any
          interference will be a violation of federal law.
        </p>
        <p>
          Do not hinder, exclude, or block the view of this journalist in the exercise of court-recognized First
          Amendment rights.
        </p>
      </footer>
    </>
  );
}

