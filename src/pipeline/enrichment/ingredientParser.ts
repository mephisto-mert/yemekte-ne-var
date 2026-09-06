import { RawIngredient } from '../types';
import { ParsedIngredient, IngredientParseStatus } from './types';
import { toCanonicalText } from '../normalizer';

const COMMON_UNITS = [
  'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
  'g', 'gram', 'grams', 'kg', 'kilogram', 'ml', 'l', 'liter', 'liters',
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
  'can', 'cans', 'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces',
  'pinch', 'pinches', 'handful', 'bunch',
  'su bardağı', 'çay bardağı', 'yemek kaşığı', 'tatlı kaşığı', 'çay kaşığı',
  'adet', 'tane', 'demet', 'dilim', 'tutam', 'paket'
];

const STAPLES = [
  'tuz', 'salt', 'su', 'water', 'karabiber', 'black pepper', 'pepper',
  'zeytinyağı', 'olive oil', 'sıvı yağ', 'vegetable oil', 'oil',
  'un', 'flour', 'şeker', 'sugar'
];

/**
 * Parses fraction strings like "1/2", "3/4" or mixed "1 1/2" into floating point values.
 */
export function parseNumericValue(valStr: string): number | undefined {
  const clean = valStr.trim();
  if (/^\d+(\.\d+)?$/.test(clean)) {
    return parseFloat(clean);
  }
  const fracMatch = clean.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (den > 0) return num / den;
  }
  const mixedMatch = clean.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    if (den > 0) return whole + (num / den);
  }
  return undefined;
}

/**
 * Safely parses ingredient strings or objects into structured models without data loss.
 */
export function parseIngredient(rawInput: RawIngredient | string): ParsedIngredient {
  const rawText = typeof rawInput === 'string'
    ? rawInput.trim()
    : `${rawInput.amount ? rawInput.amount + ' ' : ''}${rawInput.item || rawInput.name || ''}`.trim();

  let amountStr: string | undefined = undefined;
  let unitStr: string | undefined = undefined;
  let nameStr = '';
  let status: IngredientParseStatus = 'unparsed';
  let confidence = 0.4;

  if (typeof rawInput === 'object' && rawInput !== null && rawInput.item) {
    // Separate amount and item already provided
    nameStr = String(rawInput.item).trim();
    if (rawInput.amount) {
      amountStr = String(rawInput.amount).trim();
      const numVal = parseNumericValue(amountStr);

      // Check if amount contains unit as well (e.g. "500g" or "1 cup")
      const unitMatch = amountStr.match(/^([\d\s./]+)\s*([a-zA-ZçğıöşüÇĞİÖŞÜ\s]+)$/);
      if (unitMatch) {
        amountStr = unitMatch[1].trim();
        unitStr = unitMatch[2].trim();
      }

      if (numVal !== undefined || unitStr) {
        status = 'parsed';
        confidence = 0.9;
      } else {
        status = 'approximate';
        confidence = 0.7;
      }
    } else {
      status = 'approximate';
      confidence = 0.6;
    }
  } else {
    // Single string parse e.g. "1 can coconut milk" or "2 tbsp olive oil"
    const regex = /^([\d\s./]+)?\s*([a-zA-ZçğıöşüÇĞİÖŞÜ]+)?\s+(.+)$/;
    const match = rawText.match(regex);

    if (match) {
      const candidateAmount = match[1]?.trim();
      const candidateUnit = match[2]?.trim().toLowerCase();
      const candidateName = match[3]?.trim();

      if (candidateUnit && COMMON_UNITS.includes(candidateUnit)) {
        amountStr = candidateAmount;
        unitStr = candidateUnit;
        nameStr = candidateName;
        status = 'parsed';
        confidence = 0.9;
      } else if (candidateAmount) {
        amountStr = candidateAmount;
        nameStr = `${candidateUnit ? candidateUnit + ' ' : ''}${candidateName}`;
        status = 'parsed';
        confidence = 0.8;
      } else {
        nameStr = rawText;
        status = 'unparsed';
        confidence = 0.5;
      }
    } else {
      nameStr = rawText;
      status = 'unparsed';
      confidence = 0.4;
    }
  }

  const canonicalName = toCanonicalText(nameStr);
  const isStaple = STAPLES.some(s => canonicalName === s || canonicalName.includes(s));
  const numericVal = amountStr ? parseNumericValue(amountStr) : undefined;

  return {
    raw: rawText,
    name: nameStr || rawText,
    canonicalName,
    amount: amountStr || undefined,
    amountValue: numericVal,
    unit: unitStr || undefined,
    confidence,
    status,
    isStaple
  };
}
