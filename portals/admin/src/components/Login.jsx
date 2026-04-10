import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
    } catch (err) {
      console.error(err);
      toast.error('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--color-bg-primary)', padding: 24
    }}>
      <div style={{
        width: '100%', maxWidth: 400, backgroundColor: 'var(--color-bg-card)',
        borderRadius: 10, border: '1px solid var(--color-border)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: 32
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--color-brand-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginTop: 8 }}>
            Sign in to access Aarogya Sanchalak
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Email Address / ID
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)',
                fontSize: 'var(--font-base)', outline: 'none'
              }}
              placeholder="staff@hospital.in"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)',
                fontSize: 'var(--font-base)', outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 12, width: '100%', padding: '12px', borderRadius: 8,
              backgroundColor: 'var(--color-brand)', color: 'white', border: 'none',
              fontSize: 'var(--font-base)', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s', letterSpacing: '0.02em'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}
