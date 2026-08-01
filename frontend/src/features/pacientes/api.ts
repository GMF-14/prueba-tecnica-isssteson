import { apiClient } from '@/lib/api-client';

export interface Paciente {
  id: number;
  nombreCompleto: string;
  telefono: string;
  email: string;
  activo: boolean;
}

export interface CrearPacienteRequest {
  nombreCompleto: string;
  telefono: string;
  email: string;
}

export interface ActualizarPacienteRequest {
  nombreCompleto: string;
  telefono: string;
  email: string;
  activo: boolean;
}

export async function obtenerPacientes(
  soloActivos = true
): Promise<Paciente[]> {
  const { data } = await apiClient.get<Paciente[]>('/pacientes', {
    params: { soloActivos },
  });
  return data;
}

export async function crearPaciente(
  request: CrearPacienteRequest
): Promise<Paciente> {
  const { data } = await apiClient.post<Paciente>('/pacientes', request);
  return data;
}

export async function actualizarPaciente(
  id: number,
  request: ActualizarPacienteRequest
): Promise<Paciente> {
  const { data } = await apiClient.put<Paciente>(`/pacientes/${id}`, request);
  return data;
}

export async function desactivarPaciente(id: number): Promise<void> {
  await apiClient.delete(`/pacientes/${id}`);
}
