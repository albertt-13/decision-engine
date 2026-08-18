import { randomUUID } from "node:crypto";
import type { SalesSnapshotRepository } from "../../../ports/SalesSnapshotRepository.js";
import type { SalesSnapshot } from "../../../domain/reporting/SalesSnapshot.js";
import { getSalesSnapshotsCollection } from "./mongo.js";

interface SalesSnapshotDocument {
  id: string;
  productId: string;
  productName: string;
  unitsSold: number;
  capturedAt: Date;
  source: SalesSnapshot["source"];
}

export class MongoSalesSnapshotRepository implements SalesSnapshotRepository {
  async saveMany(snapshots: Omit<SalesSnapshot, "id">[]): Promise<void> {
    if (snapshots.length === 0) return;
    const docs: SalesSnapshotDocument[] = snapshots.map((s) => ({ id: randomUUID(), ...s }));
    await getSalesSnapshotsCollection().insertMany(docs);
  }

  async deleteAllSimulated(): Promise<void> {
    await getSalesSnapshotsCollection().deleteMany({ source: "simulated" });
  }

  async listRecent(limit: number): Promise<SalesSnapshot[]> {
    const docs = await getSalesSnapshotsCollection()
      .find()
      .sort({ capturedAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => ({
      id: doc["id"] as string,
      productId: doc["productId"] as string,
      productName: doc["productName"] as string,
      unitsSold: doc["unitsSold"] as number,
      capturedAt: doc["capturedAt"] as Date,
      source: (doc["source"] as SalesSnapshot["source"] | undefined) ?? "real",
    }));
  }
}
