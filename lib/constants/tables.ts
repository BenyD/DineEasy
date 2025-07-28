// Table capacity options for consistent use across the application
export const TABLE_CAPACITY_OPTIONS = [
  { value: "2", label: "2 seats" },
  { value: "4", label: "4 seats" },
  { value: "6", label: "6 seats" },
  { value: "8", label: "8 seats" },
  { value: "10", label: "10 seats" },
  { value: "12", label: "12 seats" },
  { value: "15", label: "15 seats" },
  { value: "20", label: "20 seats" },
] as const;

// Filter capacity options (includes "all" for filtering)
export const TABLE_CAPACITY_FILTER_OPTIONS = [
  { value: "all", label: "All Capacities" },
  ...TABLE_CAPACITY_OPTIONS,
] as const;

// Table size mapping function for consistent sizing
export const getTableSize = (capacity: number) => {
  switch (capacity) {
    case 2:
      return { width: 50, height: 50 };
    case 4:
      return { width: 60, height: 60 };
    case 6:
      return { width: 70, height: 70 };
    case 8:
      return { width: 75, height: 75 };
    case 10:
      return { width: 85, height: 85 };
    case 12:
      return { width: 95, height: 95 };
    case 15:
      return { width: 110, height: 110 };
    case 20:
      return { width: 130, height: 130 };
    default:
      // For other capacities, use proportional sizing
      return {
        width: Math.max(50, capacity * 12),
        height: Math.max(50, capacity * 12),
      };
  }
};

// Valid capacity values
export const VALID_TABLE_CAPACITIES = [2, 4, 6, 8, 10, 12, 15, 20] as const;
export type TableCapacity = (typeof VALID_TABLE_CAPACITIES)[number];
