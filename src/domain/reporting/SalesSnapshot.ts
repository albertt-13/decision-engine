/**
 * Snapshot de ventas en un momento dado — es lo que persiste el pipeline de
 * agregación en Mongo. Sin comportamiento (no es una entidad con reglas),
 * es un dato de lectura/reporting — por eso es una interfaz simple, no una
 * clase con invariantes como `Recommendation`.
 */
export interface SalesSnapshot {
  id: string;
  productId: string;
  productName: string;
  unitsSold: number;
  capturedAt: Date;
}
