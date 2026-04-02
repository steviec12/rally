"use client";

import { useState, useCallback, useRef } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

type OnSuccess = (lat: number, lng: number) => void;

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: false,
  });

  const onSuccessRef = useRef<OnSuccess | null>(null);

  const requestLocation = useCallback((onSuccess?: OnSuccess) => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }

    onSuccessRef.current = onSuccess ?? null;
    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setState({ lat, lng, error: null, loading: false });
        onSuccessRef.current?.(lat, lng);
        onSuccessRef.current = null;
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message, loading: false }));
        onSuccessRef.current = null;
      },
    );
  }, []);

  return { ...state, requestLocation };
}
