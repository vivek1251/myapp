import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://myapp-backend-tmya.onrender.com';

// ── Save/load token from localStorage ───────────────────────────── ───────────
const getToken  = () => localStorage.getItem('token');
const saveToken = (t) => localStorage.setItem('token', t);
const clearToken = () => localStorage.removeItem('token');

// ── Reusable input style ──────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 14px', fontSize: '0.95rem',
  border: '1px solid #e2e8f0', borderRadius: '8px',
  outline: 'none', marginBottom: '12px',
  boxSizing: 'border-box',
};

// ── Reusable button style ─────────────────────────────────────────────────────
const btnStyle = (color) => ({
  width: '100%', padding: '11px', fontSize: '0.95rem', fontWeight: 700,
  background: color, color: '#fff', border: 'none', borderRadius: '8px',
  cursor: 'pointer', marginBottom: '10px',
});

// =============================================================================
// SIGNUP PAGE
// =============================================================================
function SignupPage({ onSignup, onGoLogin }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      saveToken(data.token);
      onSignup(data.user);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.sub}>Sign up to get started</p>
        {error && <div style={styles.error}>{error}</div>}
        <input style={inputStyle} placeholder="Your name"     value={name}     onChange={e => setName(e.target.value)} />
        <input style={inputStyle} placeholder="Email address" value={email}    onChange={e => setEmail(e.target.value)} type="email" />
        <input style={inputStyle} placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} type="password" />
        <button style={btnStyle('#6366f1')} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <p style={styles.link}>Already have an account? <span style={styles.anchor} onClick={onGoLogin}>Log in</span></p>
      </div>
    </div>
  );
}

// =============================================================================
// LOGIN PAGE
// =============================================================================
function LoginPage({ onLogin, onGoSignup }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      saveToken(data.token);
      onLogin(data.user);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.sub}>Log in to your account</p>
        {error && <div style={styles.error}>{error}</div>}
        <input style={inputStyle} placeholder="Email address" value={email}    onChange={e => setEmail(e.target.value)} type="email" />
        <input style={inputStyle} placeholder="Password"      value={password} onChange={e => setPassword(e.target.value)} type="password" />
        <button style={btnStyle('#6366f1')} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        <p style={styles.link}>No account? <span style={styles.anchor} onClick={onGoSignup}>Sign up</span></p>
      </div>
    </div>
  );
}

// =============================================================================
// HOME PAGE (logged in)
// =============================================================================
function HomePage({ user, onLogout }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
        <h1 style={styles.title}>Hello from my auto-deploy! 🚀</h1>
        <p style={styles.sub}>You are logged in successfully</p>
        <div style={styles.infoBox}>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Name</span><span>{user.name}</span></div>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Email</span><span>{user.email}</span></div>
          <div style={styles.infoRow}><span style={styles.infoLabel}>ID</span><span style={{fontSize:'0.75rem',color:'#94a3b8'}}>{user.id}</span></div>
        </div>
        <button style={btnStyle('#ef4444')} onClick={onLogout}>Log Out</button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN APP
// =============================================================================
export default function App() {
  const [page, setPage] = useState('login');   // 'login' | 'signup' | 'home'
  const [user, setUser] = useState(null);

  // Check if already logged in on page load
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${BACKEND_URL}/api/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.user) { setUser(data.user); setPage('home'); } })
      .catch(() => clearToken());
  }, []);

  const handleLogin  = (u) => { setUser(u); setPage('home'); };
  const handleLogout = ()  => { clearToken(); setUser(null); setPage('login'); };

  if (page === 'home')   return <HomePage   user={user} onLogout={handleLogout} />;
  if (page === 'signup') return <SignupPage onSignup={handleLogin} onGoLogin={() => setPage('login')} />;
  return                        <LoginPage  onLogin={handleLogin}  onGoSignup={() => setPage('signup')} />;
}

// =============================================================================
// STYLES
// =============================================================================
const styles = {
  page: {
    minHeight: '100vh', background: '#f0f4f8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif', padding: '24px',
  },
  card: {
    background: '#fff', borderRadius: '16px', padding: '40px',
    maxWidth: '420px', width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  title:  { fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px', color: '#1a1a2e' },
  sub:    { color: '#94a3b8', margin: '0 0 24px', fontSize: '0.9rem' },
  error:  { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.88rem' },
  link:   { textAlign: 'center', fontSize: '0.88rem', color: '#64748b', margin: 0 },
  anchor: { color: '#6366f1', cursor: 'pointer', fontWeight: 700 },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', background: '#6366f1',
            color: '#fff', fontSize: '1.8rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  infoBox:  { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
              padding: '16px', marginBottom: '20px' },
  infoRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' },
  infoLabel:{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' },
};
