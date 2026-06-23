import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../lib/firebase';
import { ensureUserProfile } from '../services/userProfile';

const AuthContext = createContext<{ user: User | null; loading: boolean; logout: () => Promise<void> }>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);

        if (firebaseUser) {
          try {
            await ensureUserProfile(firebaseUser);
          } catch (error) {
            console.warn('User profile sync failed; auth session remains valid.', error);
          }
        }
      }),
    [],
  );

  const value = useMemo(
    () => ({ user, loading, logout: () => signOut(auth) }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
