import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: Index,
});

// Placeholder temporal: se reemplaza por la pantalla de lista de citas en el próximo paso.
function Index() {
  const nombre = useAuthStore(state => state.nombre);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p>Bienvenido, {nombre}. Aquí va la lista de citas (próximo paso).</p>
    </div>
  );
}
