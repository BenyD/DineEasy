// Predefined menu tags for dietary restrictions and flavors
export const MENU_TAGS = {
  // Vegetarian Status (Mutually Exclusive)
  VEGETARIAN_STATUS: {
    VEGAN: "vegan",
    VEGETARIAN: "vegetarian",
    NON_VEGETARIAN: "non-vegetarian",
  },

  // Dietary Restrictions
  DIETARY: {
    GLUTEN_FREE: "gluten-free",
    DAIRY_FREE: "dairy-free",
    NUT_FREE: "nut-free",
    ORGANIC: "organic",
  },

  // Meat Types
  MEAT_TYPES: {
    BEEF: "beef",
    PORK: "pork",
    CHICKEN: "chicken",
    LAMB: "lamb",
    FISH: "fish",
    SEAFOOD: "seafood",
    TURKEY: "turkey",
    DUCK: "duck",
  },

  // Flavors and Characteristics
  FLAVOR: {
    SPICY: "spicy",
    SWEET: "sweet",
    SOUR: "sour",
    SALTY: "salty",
    SMOKY: "smoky",
    CREAMY: "creamy",
    CRISPY: "crispy",
    FRESH: "fresh",
  },

  // Special Indicators
  SPECIAL: {
    CHEF_SPECIAL: "chef-special",
    DISH_OF_THE_DAY: "dish-of-the-day",
    HOMEMADE: "homemade",
    SEASONAL: "seasonal",
    GYM_READY: "gym-ready",
    FARM: "farm",
  },
} as const;

// Tag categories for organization
export const TAG_CATEGORIES = {
  VEGETARIAN_STATUS: "Vegetarian Status",
  DIETARY: "Dietary",
  MEAT_TYPES: "Meat Types",
  FLAVOR: "Flavor",
  SPECIAL: "Special",
} as const;

