import express from 'express';
import { ingredients, pizzaTemplates, doughTypes } from './db.js';
import { ObjectId } from 'mongodb';

router.get('/', async function (req, res) {
  res.type('application/json');
  try {
    const allIngredients = await ingredients.find({}).toArray();
    const ingredientList = allIngredients.map(r => ({
      id: r._id,
      name: r.name,
      description: r.description,
      upcharge: r.upcharge,
      vegan: r.vegan,
      available: r.available
    }));
    res.send(JSON.stringify({ ingredients: ingredientList }));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: 'Interner Serverfehler' }));
  }
});

export default router;