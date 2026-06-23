import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { Eye, EyeOff, Fish, LockKeyhole, Mail, ShieldCheck, Waves } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DeveloperCredit } from '../components/DeveloperCredit';
import { AlertMessage } from '../components/ui';
import { auth } from '../lib/firebase';
import { ensureUserProfile, mapFirebaseAuthError } from '../services/userProfile';

function AuthShell({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!success || mode !== 'signup') return;
    const timer = window.setTimeout(() => navigate('/auth/login'), 1600);
    return () => window.clearTimeout(timer);
  }, [mode, navigate, success]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setShowSignupPrompt(false);
    setLoading(true);

    if (mode === 'login') {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } catch (err) {
        const message = mapFirebaseAuthError(err, 'login');
        setError(message);
        setShowSignupPrompt(message.startsWith('No account found'));
      } finally {
        setLoading(false);
      }
      return;
    }

    let accountCreated = false;
    const setupWarnings: string[] = [];

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      accountCreated = true;

      if (name) {
        try {
          await updateProfile(credential.user, { displayName: name });
        } catch {
          setupWarnings.push('display name');
        }
      }

      try {
        await ensureUserProfile(credential.user, { name: name || email.split('@')[0] });
      } catch {
        setupWarnings.push('profile details');
      }

      try {
        await signOut(auth);
      } catch {
        setupWarnings.push('automatic sign out');
      }

      setSuccess(
        setupWarnings.length
          ? 'Account created successfully. Some profile details could not be saved, but you can log in.'
          : 'Account created successfully. Please log in.',
      );
    } catch (err) {
      if (accountCreated) {
        setSuccess('Account created successfully. Some profile details could not be saved, but you can log in.');
      } else {
        setError(mapFirebaseAuthError(err, 'signup'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4 sm:p-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden p-10 lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="inline-grid h-14 w-14 place-items-center rounded-3xl bg-cyan-300 text-slate-950 shadow-glow">
                <Fish size={30} />
              </span>
              <h1 className="mt-8 text-5xl font-black tracking-tight">A premium control room for every aquarium.</h1>
              <p className="mt-5 max-w-md leading-7 text-cyan-50/80">
                Sign in to manage private feeders, scoped commands, pairing codes, schedules, logs, and motor calibration.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-200">
              <Feature icon={ShieldCheck} text="Firebase Auth + owner-scoped devices" />
              <Feature icon={Waves} text="Dark glass aquarium dashboard" />
              <Feature icon={LockKeyhole} text="Per-device command paths only" />
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="space-y-5 p-6 sm:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">AquaFeed Cloud</p>
            <h1 className="mt-2 text-3xl font-black">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
            <p className="mt-2 text-slate-300">Secure access for your private fleet of fish feeders.</p>
          </div>

          {success && <AlertMessage tone="success">{success}</AlertMessage>}
          {error && <AlertMessage tone="danger">{error}</AlertMessage>}

          {mode === 'signup' && (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-200">Display name</span>
              <input className="field" placeholder="Home aquarist" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Email address</span>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input className="field pl-11" type="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                className="field pl-11 pr-14"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-300 hover:bg-white/10" type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === 'signup' && <span className="text-xs text-slate-400">Use at least 6 characters. Never reuse your Firebase device password.</span>}
          </label>

          <button className="btn-primary w-full" disabled={loading || !!success}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}
          </button>

          {showSignupPrompt && <Link className="btn-ghost block text-center" to="/auth/signup">Go to signup</Link>}

          <div className="space-y-2 text-center text-sm text-slate-400">
            {mode === 'login' ? (
              <>
                <Link className="text-cyan-300 hover:text-cyan-100" to="/auth/signup">Create an account</Link>
                <br />
                <Link className="text-cyan-300 hover:text-cyan-100" to="/auth/forgot-password">Forgot password?</Link>
              </>
            ) : (
              <Link className="text-cyan-300 hover:text-cyan-100" to="/auth/login">Already have an account? Login</Link>
            )}
          </div>

          <DeveloperCredit variant="auth" />
        </form>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-3 backdrop-blur-xl">
      <Icon className="text-cyan-200" size={18} />
      <span>{text}</span>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('If this email exists, a reset link has been sent.');
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      if (code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else if (code === 'auth/network-request-failed') setError('Network error. Please check your connection.');
      else setMessage('If this email exists, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-5 p-7">
        <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-300/20">
          <LockKeyhole size={24} />
        </span>
        <div>
          <h1 className="text-3xl font-black">Reset password</h1>
          <p className="mt-2 text-slate-300">Enter your email and we will send a reset link if the account exists.</p>
        </div>
        {message && <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-emerald-100">{message}</p>}
        {error && <AlertMessage tone="danger">{error}</AlertMessage>}
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-200">Email address</span>
          <input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
        <Link className="block text-center text-sm text-cyan-300 hover:text-cyan-100" to="/auth/login">Back to login</Link>
        <DeveloperCredit variant="auth" />
      </form>
    </div>
  );
}

export const LoginPage = () => <AuthShell mode="login" />;
export const SignupPage = () => <AuthShell mode="signup" />;
