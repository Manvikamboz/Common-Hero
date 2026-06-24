import { useState, useEffect, useCallback } from 'react';

interface Coords {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    setLocation(null);
    setLoading(true);
    setError(null);

    const fallbackToIP = () => {
      fetch('https://ipapi.co/json/')
        .then((res) => {
          if (!res.ok) throw new Error('IP lookup failed');
          return res.json();
        })
        .then((data) => {
          if (data.latitude && data.longitude) {
            setLocation({
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
            });
            setError(null);
          } else {
            setError('Location permission denied. Please select your location on the map.');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Location permission denied. Please select your location on the map.');
          setLoading(false);
        });
    };

    if (!navigator.geolocation) {
      fallbackToIP();
      return;
    }

    // Try High Accuracy first (satellite/GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (highAccErr) => {
        console.warn('GPS high accuracy failed, retrying with low accuracy:', highAccErr.message);
        // Try Low Accuracy (Wi-Fi/Cell towers)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setError(null);
            setLoading(false);
          },
          (lowAccErr) => {
            console.warn('GPS low accuracy failed, falling back to IP geolocation:', lowAccErr.message);
            fallbackToIP();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { location, error, loading, requestLocation };
}
