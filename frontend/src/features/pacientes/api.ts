import { apiClient } from '@/lib/api-client';

export interface Paciente {
  id: number;
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
