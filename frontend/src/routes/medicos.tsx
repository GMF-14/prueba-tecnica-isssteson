import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Pencil, Plus, UserX } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import {
  desactivarMedico,
  obtenerMedicos,
  type Medico,
} from '@/features/medicos/api';
import { MedicoFormDialog } from '@/features/medicos/medico-form-dialog';
import { confirmar, notificar } from '@/lib/alertas';
import { AppHeader } from '@/components/app-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/medicos')({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: MedicosPage,
});

function MedicosPage() {
  const queryClient = useQueryClient();
  const [formAbierto, setFormAbierto] = useState(false);
  const [medicoEnEdicion, setMedicoEnEdicion] = useState<Medico | null>(null);

  const medicosQuery = useQuery({
    queryKey: ['medicos', { soloActivos: false }],
    queryFn: () => obtenerMedicos(false),
  });

  const desactivarMutation = useMutation({
    mutationFn: desactivarMedico,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      notificar.fire({ icon: 'success', title: 'Médico desactivado' });
    },
  });

  const solicitarBaja = async (medico: Medico) => {
    const resultado = await confirmar.fire({
      icon: 'warning',
      title: '¿Desactivar este médico?',
      text: medico.nombreCompleto,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'No',
    });

    if (resultado.isConfirmed) {
      desactivarMutation.mutate(medico.id);
    }
  };

  return (
    <div className="bg-muted min-h-svh">
      <AppHeader
        titulo="Médicos"
        accion={
          <Button
            variant="secondary"
            onClick={() => {
              setMedicoEnEdicion(null);
              setFormAbierto(true);
            }}
          >
            <Plus className="size-4" />
            Nuevo médico
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto max-w-6xl p-4 sm:p-6"
      >
        <div className="bg-card rounded-lg border p-4">
          {medicosQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : medicosQuery.isError ? (
            <p className="text-destructive text-sm">
              No se pudieron cargar los médicos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicosQuery.data?.map(medico => (
                  <TableRow key={medico.id}>
                    <TableCell className="font-medium">
                      {medico.nombreCompleto}
                    </TableCell>
                    <TableCell>{medico.especialidad}</TableCell>
                    <TableCell>
                      <Badge variant={medico.activo ? 'default' : 'secondary'}>
                        {medico.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Editar"
                          onClick={() => {
                            setMedicoEnEdicion(medico);
                            setFormAbierto(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {medico.activo && (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Desactivar"
                            disabled={desactivarMutation.isPending}
                            onClick={() => solicitarBaja(medico)}
                          >
                            <UserX className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {medicosQuery.data?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground text-center"
                    >
                      No hay médicos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>

      <MedicoFormDialog
        open={formAbierto}
        onOpenChange={setFormAbierto}
        medicoExistente={medicoEnEdicion}
      />
    </div>
  );
}
