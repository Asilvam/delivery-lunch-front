import axios from 'axios';
import Swal from 'sweetalert2';
export async function showActionError(error: unknown) {
  const message = axios.isAxiosError(error) && error.response?.status === 401
    ? 'Tu sesión venció. Inicia sesión nuevamente.'
    : 'No pudimos completar la acción. El pedido sigue disponible; intenta nuevamente.';
  await Swal.fire({ icon: 'error', title: 'No se pudo actualizar el pedido', text: message, confirmButtonText: 'Entendido' });
}
export function showActionSuccess(title: string) {
  return Swal.fire({ toast: true, position: 'top-end', icon: 'success', title, timer: 2500, showConfirmButton: false });
}
