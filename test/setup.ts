import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock File API if not present in Node environment
if (typeof global.File === 'undefined') {
  class MockFile extends Blob {
    name: string;
    lastModified: number = Date.now();
    constructor(parts: any[], name: string, options?: any) {
      super(parts, options);
      this.name = name;
    }
  }
  global.File = MockFile as any;
}

// Mock google maps globally
global.window = global.window || {};
(global as any).window.google = {
  maps: {
    Map: vi.fn().mockImplementation(() => ({
      addListener: vi.fn(),
      setCenter: vi.fn(),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      addListener: vi.fn(),
      setPosition: vi.fn(),
      setMap: vi.fn(),
    })),
    Geocoder: vi.fn().mockImplementation(() => ({
      geocode: vi.fn().mockImplementation((req, callback) => {
        callback([{ formatted_address: 'Mock address, MG Road, New Delhi' }], 'OK');
      }),
    })),
    SymbolPath: { CIRCLE: 1 },
  },
};

// Mock geolocation api safely in node/jsdom
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) =>
    success({
      coords: {
        latitude: 28.6139,
        longitude: 77.209,
      },
    })
  ),
  watchPosition: vi.fn(),
};

global.navigator = global.navigator || {};
(global as any).navigator.geolocation = mockGeolocation;
