import { User } from 'firebase/auth';
import { get, ref, update } from 'firebase/database';
import { db } from '../lib/firebase';

export type AuthMode = 'login' | 'signup';

export function mapFirebaseAuthError(error: unknown, mode: AuthMode) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: string }).code) : '';

  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (mode === 'login' && code === 'auth/user-not-found') return 'No account found with this email. Please sign up first.';
  if (mode === 'login' && code === 'auth/wrong-password') return 'Incorrect password. Please try again.';
  if (mode === 'login' && code === 'auth/invalid-credential') return 'Email or password is incorrect.';
  if (mode === 'login' && code === 'auth/user-disabled') return 'This account has been disabled.';
  if (mode === 'login' && code === 'auth/operation-not-allowed') return 'Email/password login is not enabled in Firebase.';
  if (mode === 'signup' && code === 'auth/email-already-in-use') return 'This email already has an account. Please log in instead.';
  if (mode === 'signup' && code === 'auth/weak-password') return 'Password should be at least 6 characters.';
  if (mode === 'signup' && code === 'auth/operation-not-allowed') return 'Email/password signup is not enabled in Firebase.';
  if (code === 'auth/network-request-failed') return 'Network error. Please check your connection.';

  return mode === 'login' ? 'Login failed. Please try again.' : 'Signup failed. Please try again.';
}

export async function ensureUserProfile(user: User, extraData: { name?: string } = {}) {
  const profileRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(profileRef);
  const now = Date.now();
  const existing = snapshot.exists() ? snapshot.val() : {};

  await update(profileRef, {
    name: extraData.name || user.displayName || existing.name || user.email?.split('@')[0] || 'Aquarist',
    email: user.email || existing.email || '',
    createdAt: existing.createdAt || now,
    updatedAt: now,
  });
}
