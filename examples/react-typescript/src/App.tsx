import { useState, useEffect } from 'react';
import './App.css';
import { userService, type User } from './services/userService';

/**
 * RANA-Compliant React Component Example
 *
 * This component demonstrates RANA best practices:
 * - Real data from API (no mocks)
 * - Proper error handling
 * - Loading states
 * - TypeScript types
 * - Clean, readable code
 */

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ RANA: Real data from API, not mocks
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      // ✅ RANA: Proper error handling
      console.error('Error loading users:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ RANA: Loading state
  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  // ✅ RANA: Error state
  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error loading users</h2>
          <p>{error.message}</p>
          <button onClick={loadUsers}>Try Again</button>
        </div>
      </div>
    );
  }

  // ✅ RANA: Success state with real data
  return (
    <div className="app">
      <header>
        <h1>RANA React Example</h1>
        <p>This app demonstrates RANA best practices</p>
      </header>

      <main>
        <section>
          <h2>Users ({users.length})</h2>
          <div className="user-list">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <p className="company">{user.company.name}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <p>Built with RANA standards ✅</p>
        <ul>
          <li>✅ Real data (no mocks)</li>
          <li>✅ Error handling</li>
          <li>✅ Loading states</li>
          <li>✅ TypeScript types</li>
          <li>✅ Tests included</li>
        </ul>
      </footer>
    </div>
  );
}

export default App;
