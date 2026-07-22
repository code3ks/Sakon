import React from 'react';
import './FunctionCallLog.css';

function FunctionCallLog({ calls }) {
  return (
    <div className="function-call-log">
      <div className="log-header">
        <h3>🔧 Function Calls</h3>
        <span className="badge">{calls.length}</span>
      </div>

      <div className="log-content">
        {calls.length === 0 ? (
          <p className="empty-state">No function calls yet. The agent will log its actions here.</p>
        ) : (
          calls.map((call, idx) => (
            <div key={idx} className="call-entry">
              <div className="call-header">
                <span className="call-name">{call.name}</span>
                <span className="call-timestamp">{new Date(call.timestamp).toLocaleTimeString()}</span>
              </div>
              {call.arguments && (
                <div className="call-args">
                  <strong>Arguments:</strong>
                  <pre>{JSON.stringify(call.arguments, null, 2)}</pre>
                </div>
              )}
              {call.result && (
                <div className="call-result">
                  <strong>Result:</strong> {call.result}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FunctionCallLog;
