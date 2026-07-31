import { apiClient } from '@/lib/api-client';

export type EstadoCita = 'Programada' | 'Cancelada';

export interface Cita {
  id: number;
  medicoId: number;
  medicoNombre: string;
  pacienteId: number;
  pacienteNombre: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: EstadoCita;
}

export interface ConsultarCitasParams {
  fechaDesde?: string;
  fechaHasta?: string;
  medicoId?: number;
}

export async function consultarCitas(
  params: ConsultarCitasParams
): Promise<Cita[]> {
  const { data } = await apiClient.get<Cita[]>('/citas', { params });
  return data;
}

export async function cancelarCita(id: number): Promise<Cita> {
  const { data } = await apiClient.post<Cita>(`/citas/${id}/cancelar`);
  return data;
}
