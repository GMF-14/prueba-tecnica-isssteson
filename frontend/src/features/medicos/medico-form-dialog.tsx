import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import {
  actualizarMedico,
  crearMedico,
  type Medico,
} from '@/features/medicos/api';
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

const medicoSchema = z.object({
  nombreCompleto: z.string().min(1, 'El nombre es obligatorio').max(200),
  especialidad: z.string().min(1, 'La especialidad es obligatoria').max(150),
  activo: z.boolean(),
});

type MedicoFormValues = z.infer<typeof medicoSchema>;

const valoresVacios: MedicoFormValues = {
  nombreCompleto: '',
  especialidad: '',
  activo: true,
};

interface MedicoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicoExistente?: Medico | null;
}

export function MedicoFormDialog({
  open,
  onOpenChange,
  medicoExistente,
}: MedicoFormDialogProps) {
  const queryClient = useQueryClient();
  const esEdicion = Boolean(medicoExistente);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicoFormValues>({
    resolver: zodResolver(medicoSchema),
    defaultValues: valoresVacios,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      medicoExistente
        ? {
            nombreCompleto: medicoExistente.nombreCompleto,
            especialidad: medicoExistente.especialidad,
            activo: medicoExistente.activo,
          }
        : valoresVacios
    );
  }, [open, medicoExistente, reset]);

  const mutation = useMutation({
    mutationFn: (values: MedicoFormValues) =>
      esEdicion
        ? actualizarMedico(medicoExistente!.id, values)
        : crearMedico(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      onOpenChange(false);
      notificar.fire({
        icon: 'success',
        title: esEdicion ? 'Médico actualizado' : 'Médico creado',
      });
    },
  });

  const onSubmit = (values: MedicoFormValues) => mutation.mutate(values);

  const mensajeError = axios.isAxiosError(mutation.error)
    ? ((mutation.error.response?.data as { mensaje?: string } | undefined)
        ?.mensaje ?? 'No se pudo guardar el médico.')
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? 'Editar médico' : 'Nuevo médico'}
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
            <Label htmlFor="especialidad">Especialidad</Label>
            <Input id="especialidad" {...register('especialidad')} />
            {errors.especialidad && (
              <p className="text-destructive text-sm">
                {errors.especialidad.message}
              </p>
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
                  : 'Crear médico'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
