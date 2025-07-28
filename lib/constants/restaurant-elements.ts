import type { RestaurantElement } from "@/types";

// Default sizes for different element types
export const getDefaultElementSize = (elementType: string) => {
  switch (elementType) {
    case "entrance":
      return { width: 120, height: 70 }; // Larger entrance card
    case "kitchen":
      return { width: 100, height: 70 }; // Slightly smaller but still prominent
    case "bar":
      return { width: 80, height: 60 }; // Compact for "Bar" text
    case "counter":
      return { width: 90, height: 60 }; // Wider for "Counter" text
    case "bathroom":
      return { width: 100, height: 70 }; // Larger for "Main Bathroom" text
    case "storage":
      return { width: 80, height: 60 }; // Standard size
    default:
      return { width: 80, height: 60 };
  }
};

// Smart naming logic to prevent duplicate "Main" elements
export const getSmartElementName = (
  elementType: string,
  baseName: string,
  existingElements: RestaurantElement[]
) => {
  const existingElementsOfType = existingElements.filter(
    (el) => el.type === elementType
  );

  if (existingElementsOfType.length === 0) {
    // First element of this type - use "Main" prefix
    return `Main ${baseName}`;
  } else {
    // Check if there's already a "Main" element
    const hasMain = existingElementsOfType.some((el) =>
      el.name.startsWith("Main ")
    );

    if (!hasMain) {
      // No "Main" element exists yet - use "Main" prefix
      return `Main ${baseName}`;
    } else {
      // "Main" element already exists - use base name
      return baseName;
    }
  }
};

// Element definitions with default properties
export const ELEMENT_DEFINITIONS = {
  entrance: {
    baseName: "Entrance",
    icon: "DoorOpen",
    color: "#10b981",
  },
  kitchen: {
    baseName: "Kitchen",
    icon: "ChefHat",
    color: "#f59e0b",
  },
  bar: {
    baseName: "Bar",
    icon: "Wine",
    color: "#8b5cf6",
  },
  bathroom: {
    baseName: "Bathroom",
    icon: "Bath",
    color: "#06b6d4",
  },
  counter: {
    baseName: "Counter",
    icon: "Building2",
    color: "#ef4444",
  },
  storage: {
    baseName: "Storage",
    icon: "Package",
    color: "#6b7280",
  },
} as const;

// Create a new element with default properties
export const createElement = (
  type: RestaurantElement["type"],
  existingElements: RestaurantElement[] = [],
  customProps?: Partial<RestaurantElement>
): RestaurantElement => {
  const definition = ELEMENT_DEFINITIONS[type];
  const defaultSize = getDefaultElementSize(type);
  const smartName = getSmartElementName(
    type,
    definition.baseName,
    existingElements
  );

  return {
    id: `${type}-${Date.now()}`,
    type,
    name: smartName,
    x: 100,
    y: 100,
    width: defaultSize.width,
    height: defaultSize.height,
    rotation: 0,
    color: definition.color,
    icon: definition.icon,
    locked: false,
    visible: true,
    ...customProps,
  };
};

// Get status color for tables
export const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-500";
    case "occupied":
      return "bg-red-500";
    case "reserved":
      return "bg-yellow-500";
    case "unavailable":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

// Get status background color for tables
export const getStatusBackground = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-50 border-green-200";
    case "occupied":
      return "bg-red-50 border-red-200";
    case "reserved":
      return "bg-yellow-50 border-yellow-200";
    case "unavailable":
      return "bg-gray-50 border-gray-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};
