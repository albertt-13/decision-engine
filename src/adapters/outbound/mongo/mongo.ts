import dns from "node:dns";
import { MongoClient } from "mongodb";
import { env } from "../../../shared/config/env.js";
import { logger } from "../../../shared/logger.js";

// Ver bitácora de OrderFlow: Node prefiere IPv6 y algunos egress de cloud
// rompen el handshake TLS contra Mongo Atlas — forzar IPv4 lo evita. Se deja
// desde el arranque acá, no como fix reactivo esta vez.
dns.setDefaultResultOrder("ipv4first");

export const mongoClient = new MongoClient(env.MONGODB_URL, { family: 4 });

let connected = false;

export async function connectMongo(): Promise<void> {
  if (connected) return;
  await mongoClient.connect();
  connected = true;
  logger.info("mongodb: conectado");
}

export function getSalesSnapshotsCollection() {
  return mongoClient.db().collection("salesSnapshots");
}

export function pingMongo() {
  return mongoClient.db().command({ ping: 1 });
}
