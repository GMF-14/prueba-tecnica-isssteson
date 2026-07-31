import type { ToolbarProps, View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NOMBRES_VISTA: Record<string, string> = {
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
};

export function CalendarioToolbar<TEvent extends object = object>({
  label,
  view,
  views,
  onNavigate,
  onView,
}: ToolbarProps<TEvent, object>) {
  // "views" puede llegar como arreglo (nuestro caso) o como objeto de banderas;
  // se normaliza para poder listar las opciones del selector.
  const listaVistas: View[] = Array.isArray(views)
    ? views
    : (Object.keys(views) as View[]);

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('PREV')}
          aria-label="Periodo anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" onClick={() => onNavigate('TODAY')}>
          Hoy
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('NEXT')}
          aria-label="Periodo siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-1 text-sm font-medium capitalize sm:text-base">
          {label}
        </span>
      </div>

      <Select value={view} onValueChange={value => onView(value as View)}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {listaVistas.map(v => (
            <SelectItem key={v} value={v}>
              {NOMBRES_VISTA[v] ?? v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
