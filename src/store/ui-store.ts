"use client";

import { create } from "zustand";
import type { ProjectTag } from "@/data/projects";

export type GraphicsOverride = "auto" | "high" | "low";
export type ThemeMode = "dark" | "light";

const GRAPHICS_CYCLE: GraphicsOverride[] = ["auto", "high", "low"];

interface UIState {
  menuOpen: boolean;
  soundEnabled: boolean;
  theme: ThemeMode;
  graphicsOverride: GraphicsOverride;
  requestedProjectId: string | null;
  requestedTag: ProjectTag | null;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  toggleSound: () => void;
  initSound: () => void;
  toggleTheme: () => void;
  initTheme: () => void;
  cycleGraphics: () => void;
  requestProject: (id: string) => void;
  clearProjectRequest: () => void;
  requestTagFilter: (tag: ProjectTag) => void;
  clearTagFilterRequest: () => void;
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const useUIStore = create<UIState>()((set) => ({
  menuOpen: false,
  soundEnabled: false,
  theme: "dark",
  graphicsOverride: "auto",
  requestedProjectId: null,
  requestedTag: null,
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),
  toggleSound: () =>
    set((state) => {
      const soundEnabled = !state.soundEnabled;
      persist("folio:sound", soundEnabled ? "1" : "0");
      return { soundEnabled };
    }),
  initSound: () =>
    set(() => ({ soundEnabled: readStored("folio:sound") === "1" })),
  toggleTheme: () =>
    set((state) => {
      const theme: ThemeMode = state.theme === "dark" ? "light" : "dark";
      persist("folio:theme", theme);
      return { theme };
    }),
  initTheme: () =>
    set(() => ({ theme: readStored("folio:theme") === "light" ? "light" : "dark" })),
  cycleGraphics: () =>
    set((state) => ({
      graphicsOverride:
        GRAPHICS_CYCLE[
          (GRAPHICS_CYCLE.indexOf(state.graphicsOverride) + 1) %
            GRAPHICS_CYCLE.length
        ],
    })),
  requestProject: (id) => set({ requestedProjectId: id, menuOpen: false }),
  clearProjectRequest: () => set({ requestedProjectId: null }),
  requestTagFilter: (tag) => set({ requestedTag: tag, menuOpen: false }),
  clearTagFilterRequest: () => set({ requestedTag: null }),
}));
