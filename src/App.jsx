import { useState, useEffect } from 'react';
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
  const [darkMode, setDarkMode] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

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

  const hasPendingQueue = queuedLetters.some(item => item.status === 'pending');

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'dark bg-[#1E1E1E]' : 'bg-white'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b transition-colors ${
        darkMode ? 'bg-[#1E1E1E] border-[#404040]' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className={`font-semibold text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Sakon ABU
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Offline Toggle */}
              <button
                onClick={toggleOfflineMode}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isOffline
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {isOffline ? 'Offline' : 'Online'}
              </button>

              {/* Queue Button */}
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`relative p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-[#2D2D2D] text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {hasPendingQueue && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-[#2D2D2D] text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-1">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              darkMode={darkMode}
            />
          </div>

          {/* Letter Preview Section */}
          <div className="lg:col-span-1">
            <LetterPreview
              letter={letter}
              onSend={handleSendLetter}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {/* Queue Sidebar */}
      {showQueue && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowQueue(false)}
          ></div>
          <div className={`absolute right-0 top-0 h-full w-full sm:w-96 shadow-2xl ${
            darkMode ? 'bg-[#1E1E1E]' : 'bg-white'
          }`}>
            <OfflineQueue 
              queue={queuedLetters} 
              onRefresh={loadQueue} 
              onFlush={flushQueue}
              onClose={() => setShowQueue(false)}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
