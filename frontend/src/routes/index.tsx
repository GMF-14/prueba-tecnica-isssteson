import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({
  component: Index,
});

// Placeholder temporal: se reemplaza por la pantalla de Login en el próximo paso.
function Index() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Button>Citas ISSSTESON</Button>
    </div>
  );
}
