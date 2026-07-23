import { useState, useRef, useEffect } from 'react';

function ChatInterface({ messages, onSendMessage, isLoading, darkMode }) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);

          try {
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            if (data.text) {
              setInput(data.text);
            }
          } catch (error) {
            console.error('Transcription failed:', error);
            alert('Voice input not available. Please type your message.');
          }

          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone access denied:', error);
        alert('Microphone access denied. Please type your message.');
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-10rem)] rounded-xl border ${
      darkMode ? 'bg-[#2D2D2D] border-[#404040]' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        darkMode ? 'border-[#404040]' : 'border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Chat
        </h2>
        <p className={`text-sm mt-1 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Describe your situation in English or Hausa
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Sannu! Welcome!
              </h3>
              <p className={`text-sm mb-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Tell me about the letter you need. For example:
              </p>
              <div className={`text-left space-y-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-[#1E1E1E]' : 'bg-gray-50'
                }`}>
                  "My roommate keeps stealing my things"
                </div>
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-[#1E1E1E]' : 'bg-gray-50'
                }`}>
                  "I need to defer my exam due to illness"
                </div>
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-[#1E1E1E]' : 'bg-gray-50'
                }`}>
                  "I need a transcript for my visa"
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                : darkMode
                  ? 'bg-[#1E1E1E] text-gray-200'
                  : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-2xl px-4 py-3 ${
              darkMode ? 'bg-[#1E1E1E]' : 'bg-gray-100'
            }`}>
              <div className="flex space-x-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  darkMode ? 'bg-gray-500' : 'bg-gray-400'
                }`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  darkMode ? 'bg-gray-500' : 'bg-gray-400'
                }`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  darkMode ? 'bg-gray-500' : 'bg-gray-400'
                }`} style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`px-4 py-4 border-t ${
        darkMode ? 'border-[#404040]' : 'border-gray-200'
      }`}>
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message..."
              disabled={isLoading}
              rows={1}
              className={`w-full px-4 py-3 pr-12 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                darkMode
                  ? 'bg-[#1E1E1E] text-white border-[#404040] placeholder-gray-500'
                  : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'
              } border`}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            
            {/* Voice button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`absolute right-3 bottom-3 p-1.5 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-[#2D2D2D]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-xl transition-all ${
              isLoading || !input.trim()
                ? darkMode
                  ? 'bg-[#404040] text-gray-600'
                  : 'bg-gray-200 text-gray-400'
                : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
            } disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;
