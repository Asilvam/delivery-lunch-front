import { useCallback, useEffect, useRef, useState } from "react";

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function useKitchenBell() {
  const [enabled, setEnabled] = useState(true);
  const [activating, setActivating] = useState(false);
  const context = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);
  const activatingRef = useRef(false);
  const mounted = useRef(false);

  const getAudio = useCallback(() => {
    if (!context.current || context.current.state === "closed") {
      const Audio =
        window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!Audio)
        throw new Error("Este navegador no permite activar el timbre.");
      context.current = new Audio();
    }
    return context.current;
  }, []);

  useEffect(() => {
    mounted.current = true;
    enabledRef.current = true;
    const unlock = () => {
      if (!enabledRef.current) return;
      try {
        void getAudio()
          .resume()
          .catch(() => {});
      } catch {
        /* El navegador puede requerir interacción. */
      }
    };
    unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      mounted.current = false;
      enabledRef.current = false;
      const audio = context.current;
      context.current = null;
      if (audio && audio.state !== "closed") void audio.close().catch(() => {});
    };
  }, [getAudio]);

  const ring = useCallback(() => {
    const audio = context.current;
    if (!enabledRef.current || !audio) return;
    // No se encolan timbres mientras el navegador mantiene el audio suspendido.
    if (audio.state !== "running") return;
    try {
      const now = audio.currentTime;
      for (const [offset, frequency] of [
        [0, 880],
        [0.18, 1174.66],
      ]) {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + offset);
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.18, now + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.36);
      }
    } catch {
      context.current = null;
      void audio.close().catch(() => {});
    }
  }, []);

  const toggle = useCallback(async () => {
    if (activatingRef.current) return;
    if (enabledRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      const audio = context.current;
      context.current = null;
      if (audio && audio.state !== "closed") await audio.close();
      return;
    }

    activatingRef.current = true;
    setActivating(true);
    let audio: AudioContext | null = null;
    try {
      // Se crea y reactiva dentro del clic, necesario en Safari y otros móviles.
      audio = getAudio();
      await audio.resume();
      if (!mounted.current || context.current !== audio) return;
      if (audio.state !== "running")
        throw new Error("No pudimos activar el timbre. Intenta nuevamente.");
      enabledRef.current = true;
      setEnabled(true);
      ring();
    } catch (error) {
      if (context.current === audio) context.current = null;
      if (audio && audio.state !== "closed") void audio.close().catch(() => {});
      throw error;
    } finally {
      activatingRef.current = false;
      if (mounted.current) setActivating(false);
    }
  }, [getAudio, ring]);

  return { enabled, activating, toggle, ring };
}
