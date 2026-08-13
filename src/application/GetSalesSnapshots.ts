import type { SalesSnapshotRepository } from "../ports/SalesSnapshotRepository.js";
import type { SalesSnapshot } from "../domain/reporting/SalesSnapshot.js";

const DEFAULT_LIMIT = 50;

export class GetSalesSnapshots {
  constructor(private readonly snapshotRepo: SalesSnapshotRepository) {}

  execute(limit: number = DEFAULT_LIMIT): Promise<SalesSnapshot[]> {
    return this.snapshotRepo.listRecent(limit);
  }
}
