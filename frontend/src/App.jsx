import { useState } from 'react';
import { checkHealth } from './services/api';

function App() {
  const [backendStatus, setBackendStatus] = useState('Not checked yet');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const data = await checkHealth();
      setBackendStatus(`✅ Connected! Server says: ${data.status}`);
    } catch (error) {
        console.error('Connection error:', error);
      setBackendStatus('❌ Connection failed. Is your backend running?');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Football Manager - Connection Test</h1>
      <p>Backend Status: {backendStatus}</p>
      <button onClick={testConnection} disabled={loading}>
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>
    </div>
  );
}

export default App;