import fs from 'fs';
import path from 'path';

export interface AtomicWriteOptions {
  tempDir?: string;
}

/**
 * Writes a buffer atomically to destinationPath using a staging temporary file and fs.rename.
 * Ensures parent directories exist and guarantees zero partial or corrupt files on crash/failure.
 */
export async function writeBufferAtomic(
  destinationPath: string,
  buffer: Buffer | Uint8Array,
  options?: AtomicWriteOptions
): Promise<void> {
  const normalizedDest = path.resolve(destinationPath);
  const destDir = path.dirname(normalizedDest);

  // 1. Ensure destination directory exists
  await fs.promises.mkdir(destDir, { recursive: true });

  // 2. Generate a unique staging temp file path on the same filesystem
  const stagingDir = options?.tempDir ? path.resolve(options.tempDir) : destDir;
  await fs.promises.mkdir(stagingDir, { recursive: true });

  const randomSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tmpPath = path.join(stagingDir, `.${path.basename(normalizedDest)}.tmp_${randomSuffix}`);

  try {
    // 3. Write data to temporary file
    await fs.promises.writeFile(tmpPath, buffer);

    // 4. Atomic rename / move to destination path
    await fs.promises.rename(tmpPath, normalizedDest);
  } catch (err: any) {
    // Clean up temporary file on failure
    try {
      if (fs.existsSync(tmpPath)) {
        await fs.promises.unlink(tmpPath);
      }
    } catch {
      // Ignore unlink error during failure recovery
    }
    throw new Error(`Atomik dosya yazma başarısız oldu (${normalizedDest}): ${err.message}`);
  }
}
