/**
 * Snapshot de ventas en un momento dado — es lo que persiste el pipeline de
 * agregación en Mongo. Sin comportamiento (no es una entidad con reglas),
 * es un dato de lectura/reporting — por eso es una interfaz simple, no una
 * clase con invariantes como `Recommendation`.
 */
export type SalesSnapshotSource = "real" | "simulated";

export interface SalesSnapshot {
  id: string;
  productId: string;
  productName: string;
  unitsSold: number;
  capturedAt: Date;
  /**
   * "real": vino de una corrida real del pipeline contra OrderFlow.
   * "simulated": historial de respaldo generado para tener una tendencia
   * con profundidad — ver `SalesTrendSimulator.ts`. Nunca se ocultan ni se
   * mezclan sin distinción: el frontend los muestra diferenciados.
   */
  source: SalesSnapshotSource;
}
