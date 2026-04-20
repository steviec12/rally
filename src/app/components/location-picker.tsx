'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

function DraggableMarker({
  lat,
  lng,
  onLocationChange,
}: {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={[lat, lng]}
      icon={markerIcon}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const pos = marker.getLatLng();
            onLocationChange(pos.lat, pos.lng);
          }
        },
      }}
    />
  );
}

export default function LocationPicker({ lat, lng, onLocationChange }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLocation = lat != null && lng != null;

  useEffect(() => {
    if (hasLocation) return;
    requestLocation();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setError(err.message);
        setLocating(false);
      }
    );
  }

  if (locating) {
    return (
      <div
        style={{
          height: 200,
          borderRadius: 12,
          background: 'var(--fuchsia-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--text-muted)',
        }}
      >
        Getting your location…
      </div>
    );
  }

  if (!hasLocation) {
    return (
      <div
        style={{
          height: 200,
          borderRadius: 12,
          background: 'var(--fuchsia-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {error && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--fuchsia)',
              textAlign: 'center',
              padding: '0 16px',
            }}
          >
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={requestLocation}
          style={{
            padding: '8px 16px',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 13,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Allow location access
        </button>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          Tap the map to set a pin, or drag to adjust
        </p>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', height: 200 }}>
      <MapContainer
        center={[lat!, lng!]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DraggableMarker lat={lat!} lng={lng!} onLocationChange={onLocationChange} />
      </MapContainer>
    </div>
  );
}
