// Tiny localStorage wrapper used to persist UI state across reloads.
// Safe in non-browser/SSR environments (no-op fallback).

const PREFIX = 'qz:'

function safeGet(key: string): string | null {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(PREFIX + key) : null }
  catch { return null }
}
function safeSet(key: string, val: string): void {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(PREFIX + key, val) }
  catch { /* quota / private mode — ignore */ }
}
function safeDel(key: string): void {
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(PREFIX + key) }
  catch { /* ignore */ }
}

/**
 * Load a JSON-serialized value from localStorage; returns the fallback if absent or unparsable.
 */
export function loadJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key)
  if (raw == null) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

/**
 * Persist a JSON-serializable value. Pass `undefined` to remove the key.
 */
export function saveJSON(key: string, value: unknown): void {
  if (value === undefined) { safeDel(key); return }
  try { safeSet(key, JSON.stringify(value)) } catch { /* ignore */ }
}

/**
 * A Map-like cache backed by localStorage. Reads on construction, writes on every mutation.
 * Used to keep PlanDetail/InspectionPanel confirmation state across page reloads.
 */
export class PersistedMap<V> {
  private map: Map<string, V>
  private storageKey: string
  constructor(storageKey: string) {
    this.storageKey = storageKey
    const obj = loadJSON<Record<string, V>>(storageKey, {})
    this.map = new Map(Object.entries(obj))
  }
  get(k: string): V | undefined { return this.map.get(k) }
  has(k: string): boolean { return this.map.has(k) }
  set(k: string, v: V): this {
    this.map.set(k, v)
    saveJSON(this.storageKey, Object.fromEntries(this.map))
    return this
  }
  delete(k: string): boolean {
    const ok = this.map.delete(k)
    if (ok) saveJSON(this.storageKey, Object.fromEntries(this.map))
    return ok
  }
  clear(): void {
    this.map.clear()
    saveJSON(this.storageKey, {})
  }
}
