import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CitaFormDialog } from './cita-form-dialog';
import * as medicosApi from '@/features/medicos/api';
import * as pacientesApi from '@/features/pacientes/api';
import * as citasApi from '@/features/citas/api';

vi.mock('@/features/medicos/api', () => ({ obtenerMedicos: vi.fn() }));
vi.mock('@/features/pacientes/api', () => ({ obtenerPacientes: vi.fn() }));
vi.mock('@/features/citas/api', () => ({
  crearCita: vi.fn(),
  actualizarCita: vi.fn(),
}));
vi.mock('@/lib/alertas', () => ({
  notificar: { fire: vi.fn() },
  confirmar: { fire: vi.fn() },
}));

function renderDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <CitaFormDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>
  );
  return { onOpenChange };
}

// Los dos <Select> (médico y paciente) no traen un nombre accesible fiable en
// jsdom, así que se ubican por posición: el primer combobox es "Médico" y el
// segundo "Paciente" (ese es el orden en el que se renderizan en el formulario).
async function seleccionarMedicoYPaciente(
  user: ReturnType<typeof userEvent.setup>
) {
  const combos = screen.getAllByRole('combobox');

  await user.click(combos[0]);
  await user.click(
    await screen.findByRole('option', { name: /dra\. ana pérez/i })
  );

  await user.click(combos[1]);
  await user.click(await screen.findByRole('option', { name: /juan lópez/i }));
}

describe('CitaFormDialog', () => {
  beforeEach(() => {
    vi.mocked(medicosApi.obtenerMedicos).mockResolvedValue([
      {
        id: 1,
        nombreCompleto: 'Dra. Ana Pérez',
        especialidad: 'Pediatría',
        activo: true,
      },
    ]);
    vi.mocked(pacientesApi.obtenerPacientes).mockResolvedValue([
      {
        id: 1,
        nombreCompleto: 'Juan López',
        telefono: '',
        email: '',
        activo: true,
      },
    ]);
    vi.mocked(citasApi.crearCita).mockReset();
  });

  it('muestra errores de validación si se envía vacío', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /crear cita/i }));

    expect(
      await screen.findByText('El médico es obligatorio')
    ).toBeInTheDocument();
    expect(screen.getByText('El paciente es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La fecha es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('La hora es obligatoria')).toBeInTheDocument();
    expect(citasApi.crearCita).not.toHaveBeenCalled();
  });

  it('crea una cita con el médico, paciente, fecha y hora seleccionados', async () => {
    vi.mocked(citasApi.crearCita).mockResolvedValue({
      id: 1,
      medicoId: 1,
      medicoNombre: 'Dra. Ana Pérez',
      pacienteId: 1,
      pacienteNombre: 'Juan López',
      fechaHoraInicio: '2030-01-02T10:00:00',
      fechaHoraFin: '2030-01-02T10:30:00',
      estado: 'Programada',
    });

    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await screen.findByText('Selecciona un médico');
    await seleccionarMedicoYPaciente(user);

    fireEvent.change(screen.getByLabelText(/fecha/i), {
      target: { value: '2030-01-02' },
    });
    fireEvent.change(screen.getByLabelText(/hora/i), {
      target: { value: '10:00' },
    });

    await user.click(screen.getByRole('button', { name: /crear cita/i }));

    await waitFor(() => {
      expect(citasApi.crearCita).toHaveBeenCalledWith({
        medicoId: 1,
        pacienteId: 1,
        fechaHoraInicio: '2030-01-02T10:00:00',
      });
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('muestra el mensaje de error del backend cuando falla la creación', async () => {
    vi.mocked(citasApi.crearCita).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          mensaje: 'El médico ya tiene una cita programada en ese horario.',
        },
      },
    });

    const user = userEvent.setup();
    renderDialog();

    await screen.findByText('Selecciona un médico');
    await seleccionarMedicoYPaciente(user);

    fireEvent.change(screen.getByLabelText(/fecha/i), {
      target: { value: '2030-01-02' },
    });
    fireEvent.change(screen.getByLabelText(/hora/i), {
      target: { value: '10:00' },
    });

    await user.click(screen.getByRole('button', { name: /crear cita/i }));

    expect(
      await screen.findByText(
        'El médico ya tiene una cita programada en ese horario.'
      )
    ).toBeInTheDocument();
  });
});
