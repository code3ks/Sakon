import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

function ChatInterface({ messages, onSendMessage, isLoading }) {
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
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Chat with Sakon ABU</h2>
        <p>Describe your issue in English or Hausa</p>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>👋 Sannu! Welcome!</h3>
            <p>Tell me about the letter you need to write. For example:</p>
            <ul>
              <li>"My hostel roommate keeps stealing my things"</li>
              <li>"I need to defer my exam due to illness"</li>
              <li>"I need a transcript for my visa application"</li>
            </ul>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="E.g., 'I need to defer my exam' or 'My hostel roommate keeps stealing my things'"
          disabled={isLoading}
          className="message-input"
        />
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`voice-button ${isRecording ? 'recording' : ''}`}
          disabled={isLoading}
          title="Voice input (optional)"
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
