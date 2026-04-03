import { PrismaClient, JoinRequestStatus } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

const SEED_PASSWORD = "password123";

const USERS = [
  {
    name: "Alex Kim",
    email: "alex@test.com",
    bio: "Basketball and hiking enthusiast. New to LA!",
    interests: ["basketball", "hiking", "fitness"],
    location: "Santa Monica, CA",
    locationLat: 34.0195,
    locationLng: -118.4912,
    rating: 4.5,
    activityCount: 8,
  },
  {
    name: "Jordan Lee",
    email: "jordan@test.com",
    bio: "Runner and yoga lover. Always looking for workout buddies.",
    interests: ["running", "yoga", "fitness", "outdoors"],
    location: "Venice, CA",
    locationLat: 33.985,
    locationLng: -118.4695,
    rating: 4.2,
    activityCount: 12,
  },
  {
    name: "Sam Rivera",
    email: "sam@test.com",
    bio: "Foodie and casual gamer. Down for anything spontaneous.",
    interests: ["food", "gaming", "cooking", "movies"],
    location: "Westwood, CA",
    locationLat: 34.0596,
    locationLng: -118.4452,
    rating: 3.8,
    activityCount: 3,
  },
  {
    name: "Taylor Chen",
    email: "taylor@test.com",
    bio: "Rock climber and coffee snob. Let's go bouldering!",
    interests: ["climbing", "fitness", "hiking", "outdoors"],
    location: "Culver City, CA",
    locationLat: 34.0211,
    locationLng: -118.3965,
    rating: 4.8,
    activityCount: 20,
  },
  {
    name: "Morgan Blake",
    email: "morgan@test.com",
    bio: "Just moved here. Looking for pickup sports and board game nights.",
    interests: ["basketball", "soccer", "board games", "gaming"],
    location: "Downtown LA",
    locationLat: 34.0407,
    locationLng: -118.2468,
    rating: null,
    activityCount: 0,
  },
  {
    name: "Riley Park",
    email: "riley@test.com",
    bio: "Surfer and beach volleyball player. Sunset sessions are the best.",
    interests: ["surfing", "volleyball", "outdoors", "fitness"],
    location: "Manhattan Beach, CA",
    locationLat: 33.8847,
    locationLng: -118.4109,
    rating: 4.0,
    activityCount: 6,
  },
  {
    name: "Casey Nguyen",
    email: "casey@test.com",
    bio: "Photography walks and art museum trips. Creative people welcome.",
    interests: ["photography", "art", "walking", "museums"],
    location: "Silver Lake, LA",
    locationLat: 34.0869,
    locationLng: -118.2702,
    rating: 3.5,
    activityCount: 2,
  },
];

