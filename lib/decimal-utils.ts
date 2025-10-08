import { Decimal } from "@prisma/client/runtime/library";

/**
 * Utility functions for working with Prisma Decimal types
 * These functions handle conversions and comparisons between Decimal and number types
 */

export function decimalToNumber(decimal: Decimal | number | null | undefined): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  return Number(decimal.toString());
}

export function numberToDecimal(num: number | null | undefined): Decimal {
  if (num === null || num === undefined) return new Decimal(0);
  return new Decimal(num);
}

export function decimalCompare(decimal: Decimal | number, compareValue: number): {
  isGreater: boolean;
  isLess: boolean;
  isEqual: boolean;
  isGreaterOrEqual: boolean;
  isLessOrEqual: boolean;
} {
  const decimalValue = decimalToNumber(decimal);
  return {
    isGreater: decimalValue > compareValue,
    isLess: decimalValue < compareValue,
    isEqual: decimalValue === compareValue,
    isGreaterOrEqual: decimalValue >= compareValue,
    isLessOrEqual: decimalValue <= compareValue
  };
}

export function decimalAdd(decimal: Decimal | number, addValue: number): Decimal {
  const currentValue = decimalToNumber(decimal);
  return new Decimal(currentValue + addValue);
}

export function decimalSubtract(decimal: Decimal | number, subtractValue: number): Decimal {
  const currentValue = decimalToNumber(decimal);
  return new Decimal(currentValue - subtractValue);
}

export function decimalArithmetic(decimal: Decimal | number, operation: 'add' | 'subtract' | 'multiply' | 'divide', value: number): number {
  const currentValue = decimalToNumber(decimal);
  switch (operation) {
    case 'add':
      return currentValue + value;
    case 'subtract':
      return currentValue - value;
    case 'multiply':
      return currentValue * value;
    case 'divide':
      return value !== 0 ? currentValue / value : 0;
    default:
      return currentValue;
  }
}