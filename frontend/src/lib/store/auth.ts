'use client';

import { useMemo } from 'react';
import { AUTH_STORAGE_KEY, clearAuth, setAuth as setAuthAction, type User } from '@/lib/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

type AuthFacade = {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
};

export function useAuthStore<T = AuthFacade>(selector?: (state: AuthFacade) => T): T {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  const facade = useMemo<AuthFacade>(
    () => ({
      user,
      token,
      setAuth: (nextUser: User, nextToken: string) => {
        localStorage.setItem('token', nextToken);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
        dispatch(setAuthAction({ user: nextUser, token: nextToken }));
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('auth-storage');
        dispatch(clearAuth());
      },
    }),
    [dispatch, token, user]
  );

  return selector ? selector(facade) : (facade as T);
}
