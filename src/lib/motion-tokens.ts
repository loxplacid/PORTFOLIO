export type BezierEase = [number, number, number, number];

export const EASE_EXPO: BezierEase = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT_QUINT: BezierEase = [0.87, 0, 0.13, 1];

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

export const SPRING_FOLLOW = {
  stiffness: 150,
  damping: 15,
} as const;

export const DURATION_ENTER = 0.45;
export const DURATION_EXIT = 0.26;
export const DURATION_MORPH = 0.62;

export const ENTER_TRANSITION = { duration: DURATION_ENTER, ease: EASE_EXPO };
export const EXIT_TRANSITION = { duration: DURATION_EXIT, ease: EASE_EXPO };
