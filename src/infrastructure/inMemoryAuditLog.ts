import type { AuditEntry, AuditLog } from '../domain';

export class InMemoryAuditLog implements AuditLog {
  private entries: readonly AuditEntry[] = Object.freeze([]);
  private readonly listeners = new Set<() => void>();

  append(entry: AuditEntry): void {
    this.entries = Object.freeze([...this.entries, entry]);
    this.listeners.forEach((listener) => listener());
  }

  list(): readonly AuditEntry[] {
    return this.entries;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
