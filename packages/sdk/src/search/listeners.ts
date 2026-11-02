/** The subscribers of a controller's snapshots. */
export interface Listeners<T> {
  /** Returns an unsubscribe function. */
  subscribe(listener: (value: T) => void): () => void;
  notify(value: T): void;
  clear(): void;
}

export const createListeners = <T>(): Listeners<T> => {
  const listeners = new Set<(value: T) => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    notify(value) {
      for (const listener of listeners) {
        listener(value);
      }
    },
    clear: () => {
      listeners.clear();
    },
  };
};
