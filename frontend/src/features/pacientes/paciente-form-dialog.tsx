import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import {
  actualizarPaciente,
  crearPaciente,
  type Paciente,
} from '@/features/pacientes/api';
import { notificar } from '@/lib/alertas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const pacienteSchema = z.object({
  nombreCompleto: z.string().min(1, 'El nombre es obligatorio').max(200),
  telefono: z.string().max(20).optional().or(z.literal('')),
  email: z
    .string()
    .email('Correo inválido')
    .max(200)
    .optional()
    .or(z.literal('')),
  activo: z.boolean(),
});

type PacienteFormValues = z.infer<typeof pacienteSchema>;

const valoresVacios: PacienteFormValues = {
  nombreCompleto: '',
  telefono: '',
  email: '',
  activo: true,
};

interface PacienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteExistente?: Paciente | null;
}

export function PacienteFormDialog({
  open,
  onOpenChange,
  pacienteExistente,
}: PacienteFormDialogProps) {
  const queryClient = useQueryClient();
  const esEdicion = Boolean(pacienteExistente);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: valoresVacios,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      pacienteExistente
        ? {
            nombreCompleto: pacienteExistente.nombreCompleto,
            telefono: pacienteExistente.telefono,
            email: pacienteExistente.email,
            activo: pacienteExistente.activo,
          }
        : valoresVacios
    );
  }, [open, pacienteExistente, reset]);

  const mutation = useMutation({
    mutationFn: (values: PacienteFormValues) => {
      const payload = {
        ...values,
        telefono: values.telefono ?? '',
        email: values.email ?? '',
      };
      return esEdicion
        ? actualizarPaciente(pacienteExistente!.id, payload)
        : crearPaciente(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      onOpenChange(false);
      notificar.fire({
        icon: 'success',
        title: esEdicion ? 'Paciente actualizado' : 'Paciente creado',
      });
    },
  });

  const onSubmit = (values: PacienteFormValues) => mutation.mutate(values);

  const mensajeError = axios.isAxiosError(mutation.error)
    ? ((mutation.error.response?.data as { mensaje?: string } | undefined)
        ?.mensaje ?? 'No se pudo guardar el paciente.')
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? 'Editar paciente' : 'Nuevo paciente'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="nombreCompleto">Nombre completo</Label>
            <Input id="nombreCompleto" {...register('nombreCompleto')} />
            {errors.nombreCompleto && (
              <p className="text-destructive text-sm">
                {errors.nombreCompleto.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" {...register('telefono')} />
            {errors.telefono && (
              <p className="text-destructive text-sm">
                {errors.telefono.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>

          {esEdicion && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded"
                {...register('activo')}
              />
              Activo
            </label>
          )}

          {mensajeError && (
            <p className="text-destructive text-sm">{mensajeError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Guardando...'
                : esEdicion
                  ? 'Guardar cambios'
                  : 'Crear paciente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
