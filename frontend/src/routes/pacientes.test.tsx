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
import * as pacientesApi from '@/features/pacientes/api';

vi.mock('@/features/pacientes/api', () => ({
  obtenerPacientes: vi.fn(),
  crearPaciente: vi.fn(),
  actualizarPaciente: vi.fn(),
  desactivarPaciente: vi.fn(),
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

describe('PacientesPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession({
      token: 'token-de-prueba',
      nombreUsuario: 'admin',
      nombre: 'Administrador',
      expiraEn: '2030-01-01T00:00:00Z',
    });
    vi.mocked(pacientesApi.obtenerPacientes).mockReset();
    vi.mocked(pacientesApi.crearPaciente).mockReset();
  });

  it('muestra la lista de pacientes', async () => {
    vi.mocked(pacientesApi.obtenerPacientes).mockResolvedValue([
      {
        id: 1,
        nombreCompleto: 'Juan López',
        telefono: '6621234567',
        email: 'juan@test.com',
        activo: true,
      },
    ]);

    renderApp('/pacientes');

    expect(await screen.findByText('Juan López')).toBeInTheDocument();
    expect(screen.getByText('6621234567')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay pacientes registrados', async () => {
    vi.mocked(pacientesApi.obtenerPacientes).mockResolvedValue([]);

    renderApp('/pacientes');

    expect(
      await screen.findByText('No hay pacientes registrados.')
    ).toBeInTheDocument();
  });

  it('crea un paciente nuevo con los datos del formulario', async () => {
    vi.mocked(pacientesApi.obtenerPacientes).mockResolvedValue([]);
    vi.mocked(pacientesApi.crearPaciente).mockResolvedValue({
      id: 2,
      nombreCompleto: 'María Hernández',
      telefono: '',
      email: '',
      activo: true,
    });

    const user = userEvent.setup();
    renderApp('/pacientes');

    await screen.findByText('No hay pacientes registrados.');

    await user.click(screen.getByRole('button', { name: /nuevo paciente/i }));
    await user.type(
      screen.getByLabelText(/nombre completo/i),
      'María Hernández'
    );
    await user.click(screen.getByRole('button', { name: /crear paciente/i }));

    await waitFor(() => {
      expect(pacientesApi.crearPaciente).toHaveBeenCalledWith({
        nombreCompleto: 'María Hernández',
        telefono: '',
        email: '',
      });
    });
  });
});
