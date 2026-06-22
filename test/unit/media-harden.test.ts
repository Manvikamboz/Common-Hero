import { describe, it, expect } from 'vitest';
import { validateMagicBytes, stripExifFromJpeg, hardenUploadedFile } from '@/lib/media-harden';

describe('Media Hardening Unit Tests', () => {
  it('should identify JPEG magic bytes correctly', () => {
    const mockJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const validation = validateMagicBytes(mockJpeg);
    expect(validation.isValid).toBe(true);
    expect(validation.mime).toBe('image/jpeg');
  });

  it('should identify PNG magic bytes correctly', () => {
    const mockPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validation = validateMagicBytes(mockPng);
    expect(validation.isValid).toBe(true);
    expect(validation.mime).toBe('image/png');
  });

  it('should reject unknown format magic bytes', () => {
    const mockTxt = Buffer.from('hello world plain text content');
    const validation = validateMagicBytes(mockTxt);
    expect(validation.isValid).toBe(false);
    expect(validation.mime).toBe('unknown');
  });

  it('should reject files exceeding 10MB', () => {
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const result = hardenUploadedFile(hugeBuffer);
    expect(result.success).toBe(false);
    expect(result.error).toContain('size exceeds');
  });

  it('should parse JPEG markers and strip APP1 EXIF segment safely', () => {
    // SOI marker: FF D8
    // APP1 marker with length: FF E1 00 08 45 78 69 66 00 00
    // DQT marker: FF DB 00 04 00 01
    // EOI marker: FF D9
    const mockJpegWithExif = Buffer.from([
      0xff, 0xd8, // SOI
      0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // APP1 (EXIF)
      0xff, 0xdb, 0x00, 0x04, 0x00, 0x01, // DQT
      0xff, 0xd9 // EOI
    ]);

    const sanitized = stripExifFromJpeg(mockJpegWithExif);

    // Verify APP1 (FF E1) marker segment is removed
    const hasApp1 = sanitized.includes(Buffer.from([0xff, 0xe1]));
    expect(hasApp1).toBe(false);

    // Verify SOI and EOI remain
    expect(sanitized[0]).toBe(0xff);
    expect(sanitized[1]).toBe(0xd8);
  });
});
