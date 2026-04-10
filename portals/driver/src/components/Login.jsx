// Login.jsx — Firebase Auth email/password login
// Mobile-first: large inputs, high contrast, single action screen
import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle, Truck } from 'lucide-react';
import clsx from 'clsx';

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('driver@hospital.in');
  const [password, setPassword] = useState('driver123'); // Default hackathon pass
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const [{ signInWithEmailAndPassword }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('../../../shared/firebase.js'),
      ]);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      onLogin(cred.user);
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.code === 'auth/too-many-requests'
        ? 'Too many attempts. Try again later.'
        : err.code === 'auth/network-request-failed'
        ? 'Network error. Check your connection.'
        : 'Login failed. Check your connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[var(--color-bg-primary)]">
      <div className="w-full max-w-[420px] animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[14px] bg-[var(--color-brand)] mb-5 shadow-card">
            <Truck size={32} className="text-white" />
          </div>
          <h1 className="text-[var(--font-2xl)] font-semibold text-[var(--color-text-primary)] tracking-tight leading-tight">
            Aarogya Sanchalak
          </h1>
          <p className="text-[var(--font-base)] text-[var(--color-text-muted)] mt-1">
            Driver Emergency Portal
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-critical)] animate-pulse"></span>
            <span className="text-[var(--font-sm)] text-[var(--color-critical)] font-semibold tracking-wide uppercase">
              Live System
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-bg-card)] rounded-[10px] p-6 shadow-card border border-[var(--color-border)]">
          <h2 className="text-[var(--color-text-primary)] font-semibold text-[var(--font-lg)] mb-6 flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
            <Shield size={20} className="text-[var(--color-brand)]" />
            Driver Authentication
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[var(--font-sm)] text-[var(--color-text-secondary)] font-medium mb-1.5" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="driver@hospital.in"
                className={clsx(
                  "w-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                  "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-base)]",
                  "focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-light)] transition-all"
                )}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[var(--font-sm)] text-[var(--color-text-secondary)] font-medium mb-1.5" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={clsx(
                    "w-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]",
                    "border border-[var(--color-border)] rounded-[8px] px-4 min-h-[48px] text-[var(--font-base)] pr-12",
                    "focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-light)] transition-all"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] flex items-center justify-center p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[var(--color-critical-light)] border border-[var(--color-critical)] rounded-[8px] px-4 py-3 flex items-start gap-3 mt-2">
                <AlertTriangle size={18} className="text-[var(--color-critical)] shrink-0 mt-0.5" />
                <p className="text-[var(--color-critical)] text-[var(--font-sm)] font-medium leading-snug">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className={clsx(
                "w-full mt-4 bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]",
                "font-semibold text-[var(--font-base)] rounded-[8px] min-h-[48px]",
                "transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2 shadow-sm"
              )}
            >
              {loading
                ? <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Authenticating...</>
                : 'Sign In'
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[var(--font-xs)] text-[var(--color-text-muted)]">
            Aarogya Sanchalak Clinical System · NEOFuture 2026
          </p>
        </div>
      </div>
    </div>
  );
}
