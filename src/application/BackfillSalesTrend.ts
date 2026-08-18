import type { DataSource } from "../ports/DataSource.js";
import type { SalesSnapshotRepository } from "../ports/SalesSnapshotRepository.js";
import { simulateHistoricalTrend } from "../domain/reporting/SalesTrendSimulator.js";

const BESTSELLERS_LIMIT = 20;
const DEFAULT_DAYS = 30;

/**
 * Acción puntual (no un cron): genera historial simulado para los productos
 * REALES de OrderFlow, terminando en su `unitsSold` real de hoy — para que
 * "Tendencia de ventas" tenga profundidad sin esperar semanas de corridas
 * reales del pipeline. Ver `SalesTrendSimulator.ts` para la matemática.
 */
export class BackfillSalesTrend {
  constructor(
    private readonly dataSource: DataSource,
    private readonly snapshotRepo: SalesSnapshotRepository,
    private readonly days: number = DEFAULT_DAYS,
    private readonly random: () => number = Math.random,
  ) {}

  async execute(): Promise<number> {
    // Idempotente: sin este borrado, correr "Generar historial" más de una vez
    // apila una serie de 30 días nueva encima de la anterior (con otro seed
    // random y otro instante de referencia) — el gráfico termina zigzagueando
    // entre corridas en vez de mostrar una sola tendencia limpia.
    await this.snapshotRepo.deleteAllSimulated();

    const bestsellers = await this.dataSource.getBestsellers(BESTSELLERS_LIMIT);

    const snapshots = bestsellers
      .filter((p): p is typeof p & { unitsSold: number } => p.unitsSold !== undefined)
      .flatMap((p) =>
        simulateHistoricalTrend({
          productId: p.id,
          productName: p.name,
          currentUnitsSold: p.unitsSold,
          days: this.days,
          random: this.random,
        }),
      );

    await this.snapshotRepo.saveMany(snapshots);
    return snapshots.length;
  }
}
