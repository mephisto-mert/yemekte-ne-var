/**
 * Binary Image & File Signature Validation.
 * 
 * Verifies that downloaded image buffers are genuine image formats (JPEG, PNG, WEBP),
 * prevents Content-Type spoofing (e.g. HTML served as JPEG), extracts real dimensions,
 * and blocks microscopic tracking pixels.
 */

export type SupportedImageFormat = 'jpeg' | 'png' | 'webp';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface BinaryValidationOptions {
  expectedMimeType?: string;
  minWidth?: number;
  minHeight?: number;
  maxDimension?: number;
  maxByteSize?: number;
}

export interface BinaryValidationResult {
  isValid: boolean;
  format?: SupportedImageFormat;
  mimeType?: string;
  dimensions?: ImageDimensions;
  byteSize: number;
  error?: string;
}

/**
 * Detects image format based strictly on Magic Bytes (File Signatures).
 */
export function detectMagicBytes(buffer: Buffer | Uint8Array): { format: SupportedImageFormat | null; mimeType: string | null } {
  if (!buffer || buffer.length < 12) {
    return { format: null, mimeType: null };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { format: 'jpeg', mimeType: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 && // P
    buffer[2] === 0x4E && // N
    buffer[3] === 0x47 && // G
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { format: 'png', mimeType: 'image/png' };
  }

  // 3. WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50   // P
  ) {
    return { format: 'webp', mimeType: 'image/webp' };
  }

  return { format: null, mimeType: null };
}

/**
 * Extracts real dimensions (width, height) directly from the binary buffer.
 */
export function extractBinaryDimensions(buffer: Buffer | Uint8Array, format: SupportedImageFormat): ImageDimensions | null {
  try {
    if (format === 'png') {
      // PNG IHDR is at offset 12..24. Width at 16..19, Height at 20..23 (Big-Endian)
      if (buffer.length >= 24) {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const width = view.getUint32(16, false);
        const height = view.getUint32(20, false);
        return { width, height };
      }
    }

    if (format === 'jpeg') {
      // Walk JPEG markers to find SOF (Start of Frame)
      let offset = 2;
      const len = buffer.length;
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

      while (offset < len) {
        if (buffer[offset] !== 0xFF) {
          offset++;
          continue;
        }

        const marker = buffer[offset + 1];

        // SOF markers: C0 to C3, C5 to C7, C9 to CB
        const isSof =
          (marker >= 0xC0 && marker <= 0xC3) ||
          (marker >= 0xC5 && marker <= 0xC7) ||
          (marker >= 0xC9 && marker <= 0xCB);

        if (isSof && offset + 8 < len) {
          const height = view.getUint16(offset + 5, false);
          const width = view.getUint16(offset + 7, false);
          return { width, height };
        }

        // Standalone markers without length
        if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
          offset += 2;
          continue;
        }

        // Next marker offset by payload length
        if (offset + 3 < len) {
          const markerLen = view.getUint16(offset + 2, false);
          offset += 2 + markerLen;
        } else {
          break;
        }
      }
    }

    if (format === 'webp') {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      // Chunk header starts at offset 12
      const chunkType = String.fromCharCode(buffer[12], buffer[13], buffer[14], buffer[15]);

      // Lossy VP8
      if (chunkType === 'VP8 ' && buffer.length >= 30) {
        const width = (view.getUint16(26, true) & 0x3FFF);
        const height = (view.getUint16(28, true) & 0x3FFF);
        return { width, height };
      }

      // Lossless VP8L
      if (chunkType === 'VP8L' && buffer.length >= 25) {
        const b1 = buffer[21];
        const b2 = buffer[22];
        const b3 = buffer[23];
        const b4 = buffer[24];
        const width = 1 + (((b2 & 0x3F) << 8) | b1);
        const height = 1 + (((b4 & 0x0F) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6));
        return { width, height };
      }

      // Extended VP8X
      if (chunkType === 'VP8X' && buffer.length >= 30) {
        const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
        const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
        return { width, height };
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Thoroughly validates image buffer integrity, file signature, format matching, and dimensions.
 */
export function validateImageBinary(
  buffer: Buffer | Uint8Array,
  options?: BinaryValidationOptions
): BinaryValidationResult {
  const byteSize = buffer ? buffer.length : 0;

  if (!buffer || byteSize === 0) {
    return { isValid: false, byteSize: 0, error: 'İndirilen görsel içeriği boş (0 byte).' };
  }

  // Max byte limit check
  const maxBytes = options?.maxByteSize ?? 10 * 1024 * 1024; // 10 MB default
  if (byteSize > maxBytes) {
    return {
      isValid: false,
      byteSize,
      error: `Dosya boyutu maksimum sınırı aştı (${(byteSize / 1024 / 1024).toFixed(2)} MB > ${(maxBytes / 1024 / 1024).toFixed(2)} MB)`
    };
  }

  // HTML detection check
  const preview = String.fromCharCode(...buffer.slice(0, 100)).toLowerCase();
  if (preview.includes('<html') || preview.includes('<!doctype') || preview.includes('<body') || preview.includes('<svg')) {
    return {
      isValid: false,
      byteSize,
      error: 'Binary doğrulaması başarısız: Yanıt görsel yerine HTML/XML/SVG metni içeriyor.'
    };
  }

  // Magic bytes check
  const { format, mimeType } = detectMagicBytes(buffer);
  if (!format || !mimeType) {
    return {
      isValid: false,
      byteSize,
      error: 'Bilinmeyen veya desteklenmeyen görsel imzası (Yalnızca JPEG, PNG ve WEBP desteklenir).'
    };
  }

  // Content-Type / MIME mismatch check
  if (options?.expectedMimeType) {
    const expected = options.expectedMimeType.toLowerCase().trim();
    // Normalize image/jpg to image/jpeg
    const normalizedExpected = expected === 'image/jpg' ? 'image/jpeg' : expected;
    if (normalizedExpected !== mimeType && !normalizedExpected.includes('*')) {
      return {
        isValid: false,
        byteSize,
        format,
        mimeType,
        error: `Content-Type (${options.expectedMimeType}) ile tespit edilen dosya imzası (${mimeType}) uyuşmuyor.`
      };
    }
  }

  // Dimensions check
  const dimensions = extractBinaryDimensions(buffer, format);
  const minWidth = options?.minWidth ?? 200;
  const minHeight = options?.minHeight ?? 200;
  const maxDimension = options?.maxDimension ?? 6000;

  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
    return {
      isValid: false,
      byteSize,
      format,
      mimeType,
      error: 'Görsel boyutları binary başlığından okunamadı veya dosya bozuk.'
    };
  }

  if (dimensions.width < minWidth || dimensions.height < minHeight) {
    return {
      isValid: false,
      byteSize,
      format,
      mimeType,
      dimensions,
      error: `Görsel boyutları minimum kalitenin altında (${dimensions.width}x${dimensions.height} < ${minWidth}x${minHeight}px).`
    };
  }

  if (dimensions.width > maxDimension || dimensions.height > maxDimension) {
    return {
      isValid: false,
      byteSize,
      format,
      mimeType,
      dimensions,
      error: `Görsel boyutları maksimum sınırın üzerinde (${dimensions.width}x${dimensions.height} > ${maxDimension}px).`
    };
  }

  return {
    isValid: true,
    format,
    mimeType,
    dimensions,
    byteSize
  };
}
