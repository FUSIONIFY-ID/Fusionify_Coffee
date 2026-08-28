'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '@/lib/client-api';

type LoginResponse = {
  challengeToken: string;
  requiresTotpSetup: boolean;
  requiresTotp: boolean;
};

type TotpSetupResponse = {
  secret: string;
  otpauthUri: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'setup' | 'totp'>(
    'credentials',
  );
  const [challengeToken, setChallengeToken] = useState('');
  const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitCredentials(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await apiJson<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setChallengeToken(response.challengeToken);

      if (response.requiresTotpSetup) {
        const nextSetup = await apiJson<TotpSetupResponse>(
          '/api/auth/totp/setup',
          {
            method: 'POST',
            body: JSON.stringify({ challengeToken: response.challengeToken }),
          },
        );
        setSetup(nextSetup);
        setStep('setup');
      } else {
        setStep('totp');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyTotp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await apiJson<{ success: true }>('/api/auth/totp/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeToken, code }),
      });
      router.replace('/kds');
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Authenticator code rejected.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand-lockup auth-brand">
          <span className="brand-mark">F</span>
          <div>
            <strong>Fusionify Coffee</strong>
            <small>Staff Operations</small>
          </div>
        </div>

        {step === 'credentials' ? (
          <>
            <div className="page-heading compact">
              <p className="eyebrow">STAFF ACCESS</p>
              <h1>Sign in to your outlet</h1>
              <p>Password verification is followed by your authenticator code.</p>
            </div>
            <form className="form-stack" onSubmit={submitCredentials}>
              <label>
                Work email
                <input
                  autoComplete="username"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  autoComplete="current-password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button className="primary-button" disabled={busy}>
                {busy ? 'Checking…' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="page-heading compact">
              <p className="eyebrow">AUTHENTICATOR</p>
              <h1>{step === 'setup' ? 'Set up TOTP' : 'Enter 6-digit code'}</h1>
              <p>
                {step === 'setup'
                  ? 'Add this secret to your authenticator app once, then enter the current code.'
                  : 'Use the current code from your authenticator app.'}
              </p>
            </div>

            {step === 'setup' && setup ? (
              <div className="totp-secret">
                <span>Manual setup key</span>
                <code>{setup.secret}</code>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigator.clipboard.writeText(setup.secret)}
                >
                  Copy key
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setStep('totp')}
                >
                  I added it to my authenticator
                </button>
              </div>
            ) : (
              <form className="form-stack" onSubmit={verifyTotp}>
                <label>
                  Authenticator code
                  <input
                    className="otp-input"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, ''))
                    }
                  />
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                <button
                  className="primary-button"
                  disabled={busy || code.length !== 6}
                >
                  {busy ? 'Verifying…' : 'Verify & open KDS'}
                </button>
              </form>
            )}
          </>
        )}
      </section>

      <aside className="auth-context">
        <p className="eyebrow">FUSIONIFY COFFEE</p>
        <h2>One queue. Clear handoffs.</h2>
        <p>
          Orders move through Confirmed, Preparing, Ready, Picked Up, and
          Completed. Every server-side status change is recorded.
        </p>
      </aside>
    </main>
  );
}
