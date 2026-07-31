import Swal from 'sweetalert2';

// Instancias preconfiguradas de SweetAlert2 con el color institucional,
// para no repetir la configuración en cada pantalla.
export const confirmar = Swal.mixin({
  confirmButtonColor: 'rgb(135 37 50)',
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
});

export const notificar = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});
