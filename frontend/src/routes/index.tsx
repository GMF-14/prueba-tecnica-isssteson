import { createFileRoute, redirect } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
} from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useAuthStore } from '@/stores/auth-store';
import { cancelarCita, consultarCitas, type Cita } from '@/features/citas/api';
import { obtenerMedicos } from '@/features/medicos/api';
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

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: ListaCitasPage,
});

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
});

interface CitaEvento {
  id: number;
  title: string;
  start: Date;
  end: Date;
  cita: Cita;
}

function ListaCitasPage() {
  const queryClient = useQueryClient();
  const nombre = useAuthStore(state => state.nombre);

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [medicoId, setMedicoId] = useState('todos');
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [vista, setVista] = useState<View>(Views.WEEK);
  const [fecha, setFecha] = useState(new Date());

  const medicosQuery = useQuery({
    queryKey: ['medicos', { soloActivos: true }],
    queryFn: () => obtenerMedicos(true),
  });

  const citasQuery = useQuery({
    queryKey: ['citas', { fechaDesde, fechaHasta, medicoId }],
    queryFn: () =>
      consultarCitas({
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        medicoId: medicoId !== 'todos' ? Number(medicoId) : undefined,
      }),
  });

  const cancelarMutation = useMutation({
    mutationFn: cancelarCita,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      setCitaSeleccionada(null);
    },
  });

  const eventos = useMemo<CitaEvento[]>(
    () =>
      (citasQuery.data ?? []).map(cita => ({
        id: cita.id,
        title: `${cita.pacienteNombre} — ${cita.medicoNombre}`,
        start: new Date(cita.fechaHoraInicio),
        end: new Date(cita.fechaHoraFin),
        cita,
      })),
    [citasQuery.data]
  );

  const hayFiltrosActivos =
    fechaDesde !== '' || fechaHasta !== '' || medicoId !== 'todos';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Citas</h1>
          <p className="text-muted-foreground text-sm">Sesión de {nombre}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => useAuthStore.getState().logout()}
        >
          Cerrar sesión
        </Button>
      </header>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="fechaDesde">Desde</Label>
          <Input
            id="fechaDesde"
            type="date"
            value={fechaDesde}
            onChange={event => setFechaDesde(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fechaHasta">Hasta</Label>
          <Input
            id="fechaHasta"
            type="date"
            value={fechaHasta}
            onChange={event => setFechaHasta(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Médico</Label>
          <Select value={medicoId} onValueChange={setMedicoId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todos los médicos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los médicos</SelectItem>
              {medicosQuery.data?.map(medico => (
                <SelectItem key={medico.id} value={String(medico.id)}>
                  {medico.nombreCompleto} — {medico.especialidad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hayFiltrosActivos && (
          <Button
            variant="ghost"
            onClick={() => {
              setFechaDesde('');
              setFechaHasta('');
              setMedicoId('todos');
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="rounded-lg border p-4">
        {citasQuery.isError ? (
          <p className="text-destructive text-sm">
            No se pudieron cargar las citas. Intenta de nuevo más tarde.
          </p>
        ) : (
          <Calendar
            localizer={localizer}
            culture="es"
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            date={fecha}
            onNavigate={setFecha}
            view={vista}
            onView={setVista}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            style={{ height: 650 }}
            messages={{
              next: 'Sig.',
              previous: 'Ant.',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Cita',
              noEventsInRange: 'No hay citas en este rango.',
            }}
            eventPropGetter={(evento: CitaEvento) => ({
              className:
                evento.cita.estado === 'Cancelada'
                  ? 'opacity-50 line-through'
                  : '',
            })}
            onSelectEvent={(evento: CitaEvento) =>
              setCitaSeleccionada(evento.cita)
            }
          />
        )}
      </div>

      <Dialog
        open={citaSeleccionada !== null}
        onOpenChange={open => !open && setCitaSeleccionada(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de la cita</DialogTitle>
          </DialogHeader>

          {citaSeleccionada && (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Médico</dt>
                  <dd>{citaSeleccionada.medicoNombre}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Paciente</dt>
                  <dd>{citaSeleccionada.pacienteNombre}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Horario</dt>
                  <dd>
                    {format(
                      new Date(citaSeleccionada.fechaHoraInicio),
                      'dd/MM/yyyy HH:mm'
                    )}{' '}
                    - {format(new Date(citaSeleccionada.fechaHoraFin), 'HH:mm')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd>{citaSeleccionada.estado}</dd>
                </div>
              </dl>

              <DialogFooter>
                {citaSeleccionada.estado === 'Programada' && (
                  <Button
                    variant="destructive"
                    disabled={cancelarMutation.isPending}
                    onClick={() => cancelarMutation.mutate(citaSeleccionada.id)}
                  >
                    {cancelarMutation.isPending
                      ? 'Cancelando...'
                      : 'Cancelar cita'}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
