import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './auth-store';

const sesion = {
  token: 'token-de-prueba',
  nombreUsuario: 'admin',
  nombre: 'Administrador',
  expiraEn: '2030-01-01T00:00:00Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('empieza sin sesión activa', () => {
    const estado = useAuthStore.getState();

    expect(estado.token).toBeNull();
    expect(estado.nombreUsuario).toBeNull();
    expect(estado.nombre).toBeNull();
  });

  it('setSession guarda el token y los datos del usuario', () => {
    useAuthStore.getState().setSession(sesion);
    const estado = useAuthStore.getState();

    expect(estado.token).toBe(sesion.token);
    expect(estado.nombreUsuario).toBe(sesion.nombreUsuario);
    expect(estado.nombre).toBe(sesion.nombre);
  });

  it('logout limpia la sesión', () => {
    useAuthStore.getState().setSession(sesion);
    useAuthStore.getState().logout();
    const estado = useAuthStore.getState();

    expect(estado.token).toBeNull();
    expect(estado.nombreUsuario).toBeNull();
    expect(estado.nombre).toBeNull();
  });
});
