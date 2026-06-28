/**
 * Server-side media hardening utility.
 * Validates magic bytes (real MIME type), enforces size limits, and strips JPEG EXIF metadata.
 */

// Max 10MB size limit
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate MIME type by checking the magic bytes of the file buffer
 */
export function validateMagicBytes(buffer: Buffer): { isValid: boolean; mime: string } {
  if (buffer.length < 4) {
    return { isValid: false, mime: 'unknown' };
  }

  const hex = buffer.toString('hex', 0, 4).toUpperCase();

  // JPEG: FF D8 FF
  if (hex.startsWith('FFD8FF')) {
    return { isValid: true, mime: 'image/jpeg' };
  }
  // PNG: 89 50 4E 47
  if (hex === '89504E47') {
    return { isValid: true, mime: 'image/png' };
  }
  // WebP: RIFF ... WEBP (hex 52 49 46 46 at start, 57 45 42 50 at index 8)
  if (hex === '52494646') {
    const webpHex = buffer.toString('hex', 8, 12).toUpperCase();
    if (webpHex === '57454250') {
      return { isValid: true, mime: 'image/webp' };
    }
  }
  // GIF: 47 49 46 38 (GIF8)
  if (hex === '47494638') {
    return { isValid: true, mime: 'image/gif' };
  }
  
  // MP4: index 4 has 'ftyp' (66747970)
  if (buffer.length >= 8 && buffer.toString('hex', 4, 8).toUpperCase() === '66747970') {
    return { isValid: true, mime: 'video/mp4' };
  }
  
  // WebM: starts with 1A45DFA3
  if (hex === '1A45DFA3') {
    return { isValid: true, mime: 'video/webm' };
  }

  return { isValid: false, mime: 'unknown' };
}

/**
 * Scan and strip EXIF (APP1) segments from a JPEG buffer to prevent location leaks.
 */
export function stripExifFromJpeg(buffer: Buffer): Buffer {
  // Check if it is a valid JPEG
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer; // Return unchanged if not JPEG
  }

  const resultChunks: Buffer[] = [];
  let offset = 2;

  // Add the SOI (Start of Image) marker
  resultChunks.push(buffer.subarray(0, 2));

  while (offset < buffer.length) {
    // End of markers
    if (offset + 1 >= buffer.length) break;

    // A marker must start with 0xFF
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];

    // SOS (Start of Scan) or EOI (End of Image) markers mean we are done parsing metadata
    if (marker === 0xda || marker === 0xd9) {
      resultChunks.push(buffer.subarray(offset));
      break;
    }

    // Read segment size (big endian)
    if (offset + 3 >= buffer.length) break;
    const length = (buffer[offset + 2] << 8) + buffer[offset + 3];

    // APP1 marker (0xE1) contains EXIF data. Skip it.
    if (marker === 0xe1) {
      offset += length + 2;
      continue;
    }

    // Keep other segments
    resultChunks.push(buffer.subarray(offset, offset + length + 2));
    offset += length + 2;
  }

  return Buffer.concat(resultChunks);
}

/**
 * Hardens uploaded files:
 * 1. Checks file size
 * 2. Validates magic bytes
 * 3. Strips EXIF metadata if JPEG
 */
export function hardenUploadedFile(
  buffer: Buffer
): { success: boolean; error?: string; hardenedBuffer: Buffer; mimeType: string } {
  // 1. File size check
  if (buffer.length > MAX_FILE_SIZE) {
    return { success: false, error: 'File size exceeds maximum limit of 10MB', hardenedBuffer: buffer, mimeType: 'unknown' };
  }

  // 2. Magic bytes validation
  const validation = validateMagicBytes(buffer);
  if (!validation.isValid) {
    return { success: false, error: 'Invalid file format. Only images (JPEG, PNG, WebP) and videos (MP4, WebM) are allowed.', hardenedBuffer: buffer, mimeType: 'unknown' };
  }

  // 3. EXIF stripping for JPEGs
  let hardenedBuffer = buffer;
  if (validation.mime === 'image/jpeg') {
    try {
      hardenedBuffer = stripExifFromJpeg(buffer);
    } catch (e) {
      console.warn('Failed to strip EXIF from image: ', e);
    }
  }

  return {
    success: true,
    hardenedBuffer,
    mimeType: validation.mime,
  };
}
