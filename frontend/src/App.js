import React, { useState, useEffect } from 'react';

// ── Change this to your actual Render backend URL after deploying ──
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://myapp-backend-tmya.onrender.com';

function App() {
  const [message, setMessage] = useState('Loading...');
  const [items, setItems]     = useState([]);
  const [error, setError]     = useState(null);

  useEffect(() => {
    // Fetch greeting from Flask
    fetch(`${BACKEND_URL}/api/hello`)
      .then(r => r.json())
      .then(data => setMessage(data.message))
      .catch(() => setError('Could not reach backend'));

    // Fetch items list from Flask
    fetch(`${BACKEND_URL}/api/items`)
      .then(r => r.json())
      .then(data => setItems(data.items))
      .catch(() => {});
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚀 My App</h1>
        <p style={styles.subtitle}>React + Flask · Auto-deployed for free</p>

        <div style={styles.box}>
          <p style={styles.label}>Message from Flask backend:</p>
          {error
            ? <p style={styles.error}>{error}</p>
            : <p style={styles.message}>{message}</p>
          }
        </div>

        {items.length > 0 && (
          <div style={styles.box}>
            <p style={styles.label}>Items from API:</p>
            <ul style={styles.list}>
              {items.map(item => (
                <li key={item.id} style={styles.item}>
                  #{item.id} — {item.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p style={styles.footer}>
          Edit <code>frontend/src/App.js</code> or <code>backend/app.py</code>,
          push to GitHub, and this page updates automatically ✓
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif',
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '520px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  title: { fontSize: '2rem', margin: '0 0 8px', color: '#1a1a2e' },
  subtitle: { color: '#666', margin: '0 0 32px', fontSize: '0.95rem' },
  box: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '16px 20px',
    marginBottom: '16px',
  },
  label: { fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase',
           letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 600 },
  message: { fontSize: '1.1rem', color: '#1a1a2e', margin: 0, fontWeight: 600 },
  error: { color: '#ef4444', margin: 0, fontSize: '0.9rem' },
  list: { margin: 0, paddingLeft: '20px' },
  item: { padding: '4px 0', color: '#334155' },
  footer: { fontSize: '0.82rem', color: '#94a3b8', marginTop: '24px',
            marginBottom: 0, lineHeight: 1.6 },
};

export default App;
