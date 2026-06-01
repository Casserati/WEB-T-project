import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');

const db = client.db('burgerpalace');
const toppings = db.collection('toppings');
const burgers = db.collection('burgers');
const bunTypes = db.collection('bunTypes');
const patties = db.collection('patties');
const orders = db.collection('orders');

export { toppings, burgers, bunTypes, patties, orders };