/**
 * Haversine distance between two GPS coordinates (in km)
 */
export function getHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Cosine similarity between two numeric vectors (for embedding-based duplicate detection)
 */
export function getCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Ray-casting point-in-polygon check for GeoJSON polygons
 */
export function isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][1], yi = ring[i][0];
      const xj = ring[j][1], yj = ring[j][0];
      const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

/**
 * Build Google Maps marker color by issue status
 */
export function getMarkerColorByStatus(status: string): string {
  const map: Record<string, string> = {
    reported: '#f59e0b',
    open: '#ef4444',
    validated: '#8b5cf6',
    assigned: '#f97316',
    in_progress: '#3b82f6',
    resolved: '#10b981',
    archived: '#6b7280',
  };
  return map[status] ?? '#6b7280';
}

/**
 * Build Google Maps marker SVG pin by color
 */
export function buildMarkerSvg(color: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11.314 14 24 16 24s16-12.686 16-24C32 7.163 24.837 0 16 0z" fill="${color}"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `)}`;
}
