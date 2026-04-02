export interface FeedActivity {
  id: string;
  title: string;
  tags: string[];
  dateTime: string; // ISO string — serialized from Date for client components
  location: string;
  maxSpots: number;
  host: { id: string; name: string | null; image: string | null };
  _count: { joinRequests: number };
}
