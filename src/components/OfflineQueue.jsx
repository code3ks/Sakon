function OfflineQueue({ queue, onRefresh, onFlush, onClose, darkMode }) {
  const hasPending = queue.some(item => item.status === 'pending');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${
        darkMode ? 'border-[#404040]' : 'border-gray-200'
      }`}>
        <div>
          <h3 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Send Queue
          </h3>
          <p className={`text-sm mt-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {queue.length} {queue.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            darkMode
              ? 'hover:bg-[#2D2D2D] text-gray-400'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Actions */}
      <div className={`px-6 py-3 border-b flex gap-2 ${
        darkMode ? 'border-[#404040]' : 'border-gray-200'
      }`}>
        <button
          onClick={onRefresh}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-[#1E1E1E] text-white hover:bg-[#2D2D2D]'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        {hasPending && (
          <button
            onClick={onFlush}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send All
          </button>
        )}
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {queue.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-[#1E1E1E]' : 'bg-gray-100'
              }`}>
                <svg className={`w-8 h-8 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No queued letters
              </p>
              <p className={`text-xs mt-2 ${
                darkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Letters sent offline will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-colors ${
                  darkMode
                    ? 'bg-[#1E1E1E] border-[#404040] hover:border-[#505050]'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.letterType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    {item.destination && (
                      <div className={`text-xs mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        To: {item.destination}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : item.status === 'sent'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {item.status === 'pending' && '⏳ Pending'}
                    {item.status === 'sent' && '✓ Sent'}
                    {item.status === 'failed' && '✗ Failed'}
                  </span>
                </div>
                <div className={`text-xs ${
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OfflineQueue;
