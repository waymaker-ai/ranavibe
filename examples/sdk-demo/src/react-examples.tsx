/**
 * RANA React Examples
 * Complete demonstrations of React hooks
 */

import React, { useState } from 'react';
import { createRana } from '@rana/core';
import {
  RanaProvider,
  useRanaChat,
  useRanaStream,
  useRanaCost,
  useRanaConversation,
  useRanaOptimize,
} from '@rana/react';

// Initialize RANA client
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
  },
  cache: {
    enabled: true,
  },
});

// ============================================================================
// Example 1: Simple Chat Component
// ============================================================================

function SimpleChatExample() {
  const [input, setInput] = useState('');
  const { chat, response, loading, error, cost } = useRanaChat(rana, {
    provider: 'anthropic',
    optimize: 'cost',
  });

  const handleSend = async () => {
    if (!input.trim()) return;
    await chat(input);
    setInput('');
  };

  return (
    <div className="chat-container">
      <h2>Simple Chat</h2>

      <div className="messages">
        {response && (
          <div className="message assistant">
            <strong>Assistant:</strong> {response.content}
          </div>
        )}
        {error && (
          <div className="message error">
            <strong>Error:</strong> {error.message}
          </div>
        )}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="cost">Cost: ${cost.toFixed(4)}</div>
    </div>
  );
}

// ============================================================================
// Example 2: Streaming Chat
// ============================================================================

function StreamingChatExample() {
  const [input, setInput] = useState('');
  const { stream, content, loading, done } = useRanaStream(rana, {
    provider: 'anthropic',
  });

  const handleStream = async () => {
    if (!input.trim()) return;
    await stream(input);
    setInput('');
  };

  return (
    <div className="chat-container">
      <h2>Streaming Chat</h2>

      <div className="streaming-message">
        {content && <div className="content">{content}</div>}
        {loading && !done && <span className="cursor">▊</span>}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleStream()}
          placeholder="Ask for a story..."
          disabled={loading}
        />
        <button onClick={handleStream} disabled={loading || !input.trim()}>
          {loading ? 'Streaming...' : 'Stream'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Cost Dashboard
// ============================================================================

function CostDashboardExample() {
  const { stats, loading, refresh } = useRanaCost(rana);

  if (loading) {
    return <div className="loading">Loading cost stats...</div>;
  }

  if (!stats) {
    return <div className="empty">No data yet</div>;
  }

  return (
    <div className="dashboard">
      <h2>💰 Cost Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Spent</div>
          <div className="value cost">${stats.total_spent.toFixed(2)}</div>
        </div>

        <div className="stat-card success">
          <div className="label">Total Saved</div>
          <div className="value">${stats.total_saved.toFixed(2)}</div>
          <div className="subtext">{stats.savings_percentage.toFixed(0)}% savings</div>
        </div>

        <div className="stat-card">
          <div className="label">Cache Hit Rate</div>
          <div className="value">{(stats.cache_hit_rate * 100).toFixed(0)}%</div>
        </div>

        <div className="stat-card">
          <div className="label">Total Requests</div>
          <div className="value">{stats.total_requests.toLocaleString()}</div>
        </div>
      </div>

      <div className="breakdown">
        <h3>Provider Breakdown</h3>
        {stats.breakdown.map((item) => (
          <div key={item.provider} className="provider-row">
            <div className="provider-name">{item.provider}</div>
            <div className="provider-bar">
              <div
                className="bar-fill"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <div className="provider-cost">${item.total_cost.toFixed(2)}</div>
            <div className="provider-percent">{item.percentage.toFixed(0)}%</div>
          </div>
        ))}
      </div>

      <button onClick={refresh} className="refresh-btn">
        Refresh Stats
      </button>
    </div>
  );
}

// ============================================================================
// Example 4: Full Conversation
// ============================================================================

function ConversationExample() {
  const {
    messages,
    sendMessage,
    clearConversation,
    loading,
    error,
  } = useRanaConversation(rana, {
    provider: 'anthropic',
    optimize: 'balanced',
  });

  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="conversation">
      <div className="header">
        <h2>Full Conversation</h2>
        <button onClick={clearConversation} className="clear-btn">
          Clear
        </button>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="role">
              {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
            </div>
            <div className="content">{msg.content}</div>
          </div>
        ))}
        {loading && <div className="typing">Assistant is typing...</div>}
        {error && <div className="error">{error.message}</div>}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Optimization Panel
// ============================================================================

function OptimizationPanelExample() {
  const { savings, recommendations } = useRanaOptimize(rana);

  return (
    <div className="optimization-panel">
      <h2>💡 Optimization Recommendations</h2>

      <div className="savings-card">
        <div className="label">Potential Savings</div>
        <div className="value">${savings.total.toFixed(2)}</div>
        <div className="percentage">{savings.percentage.toFixed(0)}%</div>
      </div>

      <div className="recommendations">
        <h3>Recommendations</h3>
        {recommendations.length > 0 ? (
          <ul>
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        ) : (
          <div className="no-recommendations">
            ✅ All optimizations applied! Your setup is perfect.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main App Component
// ============================================================================

export function App() {
  const [activeTab, setActiveTab] = useState<
    'chat' | 'stream' | 'cost' | 'conversation' | 'optimize'
  >('chat');

  return (
    <RanaProvider client={rana}>
      <div className="app">
        <header>
          <h1>🐟 RANA React Examples</h1>
          <p>Complete demonstration of React hooks</p>
        </header>

        <nav className="tabs">
          <button
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Simple Chat
          </button>
          <button
            className={activeTab === 'stream' ? 'active' : ''}
            onClick={() => setActiveTab('stream')}
          >
            Streaming
          </button>
          <button
            className={activeTab === 'cost' ? 'active' : ''}
            onClick={() => setActiveTab('cost')}
          >
            Cost Dashboard
          </button>
          <button
            className={activeTab === 'conversation' ? 'active' : ''}
            onClick={() => setActiveTab('conversation')}
          >
            Conversation
          </button>
          <button
            className={activeTab === 'optimize' ? 'active' : ''}
            onClick={() => setActiveTab('optimize')}
          >
            Optimize
          </button>
        </nav>

        <main>
          {activeTab === 'chat' && <SimpleChatExample />}
          {activeTab === 'stream' && <StreamingChatExample />}
          {activeTab === 'cost' && <CostDashboardExample />}
          {activeTab === 'conversation' && <ConversationExample />}
          {activeTab === 'optimize' && <OptimizationPanelExample />}
        </main>

        <footer>
          <p>Made with ❤️ using RANA SDK</p>
        </footer>
      </div>
    </RanaProvider>
  );
}

export default App;
