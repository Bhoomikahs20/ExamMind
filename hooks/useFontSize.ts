"use client";

import { useState, useEffect, useCallback } from "react";

type FontSize = "normal" | "large" | "larger";

const SIZES: Record<FontSize, string> = {
  normal: "1rem",
  large: "1.125rem",
  larger: "1.25rem",
};

const STORAGE_KEY = "examind_font_size";

export function useFontSize() {
  const [size, setSize] = useState<FontSize>("normal");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as FontSize | null;
    if (saved && saved in SIZES) {
      setSize(saved);
      document.documentElement.style.fontSize = SIZES[saved];
    }
  }, []);

  const change = useCallback((next: FontSize) => {
    setSize(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.style.fontSize = SIZES[next];
  }, []);

  return { size, change, sizes: Object.keys(SIZES) as FontSize[] };
}
