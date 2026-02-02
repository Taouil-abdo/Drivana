import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CLIENT' | 'DRIVER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  token: string | null;
}

export const AUTH_STORAGE_KEY = 'drivana-auth';

const initialState: AuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
    },
    hydrateAuth: (state, action: PayloadAction<AuthState>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
  },
});

export const { setAuth, clearAuth, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