// Tag display information
export const TAG_INFO = {
  // Vegetarian Status tags (Prominent display)
  [MENU_TAGS.VEGETARIAN_STATUS.VEGAN]: {
    label: "Vegan",
    description: "No animal products",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "🌱",
  },
  [MENU_TAGS.VEGETARIAN_STATUS.VEGETARIAN]: {
    label: "Vegetarian",
    description: "No meat products",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🥬",
  },
  [MENU_TAGS.VEGETARIAN_STATUS.NON_VEGETARIAN]: {
    label: "Non-Vegetarian",
    description: "Contains meat products",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "🥩",
  },

  // Dietary tags (Subtle display)
  [MENU_TAGS.DIETARY.GLUTEN_FREE]: {
    label: "Gluten-Free",
    description: "No gluten ingredients",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "🌾",
  },
  [MENU_TAGS.DIETARY.DAIRY_FREE]: {
    label: "Dairy-Free",
    description: "No dairy products",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🥛",
  },
  [MENU_TAGS.DIETARY.NUT_FREE]: {
    label: "Nut-Free",
    description: "No nuts or nut products",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "🥜",
  },
  [MENU_TAGS.DIETARY.ORGANIC]: {
    label: "Organic",
    description: "Organic ingredients",
    color: "bg-lime-100 text-lime-700 border-lime-200",
    icon: "🌿",
  },

  // Meat type tags (Subtle display)
  [MENU_TAGS.MEAT_TYPES.BEEF]: {
    label: "Beef",
    description: "Contains beef",
    color: "bg-red-50 text-red-600 border-red-200",
    icon: "🐄",
  },
  [MENU_TAGS.MEAT_TYPES.PORK]: {
    label: "Pork",
    description: "Contains pork",
    color: "bg-pink-50 text-pink-600 border-pink-200",
    icon: "🐷",
  },
  [MENU_TAGS.MEAT_TYPES.CHICKEN]: {
    label: "Chicken",
    description: "Contains chicken",
    color: "bg-orange-50 text-orange-600 border-orange-200",
    icon: "🐔",
  },
  [MENU_TAGS.MEAT_TYPES.LAMB]: {
    label: "Lamb",
    description: "Contains lamb",
    color: "bg-yellow-50 text-yellow-600 border-yellow-200",
    icon: "🐑",
  },
  [MENU_TAGS.MEAT_TYPES.FISH]: {
    label: "Fish",
    description: "Contains fish",
    color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    icon: "🐟",
  },
  [MENU_TAGS.MEAT_TYPES.SEAFOOD]: {
    label: "Seafood",
    description: "Contains seafood",
    color: "bg-blue-50 text-blue-600 border-blue-200",
    icon: "🦐",
  },
  [MENU_TAGS.MEAT_TYPES.TURKEY]: {
    label: "Turkey",
    description: "Contains turkey",
    color: "bg-brown-50 text-brown-600 border-brown-200",
    icon: "🦃",
  },
  [MENU_TAGS.MEAT_TYPES.DUCK]: {
    label: "Duck",
    description: "Contains duck",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    icon: "🦆",
  },

  // Flavor tags
  [MENU_TAGS.FLAVOR.SPICY]: {
    label: "Spicy",
    description: "Hot and spicy",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "🌶️",
  },
  [MENU_TAGS.FLAVOR.SWEET]: {
    label: "Sweet",
    description: "Sweet taste",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    icon: "🍯",
  },
  [MENU_TAGS.FLAVOR.SOUR]: {
    label: "Sour",
    description: "Tangy and sour",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: "🍋",
  },
  [MENU_TAGS.FLAVOR.SALTY]: {
    label: "Salty",
    description: "Salty taste",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🧂",
  },
  [MENU_TAGS.FLAVOR.SMOKY]: {
    label: "Smoky",
    description: "Smoked flavor",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "🔥",
  },
  [MENU_TAGS.FLAVOR.CREAMY]: {
    label: "Creamy",
    description: "Creamy texture",
    color: "bg-white-100 text-white-700 border-white-200",
    icon: "🥛",
  },
  [MENU_TAGS.FLAVOR.CRISPY]: {
    label: "Crispy",
    description: "Crispy texture",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "🥨",
  },
  [MENU_TAGS.FLAVOR.FRESH]: {
    label: "Fresh",
    description: "Fresh ingredients",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🌿",
  },

  // Special tags
  [MENU_TAGS.SPECIAL.CHEF_SPECIAL]: {
    label: "Chef Special",
    description: "Chef's recommendation",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "👨‍🍳",
  },
  [MENU_TAGS.SPECIAL.DISH_OF_THE_DAY]: {
    label: "Dish of the Day",
    description: "Today's special",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "📅",
  },
  [MENU_TAGS.SPECIAL.HOMEMADE]: {
    label: "Homemade",
    description: "Made in-house",
    color: "bg-brown-100 text-brown-700 border-brown-200",
    icon: "🏠",
  },
  [MENU_TAGS.SPECIAL.SEASONAL]: {
    label: "Seasonal",
    description: "Seasonal ingredients",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: "🍂",
  },
  [MENU_TAGS.SPECIAL.GYM_READY]: {
    label: "Gym Ready",
    description: "High protein, healthy",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "💪",
  },
  [MENU_TAGS.SPECIAL.FARM]: {
    label: "Farm",
    description: "Farm fresh ingredients",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🚜",
  },
} as const;

// Helper function to get tag info
export const getTagInfo = (tag: string) => {
  return (
    TAG_INFO[tag as keyof typeof TAG_INFO] || {
      label: tag,
      description: tag,
      color: "bg-gray-100 text-gray-700 border-gray-200",
      icon: "🏷️",
    }
  );
};

// Get all available tags
export const getAllTags = () => {
  return Object.values(MENU_TAGS).flatMap((category) =>
    Object.values(category)
  );
};

// Get tags by category
export const getTagsByCategory = (category: keyof typeof MENU_TAGS) => {
  return Object.values(MENU_TAGS[category]);
};
