export interface HistoryEntry<T> {
  state: T;
  description: string;
  timestamp: number;
}

export class HistoryManager<T> {
  private past: HistoryEntry<T>[] = [];
  private future: HistoryEntry<T>[] = [];
  private current: T;
  private maxHistory: number;

  constructor(initial: T, maxHistory: number = 50) {
    this.current = initial;
    this.maxHistory = maxHistory;
  }

  push(state: T, description: string): void {
    this.past.push({
      state: this.current,
      description,
      timestamp: Date.now(),
    });
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    this.current = state;
    this.future = [];
  }

  undo(): T | null {
    if (this.past.length === 0) return null;
    const entry = this.past.pop()!;
    this.future.push({
      state: this.current,
      description: entry.description,
      timestamp: Date.now(),
    });
    this.current = entry.state;
    return this.current;
  }

  redo(): T | null {
    if (this.future.length === 0) return null;
    const entry = this.future.pop()!;
    this.past.push({
      state: this.current,
      description: entry.description,
      timestamp: Date.now(),
    });
    this.current = entry.state;
    return this.current;
  }

  getCurrent(): T {
    return this.current;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}
