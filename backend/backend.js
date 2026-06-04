import express from "express";
import { ObjectId } from "mongodb";
import { burgers, orders } from "./database.js";

const router = express.Router();

router.get("/burgers", async function (req, res) {
  res.type("application/json");
  try {
    const allBurgers = await burgers.find({}).toArray();
    res.send(JSON.stringify({ burgers: allBurgers }));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Internal server error" }));
  }
});

router.post("/orders", async function (req, res) {
  res.type("application/json");
  try {
    let data;
    try {
      data = JSON.parse(req.body.toString("utf-8"));
    } catch (e) {
      return res
        .status(400)
        .send(JSON.stringify({ success: false, error: "Invalid JSON." }));
    }
    const errors = [];
    if (!data.cart || !Array.isArray(data.cart) || data.cart.length === 0)
      errors.push("Cart is empty.");
    if (
      !data.customerName ||
      typeof data.customerName !== "string" ||
      data.customerName.trim().length < 2
    )
      errors.push("Name required (min 2 chars).");
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.push("Invalid email.");
    if (
      !data.phone ||
      !/^(\+41\s?\d{2}|0\d{2})\s?\d{3}\s?\d{2}\s?\d{2}$/.test(data.phone.trim())
    )
      errors.push("Phone: +41 79 123 45 67 or 079 123 45 67.");
    if (
      !data.address ||
      typeof data.address !== "string" ||
      data.address.trim().length < 3
    )
      errors.push("Address required.");
    if (errors.length > 0)
      return res
        .status(400)
        .send(JSON.stringify({ success: false, error: errors.join(" | ") }));
    let totalPrice = 0;
    const orderItems = [];
    for (const ci of data.cart) {
      if (!ObjectId.isValid(ci.burgerId))
        return res
          .status(400)
          .send(JSON.stringify({ success: false, error: "Invalid burger ID." }));
      const burger = await burgers.findOne({ _id: new ObjectId(ci.burgerId) });
      if (!burger)
        return res
          .status(404)
          .send(
            JSON.stringify({
              success: false,
              error: "Burger not found: " + ci.burgerId,
            }),
          );
      const qty = Number(ci.quantity) || 1;
      if (qty < 1 || qty > 20)
        return res
          .status(400)
          .send(
            JSON.stringify({ success: false, error: "Quantity must be 1-20." }),
          );
      const itemTotal = Math.round(Number(burger.basePrice) * qty * 100) / 100;
      totalPrice += itemTotal;
      orderItems.push({
        burgerName: burger.name,
        quantity: qty,
        itemTotal: itemTotal,
      });
    }
    const dbOrder = {
      customerName: data.customerName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      lat: data.lat || null,
      lng: data.lng || null,
      items: orderItems,
      totalPrice: Math.round(totalPrice * 100) / 100,
      createdAt: new Date(),
    };
    const result = await orders.insertOne(dbOrder);
    const resOrder = {
      customerName: dbOrder.customerName,
      email: dbOrder.email,
      phone: dbOrder.phone,
      address: dbOrder.address,
      items: orderItems,
      totalPrice: dbOrder.totalPrice,
    };
    res
      .status(201)
      .send(
        JSON.stringify({
          orderId: result.insertedId.toString(),
          order: resOrder,
        }),
      );
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Internal server error" }));
  }
});

router.get("/orders/last", async function (req, res) {
  res.type("application/json");
  try {
    const email = req.query.email;
    if (!email || typeof email !== "string")
      return res
        .status(400)
        .send(JSON.stringify({ error: "Email parameter required." }));
    const lastOrder = await orders.findOne(
      { email: email.trim() },
      { sort: { createdAt: -1 } },
    );
    if (!lastOrder)
      return res
        .status(404)
        .send(JSON.stringify({ error: "No previous orders found." }));
    const resOrder = { customerName: lastOrder.customerName, email: lastOrder.email,
      phone: lastOrder.phone, address: lastOrder.address, items: lastOrder.items, totalPrice: lastOrder.totalPrice };
    res.send(JSON.stringify({ orderId: lastOrder._id.toString(), order: resOrder }));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Internal server error" }));
  }
});

export default router;