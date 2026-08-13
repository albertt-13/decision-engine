import type { DataSource } from "../ports/DataSource.js";
import type { SalesSnapshotRepository } from "../ports/SalesSnapshotRepository.js";

const SNAPSHOT_LIMIT = 20;

/**
 * El pipeline "de datos" del proyecto: agrega bestsellers de OrderFlow en
 * una foto (`SalesSnapshot`) cada vez que corre. Guarda solo productos con
 * `unitsSold` conocido — el catálogo completo no tiene ese dato, solo
 * bestsellers.
 */
export class RunAggregationPipeline {
  constructor(
    private readonly dataSource: DataSource,
    private readonly snapshotRepo: SalesSnapshotRepository,
  ) {}

  async execute(): Promise<number> {
    const bestsellers = await this.dataSource.getBestsellers(SNAPSHOT_LIMIT);
    const capturedAt = new Date();

    const snapshots = bestsellers
      .filter((p): p is typeof p & { unitsSold: number } => p.unitsSold !== undefined)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        unitsSold: p.unitsSold,
        capturedAt,
      }));

    await this.snapshotRepo.saveMany(snapshots);
    return snapshots.length;
  }
}
