// Run with: mongosh < database_insert.js
// To reset: use("burgerpalace"); db.dropDatabase();

use("burgerpalace");

db.createCollection("burgers");
db.burgers.createIndex({ name: 1 }, { unique: true });
db.createCollection("orders");
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ email: 1 });

db.burgers.insertMany([
  { name: "Classic Burger",        description: "Beef patty with cheddar, lettuce, tomato, and pickles", basePrice: 12, popular: true },
  { name: "BBQ Bacon Burger",      description: "Smoky bacon with melted cheddar and onion rings",       basePrice: 15, popular: true },
  { name: "Swiss Mushroom Burger", description: "Swiss cheese with sauteed mushrooms",                   basePrice: 14, popular: true },
  { name: "Spicy Jalapeno Burger", description: "Fiery jalapenos with pepper jack kick",                 basePrice: 14, popular: false },
  { name: "Chicken Deluxe",        description: "Grilled chicken with fresh lettuce and tomato",         basePrice: 13, popular: true },
  { name: "Veggie Garden",         description: "Plant-based patty with avocado and greens",             basePrice: 13, popular: false }
]);

print("burgerpalace seeded!");
print("  Burgers: " + db.burgers.countDocuments());