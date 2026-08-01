import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Pencil, Plus, UserX } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import {
  desactivarPaciente,
  obtenerPacientes,
  type Paciente,
} from '@/features/pacientes/api';
import { PacienteFormDialog } from '@/features/pacientes/paciente-form-dialog';
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

export const Route = createFileRoute('/pacientes')({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: PacientesPage,
});

function PacientesPage() {
  const queryClient = useQueryClient();
  const [formAbierto, setFormAbierto] = useState(false);
  const [pacienteEnEdicion, setPacienteEnEdicion] = useState<Paciente | null>(
    null
  );

  const pacientesQuery = useQuery({
    queryKey: ['pacientes', { soloActivos: false }],
    queryFn: () => obtenerPacientes(false),
  });

  const desactivarMutation = useMutation({
    mutationFn: desactivarPaciente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      notificar.fire({ icon: 'success', title: 'Paciente desactivado' });
    },
  });

  const solicitarBaja = async (paciente: Paciente) => {
    const resultado = await confirmar.fire({
      icon: 'warning',
      title: '¿Desactivar este paciente?',
      text: paciente.nombreCompleto,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'No',
    });

    if (resultado.isConfirmed) {
      desactivarMutation.mutate(paciente.id);
    }
  };

  return (
    <div className="bg-muted min-h-svh">
      <AppHeader
        titulo="Pacientes"
        accion={
          <Button
            variant="secondary"
            onClick={() => {
              setPacienteEnEdicion(null);
              setFormAbierto(true);
            }}
          >
            <Plus className="size-4" />
            Nuevo paciente
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
          {pacientesQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : pacientesQuery.isError ? (
            <p className="text-destructive text-sm">
              No se pudieron cargar los pacientes.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientesQuery.data?.map(paciente => (
                  <TableRow key={paciente.id}>
                    <TableCell className="font-medium">
                      {paciente.nombreCompleto}
                    </TableCell>
                    <TableCell>{paciente.telefono || '—'}</TableCell>
                    <TableCell>{paciente.email || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={paciente.activo ? 'default' : 'secondary'}
                      >
                        {paciente.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Editar"
                          onClick={() => {
                            setPacienteEnEdicion(paciente);
                            setFormAbierto(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {paciente.activo && (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Desactivar"
                            disabled={desactivarMutation.isPending}
                            onClick={() => solicitarBaja(paciente)}
                          >
                            <UserX className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pacientesQuery.data?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground text-center"
                    >
                      No hay pacientes registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>

      <PacienteFormDialog
        open={formAbierto}
        onOpenChange={setFormAbierto}
        pacienteExistente={pacienteEnEdicion}
      />
    </div>
  );
}
