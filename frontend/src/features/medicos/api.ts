import { apiClient } from '@/lib/api-client';

export interface Medico {
  id: number;
  nombreCompleto: string;
  especialidad: string;
  activo: boolean;
}

export interface CrearMedicoRequest {
  nombreCompleto: string;
  especialidad: string;
}

export interface ActualizarMedicoRequest {
  nombreCompleto: string;
  especialidad: string;
  activo: boolean;
}

export async function obtenerMedicos(soloActivos = true): Promise<Medico[]> {
  const { data } = await apiClient.get<Medico[]>('/medicos', {
    params: { soloActivos },
  });
  return data;
}

export async function crearMedico(
  request: CrearMedicoRequest
): Promise<Medico> {
  const { data } = await apiClient.post<Medico>('/medicos', request);
  return data;
}

export async function actualizarMedico(
  id: number,
  request: ActualizarMedicoRequest
): Promise<Medico> {
  const { data } = await apiClient.put<Medico>(`/medicos/${id}`, request);
  return data;
}

export async function desactivarMedico(id: number): Promise<void> {
  await apiClient.delete(`/medicos/${id}`);
}
