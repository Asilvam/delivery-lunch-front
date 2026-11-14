import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useKitchenBell } from "./useKitchenBell";

const oscillatorNode = () => ({
  type: "sine",
  frequency: { setValueAtTime: vi.fn() },
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  onended: null as (() => void) | null,
});

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state = "suspended";
  currentTime = 1;
  destination = {};
  oscillators: ReturnType<typeof oscillatorNode>[] = [];
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  resume = vi.fn(async () => {
    this.state = "running";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
  createOscillator = vi.fn(() => {
    const oscillator = oscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  });
  createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
}
beforeEach(() => {
  FakeAudioContext.instances = [];
  vi.stubGlobal("AudioContext", FakeAudioContext);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("enables sound by default, plays a short bell and silences immediately", async () => {
  const hook = renderHook(() => useKitchenBell());
  const ring = hook.result.current.ring;
  expect(FakeAudioContext.instances).toHaveLength(1);
  expect(hook.result.current.enabled).toBe(true);
  expect(hook.result.current.ring).toBe(ring);
  const audio = FakeAudioContext.instances[0];
  expect(audio.resume).toHaveBeenCalledTimes(1);
  expect(audio.createOscillator).not.toHaveBeenCalled();
  act(() => ring());
  expect(audio.createOscillator).toHaveBeenCalledTimes(2);
  expect(audio.oscillators[1].stop).toHaveBeenCalledWith(1.54);
  audio.oscillators.forEach((oscillator) => oscillator.onended?.());
  expect(audio.oscillators[0].disconnect).toHaveBeenCalled();
  await act(async () => {
    await hook.result.current.toggle();
  });
  act(() => ring());
  expect(hook.result.current.enabled).toBe(false);
  expect(audio.close).toHaveBeenCalledTimes(1);
  expect(audio.createOscillator).toHaveBeenCalledTimes(2);
  await act(async () => {
    await hook.result.current.toggle();
  });
  expect(hook.result.current.enabled).toBe(true);
  expect(FakeAudioContext.instances[1].createOscillator).toHaveBeenCalledTimes(
    2,
  );
});

it("releases the audio context when leaving kitchen", async () => {
  const hook = renderHook(() => useKitchenBell());
  const audio = FakeAudioContext.instances[0];
  hook.unmount();
  expect(audio.close).toHaveBeenCalledTimes(1);
});

it("does not queue old bells when the browser suspends audio", async () => {
  const hook = renderHook(() => useKitchenBell());
  const audio = FakeAudioContext.instances[0];
  audio.state = "suspended";
  act(() => hook.result.current.ring());
  expect(audio.createOscillator).not.toHaveBeenCalled();
  expect(hook.result.current.enabled).toBe(true);
  act(() => window.dispatchEvent(new Event("pointerdown")));
  expect(audio.state).toBe("running");
  expect(audio.createOscillator).not.toHaveBeenCalled();
  act(() => hook.result.current.ring());
  expect(audio.createOscillator).toHaveBeenCalledTimes(2);
});

it("allows trying again after activation is blocked", async () => {
  const hook = renderHook(() => useKitchenBell());
  await act(async () => {
    await hook.result.current.toggle();
  });
  vi.stubGlobal(
    "AudioContext",
    class extends FakeAudioContext {
      resume = vi.fn(async () => {
        throw new Error("blocked");
      });
    },
  );
  await act(async () => {
    await expect(hook.result.current.toggle()).rejects.toThrow("blocked");
  });
  expect(hook.result.current.enabled).toBe(false);
  expect(hook.result.current.activating).toBe(false);
  expect(FakeAudioContext.instances[0].close).toHaveBeenCalledTimes(1);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  await act(async () => {
    await hook.result.current.toggle();
  });
  expect(hook.result.current.enabled).toBe(true);
});
