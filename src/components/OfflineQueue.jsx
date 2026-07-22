import React from 'react';
import './OfflineQueue.css';

function OfflineQueue({ queue, onRefresh, onFlush }) {
  const hasPending = queue.some(item => item.status === 'pending');

  return (
    <div className="offline-queue">
      <div className="queue-header">
        <h3>📮 Send Queue</h3>
        <div className="queue-actions">
          {hasPending && (
            <button onClick={onFlush} className="flush-btn" title="Send all pending">
              ▶️
            </button>
          )}
          <button onClick={onRefresh} className="refresh-btn" title="Refresh">
            🔄
          </button>
        </div>
      </div>

      <div className="queue-content">
        {queue.length === 0 ? (
          <p className="empty-state">No queued letters. Letters will appear here when sent offline.</p>
        ) : (
          queue.map((item, idx) => (
            <div key={idx} className={`queue-item ${item.status}`}>
              <div className="item-header">
                <span className="item-type">{item.letterType}</span>
                <span className={`status-badge ${item.status}`}>
                  {item.status === 'pending' && '⏳ Pending'}
                  {item.status === 'sent' && '✅ Sent'}
                  {item.status === 'failed' && '❌ Failed'}
                </span>
              </div>
              <div className="item-details">
                <div className="item-destination">
                  To: {item.destination || 'Export'}
                </div>
                <div className="item-timestamp">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OfflineQueue;
