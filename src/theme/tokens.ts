export const Radius = {
  small: 10,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

export const Motion = {
  press: 120,
  state: 180,
  exit: 120,
} as const;

export const Opacity = {
  pressed: 0.76,
  disabled: 0.5,
} as const;

export const Layout = {
  compactBreakpoint: 520,
  wideBreakpoint: 900,
  authMaxWidth: 1080,
  formMaxWidth: 520,
  contentMaxWidth: 760,
  feedMaxWidth: 880,
  clientContentMaxWidth: 1120,
} as const;

export const TypeScale = {
  caption: 13,
  label: 14,
  body: 16,
  title: 20,
  headline: 30,
  display: 38,
} as const;
