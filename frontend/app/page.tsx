'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/lib/api';
import Image from 'next/image';

const CHARACTERS = [
  { key: 'tanjiro', name: 'Tanjiro', img: '/characters/tanjiro.png' },
  { key: 'nezuko', name: 'Nezuko', img: '/characters/nezuko.png' },
  { key: 'zenitsu', name: 'Zenitsu', img: '/characters/zenitsu.png' },
  { key: 'inosuke', name: 'Inosuke', img: '/characters/inosuke.png' },
];

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    character: 'tanjiro',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(registerForm);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <h1>🌸 KimetsuTask</h1>
          <p>Bloom Every Day. Slay Every Task.</p>
        </div>

        <div className="auth-card glass-card">
          <div className="auth-tabs">
            <button
              id="tab-login"
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); }}
            >
              Login
            </button>
            <button
              id="tab-register"
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && <div className="error-msg">⚠ {error}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} id="login-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  placeholder="demon@slayer.corp"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  id="login-password"
                  className="form-input"
                  type="password"
                  placeholder="••••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <button id="login-submit" className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Entering...' : '🌸 Enter Your Garden'}
              </button>
              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontWeight: 700 }}
                >
                  Join the garden ✨
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} id="register-form">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  id="reg-username"
                  className="form-input"
                  type="text"
                  placeholder="YourSlayerName"
                  value={registerForm.username}
                  onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  placeholder="demon@slayer.corp"
                  value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  id="reg-password"
                  className="form-input"
                  type="password"
                  placeholder="••••••••••"
                  value={registerForm.password}
                  onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Choose Your Character</label>
                <div className="characters-grid">
                  {CHARACTERS.map(c => (
                    <div
                      key={c.key}
                      id={`char-${c.key}`}
                      className={`character-option ${registerForm.character === c.key ? 'selected' : ''}`}
                      onClick={() => setRegisterForm({ ...registerForm, character: c.key })}
                    >
                      <img src={c.img} alt={c.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }} />
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button id="register-submit" className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? 'Joining...' : '🌸 Join the Garden'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '2px' }}>
          ✨ KIMETSU TASK GARDEN ✨
        </p>
      </div>
    </main>
  );
}
