import express from 'express';
import { ObjectId } from 'mongodb';
import { toppings, burgers, bunTypes, patties, orders } from './database.js';

const router = express.Router();
router.use(express.json());

router.get('/', async function (req, res) {
  res.type('application/json');
  try {
    const allToppings = await toppings.find({}).toArray();
    const toppingList = allToppings.map((t) => ({
      id: t._id,
      name: t.name,
      description: t.description,
      upcharge: t.upcharge,
      vegan: t.vegan,
      available: t.available,
    }));
    const allBurgers = await burgers.find({}).toArray();
    const allBunTypes = await bunTypes.find({}).toArray();
    const allPatties = await patties.find({}).toArray();
    res.send(JSON.stringify({
      toppings: toppingList,
      burgers: allBurgers,
      bunTypes: allBunTypes,
      patties: allPatties,
    }));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: 'Internal server error' }));
  }
});

router.post('/', async function (req, res) {
  res.type('application/json');
  try {
    let data = req.body;
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      const raw = await new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => { resolve(body); });
      });
      try {
        data = JSON.parse(raw);
      } catch (e) {
        res.status(400).send(JSON.stringify({ success: false, error: 'Request body is empty or not valid JSON.' }));
        return;
      }
    }
    if (!data.burgerId || typeof data.burgerId !== 'string') {
      res.status(400).send(JSON.stringify({ success: false, error: 'Please select a burger.' }));
      return;
    }
    if (!data.customerName || typeof data.customerName !== 'string' || data.customerName.trim().length < 2) {
      res.status(400).send(JSON.stringify({ success: false, error: 'Customer name is required (min 2 characters).' }));
      return;
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      res.status(400).send(JSON.stringify({ success: false, error: 'Please enter a valid email address.' }));
      return;
    }
    if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length < 5) {
      res.status(400).send(JSON.stringify({ success: false, error: 'Please enter a valid phone number.' }));
      return;
    }
    if (!data.address || typeof data.address !== 'string' || data.address.trim().length < 3) {
      res.status(400).send(JSON.stringify({ success: false, error: 'Delivery address is required. Please use the location button.' }));
      return;
    }
    if (typeof data.quantity !== 'number' || data.quantity < 1 || data.quantity > 20) {
      res.status(400).send(JSON.stringify({ success: false, error: 'Quantity must be between 1 and 20.' }));
      return;
    }
    const burger = await burgers.findOne({ _id: new ObjectId(data.burgerId) });
    if (!burger) {
      res.status(404).send(JSON.stringify({ success: false, error: 'Burger not found.' }));
      return;
    }
    const isWish = burger.name === 'Wish Burger';
    let pattyName = null;
    let bunName = null;
    let pattyUpcharge = 0;
    let bunUpcharge = 0;
    let toppingDocs = [];
    if (isWish) {
      if (!data.pattyId) {
        res.status(400).send(JSON.stringify({ success: false, error: 'Please select a patty.' }));
        return;
      }
      if (!data.bunTypeId) {
        res.status(400).send(JSON.stringify({ success: false, error: 'Please select a bun type.' }));
        return;
      }
      const patty = await patties.findOne({ _id: new ObjectId(data.pattyId) });
      if (!patty) {
        res.status(404).send(JSON.stringify({ success: false, error: 'Patty not found.' }));
        return;
      }
      const bunType = await bunTypes.findOne({ _id: new ObjectId(data.bunTypeId) });
      if (!bunType) {
        res.status(404).send(JSON.stringify({ success: false, error: 'Bun type not found.' }));
        return;
      }
      pattyName = patty.name;
      pattyUpcharge = patty.upcharge || 0;
      bunName = bunType.name;
      bunUpcharge = bunType.upcharge || 0;
      if (data.toppingIds && data.toppingIds.length > 0) {
        const toppingOids = data.toppingIds.map((id) => new ObjectId(id));
        toppingDocs = await toppings.find({ _id: { $in: toppingOids }, available: true }).toArray();
        if (toppingDocs.length !== data.toppingIds.length) {
          res.status(400).send(JSON.stringify({ success: false, error: 'One or more toppings are unavailable.' }));
          return;
        }
      }
    } else {
      if (burger.defaultPatty) {
        const dp = await patties.findOne({ _id: burger.defaultPatty });
        if (dp) pattyName = dp.name;
      }
      if (burger.defaultBunType) {
        const db2 = await bunTypes.findOne({ _id: burger.defaultBunType });
        if (db2) bunName = db2.name;
      }
    }
    const toppingsTotal = toppingDocs.reduce((sum, t) => sum + (t.upcharge || 0), 0);
    const totalPrice = (Number(burger.basePrice) + pattyUpcharge + bunUpcharge + toppingsTotal) * data.quantity;
    const order = {
      customerName: data.customerName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      burgerName: burger.name,
      pattyName: pattyName,
      bunTypeName: bunName,
      toppings: toppingDocs.map((t) => t.name),
      quantity: data.quantity,
      address: data.address.trim(),
      lat: data.lat || null,
      lng: data.lng || null,
      totalPrice: Math.round(totalPrice * 100) / 100,
      createdAt: new Date(),
    };
    const result = await orders.insertOne(order);
    res.status(201).send(JSON.stringify({
      success: true,
      orderId: result.insertedId.toString(),
      order: order,
    }));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: 'Internal server error' }));
  }
});

export default router;