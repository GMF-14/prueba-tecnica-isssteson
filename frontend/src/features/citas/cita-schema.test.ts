import { describe, expect, it } from 'vitest';
import { format } from 'date-fns';
import { citaSchema } from './cita-form-dialog';

function fechaHace(dias: number) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return format(fecha, 'yyyy-MM-dd');
}

describe('citaSchema', () => {
  it('acepta datos válidos con fecha de hoy en adelante', () => {
    const resultado = citaSchema.safeParse({
      medicoId: '1',
      pacienteId: '2',
      fecha: fechaHace(0),
      hora: '10:00',
    });

    expect(resultado.success).toBe(true);
  });

  it('rechaza una fecha anterior a hoy', () => {
    const resultado = citaSchema.safeParse({
      medicoId: '1',
      pacienteId: '2',
      fecha: fechaHace(-1),
      hora: '10:00',
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe(
        'La fecha no puede ser anterior a hoy'
      );
    }
  });

  it('rechaza cuando falta el médico', () => {
    const resultado = citaSchema.safeParse({
      medicoId: '',
      pacienteId: '2',
      fecha: fechaHace(1),
      hora: '10:00',
    });

    expect(resultado.success).toBe(false);
  });

  it('rechaza cuando falta el paciente', () => {
    const resultado = citaSchema.safeParse({
      medicoId: '1',
      pacienteId: '',
      fecha: fechaHace(1),
      hora: '10:00',
    });

    expect(resultado.success).toBe(false);
  });
});
