import { MongoClient } from "mongodb";

//url to mongodb server connection via client
const client = new MongoClient("mongodb://localhost:27017");

//waiting for connection to be established
await client.connect();

//creating database
const db = client.db("burgerpalace");

//creating collection (table) in database
await db.createCollection("burgers").catch(() => {});
await db.createCollection("orders").catch(() => {});

//adding index for faster search and indexing orders for last order first
await db.collection("burgers").createIndex({ name: 1 }, { unique: true }).catch(() => {});
await db.collection("orders").createIndex({ createdAt: -1 }).catch(() => {});
await db.collection("orders").createIndex({ email: 1 }).catch(() => {});

const burgers = db.collection("burgers");
const orders = db.collection("orders");

//exporting tables so they can be used in backend
export { burgers, orders };