// Predefined menu tags for dietary restrictions and flavors
export const MENU_TAGS = {
  // Dietary Restrictions
  DIETARY: {
    VEGAN: "vegan",
    VEGETARIAN: "vegetarian",
    GLUTEN_FREE: "gluten-free",
    DAIRY_FREE: "dairy-free",
    NUT_FREE: "nut-free",
    HALAL: "halal",
    KOSHER: "kosher",
    ORGANIC: "organic",
    LOW_CARB: "low-carb",
    KETO: "keto",
    PALEO: "paleo",
  },

  // Flavors and Characteristics
  FLAVOR: {
    SPICY: "spicy",
    SWEET: "sweet",
    SOUR: "sour",
    BITTER: "bitter",
    UMAMI: "umami",
    SALTY: "salty",
    SMOKY: "smoky",
    CREAMY: "creamy",
    CRISPY: "crispy",
    TENDER: "tender",
    FRESH: "fresh",
    RICH: "rich",
  },

  // Special Indicators
  SPECIAL: {
    POPULAR: "popular",
    CHEF_SPECIAL: "chef-special",
    SEASONAL: "seasonal",
    LOCAL: "local",
    FARM_TO_TABLE: "farm-to-table",
    HOMEMADE: "homemade",
    ARTISANAL: "artisanal",
  },
} as const;

// Tag categories for organization
export const TAG_CATEGORIES = {
  DIETARY: "Dietary",
  FLAVOR: "Flavor",
  SPECIAL: "Special",
} as const;

// Tag display information
export const TAG_INFO = {
  [MENU_TAGS.DIETARY.VEGAN]: {
    label: "Vegan",
    description: "No animal products",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "🌱",
  },
  [MENU_TAGS.DIETARY.VEGETARIAN]: {
    label: "Vegetarian",
    description: "No meat products",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🥬",
  },
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
  [MENU_TAGS.DIETARY.HALAL]: {
    label: "Halal",
    description: "Halal certified",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    icon: "☪️",
  },
  [MENU_TAGS.DIETARY.KOSHER]: {
    label: "Kosher",
    description: "Kosher certified",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "✡️",
  },
  [MENU_TAGS.DIETARY.ORGANIC]: {
    label: "Organic",
    description: "Organic ingredients",
    color: "bg-lime-100 text-lime-700 border-lime-200",
    icon: "🌿",
  },
  [MENU_TAGS.DIETARY.LOW_CARB]: {
    label: "Low-Carb",
    description: "Low carbohydrate content",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: "🥑",
  },
  [MENU_TAGS.DIETARY.KETO]: {
    label: "Keto",
    description: "Keto-friendly",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    icon: "🥩",
  },
  [MENU_TAGS.DIETARY.PALEO]: {
    label: "Paleo",
    description: "Paleo diet friendly",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "🦴",
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
  [MENU_TAGS.FLAVOR.BITTER]: {
    label: "Bitter",
    description: "Bitter taste",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "☕",
  },
  [MENU_TAGS.FLAVOR.UMAMI]: {
    label: "Umami",
    description: "Savory and rich",
    color: "bg-brown-100 text-brown-700 border-brown-200",
    icon: "🍄",
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
  [MENU_TAGS.FLAVOR.TENDER]: {
    label: "Tender",
    description: "Tender and soft",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "🥩",
  },
  [MENU_TAGS.FLAVOR.FRESH]: {
    label: "Fresh",
    description: "Fresh ingredients",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🌿",
  },
  [MENU_TAGS.FLAVOR.RICH]: {
    label: "Rich",
    description: "Rich and flavorful",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "🍷",
  },

  // Special tags
  [MENU_TAGS.SPECIAL.POPULAR]: {
    label: "Popular",
    description: "Customer favorite",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "⭐",
  },
  [MENU_TAGS.SPECIAL.CHEF_SPECIAL]: {
    label: "Chef Special",
    description: "Chef's recommendation",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "👨‍🍳",
  },
  [MENU_TAGS.SPECIAL.SEASONAL]: {
    label: "Seasonal",
    description: "Seasonal ingredients",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: "🍂",
  },
  [MENU_TAGS.SPECIAL.LOCAL]: {
    label: "Local",
    description: "Locally sourced",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🏠",
  },
  [MENU_TAGS.SPECIAL.FARM_TO_TABLE]: {
    label: "Farm-to-Table",
    description: "Direct from farm",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🚜",
  },
  [MENU_TAGS.SPECIAL.HOMEMADE]: {
    label: "Homemade",
    description: "Made in-house",
    color: "bg-brown-100 text-brown-700 border-brown-200",
    icon: "🏠",
  },
  [MENU_TAGS.SPECIAL.ARTISANAL]: {
    label: "Artisanal",
    description: "Handcrafted",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "🎨",
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
