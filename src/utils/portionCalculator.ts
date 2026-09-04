import { RecipeIngredient } from '../types';

export function calculatePortions(
  ingredients: RecipeIngredient[], 
  originalServings: number, 
  targetServings: number
): RecipeIngredient[] {
  if (originalServings <= 0 || targetServings <= 0 || originalServings === targetServings) {
    return ingredients;
  }

  const ratio = targetServings / originalServings;

  return ingredients.map(ing => {
    const adjustedAmount = scaleAmountString(ing.amount, ratio);
    return {
      ...ing,
      amount: adjustedAmount
    };
  });
}

function scaleAmountString(amountStr: string, ratio: number): string {
  if (!amountStr || amountStr.trim() === '') return amountStr;

  // Handle fractions like "1/2 su bardağı"
  const fractionMatch = amountStr.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    const val = (num / den) * ratio;
    const unit = amountStr.replace(fractionMatch[0], '').trim();
    return `${formatDecimalOrFraction(val)} ${unit}`.trim();
  }

  // Handle numbers like "2 adet", "250 gram", "1.5 tatlı kaşığı"
  const numberMatch = amountStr.match(/(\d+(?:[.,]\d+)?)/);
  if (numberMatch) {
    const num = parseFloat(numberMatch[1].replace(',', '.'));
    const val = num * ratio;
    const unit = amountStr.replace(numberMatch[0], '').trim();
    return `${formatDecimalOrFraction(val)} ${unit}`.trim();
  }

  return amountStr;
}

function formatDecimalOrFraction(val: number): string {
  if (Math.abs(val - Math.round(val)) < 0.05) {
    return Math.round(val).toString();
  }
  if (Math.abs(val - 0.25) < 0.05) return '1/4';
  if (Math.abs(val - 0.33) < 0.05) return '1/3';
  if (Math.abs(val - 0.5) < 0.05) return '1/2';
  if (Math.abs(val - 0.75) < 0.05) return '3/4';
  if (Math.abs(val - 1.5) < 0.05) return '1.5';
  
  return val.toFixed(1).replace('.0', '');
}
