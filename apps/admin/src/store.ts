import { create } from 'zustand';

interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  setAuth: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const savedUser = localStorage.getItem('user');

export const useAuth = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: localStorage.getItem('token'),
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
