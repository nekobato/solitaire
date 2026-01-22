/**
 * Theme definitions for card rendering.
 * @module theme
 */

"use strict";

export type ThemeName = "classic" | "dark" | "light" | "contrast";

export type Style = {
  fg?: string;
  bold?: boolean;
};

export type Theme = {
  name: ThemeName;
  card: {
    face: { redFg: string; blackFg: string };
    back: Style;
    placeholder: Style;
    border: Style;
  };
  foundationPlaceholder: { redFg: string; blackFg: string };
  highlight: {
    cursor: { border: Style; text: Style };
    selected: { border: Style; text: Style };
    cursorSelected: { border: Style; text: Style };
  };
};

export const DEFAULT_THEME_NAME: ThemeName = "classic";

export const THEME_NAMES: readonly ThemeName[] = [
  "classic",
  "dark",
  "light",
  "contrast",
];

const THEMES: Record<ThemeName, Theme> = {
  classic: {
    name: "classic",
    card: {
      face: { redFg: "red", blackFg: "white" },
      back: { fg: "gray" },
      placeholder: { fg: "white" },
      border: { fg: "white" },
    },
    foundationPlaceholder: { redFg: "red", blackFg: "white" },
    highlight: {
      cursor: { border: { fg: "#38bdf8" }, text: { bold: true } },
      selected: { border: { fg: "yellow" }, text: { bold: true } },
      cursorSelected: { border: { fg: "green" }, text: { bold: true } },
    },
  },
  dark: {
    name: "dark",
    card: {
      face: { redFg: "#e11d48", blackFg: "#f8fafc" },
      back: { fg: "#94a3b8" },
      placeholder: { fg: "#94a3b8" },
      border: { fg: "#e2e8f0" },
    },
    foundationPlaceholder: { redFg: "#fb7185", blackFg: "#e2e8f0" },
    highlight: {
      cursor: { border: { fg: "#38bdf8", bold: true }, text: { bold: true } },
      selected: {
        border: { fg: "#f472b6", bold: true },
        text: { bold: true },
      },
      cursorSelected: {
        border: { fg: "#a3e635", bold: true },
        text: { bold: true },
      },
    },
  },
  light: {
    name: "light",
    card: {
      face: { redFg: "#b91c1c", blackFg: "#111827" },
      back: { fg: "#6b7280" },
      placeholder: { fg: "#6b7280" },
      border: { fg: "#111827" },
    },
    foundationPlaceholder: { redFg: "#b91c1c", blackFg: "#111827" },
    highlight: {
      cursor: { border: { fg: "#2563eb" }, text: { bold: true } },
      selected: { border: { fg: "#f59e0b" }, text: { bold: true } },
      cursorSelected: { border: { fg: "#22c55e" }, text: { bold: true } },
    },
  },
  contrast: {
    name: "contrast",
    card: {
      face: { redFg: "#ff0000", blackFg: "#ffffff" },
      back: { fg: "#ffffff" },
      placeholder: { fg: "#ffffff" },
      border: { fg: "#ffffff" },
    },
    foundationPlaceholder: { redFg: "#ff0000", blackFg: "#ffffff" },
    highlight: {
      cursor: { border: { fg: "#00ffff", bold: true }, text: { bold: true } },
      selected: {
        border: { fg: "#ff00ff", bold: true },
        text: { bold: true },
      },
      cursorSelected: {
        border: { fg: "#00ff00", bold: true },
        text: { bold: true },
      },
    },
  },
};

export function isThemeName(value: string | undefined): value is ThemeName {
  if (!value) return false;
  return (THEMES as Record<string, Theme>)[value] !== undefined;
}

export function resolveTheme(name?: string): Theme {
  if (isThemeName(name)) return THEMES[name];
  return THEMES[DEFAULT_THEME_NAME];
}

export function listThemes(): readonly ThemeName[] {
  return THEME_NAMES;
}
