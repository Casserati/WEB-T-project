// Run with: mongosh < seed_burgerpalace.js
// To reset: use("burgerpalace"); db.dropDatabase();

use("burgerpalace");

db.createCollection("toppings");
db.toppings.createIndex({ name: 1 }, { unique: true });
db.createCollection("burgers");
db.burgers.createIndex({ name: 1 }, { unique: true });
db.createCollection("bunTypes");
db.bunTypes.createIndex({ name: 1 }, { unique: true });
db.createCollection("patties");
db.patties.createIndex({ name: 1 }, { unique: true });
db.createCollection("orders");
db.orders.createIndex({ createdAt: -1 });

db.toppings.insertMany([
  { name: "Cheddar",        description: "Aged cheddar cheese",      upcharge: 1.5,  vegan: false, available: true },
  { name: "Swiss Cheese",   description: "Mild Swiss cheese slice",  upcharge: 1.5,  vegan: false, available: true },
  { name: "Bacon",          description: "Crispy smoked bacon",      upcharge: 2.5,  vegan: false, available: true },
  { name: "Fried Egg",      description: "Sunny side up egg",        upcharge: 2,    vegan: false, available: true },
  { name: "Lettuce",        description: "Fresh iceberg lettuce",    upcharge: 0.5,  vegan: true,  available: true },
  { name: "Tomato",         description: "Sliced ripe tomato",       upcharge: 0.5,  vegan: true,  available: true },
  { name: "Onion Rings",    description: "Crispy fried onion rings", upcharge: 1.5,  vegan: true,  available: true },
  { name: "Pickles",        description: "Tangy dill pickles",       upcharge: 0.5,  vegan: true,  available: true },
  { name: "Jalapenos",      description: "Spicy sliced jalapenos",   upcharge: 1,    vegan: true,  available: true },
  { name: "Avocado",        description: "Fresh avocado slices",     upcharge: 2,    vegan: true,  available: false }
]);

const cheddar   = db.toppings.findOne({ name: "Cheddar" })._id;
const swiss     = db.toppings.findOne({ name: "Swiss Cheese" })._id;
const bacon     = db.toppings.findOne({ name: "Bacon" })._id;
const friedEgg  = db.toppings.findOne({ name: "Fried Egg" })._id;
const lettuce   = db.toppings.findOne({ name: "Lettuce" })._id;
const tomato    = db.toppings.findOne({ name: "Tomato" })._id;
const onionRing = db.toppings.findOne({ name: "Onion Rings" })._id;
const pickles   = db.toppings.findOne({ name: "Pickles" })._id;
const jalapenos = db.toppings.findOne({ name: "Jalapenos" })._id;

db.bunTypes.insertMany([
  { name: "Classic",      description: "Soft sesame seed bun",        upcharge: 0 },
  { name: "Brioche",      description: "Buttery golden brioche bun",  upcharge: 1.5 },
  { name: "Pretzel",      description: "Salted Bavarian pretzel bun", upcharge: 2 },
  { name: "Gluten Free",  description: "Gluten free oat bun",         upcharge: 3 }
]);

const classicBun = db.bunTypes.findOne({ name: "Classic" })._id;

db.patties.insertMany([
  { name: "Classic Beef",    description: "100% Angus beef patty",     upcharge: 0,   vegan: false },
  { name: "Double Beef",     description: "Two Angus beef patties",    upcharge: 4,   vegan: false },
  { name: "Chicken",         description: "Grilled chicken breast",    upcharge: 1,   vegan: false },
  { name: "Crispy Chicken",  description: "Breaded and fried chicken", upcharge: 2,   vegan: false },
  { name: "Beyond Meat",     description: "Plant-based burger patty",  upcharge: 3,   vegan: true },
  { name: "Black Bean",      description: "Homemade black bean patty", upcharge: 1.5, vegan: true }
]);

const classicBeef = db.patties.findOne({ name: "Classic Beef" })._id;
const doubleBeef  = db.patties.findOne({ name: "Double Beef" })._id;
const chicken     = db.patties.findOne({ name: "Chicken" })._id;

db.burgers.insertMany([
  {
    name: "Classic Burger",
    description: "The timeless classic with cheddar and pickles",
    basePrice: 12,
    ingredients: [cheddar, lettuce, tomato, pickles],
    defaultBunType: classicBun,
    defaultPatty: classicBeef,
    popular: true
  },
  {
    name: "BBQ Bacon Burger",
    description: "Smoky bacon with melted cheddar and onion rings",
    basePrice: 15,
    ingredients: [cheddar, bacon, onionRing],
    defaultBunType: classicBun,
    defaultPatty: doubleBeef,
    popular: true
  },
  {
    name: "Swiss Mushroom Burger",
    description: "Swiss cheese with sauteed mushrooms",
    basePrice: 14,
    ingredients: [swiss, lettuce, tomato],
    defaultBunType: classicBun,
    defaultPatty: classicBeef,
    popular: true
  },
  {
    name: "Spicy Jalapeno Burger",
    description: "Fiery jalapenos with pepper jack kick",
    basePrice: 14,
    ingredients: [cheddar, jalapenos, onionRing],
    defaultBunType: classicBun,
    defaultPatty: classicBeef,
    popular: false
  },
  {
    name: "Chicken Deluxe",
    description: "Grilled chicken with fresh lettuce and tomato",
    basePrice: 13,
    ingredients: [lettuce, tomato, pickles],
    defaultBunType: classicBun,
    defaultPatty: chicken,
    popular: true
  },
  {
    name: "Wish Burger",
    description: "Pick your patty, bun, and toppings!",
    basePrice: 10,
    ingredients: [],
    popular: false
  }
]);

print("burgerpalace seeded!");
print("  Toppings:  " + db.toppings.countDocuments());
print("  Burgers:   " + db.burgers.countDocuments());
print("  Bun Types: " + db.bunTypes.countDocuments());
print("  Patties:   " + db.patties.countDocuments());
