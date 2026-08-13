import type { ProductProfileRepository } from "../../../ports/ProductProfileRepository.js";
import type { ProductProfile } from "../../../domain/catalog/ProductProfile.js";
import { mongoClient } from "./mongo.js";

function getCollection() {
  return mongoClient.db().collection<ProductProfile>("productProfiles");
}

/**
 * Igual que `SalesSnapshot`, `ProductProfile` vive en Mongo: es un documento
 * rico con forma variable a futuro (nuevas métricas de marketing se agregan
 * sin migración) — el mismo motivo que ya se documentó para snapshots, no
 * uno nuevo inventado para esta colección.
 */
export class MongoProductProfileRepository implements ProductProfileRepository {
  async save(profile: ProductProfile): Promise<void> {
    await getCollection().updateOne({ id: profile.id }, { $set: profile }, { upsert: true });
  }

  async findAll(): Promise<ProductProfile[]> {
    const docs = await getCollection().find().sort({ sku: 1 }).toArray();
    return docs.map(stripMongoId);
  }

  async findByOrderFlowProductId(orderFlowProductId: string): Promise<ProductProfile | null> {
    const doc = await getCollection().findOne({ orderFlowProductId });
    return doc ? stripMongoId(doc) : null;
  }

  async countBySubcategory(subcategoryCode: string): Promise<number> {
    return getCollection().countDocuments({ "subcategory.code": subcategoryCode });
  }
}

function stripMongoId(doc: ProductProfile & { _id?: unknown }): ProductProfile {
  const { _id, ...rest } = doc;
  return rest;
}
