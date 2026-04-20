'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type Mode = 'signin' | 'signup';

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (mode === 'signup' && !name.trim()) e.name = 'Name is required.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email.';
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    if (mode === 'signup') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.error ?? 'Something went wrong.' });
        setLoading(false);
        return;
      }
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setErrors({ form: 'Invalid email or password.' });
    } else {
      router.refresh();
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span
          style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          or continue with email
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setErrors({});
          }}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '12px',
            border: '2px solid',
            borderColor: mode === 'signin' ? 'var(--fuchsia)' : 'var(--border)',
            background: mode === 'signin' ? 'var(--fuchsia-bg)' : 'transparent',
            color: mode === 'signin' ? 'var(--fuchsia)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setErrors({});
          }}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '12px',
            border: '2px solid',
            borderColor: mode === 'signup' ? 'var(--fuchsia)' : 'var(--border)',
            background: mode === 'signup' ? 'var(--fuchsia-bg)' : 'transparent',
            color: mode === 'signup' ? 'var(--fuchsia)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Sign up
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {mode === 'signup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle(!!errors.name)}
            />
            {errors.name && <span style={errorStyle}>{errors.name}</span>}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle(!!errors.email)}
          />
          {errors.email && <span style={errorStyle}>{errors.email}</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle(!!errors.password)}
          />
          {errors.password && <span style={errorStyle}>{errors.password}</span>}
        </div>

        {errors.form && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#FFF0F0',
              border: '1px solid #FFCCCC',
              color: '#CC0000',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
            }}
          >
            {errors.form}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: loading
              ? 'var(--text-muted)'
              : 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    padding: '11px 14px',
    borderRadius: '12px',
    border: `2px solid ${hasError ? '#FF4444' : 'var(--border)'}`,
    background: '#fff',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };
}

const errorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#CC0000',
  fontFamily: 'var(--font-body)',
  paddingLeft: '4px',
};
