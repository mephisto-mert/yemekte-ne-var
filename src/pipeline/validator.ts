import { NormalizedRecipe, ValidatedRecipe, ValidationStatus } from './types';

/**
 * Validates a NormalizedRecipe according to strict production criteria.
 * Produces structured errors, warnings, and an overall status.
 *
 * Status Rules:
 * - INVALID: Missing critical fields (title, ingredients, instructions) or invalid servings. Recipe cannot be used in app.
 * - WARNING: Recipe is usable, but lacks recommended data (e.g. image, video, detailed description).
 * - VALID: Recipe meets all requirements with high completeness.
 */
export function validateRecipe(recipe: NormalizedRecipe): ValidatedRecipe {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. ID Check
  if (!recipe.id || recipe.id.trim() === '') {
    errors.push('Eksik tarif kimliği (ID eksik veya boş)');
  }

  // 2. Title Check
  if (!recipe.title || recipe.title.trim().length < 3) {
    errors.push('Eksik veya geçersiz tarif başlığı: Başlık en az 3 karakter olmalıdır');
  }

  // 3. Ingredients Check
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push('Eksik malzeme listesi (en az 1 malzeme bulunmalıdır)');
  } else {
    const invalidIngs = recipe.ingredients.filter(i => !i.name || i.name.trim().length === 0);
    if (invalidIngs.length > 0) {
      errors.push(`Geçersiz malzeme tespit edildi (${invalidIngs.length} adet isimsiz malzeme)`);
    }
  }

  // 4. Instructions Check
  if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
    errors.push('Eksik tarif adımları (en az 1 yapılış adımı bulunmalıdır)');
  } else {
    const invalidSteps = recipe.instructions.filter(s => !s || s.trim().length === 0);
    if (invalidSteps.length > 0) {
      errors.push(`Geçersiz yapılış adımı tespit edildi (${invalidSteps.length} adet boş adım)`);
    }
  }

  // 5. Servings Check
  if (typeof recipe.servings !== 'number' || recipe.servings <= 0 || isNaN(recipe.servings)) {
    errors.push('Geçersiz porsiyon miktarı (0 veya daha büyük bir sayı olmalıdır)');
  }

  // 6. Time Check
  if (typeof recipe.timeMinutes !== 'number' || recipe.timeMinutes < 0 || isNaN(recipe.timeMinutes)) {
    errors.push('Geçersiz pişirme süresi');
  } else if (recipe.timeMinutes === 0) {
    warnings.push('Pişirme süresi 0 dakika olarak belirtilmiş');
  } else if (recipe.timeMinutes > 720) {
    warnings.push(`Pişirme süresi olağandışı yüksek (${recipe.timeMinutes} dakika)`);
  }

  // 7. Category Check
  if (!recipe.category || recipe.category.trim().length === 0) {
    warnings.push('Kategori belirtilmemiş, varsayılan kategoriye atanacak');
  }

  // 8. Image Check (Warning only, does not invalidate)
  if (!recipe.image) {
    warnings.push('Görsel eksik veya placeholder olarak işaretlenmiş');
  }

  // 9. Video Check (Warning only)
  if (!recipe.videoId) {
    warnings.push('YouTube yapılış videosu atanmamış');
  }

  // 10. Description Check
  if (!recipe.description || recipe.description.length < 10) {
    warnings.push('Tarif açıklaması çok kısa veya eksik');
  }

  // Determine overall status
  let status: ValidationStatus = 'VALID';
  if (errors.length > 0) {
    status = 'INVALID';
  } else if (warnings.length > 0) {
    status = 'WARNING';
  }

  return {
    status,
    errors,
    warnings,
    recipe,
    isUsable: status !== 'INVALID'
  };
}
