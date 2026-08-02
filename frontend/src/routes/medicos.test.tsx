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
import * as medicosApi from '@/features/medicos/api';

vi.mock('@/features/medicos/api', () => ({
  obtenerMedicos: vi.fn(),
  crearMedico: vi.fn(),
  actualizarMedico: vi.fn(),
  desactivarMedico: vi.fn(),
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

describe('MedicosPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession({
      token: 'token-de-prueba',
      nombreUsuario: 'admin',
      nombre: 'Administrador',
      expiraEn: '2030-01-01T00:00:00Z',
    });
    vi.mocked(medicosApi.obtenerMedicos).mockReset();
    vi.mocked(medicosApi.crearMedico).mockReset();
  });

  it('muestra la lista de médicos', async () => {
    vi.mocked(medicosApi.obtenerMedicos).mockResolvedValue([
      {
        id: 1,
        nombreCompleto: 'Dra. Ana Pérez',
        especialidad: 'Pediatría',
        activo: true,
      },
    ]);

    renderApp('/medicos');

    expect(await screen.findByText('Dra. Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Pediatría')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay médicos registrados', async () => {
    vi.mocked(medicosApi.obtenerMedicos).mockResolvedValue([]);

    renderApp('/medicos');

    expect(
      await screen.findByText('No hay médicos registrados.')
    ).toBeInTheDocument();
  });

  it('crea un médico nuevo con los datos del formulario', async () => {
    vi.mocked(medicosApi.obtenerMedicos).mockResolvedValue([]);
    vi.mocked(medicosApi.crearMedico).mockResolvedValue({
      id: 2,
      nombreCompleto: 'Dr. Juan Gómez',
      especialidad: 'Cardiología',
      activo: true,
    });

    const user = userEvent.setup();
    renderApp('/medicos');

    await screen.findByText('No hay médicos registrados.');

    await user.click(screen.getByRole('button', { name: /nuevo médico/i }));
    await user.type(
      screen.getByLabelText(/nombre completo/i),
      'Dr. Juan Gómez'
    );
    await user.type(screen.getByLabelText(/especialidad/i), 'Cardiología');
    await user.click(screen.getByRole('button', { name: /crear médico/i }));

    await waitFor(() => {
      expect(medicosApi.crearMedico).toHaveBeenCalledWith({
        nombreCompleto: 'Dr. Juan Gómez',
        especialidad: 'Cardiología',
      });
    });
  });
});
