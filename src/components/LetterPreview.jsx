import { useState } from 'react';

function LetterPreview({ letter, onSend, darkMode }) {
  const [showModal, setShowModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('txt');

  if (!letter) {
    return (
      <div className={`flex flex-col h-[calc(100vh-10rem)] rounded-xl border ${
        darkMode ? 'bg-[#2D2D2D] border-[#404040]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
              <svg className={`w-10 h-10 ${darkMode ? 'text-amber-500' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              No Letter Yet
            </h3>
            <p className={`text-sm mb-6 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Start chatting to generate your formal letter
            </p>
            <div className={`text-left space-y-3 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p>Tell me what letter you need</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p>Provide your details</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <p>Review and download</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(letter.content);
    alert('Letter copied to clipboard!');
  };

  const handleDownload = (format) => {
    if (format === 'txt') {
      const element = document.createElement('a');
      const file = new Blob([letter.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `letter_${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (format === 'docx') {
      // Generate DOCX content (simple format)
      const docxContent = generateDocx(letter.content);
      const element = document.createElement('a');
      const file = new Blob([docxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      element.href = URL.createObjectURL(file);
      element.download = `letter_${Date.now()}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
    setShowModal(false);
  };

  const handleEmail = () => {
    const subject = `Formal Letter: ${letter.letterType.replace(/_/g, ' ')}`;
    const body = encodeURIComponent(letter.content);
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
    setShowModal(false);
  };

  const generateDocx = (content) => {
    // Simple RTF format that can be opened in Word
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs24 ${content.replace(/\n/g, '\\par ')}
}`;
    return rtfContent;
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-10rem)] rounded-xl border ${
      darkMode ? 'bg-[#2D2D2D] border-[#404040]' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        darkMode ? 'border-[#404040]' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Your Letter
            </h2>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {letter.letterType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Ready
          </span>
        </div>
      </div>

      {/* Quality Checks */}
      {letter.registerChecks && letter.registerChecks.length > 0 && (
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-[#404040]' : 'border-gray-200'
        }`}>
          <div className="space-y-2">
            {letter.registerChecks.map((check, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                {check.status === 'passed' ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {check.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letter Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <pre className={`text-sm leading-relaxed whitespace-pre-wrap font-mono ${
          darkMode ? 'text-gray-300' : 'text-gray-800'
        }`}>
          {letter.content}
        </pre>
      </div>

      {/* Actions */}
      <div className={`px-6 py-4 border-t ${
        darkMode ? 'border-[#404040]' : 'border-gray-200'
      }`}>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              darkMode
                ? 'bg-[#1E1E1E] text-white hover:bg-[#404040]'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 min-w-[120px] px-4 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          ></div>
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
            darkMode ? 'bg-[#2D2D2D]' : 'bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-xl font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Export Letter
              </h3>
              
              <div className="space-y-3">
                {/* TXT */}
                <button
                  onClick={() => handleDownload('txt')}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    darkMode
                      ? 'bg-[#1E1E1E] hover:bg-[#404040]'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Download as Text
                      </div>
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Plain text file (.txt)
                      </div>
                    </div>
                    <svg className={`w-5 h-5 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </button>

                {/* DOCX */}
                <button
                  onClick={() => handleDownload('docx')}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    darkMode
                      ? 'bg-[#1E1E1E] hover:bg-[#404040]'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Download as Word
                      </div>
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Microsoft Word format (.rtf)
                      </div>
                    </div>
                    <svg className={`w-5 h-5 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </button>

                {/* Email */}
                <button
                  onClick={handleEmail}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    darkMode
                      ? 'bg-[#1E1E1E] hover:bg-[#404040]'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Open in Email
                      </div>
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Compose in your email app
                      </div>
                    </div>
                    <svg className={`w-5 h-5 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className={`w-full mt-4 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  darkMode
                    ? 'bg-[#404040] text-white hover:bg-[#505050]'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LetterPreview;
