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
import { CalendarX, Plus, Stethoscope, X } from 'lucide-react';
import { z } from 'zod';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useAuthStore } from '@/stores/auth-store';
import { cancelarCita, consultarCitas, type Cita } from '@/features/citas/api';
import { obtenerMedicos } from '@/features/medicos/api';
import { CitaFormDialog } from '@/features/citas/cita-form-dialog';
import { CalendarioToolbar } from '@/features/citas/calendario-toolbar';
import { confirmar, notificar } from '@/lib/alertas';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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

// Los filtros viven en la URL (search params) en vez de useState: así se
// pueden compartir, guardar en favoritos, y sobreviven a un refresh.
const citasSearchSchema = z.object({
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  medicoId: z.string().optional(),
  estado: z.enum(['todas', 'Programada', 'Cancelada']).optional(),
});

type CitasSearch = z.infer<typeof citasSearchSchema>;

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) =>
    citasSearchSchema.parse(search),
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
        'h-full w-full truncate rounded-md px-1.5 py-0.5 text-xs leading-tight font-medium',
        cancelada
          ? 'bg-muted-foreground/25 text-muted-foreground line-through'
          : 'bg-brand text-brand-foreground'
      )}
    >
      {event.title}
    </motion.div>
  );
}

function ListaCitasPage() {
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const nombre = useAuthStore(state => state.nombre);

  const cerrarSesion = () => {
    useAuthStore.getState().logout();
    navigate({ to: '/login' });
  };

  const {
    fechaDesde = '',
    fechaHasta = '',
    medicoId = 'todos',
    estado = 'todas',
  } = Route.useSearch();

  // Actualiza uno o más filtros a la vez, conservando los demás en la URL.
  // "replace" evita llenar el historial del navegador con cada tecleo/cambio.
  const actualizarFiltros = (cambios: Partial<CitasSearch>) => {
    navigate({
      search: previo => ({ ...previo, ...cambios }) as CitasSearch,
      replace: true,
    });
  };

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
    // Cierra el diálogo de detalle (Radix) antes de abrir el de SweetAlert2:
    // si ambos quedan abiertos al mismo tiempo, el "detector de clic afuera"
    // de Radix intercepta el primer clic en el botón de confirmar y lo absorbe.
    setCitaSeleccionada(null);

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

  const citasFiltradas = useMemo(
    () =>
      (citasQuery.data ?? []).filter(
        cita => estado === 'todas' || cita.estado === estado
      ),
    [citasQuery.data, estado]
  );

  const eventos = useMemo<CitaEvento[]>(
    () =>
      citasFiltradas.map(cita => ({
        id: cita.id,
        title: `${cita.pacienteNombre} — ${cita.medicoNombre}`,
        start: new Date(cita.fechaHoraInicio),
        end: new Date(cita.fechaHoraFin),
        cita,
      })),
    [citasFiltradas]
  );

  const limpiarFiltros = () =>
    navigate({ search: { medicoId: 'todos', estado: 'todas' }, replace: true });

  const medicoSeleccionado = medicosQuery.data?.find(
    m => String(m.id) === medicoId
  );

  const chips = [
    fechaDesde && {
      key: 'desde',
      label: `Desde: ${fechaDesde}`,
      onRemove: () => actualizarFiltros({ fechaDesde: undefined }),
    },
    fechaHasta && {
      key: 'hasta',
      label: `Hasta: ${fechaHasta}`,
      onRemove: () => actualizarFiltros({ fechaHasta: undefined }),
    },
    medicoId !== 'todos' && {
      key: 'medico',
      label: `Médico: ${medicoSeleccionado?.nombreCompleto ?? medicoId}`,
      onRemove: () => actualizarFiltros({ medicoId: 'todos' }),
    },
    estado !== 'todas' && {
      key: 'estado',
      label: `Estado: ${estado}`,
      onRemove: () => actualizarFiltros({ estado: 'todas' }),
    },
  ].filter(
    (chip): chip is { key: string; label: string; onRemove: () => void } =>
      Boolean(chip)
  );

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
              onClick={cerrarSesion}
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
          className="bg-card flex flex-col gap-4 rounded-lg border p-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="fechaDesde">Desde</Label>
              <Input
                id="fechaDesde"
                type="date"
                value={fechaDesde}
                onChange={event =>
                  actualizarFiltros({
                    fechaDesde: event.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaHasta">Hasta</Label>
              <Input
                id="fechaHasta"
                type="date"
                value={fechaHasta}
                onChange={event =>
                  actualizarFiltros({
                    fechaHasta: event.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Médico</Label>
              <Select
                value={medicoId}
                onValueChange={value => actualizarFiltros({ medicoId: value })}
              >
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
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={estado}
                onValueChange={value =>
                  actualizarFiltros({ estado: value as CitasSearch['estado'] })
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Programada">Programada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AnimatePresence>
            {chips.length > 0 && (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2"
              >
                {chips.map(chip => (
                  <motion.div
                    key={chip.key}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Badge variant="secondary" className="gap-1 py-1 pr-1">
                      {chip.label}
                      <button
                        type="button"
                        onClick={chip.onRemove}
                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                        aria-label={`Quitar filtro ${chip.label}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                  Limpiar todo
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-card rounded-lg border p-4"
        >
          {citasQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-125 w-full sm:h-162.5" />
            </div>
          ) : citasQuery.isError ? (
            <p className="text-destructive text-sm">
              No se pudieron cargar las citas. Intenta de nuevo más tarde.
            </p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">
                  {eventos.length}{' '}
                  {eventos.length === 1
                    ? 'cita encontrada'
                    : 'citas encontradas'}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-brand size-2.5 rounded-full" />
                    Programada
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="bg-muted-foreground/40 size-2.5 rounded-full" />
                    Cancelada
                  </span>
                </div>
              </div>

              {eventos.length === 0 && (
                <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
                  <CalendarX className="size-4" />
                  No hay citas que coincidan con los filtros actuales.
                </div>
              )}

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
                    date: 'Fecha',
                    time: 'Hora',
                    event: 'Cita',
                    noEventsInRange: 'No hay citas en este rango.',
                  }}
                  components={{
                    event: EventoCalendario,
                    toolbar: CalendarioToolbar,
                  }}
                  onSelectEvent={(evento: CitaEvento) =>
                    setCitaSeleccionada(evento.cita)
                  }
                />
              </div>
            </>
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
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Médico</dt>
                  <dd>{citaSeleccionada.medicoNombre}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Paciente</dt>
                  <dd>{citaSeleccionada.pacienteNombre}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Horario</dt>
                  <dd>
                    {format(
                      new Date(citaSeleccionada.fechaHoraInicio),
                      'dd/MM/yyyy HH:mm'
                    )}{' '}
                    - {format(new Date(citaSeleccionada.fechaHoraFin), 'HH:mm')}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd>
                    <Badge
                      variant={
                        citaSeleccionada.estado === 'Cancelada'
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {citaSeleccionada.estado}
                    </Badge>
                  </dd>
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
