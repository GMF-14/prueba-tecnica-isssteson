import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { useAuthStore } from '@/stores/auth-store';
import * as authApi from '@/features/auth/api';

vi.mock('@/features/auth/api', () => ({
  login: vi.fn(),
}));

vi.mock('@/features/medicos/api', () => ({
  obtenerMedicos: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/citas/api', () => ({
  consultarCitas: vi.fn().mockResolvedValue([]),
  crearCita: vi.fn(),
  actualizarCita: vi.fn(),
  cancelarCita: vi.fn(),
}));

function renderApp(initialPath: string) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.mocked(authApi.login).mockReset();
  });

  it('muestra errores de validación si se envía vacío', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await screen.findByText(/iniciar sesión/i);
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(
      await screen.findByText('El usuario es obligatorio')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('La contraseña es obligatoria')
    ).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('guarda la sesión y navega al iniciar sesión correctamente', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'token-123',
      nombreUsuario: 'admin',
      nombre: 'Administrador',
      expiraEn: '2030-01-01T00:00:00Z',
    });

    const user = userEvent.setup();
    renderApp('/login');

    await screen.findByText(/iniciar sesión/i);
    await user.type(screen.getByLabelText(/usuario/i), 'admin');
    await user.type(screen.getByLabelText(/contraseña/i), 'Admin123!');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('token-123');
    });

    expect(
      await screen.findByText(/sesión de administrador/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });

  it('muestra un mensaje de error si las credenciales son incorrectas', async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new Error('Credenciales inválidas')
    );

    const user = userEvent.setup();
    renderApp('/login');

    await screen.findByText(/iniciar sesión/i);
    await user.type(screen.getByLabelText(/usuario/i), 'admin');
    await user.type(screen.getByLabelText(/contraseña/i), 'incorrecta');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(
      await screen.findByText(/usuario o contraseña incorrectos/i)
    ).toBeInTheDocument();
  });
});
