// Unit conversion system for inventory management

export interface UnitDefinition {
  id: string;
  name: string;
  category: 'weight' | 'volume' | 'count' | 'length';
  baseUnit: string;
  conversionFactor: number; // Factor to convert to base unit
  abbreviation: string;
}

// Define all supported units with conversion factors
export const UNITS: Record<string, UnitDefinition> = {
  // Weight units (base: gram)
  gram: {
    id: 'gram',
    name: 'Gram',
    category: 'weight',
    baseUnit: 'gram',
    conversionFactor: 1,
    abbreviation: 'g'
  },
  kilogram: {
    id: 'kilogram',
    name: 'Kilogram',
    category: 'weight',
    baseUnit: 'gram',
    conversionFactor: 1000,
    abbreviation: 'kg'
  },
  pound: {
    id: 'pound',
    name: 'Pound',
    category: 'weight',
    baseUnit: 'gram',
    conversionFactor: 453.592,
    abbreviation: 'lb'
  },
  ounce: {
    id: 'ounce',
    name: 'Ounce',
    category: 'weight',
    baseUnit: 'gram',
    conversionFactor: 28.3495,
    abbreviation: 'oz'
  },
  
  // Volume units (base: milliliter)
  milliliter: {
    id: 'milliliter',
    name: 'Milliliter',
    category: 'volume',
    baseUnit: 'milliliter',
    conversionFactor: 1,
    abbreviation: 'ml'
  },
  liter: {
    id: 'liter',
    name: 'Liter',
    category: 'volume',
    baseUnit: 'milliliter',
    conversionFactor: 1000,
    abbreviation: 'L'
  },
  gallon: {
    id: 'gallon',
    name: 'Gallon',
    category: 'volume',
    baseUnit: 'milliliter',
    conversionFactor: 3785.41,
    abbreviation: 'gal'
  },
  
  // Count units (base: piece)
  piece: {
    id: 'piece',
    name: 'Piece',
    category: 'count',
    baseUnit: 'piece',
    conversionFactor: 1,
    abbreviation: 'pc'
  },
  dozen: {
    id: 'dozen',
    name: 'Dozen',
    category: 'count',
    baseUnit: 'piece',
    conversionFactor: 12,
    abbreviation: 'dz'
  },
  pack: {
    id: 'pack',
    name: 'Pack',
    category: 'count',
    baseUnit: 'piece',
    conversionFactor: 6, // Configurable per item
    abbreviation: 'pk'
  },
  carton: {
    id: 'carton',
    name: 'Carton',
    category: 'count',
    baseUnit: 'piece',
    conversionFactor: 24, // Configurable per item
    abbreviation: 'ctn'
  },
  box: {
    id: 'box',
    name: 'Box',
    category: 'count',
    baseUnit: 'piece',
    conversionFactor: 12, // Configurable per item
    abbreviation: 'box'
  },
  case: {
    id: 'case',
    name: 'Case',
    category: 'count',
    baseUnit: 'piece',
    conversionFactor: 48, // Configurable per item
    abbreviation: 'cs'
  },
  
  // Length units (base: centimeter)
  meter: {
    id: 'meter',
    name: 'Meter',
    category: 'length',
    baseUnit: 'centimeter',
    conversionFactor: 100,
    abbreviation: 'm'
  },
  centimeter: {
    id: 'centimeter',
    name: 'Centimeter',
    category: 'length',
    baseUnit: 'centimeter',
    conversionFactor: 1,
    abbreviation: 'cm'
  },
  inch: {
    id: 'inch',
    name: 'Inch',
    category: 'length',
    baseUnit: 'centimeter',
    conversionFactor: 2.54,
    abbreviation: 'in'
  },
  foot: {
    id: 'foot',
    name: 'Foot',
    category: 'length',
    baseUnit: 'centimeter',
    conversionFactor: 30.48,
    abbreviation: 'ft'
  }
};

// Get units by category
export const getUnitsByCategory = (category: string): UnitDefinition[] => {
  return Object.values(UNITS).filter(unit => unit.category === category);
};

// Get all units
export const getAllUnits = (): UnitDefinition[] => {
  return Object.values(UNITS);
};

// Convert quantity from one unit to another
export const convertQuantity = (
  quantity: number,
  fromUnit: string,
  toUnit: string,
  customConversionFactor?: number
): number => {
  const fromUnitDef = UNITS[fromUnit];
  const toUnitDef = UNITS[toUnit];
  
  if (!fromUnitDef || !toUnitDef) {
    throw new Error(`Invalid unit: ${fromUnit} or ${toUnit}`);
  }
  
  // If units are in different categories, conversion is not possible
  if (fromUnitDef.category !== toUnitDef.category) {
    throw new Error(`Cannot convert between different unit categories: ${fromUnitDef.category} and ${toUnitDef.category}`);
  }
  
  // If converting count units with custom conversion factor, use it
  if (fromUnitDef.category === 'count' && customConversionFactor && fromUnit !== 'piece') {
    const fromFactor = customConversionFactor;
    const toFactor = toUnit === 'piece' ? 1 : (UNITS[toUnit].conversionFactor);
    return (quantity * fromFactor) / toFactor;
  }
  
  // Standard conversion: convert to base unit first, then to target unit
  const baseQuantity = quantity * fromUnitDef.conversionFactor;
  const convertedQuantity = baseQuantity / toUnitDef.conversionFactor;
  
  return Math.round(convertedQuantity * 10000) / 10000; // Round to 4 decimal places
};

// Convert to base unit (for storage)
export const convertToBaseUnit = (
  quantity: number,
  unit: string,
  customConversionFactor?: number
): number => {
  const unitDef = UNITS[unit];
  if (!unitDef) {
    throw new Error(`Invalid unit: ${unit}`);
  }
  
  // For count units, use custom factor if provided
  if (unitDef.category === 'count' && customConversionFactor && unit !== 'piece') {
    return quantity * customConversionFactor;
  }
  
  return quantity * unitDef.conversionFactor;
};

// Convert from base unit (for display)
export const convertFromBaseUnit = (
  baseQuantity: number,
  targetUnit: string,
  customConversionFactor?: number
): number => {
  const unitDef = UNITS[targetUnit];
  if (!unitDef) {
    throw new Error(`Invalid unit: ${targetUnit}`);
  }
  
  // For count units, use custom factor if provided
  if (unitDef.category === 'count' && customConversionFactor && targetUnit !== 'piece') {
    return baseQuantity / customConversionFactor;
  }
  
  const convertedQuantity = baseQuantity / unitDef.conversionFactor;
  return Math.round(convertedQuantity * 10000) / 10000;
};

// Format quantity with unit
export const formatQuantityWithUnit = (
  quantity: number,
  unit: string,
  useAbbreviation: boolean = true
): string => {
  const unitDef = UNITS[unit];
  if (!unitDef) {
    return `${quantity} ${unit}`;
  }
  
  const unitDisplay = useAbbreviation ? unitDef.abbreviation : unitDef.name;
  return `${quantity} ${unitDisplay}`;
};

// Get compatible units (same category)
export const getCompatibleUnits = (unit: string): UnitDefinition[] => {
  const unitDef = UNITS[unit];
  if (!unitDef) {
    return [];
  }
  
  return getUnitsByCategory(unitDef.category);
};

// Validate unit
export const isValidUnit = (unit: string): boolean => {
  return unit in UNITS;
};

// Get unit categories
export const getUnitCategories = (): string[] => {
  const categories = new Set(Object.values(UNITS).map(unit => unit.category));
  return Array.from(categories);
};