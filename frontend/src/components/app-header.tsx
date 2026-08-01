import type { ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Stethoscope } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ENLACES = [
  { to: '/', label: 'Citas' },
  { to: '/medicos', label: 'Médicos' },
  { to: '/pacientes', label: 'Pacientes' },
] as const;

interface AppHeaderProps {
  titulo: string;
  accion?: ReactNode;
}

export function AppHeader({ titulo, accion }: AppHeaderProps) {
  const navigate = useNavigate();
  const nombre = useAuthStore(state => state.nombre);

  const cerrarSesion = () => {
    useAuthStore.getState().logout();
    navigate({ to: '/login' });
  };

  return (
    <header className="bg-brand text-brand-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-foreground/10 flex size-10 shrink-0 items-center justify-center rounded-full">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">{titulo}</h1>
            <p className="text-brand-foreground/70 text-sm">
              Sesión de {nombre}
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {ENLACES.map(enlace => (
            <Link
              key={enlace.to}
              to={enlace.to}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-brand-foreground/10"
              activeProps={{ className: 'bg-brand-foreground/15' }}
              activeOptions={{ exact: enlace.to === '/' }}
            >
              {enlace.label}
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            'flex flex-wrap gap-2',
            accion && 'sm:flex-row-reverse'
          )}
        >
          {accion}
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
  );
}
