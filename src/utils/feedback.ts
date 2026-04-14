import Swal from 'sweetalert2';

const userToast = Swal.mixin({
  toast: true,
  position: 'center',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  },
});

export { userToast };

export const showAddToCartFeedback = async (
  dishName: string,
  nextQuantity: number,
  wasExisting: boolean,
): Promise<void> => {
  await userToast.fire({
    icon: 'success',
    title: wasExisting
      ? `${dishName} ahora tiene ${nextQuantity} ${nextQuantity === 1 ? 'unidad' : 'unidades'}`
      : `${dishName} fue agregado al pedido`,
    timer: 1600,
  });
};

export const showStockLimitFeedback = async (
  dishName: string,
  isSoldOut: boolean,
  remainingStock = 0,
): Promise<void> => {
  await userToast.fire({
    icon: isSoldOut ? 'error' : 'warning',
    title: isSoldOut
      ? `${dishName} está agotado`
      : remainingStock > 0
        ? `Solo quedan ${remainingStock} ${remainingStock === 1 ? 'plato disponible' : 'platos disponibles'} de ${dishName}`
        : `Ya no puedes agregar más unidades de ${dishName}`,
    timer: 1800,
  });
};

export const triggerCompletionFeedback = (): void => {
  try {
    if ('vibrate' in navigator) navigator.vibrate([120, 60, 120]);
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.03;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    /* noop */
  }
};