async function main() {
  console.log("Seeding database...\n");

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 12);

  // Create users
  const createdUsers = [];
  for (const userData of USERS) {
    const existing = await db.user.findUnique({
      where: { email: userData.email },
    });
    if (existing) {
      console.log(`  Skipping ${userData.name} (already exists)`);
      createdUsers.push(existing);
      continue;
    }
    const user = await db.user.create({
      data: { ...userData, password: hashedPassword },
    });
    console.log(`  Created user: ${user.name} (${user.email})`);
    createdUsers.push(user);
  }

  // Create activities hosted by different users
  const now = new Date();
  const activities = [
    {
      hostIndex: 0, // Alex
      title: "Pickup basketball at Venice Beach",
      description: "Looking for 4 more for a casual 5v5 game. All skill levels welcome!",
      tags: ["basketball", "fitness", "outdoors"],
      dateTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
      location: "Venice Beach Courts",
      locationLat: 33.985,
      locationLng: -118.4695,
      maxSpots: 8,
    },
    {
      hostIndex: 1, // Jordan
      title: "Morning trail run — Runyon Canyon",
      description: "Easy 5K pace. Meet at the main entrance. Bring water!",
      tags: ["running", "fitness", "outdoors", "hiking"],
      dateTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // +1 day
      location: "Runyon Canyon Main Entrance",
      locationLat: 34.1063,
      locationLng: -118.3487,
      maxSpots: 6,
    },
    {
      hostIndex: 2, // Sam
      title: "Board game night — Settlers of Catan",
      description: "Hosting at my place. Snacks provided. BYOB.",
      tags: ["board games", "gaming", "food"],
      dateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
      location: "Westwood Apartments",
      locationLat: 34.0596,
      locationLng: -118.4452,
      maxSpots: 4,
    },
    {
      hostIndex: 3, // Taylor
      title: "Bouldering session at Sender One",
      description: "V3-V5 range. Happy to help beginners too. Let's crush it.",
      tags: ["climbing", "fitness"],
      dateTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // +4 days
      location: "Sender One Climbing, LA",
      locationLat: 34.0211,
      locationLng: -118.3965,
      maxSpots: 3,
    },
    {
      hostIndex: 5, // Riley
      title: "Beach volleyball — sunset session",
      description: "Need 3 more for 4v4. Intermediate level preferred.",
      tags: ["volleyball", "fitness", "outdoors"],
      dateTime: new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000), // +1.5 days
      location: "Manhattan Beach Volleyball Courts",
      locationLat: 33.8847,
      locationLng: -118.4109,
      maxSpots: 6,
    },
    {
      hostIndex: 6, // Casey
      title: "Photography walk — Arts District",
      description: "Street photography + murals. Bring any camera, phone is fine too.",
      tags: ["photography", "art", "walking"],
      dateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 days
      location: "Arts District, Downtown LA",
      locationLat: 34.0407,
      locationLng: -118.2317,
      maxSpots: 8,
    },
  ];

  const createdActivities = [];
  for (const actData of activities) {
    const host = createdUsers[actData.hostIndex];
    const { hostIndex, ...data } = actData;
    const activity = await db.activity.create({
      data: { ...data, hostId: host.id, status: "open" },
    });
    console.log(`  Created activity: "${activity.title}" (hosted by ${host.name})`);
    createdActivities.push(activity);
  }

  // Create join requests across activities
  const joinRequestData = [
    // Basketball game — multiple requests
    { activityIndex: 0, userIndex: 1, score: 65 },
    { activityIndex: 0, userIndex: 3, score: 72 },
    { activityIndex: 0, userIndex: 4, score: 88, status: "approved" },
    { activityIndex: 0, userIndex: 5, score: 55 },
    // Trail run
    { activityIndex: 1, userIndex: 0, score: 78 },
    { activityIndex: 1, userIndex: 3, score: 82, status: "approved" },
    { activityIndex: 1, userIndex: 5, score: 60 },
    // Board game night
    { activityIndex: 2, userIndex: 4, score: 91 },
    { activityIndex: 2, userIndex: 6, score: 45 },
    // Bouldering
    { activityIndex: 3, userIndex: 0, score: 70, status: "approved" },
    { activityIndex: 3, userIndex: 1, score: 58 },
    // Beach volleyball
    { activityIndex: 4, userIndex: 0, score: 62 },
    { activityIndex: 4, userIndex: 1, score: 75, status: "approved" },
    { activityIndex: 4, userIndex: 3, score: 80 },
    { activityIndex: 4, userIndex: 4, score: 40 },
    // Photography walk
    { activityIndex: 5, userIndex: 2, score: 52 },
    { activityIndex: 5, userIndex: 4, score: 35 },
  ];

  for (const jrData of joinRequestData) {
    const activity = createdActivities[jrData.activityIndex];
    const user = createdUsers[jrData.userIndex];

    const existing = await db.joinRequest.findUnique({
      where: {
        activityId_userId: { activityId: activity.id, userId: user.id },
      },
    }).catch(() => null);

    if (existing) {
      console.log(`  Skipping join request: ${user.name} → "${activity.title}" (exists)`);
      continue;
    }

    await db.joinRequest.create({
      data: {
        activityId: activity.id,
        userId: user.id,
        compatibilityScore: jrData.score,
        status: (jrData.status ?? "pending") as JoinRequestStatus,
      },
    });
    console.log(
      `  Created join request: ${user.name} → "${activity.title}" (score: ${jrData.score}, ${jrData.status ?? "pending"})`,
    );
  }

  console.log("\nSeed complete!");
  console.log(`\nTest accounts (password: ${SEED_PASSWORD}):`);
  for (const u of USERS) {
    console.log(`  ${u.email} — ${u.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
