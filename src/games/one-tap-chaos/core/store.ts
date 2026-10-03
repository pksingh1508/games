// A tiny external store, so React can read the game's HUD with useSyncExternalStore and only
// re-render when something shown actually changes.
export class Store<T> {
  private listeners = new Set<() => void>();

  constructor(private value: T) {}

  get = () => this.value;

  set(next: T) {
    this.value = next;
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}
