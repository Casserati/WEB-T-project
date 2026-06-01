import express from 'express';
import { ObjectId } from 'mongodb';
import { toppings, burgers, bunTypes, patties, orders } from './database.js';

const router = express.Router();

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
    const data = req.body;
    const errors = [];
    if (!data.burgerId || typeof data.burgerId !== 'string') {
      errors.push('Please select a burger.');
    }
    if (!data.customerName || typeof data.customerName !== 'string' || data.customerName.trim().length < 2) {
      errors.push('Customer name is required (min 2 characters).');
    }
    if (!data.address || typeof data.address !== 'string' || data.address.trim().length < 5) {
      errors.push('Please enter a valid delivery address.');
    }
    if (typeof data.quantity !== 'number' || data.quantity < 1 || data.quantity > 20) {
      errors.push('Quantity must be between 1 and 20.');
    }
    if (!data.deliveryDate || typeof data.deliveryDate !== 'string') {
      errors.push('Please select a delivery date.');
    }
    if (!data.deliveryTime || typeof data.deliveryTime !== 'string') {
      errors.push('Please select a delivery time.');
    }
    if (errors.length > 0) {
      res.status(400).send(JSON.stringify({ success: false, errors: errors }));
      return;
    }
    const burger = await burgers.findOne({ _id: new ObjectId(data.burgerId) });
    if (!burger) {
      res.status(404).send(JSON.stringify({ success: false, errors: ['Burger not found.'] }));
      return;
    }
    const isWish = burger.name === 'Wish Burger';
    let pattyName = burger.defaultPatty ? (await patties.findOne({ _id: burger.defaultPatty }))?.name : null;
    let bunName = burger.defaultBunType ? (await bunTypes.findOne({ _id: burger.defaultBunType }))?.name : null;
    let pattyUpcharge = 0;
    let bunUpcharge = 0;
    let toppingDocs = [];
    if (isWish) {
      if (!data.pattyId) {
        res.status(400).send(JSON.stringify({ success: false, errors: ['Please select a patty.'] }));
        return;
      }
      if (!data.bunTypeId) {
        res.status(400).send(JSON.stringify({ success: false, errors: ['Please select a bun type.'] }));
        return;
      }
      const patty = await patties.findOne({ _id: new ObjectId(data.pattyId) });
      if (!patty) {
        res.status(404).send(JSON.stringify({ success: false, errors: ['Patty not found.'] }));
        return;
      }
      const bunType = await bunTypes.findOne({ _id: new ObjectId(data.bunTypeId) });
      if (!bunType) {
        res.status(404).send(JSON.stringify({ success: false, errors: ['Bun type not found.'] }));
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
          res.status(400).send(JSON.stringify({ success: false, errors: ['One or more toppings are unavailable.'] }));
          return;
        }
      }
    }
    const toppingsTotal = toppingDocs.reduce((sum, t) => sum + (t.upcharge || 0), 0);
    const totalPrice = (Number(burger.basePrice) + pattyUpcharge + bunUpcharge + toppingsTotal) * data.quantity;
    const order = {
      customerName: data.customerName.trim(),
      burgerName: burger.name,
      pattyName: pattyName,
      bunTypeName: bunName,
      toppings: toppingDocs.map((t) => t.name),
      quantity: data.quantity,
      address: data.address.trim(),
      deliveryDate: data.deliveryDate,
      deliveryTime: data.deliveryTime,
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