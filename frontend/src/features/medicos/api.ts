import { apiClient } from '@/lib/api-client';

export interface Medico {
  id: number;
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
