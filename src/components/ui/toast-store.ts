// A tiny toast queue shared by the whole site (no library needed).
import type { ReactNode } from "react";

export interface ToastItem {
  id: number;
  kind: "info" | "success" | "achievement" | "warning";
  title: string;
  description?: ReactNode;
  /** Optional button inside the toast. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it disappears (0 = stays until dismissed). */
  duration: number;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: ToastItem[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

export function toast(input: Omit<ToastItem, "id" | "duration"> & { duration?: number }): number {
  const id = nextId++;
  items = [...items, { duration: 5000, ...input, id }].slice(-4);
  emit();
  return id;
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => items,
  getServer: () => EMPTY,
};
