import type { SalesSnapshot } from "../domain/reporting/SalesSnapshot.js";

export interface SalesSnapshotRepository {
  saveMany(snapshots: Omit<SalesSnapshot, "id">[]): Promise<void>;
  listRecent(limit: number): Promise<SalesSnapshot[]>;
  deleteAllSimulated(): Promise<void>;
}
