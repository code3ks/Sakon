import React, { useState } from 'react';
import './LetterPreview.css';

function LetterPreview({ letter, onSend }) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMethod, setSendMethod] = useState('email');
  const [destination, setDestination] = useState('');

  // Show empty state if no letter
  if (!letter) {
    return (
      <div className="letter-preview empty-state">
        <div className="empty-content">
          <div className="empty-icon">📝</div>
          <h3>No Letter Yet</h3>
          <p>Start a conversation in the chat to generate your formal letter.</p>
          <div className="empty-tips">
            <h4>Tips:</h4>
            <ul>
              <li>Tell me what type of letter you need</li>
              <li>Provide your details (name, matric number, etc.)</li>
              <li>Explain your situation clearly</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (sendMethod === 'email' && !destination.trim()) {
      alert('Please enter an email address');
      return;
    }
    onSend(sendMethod, destination);
    setShowSendModal(false);
    setDestination('');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([letter.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `letter_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letter.content);
    alert('Letter copied to clipboard!');
  };

  return (
    <div className="letter-preview">
      <div className="preview-header">
        <h2>📄 Your Letter</h2>
        <div className="letter-type-badge">
          {letter.letterType.replace(/_/g, ' ').toUpperCase()}
        </div>
      </div>

      {letter.registerChecks && letter.registerChecks.length > 0 && (
        <div className="register-checks">
          <h3>✅ Quality Checks</h3>
          <ul>
            {letter.registerChecks.map((check, idx) => (
              <li key={idx} className={check.status}>
                <span className="check-icon">
                  {check.status === 'passed' ? '✅' : '⚠️'}
                </span>
                {check.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="letter-content">
        <pre>{letter.content}</pre>
      </div>

      <div className="preview-actions">
        <button onClick={handleCopy} className="action-btn copy">
          📋 Copy
        </button>
        <button onClick={handleDownload} className="action-btn download">
          ⬇️ Download
        </button>
        <button onClick={() => setShowSendModal(true)} className="action-btn send">
          📧 Send/Export
        </button>
      </div>

      {showSendModal && (
        <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Send or Export Letter</h3>

            <div className="send-options">
              <label>
                <input
                  type="radio"
                  value="email"
                  checked={sendMethod === 'email'}
                  onChange={(e) => setSendMethod(e.target.value)}
                />
                Email
              </label>
              <label>
                <input
                  type="radio"
                  value="export"
                  checked={sendMethod === 'export'}
                  onChange={(e) => setSendMethod(e.target.value)}
                />
                Export (save for later)
              </label>
            </div>

            {sendMethod === 'email' && (
              <input
                type="email"
                placeholder="Enter recipient email address"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="email-input"
              />
            )}

            <div className="modal-actions">
              <button onClick={() => setShowSendModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleSend} className="confirm-btn">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LetterPreview;
