"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SCENES } from "./scenes";

const TICK_MS = 50;

// Plays the film: scene index + progress within it, looping. Runs only while
// `running`; jump() seeks to the start of a scene.
export function useSceneClock(running: boolean) {
  const [state, setState] = useState({ scene: 0, p: 0 });
  const ref = useRef(state);

  useEffect(() => {
    ref.current = state;
  }, [state]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const { scene, p } = ref.current;
      const next = p + TICK_MS / 1000 / SCENES[scene].seconds;
      setState(next >= 1 ? { scene: (scene + 1) % SCENES.length, p: 0 } : { scene, p: next });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  const jump = useCallback((scene: number) => setState({ scene, p: 0 }), []);
  return { ...state, jump };
}
