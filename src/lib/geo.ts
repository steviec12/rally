export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface WithCoordinates {
  locationLat: number;
  locationLng: number;
}

// Items with (0,0) coordinates are treated as ungeocoded and excluded.
export function filterByDistance<T extends WithCoordinates>(
  items: T[],
  userLat: number,
  userLng: number,
  maxKm: number
): T[] {
  return items.filter((item) => {
    if (item.locationLat === 0 && item.locationLng === 0) return false;
    return haversineKm(userLat, userLng, item.locationLat, item.locationLng) <= maxKm;
  });
}
