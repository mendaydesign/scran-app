// Common cooking ingredients for pantry autocomplete.
// Exported as a single flat sorted array so the pantry screen can filter it
// with a simple .filter() call. Categories are preserved as comments here
// for future reference (e.g. a categorised picker).

// ─── Proteins ─────────────────────────────────────────────────────────────────
const PROTEINS = [
  'bacon',
  'beef mince',
  'chicken breast',
  'chicken thighs',
  'chorizo',
  'cod fillet',
  'eggs',
  'halloumi',
  'lamb chops',
  'lamb mince',
  'lamb shoulder',
  'pancetta',
  'pork belly',
  'pork chops',
  'pork mince',
  'prawns',
  'salmon fillet',
  'sardines (tinned)',
  'sea bass',
  'sirloin steak',
  'tofu',
  'tuna (tinned)',
];

// ─── Vegetables ───────────────────────────────────────────────────────────────
const VEGETABLES = [
  'asparagus',
  'aubergine',
  'avocado',
  'bell pepper',
  'broccoli',
  'butternut squash',
  'carrots',
  'cauliflower',
  'celery',
  'cherry tomatoes',
  'chestnut mushrooms',
  'courgette',
  'cucumber',
  'garlic',
  'green beans',
  'green pepper',
  'kale',
  'leek',
  'lettuce',
  'mushrooms',
  'new potatoes',
  'onion',
  'peas',
  'portobello mushrooms',
  'potato',
  'red onion',
  'red pepper',
  'rocket',
  'shallots',
  'spinach',
  'spring onions',
  'sun-dried tomatoes',
  'sweet potato',
  'sweetcorn',
  'tomatoes',
  'yellow pepper',
];

// ─── Fruits ───────────────────────────────────────────────────────────────────
const FRUITS = [
  'apple',
  'banana',
  'blueberries',
  'coconut',
  'lemon',
  'lime',
  'mango',
  'orange',
  'pineapple',
  'pomegranate',
  'raspberries',
  'strawberries',
];

// ─── Herbs and spices ─────────────────────────────────────────────────────────
const HERBS_AND_SPICES = [
  'bay leaves',
  'black pepper',
  'cardamom',
  'cayenne pepper',
  'chilli flakes',
  'cinnamon',
  'cumin seeds',
  'curry powder',
  'dried basil',
  'dried oregano',
  'dried rosemary',
  'dried thyme',
  'fresh basil',
  'fresh coriander',
  'fresh mint',
  'fresh parsley',
  'fresh rosemary',
  'fresh thyme',
  'garam masala',
  'garlic powder',
  'ground coriander',
  'ground cumin',
  'ground ginger',
  'mixed herbs',
  'nutmeg',
  'onion powder',
  'paprika',
  'sea salt',
  'smoked paprika',
  'turmeric',
];

// ─── Dairy and eggs ───────────────────────────────────────────────────────────
const DAIRY = [
  'butter',
  'cheddar cheese',
  'cream cheese',
  'double cream',
  'feta cheese',
  'Greek yoghurt',
  'mozzarella',
  'parmesan',
  'semi-skimmed milk',
  'single cream',
  'soured cream',
  'unsalted butter',
  'whole milk',
];

// ─── Pantry staples ───────────────────────────────────────────────────────────
const PANTRY_STAPLES = [
  'almond butter',
  'baking powder',
  'bicarbonate of soda',
  'breadcrumbs',
  'brown sugar',
  'caster sugar',
  'chicken stock',
  'coconut milk',
  'coconut oil',
  'cornflour',
  'dark chocolate',
  'dried lentils',
  'extra virgin olive oil',
  'honey',
  'icing sugar',
  'maple syrup',
  'olive oil',
  'panko breadcrumbs',
  'peanut butter',
  'plain flour',
  'red lentils',
  'self-raising flour',
  'sesame oil',
  'tinned chickpeas',
  'tinned kidney beans',
  'tinned tomatoes',
  'tomato purée',
  'vanilla extract',
  'vegetable oil',
  'vegetable stock',
  'white chocolate',
];

// ─── Sauces and condiments ────────────────────────────────────────────────────
const SAUCES = [
  'Dijon mustard',
  'dark soy sauce',
  'fish sauce',
  'harissa',
  'hoisin sauce',
  'hot sauce',
  'mayonnaise',
  'miso paste',
  'oyster sauce',
  'pesto',
  'soy sauce',
  'sriracha',
  'tahini',
  'tomato ketchup',
  'white wine vinegar',
  'Worcestershire sauce',
  'wholegrain mustard',
  'red wine vinegar',
  'balsamic vinegar',
  'apple cider vinegar',
];

// ─── Grains and carbs ─────────────────────────────────────────────────────────
const GRAINS = [
  'basmati rice',
  'bread',
  'bulgur wheat',
  'couscous',
  'fusilli',
  'jasmine rice',
  'lasagne sheets',
  'naan bread',
  'penne',
  'pitta bread',
  'polenta',
  'quinoa',
  'risotto rice',
  'rolled oats',
  'sourdough',
  'spaghetti',
  'tagliatelle',
  'tortilla wraps',
];

// ─── Categorised export ───────────────────────────────────────────────────────
// Used by the pantry dropdown to group matching suggestions under their
// category heading. Each category's items are pre-sorted A–Z.

export const INGREDIENT_CATEGORIES: { label: string; items: string[] }[] = [
  { label: 'Proteins',           items: [...PROTEINS].sort((a, b) => a.localeCompare(b)) },
  { label: 'Vegetables',         items: [...VEGETABLES].sort((a, b) => a.localeCompare(b)) },
  { label: 'Fruits',             items: [...FRUITS].sort((a, b) => a.localeCompare(b)) },
  { label: 'Herbs & Spices',     items: [...HERBS_AND_SPICES].sort((a, b) => a.localeCompare(b)) },
  { label: 'Dairy',              items: [...DAIRY].sort((a, b) => a.localeCompare(b)) },
  { label: 'Pantry Staples',     items: [...PANTRY_STAPLES].sort((a, b) => a.localeCompare(b)) },
  { label: 'Sauces & Condiments', items: [...SAUCES].sort((a, b) => a.localeCompare(b)) },
  { label: 'Grains & Carbs',     items: [...GRAINS].sort((a, b) => a.localeCompare(b)) },
];

// ─── Flat export — sorted A–Z ─────────────────────────────────────────────────
// Kept for any future use (e.g. full ingredient picker).

export const INGREDIENTS: string[] = [
  ...PROTEINS,
  ...VEGETABLES,
  ...FRUITS,
  ...HERBS_AND_SPICES,
  ...DAIRY,
  ...PANTRY_STAPLES,
  ...SAUCES,
  ...GRAINS,
].sort((a, b) => a.localeCompare(b));
