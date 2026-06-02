import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

const db = client.db("burgerpalace");

await db.createCollection("burgers").catch(() => {});
await db.createCollection("orders").catch(() => {});

await db.collection("burgers").createIndex({ name: 1 }, { unique: true }).catch(() => {});
await db.collection("orders").createIndex({ createdAt: -1 }).catch(() => {});
await db.collection("orders").createIndex({ email: 1 }).catch(() => {});

const burgers = db.collection("burgers");
const orders = db.collection("orders");

export { burgers, orders };