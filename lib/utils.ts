import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Client-side image compression to WebP < 500 KB using browser-image-compression
 */
export async function compressAndProcessImage(file: File, maxSizeKB = 500): Promise<Blob> {
  if (typeof window === 'undefined') throw new Error('compressAndProcessImage must run in browser');

  const { default: imageCompression } = await import('browser-image-compression');

  const options = {
    maxSizeMB: maxSizeKB / 1024,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
  };

  const compressed = await imageCompression(file, options);
  return compressed;
}

/**
 * Format ISO date string to human-readable "Jun 22, 2026" or "2 hours ago" format
 */
export function formatDate(isoString: string, relative = false): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (relative) {
      const diff = Date.now() - date.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Severity badge color classes
 */
export function getSeverityClasses(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/15 text-red-400 border-red-500/25';
    case 'high': return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
    case 'medium': return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    default: return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
  }
}

/**
 * Status badge color classes
 */
export function getStatusClasses(status: string): string {
  switch (status) {
    case 'resolved': return 'bg-emerald-500/15 text-emerald-400';
    case 'validated': return 'bg-violet-500/15 text-violet-400';
    case 'assigned': return 'bg-orange-500/15 text-orange-400';
    case 'in_progress': return 'bg-blue-500/15 text-blue-400';
    case 'open': return 'bg-red-500/15 text-red-400';
    default: return 'bg-zinc-800 text-gray-400';
  }
}

/**
 * Generate initials from a full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '…';
}
