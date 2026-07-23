import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import LetterPreview from './components/LetterPreview';
import OfflineQueue from './components/OfflineQueue';

function App() {
  const [messages, setMessages] = useState([]);
  const [letter, setLetter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [queuedLetters, setQueuedLetters] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Initialize session
    fetch('/api/session/start', { method: 'POST' })
      .then(res => res.json())
      .then(data => setSessionId(data.sessionId))
      .catch(console.error);

    // Load queued letters
    loadQueue();

    // Check connectivity periodically
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      setQueuedLetters(data.queue || []);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  const checkConnectivity = async () => {
    try {
      await fetch('/api/health');
      if (isOffline) {
        setIsOffline(false);
        // Flush queue when connection is restored
        flushQueue();
      }
    } catch {
      setIsOffline(true);
    }
  };

  const flushQueue = async () => {
    try {
      const response = await fetch('/api/queue/flush', { method: 'POST' });
      const data = await response.json();
      console.log(`Flushed ${data.flushed} queued items`);
      loadQueue();
    } catch (error) {
      console.error('Failed to flush queue:', error);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !sessionId) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });

      const data = await response.json();

      // Add assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      // Update letter if generated
      if (data.letter) {
        setLetter(data.letter);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLetter = async (method, destination) => {
    if (!letter) return;

    try {
      const response = await fetch('/api/letter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letterId: letter.id,
          method,
          destination,
          isOffline,
        }),
      });

      const data = await response.json();

      if (data.queued) {
        alert('Letter queued for sending when connection is available');
        loadQueue();
      } else if (data.sent) {
        alert('Letter sent successfully!');
      }
    } catch (error) {
      console.error('Failed to send letter:', error);
      alert('Failed to send letter');
    }
  };

  const toggleOfflineMode = () => {
    setIsOffline(!isOffline);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sakon ABU</h1>
        <p className="subtitle">Your formal letter assistant</p>
        <div className="header-controls">
          <button 
            className={`offline-toggle ${isOffline ? 'offline' : 'online'}`}
            onClick={toggleOfflineMode}
          >
            {isOffline ? '� Offline Mode' : '� Online'}
          </button>
        </div>
      </header>

      <div className="app-container">
        <div className="main-content">
          <div className="chat-section">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          </div>

          <div className="preview-section">
            <LetterPreview
              letter={letter}
              onSend={handleSendLetter}
            />
          </div>
        </div>

        <div className="sidebar">
          <OfflineQueue queue={queuedLetters} onRefresh={loadQueue} onFlush={flushQueue} />
        </div>
      </div>
    </div>
  );
}

export default App;
