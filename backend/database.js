import { MongoClient } from 'mongodb';

// Verbindung definieren
const client = new MongoClient('mongodb://localhost:27017');

// Datenbank und Collection öffnen (werden automatisch erstellt falls nicht existent)
const db = client.db('pizzeria');
const ingredients = db.collection('ingredients');
const pizzaTemplates = db.collection('pizzaTemplates');
const doughTypes = db.collection('doughTypes');
const orders = db.collection('orders');

export { ingredients, pizzaTemplates, doughTypes };