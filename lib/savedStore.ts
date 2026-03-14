const STORAGE_KEY = "balitrusted-saved";
const MAX_COMPARE = 4;

export type SavedState = {
  favorites: string[];
  compare: string[];
};

function load(): SavedState {
  if (typeof window === "undefined") return { favorites: [], compare: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { favorites: [], compare: [] };
    const data = JSON.parse(raw) as SavedState;
    return {
      favorites: Array.isArray(data.favorites) ? data.favorites : [],
      compare: Array.isArray(data.compare) ? data.compare.slice(0, MAX_COMPARE) : [],
    };
  } catch {
    return { favorites: [], compare: [] };
  }
}

function save(state: SavedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getSavedState(): SavedState {
  return load();
}

export function toggleFavorite(id: string): SavedState {
  const state = load();
  const idx = state.favorites.indexOf(id);
  if (idx >= 0) state.favorites.splice(idx, 1);
  else state.favorites.push(id);
  save(state);
  return state;
}

export function isFavorite(id: string): boolean {
  return load().favorites.includes(id);
}

export function toggleCompare(id: string): SavedState {
  const state = load();
  const idx = state.compare.indexOf(id);
  if (idx >= 0) state.compare.splice(idx, 1);
  else if (state.compare.length < MAX_COMPARE) state.compare.push(id);
  save(state);
  return state;
}

export function removeFromCompare(id: string): SavedState {
  const state = load();
  state.compare = state.compare.filter((x) => x !== id);
  save(state);
  return state;
}

export function isInCompare(id: string): boolean {
  return load().compare.includes(id);
}

export { MAX_COMPARE };
