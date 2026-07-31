import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HeartPulse, Stethoscope } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { login } from '@/features/auth/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const loginSchema = z.object({
  nombreUsuario: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/login')({
  // Si ya hay una sesión activa, no tiene sentido mostrar el login de nuevo.
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore(state => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: data => {
      setSession(data);
      navigate({ to: '/' });
    },
  });

  const onSubmit = (values: LoginFormValues) => mutation.mutate(values);

  return (
    <div className="bg-muted flex min-h-svh flex-col lg:flex-row">
      {/* Panel de marca: solo visible en pantallas medianas en adelante. */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-brand text-brand-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-1/2"
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Stethoscope className="size-6" />
          Citas ISSSTESON
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="max-w-md"
        >
          <HeartPulse className="mb-4 size-12 opacity-90" />
          <h1 className="mb-3 text-3xl font-semibold text-balance">
            Sistema de administración de citas médicas
          </h1>
          <p className="text-brand-foreground/80 text-sm">
            Gestiona médicos, pacientes y citas en un solo lugar, con la agenda
            siempre a la vista.
          </p>
        </motion.div>

        <p className="text-brand-foreground/60 text-xs">
          ISSSTESON — Instituto de Seguridad y Servicios Sociales de los
          Trabajadores del Estado de Sonora
        </p>

        {/* Detalle decorativo, puramente visual. */}
        <div className="bg-brand-foreground/10 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
      </motion.div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <Card>
            <CardHeader>
              <div className="bg-brand/10 text-brand mb-2 flex size-10 items-center justify-center rounded-full lg:hidden">
                <Stethoscope className="size-5" />
              </div>
              <CardTitle className="text-xl">Iniciar sesión</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="nombreUsuario">Usuario</Label>
                  <Input
                    id="nombreUsuario"
                    autoComplete="username"
                    {...register('nombreUsuario')}
                  />
                  {errors.nombreUsuario && (
                    <p className="text-destructive text-sm">
                      {errors.nombreUsuario.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {mutation.isError && (
                  <p className="text-destructive text-sm">
                    Usuario o contraseña incorrectos.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
