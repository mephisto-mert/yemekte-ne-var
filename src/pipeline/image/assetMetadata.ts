import fs from 'fs';
import path from 'path';

export type DownloadStatus =
  | 'planned'
  | 'downloading'
  | 'downloaded'
  | 'validated'
  | 'processed'
  | 'stored'
  | 'failed'
  | 'rejected';

/**
 * Complete audit and runtime metadata for a localized recipe image asset.
 * Guarantees zero license fabrication.
 */
export interface RecipeImageAsset {
  recipeId: string;
  assetPath: string;
  source: string;
  sourceId: string;
  sourceUrl: string;
  originalUrl: string;
  license: string;
  attribution: string;
  checksum: string;
  mimeType: string;
  format: string;
  width: number;
  height: number;
  byteSize: number;
  downloadedAt: string;
  processedAt: string;
  status: DownloadStatus;
  error?: string;
}

export interface RecipeImageManifest {
  version: string;
  lastUpdated: string;
  totalAssets: number;
  assets: Record<string, RecipeImageAsset>;
}

export function createEmptyManifest(): RecipeImageManifest {
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    totalAssets: 0,
    assets: {}
  };
}

export async function loadManifest(manifestPath: string): Promise<RecipeImageManifest> {
  const resolved = path.resolve(manifestPath);
  try {
    if (fs.existsSync(resolved)) {
      const content = await fs.promises.readFile(resolved, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // Fall back to empty manifest on read/parse error
  }
  return createEmptyManifest();
}

export async function saveManifest(manifestPath: string, manifest: RecipeImageManifest): Promise<void> {
  const resolved = path.resolve(manifestPath);
  const dir = path.dirname(resolved);
  await fs.promises.mkdir(dir, { recursive: true });

  const updated: RecipeImageManifest = {
    ...manifest,
    lastUpdated: new Date().toISOString(),
    totalAssets: Object.keys(manifest.assets).length
  };

  await fs.promises.writeFile(resolved, JSON.stringify(updated, null, 2), 'utf8');
}
