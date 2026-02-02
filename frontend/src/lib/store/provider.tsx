'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { AUTH_STORAGE_KEY, hydrateAuth, type User } from '@/lib/store/authSlice';
import { store } from '@/lib/store/store';

function ReduxHydration() {
  useEffect(() => {
    const emptyState = { user: null, token: null };

    try {
      const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth) as { user: User; token: string };
        if (parsed?.user && parsed?.token) {
          store.dispatch(hydrateAuth(parsed));
          return;
        }
      }

      const legacy = localStorage.getItem('auth-storage');
      if (legacy) {
        const legacyParsed = JSON.parse(legacy) as {
          state?: { user?: User | null; token?: string | null };
        };
        const legacyUser = legacyParsed?.state?.user ?? null;
        const legacyToken = legacyParsed?.state?.token ?? localStorage.getItem('token');

        store.dispatch(
          hydrateAuth({
            user: legacyUser,
            token: legacyToken ?? null,
          })
        );
      }
    } catch {
      store.dispatch(hydrateAuth(emptyState));
    }
  }, []);

  return null;
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ReduxHydration />
      {children}
    </Provider>
  );
}
