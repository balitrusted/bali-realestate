"use client";

import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import {
  getSavedState,
  toggleFavorite as toggleFavoriteStore,
  toggleCompare as toggleCompareStore,
  removeFromCompare as removeFromCompareStore,
  type SavedState,
} from "@/lib/savedStore";

type SavedContextValue = SavedState & {
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  refresh: () => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SavedState>({ favorites: [], compare: [] });

  const refresh = useCallback(() => {
    setState(getSavedState());
  }, []);

  useEffect(() => {
    refresh();
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === "balitrusted-saved") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const toggleFavorite = useCallback((id: string) => {
    const next = toggleFavoriteStore(id);
    setState(next);
  }, []);

  const toggleCompare = useCallback((id: string) => {
    const next = toggleCompareStore(id);
    setState(next);
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    const next = removeFromCompareStore(id);
    setState(next);
  }, []);

  const value = useMemo<SavedContextValue>(
    () => ({
      ...state,
      toggleFavorite,
      toggleCompare,
      removeFromCompare,
      refresh,
    }),
    [state, toggleFavorite, toggleCompare, removeFromCompare, refresh]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}

export function useSavedOptional(): SavedContextValue | null {
  return useContext(SavedContext);
}
