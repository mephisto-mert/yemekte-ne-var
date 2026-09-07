import fs from 'fs';
import path from 'path';
import { ReviewItem, ReviewItemType, IssueSeverity, ReviewStatus, RecipeEnrichmentResult } from './types';

export class HumanReviewQueue {
  private items: Map<string, ReviewItem> = new Map();

  addItem(itemData: {
    recipeId: string;
    type: ReviewItemType;
    severity: IssueSeverity;
    reason: string;
    source: string;
    candidate?: any;
  }): ReviewItem {
    const id = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item: ReviewItem = {
      id,
      recipeId: itemData.recipeId,
      type: itemData.type,
      severity: itemData.severity,
      reason: itemData.reason,
      source: itemData.source,
      candidate: itemData.candidate,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    this.items.set(id, item);
    return item;
  }

  getPendingItems(): ReviewItem[] {
    return Array.from(this.items.values()).filter(i => i.status === 'pending');
  }

  getByRecipeId(recipeId: string): ReviewItem[] {
    return Array.from(this.items.values()).filter(i => i.recipeId === recipeId);
  }

  resolveItem(id: string, status: ReviewStatus, notes?: string): boolean {
    const item = this.items.get(id);
    if (!item) return false;

    item.status = status;
    item.resolutionNotes = notes;
    return true;
  }

  exportQueue(): ReviewItem[] {
    return Array.from(this.items.values());
  }

  async saveToFile(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    const data = this.exportQueue();
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  clear(): void {
    this.items.clear();
  }
}

/**
 * Extracts review queue candidates from an enriched recipe result.
 */
export function extractReviewItemsFromEnrichment(
  enrichment: Omit<RecipeEnrichmentResult, 'reviewItems'>
): ReviewItem[] {
  const items: ReviewItem[] = [];
  const recipeId = enrichment.recipeId;
  const source = enrichment.source;

  // 1. Translation review
  if (enrichment.localizedData.translationStatus === 'not_translated' || enrichment.localizedData.translationStatus === 'pending') {
    items.push({
      id: `rev_trans_${recipeId}`,
      recipeId,
      type: 'translation',
      severity: 'warning',
      reason: 'Yabancı dildeki tarif henüz Türkçe\'ye yerelleştirilmedi.',
      source,
      candidate: { sourceTitle: enrichment.localizedData.sourceTitle, sourceLanguage: enrichment.localizedData.sourceLanguage },
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
  }

  // 2. Image license review
  if (enrichment.imageData.status === 'needs_review') {
    items.push({
      id: `rev_img_${recipeId}`,
      recipeId,
      type: 'image',
      severity: 'warning',
      reason: 'Görsel adayı lisans ve telif doğrulama kontrolü bekliyor.',
      source,
      candidate: { url: enrichment.imageData.sourceUrl, license: enrichment.imageData.license },
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
  }

  // 3. Taxonomy review
  if (enrichment.taxonomyData.status === 'unknown') {
    items.push({
      id: `rev_tax_${recipeId}`,
      recipeId,
      type: 'taxonomy',
      severity: 'warning',
      reason: 'Kategori Cookly standart mutfak taksonomisine tam eşlenemedi.',
      source,
      candidate: { rawCategory: enrichment.taxonomyData.sourceCategory },
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
  }

  return items;
}
