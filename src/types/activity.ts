export interface FeedActivity {
  id: string;
  title: string;
  tags: string[];
  dateTime: string; // ISO string — serialized from Date for client components
  location: string;
  locationLat: number;
  locationLng: number;
  maxSpots: number;
  host: { id: string; name: string | null; image: string | null };
  _count: { joinRequests: number };
}

export interface FeedFilters {
  tags?: string[];
  customTags?: boolean;
  dateFrom?: string;
  dateTo?: string;
  distanceKm?: number;
  userLat?: number;
  userLng?: number;
}
