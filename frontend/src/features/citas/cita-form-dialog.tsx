import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import axios from 'axios';

import { actualizarCita, crearCita, type Cita } from '@/features/citas/api';
import { obtenerMedicos } from '@/features/medicos/api';
import { obtenerPacientes } from '@/features/pacientes/api';
import { notificar } from '@/lib/alertas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const citaSchema = z
  .object({
    medicoId: z.string().min(1, 'Selecciona un médico'),
    pacienteId: z.string().min(1, 'Selecciona un paciente'),
    fecha: z.string().min(1, 'La fecha es obligatoria'),
    hora: z.string().min(1, 'La hora es obligatoria'),
  })
  .refine(
    data => {
      if (!data.fecha) return true;
      const fecha = new Date(`${data.fecha}T00:00:00`);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return fecha >= hoy;
    },
    { message: 'La fecha no puede ser anterior a hoy', path: ['fecha'] }
  );

type CitaFormValues = z.infer<typeof citaSchema>;

const valoresVacios: CitaFormValues = {
  medicoId: '',
  pacienteId: '',
  fecha: '',
  hora: '',
};

interface CitaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citaExistente?: Cita | null;
}

export function CitaFormDialog({
  open,
  onOpenChange,
  citaExistente,
}: CitaFormDialogProps) {
  const queryClient = useQueryClient();
  const esEdicion = Boolean(citaExistente);

  const medicosQuery = useQuery({
    queryKey: ['medicos', { soloActivos: true }],
    queryFn: () => obtenerMedicos(true),
  });

  const pacientesQuery = useQuery({
    queryKey: ['pacientes', { soloActivos: true }],
    queryFn: () => obtenerPacientes(true),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CitaFormValues>({
    resolver: zodResolver(citaSchema),
    defaultValues: valoresVacios,
  });

  useEffect(() => {
    if (!open) return;

    if (citaExistente) {
      const inicio = new Date(citaExistente.fechaHoraInicio);
      reset({
        medicoId: String(citaExistente.medicoId),
        pacienteId: String(citaExistente.pacienteId),
        fecha: format(inicio, 'yyyy-MM-dd'),
        hora: format(inicio, 'HH:mm'),
      });
    } else {
      reset(valoresVacios);
    }
  }, [open, citaExistente, reset]);

  const mutation = useMutation({
    mutationFn: (values: CitaFormValues) => {
      const payload = {
        medicoId: Number(values.medicoId),
        pacienteId: Number(values.pacienteId),
        fechaHoraInicio: `${values.fecha}T${values.hora}:00`,
      };

      return esEdicion
        ? actualizarCita(citaExistente!.id, payload)
        : crearCita(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      onOpenChange(false);
      notificar.fire({
        icon: 'success',
        title: esEdicion ? 'Cita actualizada' : 'Cita creada',
      });
    },
  });

  const onSubmit = (values: CitaFormValues) => mutation.mutate(values);

  const mensajeError = axios.isAxiosError(mutation.error)
    ? ((mutation.error.response?.data as { mensaje?: string } | undefined)
        ?.mensaje ?? 'No se pudo guardar la cita.')
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label>Médico</Label>
            <Controller
              control={control}
              name="medicoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicosQuery.data?.map(medico => (
                      <SelectItem key={medico.id} value={String(medico.id)}>
                        {medico.nombreCompleto} — {medico.especialidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.medicoId && (
              <p className="text-destructive text-sm">
                {errors.medicoId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <Controller
              control={control}
              name="pacienteId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientesQuery.data?.map(paciente => (
                      <SelectItem key={paciente.id} value={String(paciente.id)}>
                        {paciente.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.pacienteId && (
              <p className="text-destructive text-sm">
                {errors.pacienteId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" {...register('fecha')} />
              {errors.fecha && (
                <p className="text-destructive text-sm">
                  {errors.fecha.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hora">Hora</Label>
              <Input id="hora" type="time" {...register('hora')} />
              {errors.hora && (
                <p className="text-destructive text-sm">
                  {errors.hora.message}
                </p>
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Cada cita dura 30 minutos automáticamente.
          </p>

          {mensajeError && (
            <p className="text-destructive text-sm">{mensajeError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Guardando...'
                : esEdicion
                  ? 'Guardar cambios'
                  : 'Crear cita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
