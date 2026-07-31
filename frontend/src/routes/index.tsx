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
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Stethoscope } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useAuthStore } from '@/stores/auth-store';
import { cancelarCita, consultarCitas, type Cita } from '@/features/citas/api';
import { obtenerMedicos } from '@/features/medicos/api';
import { CitaFormDialog } from '@/features/citas/cita-form-dialog';
import { confirmar, notificar } from '@/lib/alertas';
import { cn } from '@/lib/utils';
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

const contenedorVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

interface CitaEvento {
  id: number;
  title: string;
  start: Date;
  end: Date;
  cita: Cita;
}

function EventoCalendario({ event }: { event: CitaEvento }) {
  const cancelada = event.cita.estado === 'Cancelada';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'h-full w-full truncate rounded-md px-1.5 py-0.5 text-xs font-medium',
        cancelada
          ? 'bg-muted-foreground/30 text-foreground line-through'
          : 'bg-brand text-brand-foreground'
      )}
    >
      {event.title}
    </motion.div>
  );
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
  const [formAbierto, setFormAbierto] = useState(false);
  const [citaEnEdicion, setCitaEnEdicion] = useState<Cita | null>(null);

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
      notificar.fire({ icon: 'success', title: 'Cita cancelada' });
    },
  });

  const solicitarCancelacion = async (cita: Cita) => {
    const resultado = await confirmar.fire({
      icon: 'warning',
      title: '¿Cancelar esta cita?',
      text: `${cita.pacienteNombre} con ${cita.medicoNombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    });

    if (resultado.isConfirmed) {
      cancelarMutation.mutate(cita.id);
    }
  };

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
    <div className="bg-muted min-h-svh">
      <header className="bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-foreground/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">
                Citas ISSSTESON
              </h1>
              <p className="text-brand-foreground/70 text-sm">
                Sesión de {nombre}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCitaEnEdicion(null);
                setFormAbierto(true);
              }}
            >
              <Plus className="size-4" />
              Nueva cita
            </Button>
            <Button
              variant="ghost"
              className="text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
              onClick={() => useAuthStore.getState().logout()}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <motion.div
        variants={contenedorVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6"
      >
        <motion.div
          variants={itemVariants}
          className="bg-card flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:flex-wrap sm:items-end"
        >
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
              <SelectTrigger className="w-full sm:w-56">
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
          <AnimatePresence>
            {hayFiltrosActivos && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-card rounded-lg border p-4"
        >
          {citasQuery.isError ? (
            <p className="text-destructive text-sm">
              No se pudieron cargar las citas. Intenta de nuevo más tarde.
            </p>
          ) : (
            <div className="h-125 sm:h-162.5">
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
                style={{ height: '100%' }}
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
                components={{ event: EventoCalendario }}
                eventPropGetter={() => ({
                  style: {
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: 0,
                  },
                })}
                onSelectEvent={(evento: CitaEvento) =>
                  setCitaSeleccionada(evento.cita)
                }
              />
            </div>
          )}
        </motion.div>
      </motion.div>

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
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCitaEnEdicion(citaSeleccionada);
                        setCitaSeleccionada(null);
                        setFormAbierto(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={cancelarMutation.isPending}
                      onClick={() => solicitarCancelacion(citaSeleccionada)}
                    >
                      {cancelarMutation.isPending
                        ? 'Cancelando...'
                        : 'Cancelar cita'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CitaFormDialog
        open={formAbierto}
        onOpenChange={setFormAbierto}
        citaExistente={citaEnEdicion}
      />
    </div>
  );
}
