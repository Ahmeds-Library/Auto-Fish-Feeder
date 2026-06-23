import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { Eye, EyeOff, Fish, LockKeyhole, Mail, ShieldCheck, Waves } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';

function loginMessage(error: unknown) {
  const code = error instanceof FirebaseError ? error.code : '';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/user-not-found') return 'No account found with this email. Please sign up first.';
  if (code === 'auth/wrong-password') return 'Incorrect password. Please try again.';
  if (code === 'auth/invalid-credential') return 'Email or password is incorrect.';
  if (code === 'auth/user-disabled') return 'This account has been disabled.';
  if (code === 'auth/operation-not-allowed') return 'Email/password login is not enabled in Firebase.';
  if (code === 'auth/network-request-failed') return 'Network error. Please check your connection.';
  return 'Login failed. Please try again.';
}

function signupMessage(error: unknown) {
  const code = error instanceof FirebaseError ? error.code : '';
  if (code === 'auth/email-already-in-use') return 'This email already has an account. Please log in instead.';
  if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/operation-not-allowed') return 'Email/password signup is not enabled in Firebase.';
  if (code === 'auth/network-request-failed') return 'Network error. Please check your connection.';
  return 'Signup failed. Please try again.';
}

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

    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(credential.user, { displayName: name });
        await set(ref(db, `users/${credential.user.uid}`), {
          name: name || email.split('@')[0],
          email,
          createdAt: Date.now(),
          devices: {},
        });
        await signOut(auth);
        setSuccess('Account created successfully. Please log in.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      const message = mode === 'login' ? loginMessage(err) : signupMessage(err);
      setError(message);
      setShowSignupPrompt(message.startsWith('No account found'));
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
              <Feature icon={LockKeyhole} text="No global `/feednow` or `/timers` paths" />
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="space-y-5 p-6 sm:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">AquaFeed Cloud</p>
            <h1 className="mt-2 text-3xl font-black">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
            <p className="mt-2 text-slate-300">Secure access for your private fleet of fish feeders.</p>
          </div>

          {success && <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-emerald-100">{success}</p>}
          {error && <p className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-rose-200">{error}</p>}

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
        {error && <p className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-rose-200">{error}</p>}
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-200">Email address</span>
          <input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
        <Link className="block text-center text-sm text-cyan-300 hover:text-cyan-100" to="/auth/login">Back to login</Link>
      </form>
    </div>
  );
}

export const LoginPage = () => <AuthShell mode="login" />;
export const SignupPage = () => <AuthShell mode="signup" />;
