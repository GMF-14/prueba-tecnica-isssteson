import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoginResponse } from '@/features/auth/api';

interface AuthState {
  token: string | null;
  nombreUsuario: string | null;
  nombre: string | null;
  setSession: (sesion: LoginResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      nombreUsuario: null,
      nombre: null,
      setSession: sesion =>
        set({
          token: sesion.token,
          nombreUsuario: sesion.nombreUsuario,
          nombre: sesion.nombre,
        }),
      logout: () => set({ token: null, nombreUsuario: null, nombre: null }),
    }),
    { name: 'citas-auth' }
  )
);
