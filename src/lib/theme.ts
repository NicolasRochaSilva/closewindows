"use client";

/**
 * Tema da pagina: escuro (padrao) ou claro. Vive no atributo data-theme do
 * <html> e no localStorage. O layout aplica o tema salvo antes da primeira
 * pintura (THEME_SCRIPT), para nao piscar.
 */
export type Theme = "dark" | "light";

export const THEME_KEY = "cw_theme";

export function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* sem localStorage (aba privada): o tema vale so ate recarregar */
  }
}
