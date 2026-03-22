# Rally — Product Requirements Document

## Overview

Rally is a location-based, activity-first social platform where users post real-world activities and others request to join. Unlike dating-style friend apps (Bumble BFF) or structured event platforms (Meetup), Rally focuses on spontaneous, casual meetups driven by what people want to do — not who they want to be friends with.

**Core concept:** A user posts an "activity card" (e.g., "Pickup basketball at Venice Beach, Saturday 10am, 4 spots"). Others browse nearby activities, request to join, and the host approves based on compatibility scores the system provides.

## Problem Statement

People who want to do activities — hiking, pickup sports, trying a new restaurant, going to a concert — often can't find others to join on short notice. Existing solutions are either:
- **Too relationship-focused** (Bumble BFF requires building a friendship before doing anything)
- **Too structured** (Meetup requires organizing formal events with RSVPs)
- **Too tied to existing social graphs** (Instagram/Facebook only surfaces your current friends)

Rally fills the gap for **spontaneous, activity-first matching with strangers**.

## Target Users

- College students looking for activity partners outside their immediate friend group
- People who recently moved to a new city
- Anyone whose usual friends aren't available or aren't into a specific activity

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **ORM:** Prisma
- **Database:** Neon (PostgreSQL)
- **Authentication:** NextAuth.js
- **Deployment:** Vercel

## Core Features (MVP)

### 1. User Authentication & Profile
- Sign up / sign in via NextAuth (Google OAuth + email)
- Profile: display name, bio, avatar, interest tags (e.g., "basketball", "hiking", "food", "gaming"), location (city/zip)
- Users can update their profile and interests at any time

### 2. Activity Cards (CRUD)
- **Create:** Host posts an activity card with:
  - Title (e.g., "Sunday morning trail run")
  - Activity type / tags (e.g., "running", "outdoors", "fitness")
  - Date and time
  - Location (address or area name)
  - Max number of spots
  - Description (optional details)
- **Read:** Browse a feed of nearby activity cards
- **Update:** Host can edit their activity before the date
- **Delete:** Host can cancel an activity

### 3. Activity Feed
- Default feed shows nearby activities sorted by relevance
- Filters: activity type, date range, distance radius
- Cards display: title, host name, date/time, location, spots remaining, activity tags

### 4. Join Requests
- Users can request to join an activity (one request per activity)
- Host sees a list of join requests ranked by compatibility score
- Host approves or declines each request
- Requester gets notified of the decision
- Spots remaining updates in real time

### 5. Compatibility Scoring Algorithm
This is the core differentiator and the primary feature for TDD development.

**Inputs:**
- Requesting user's profile (interests, location, rating)
- Activity card details (tags, location)
- Host's preferences (if any)

**Scoring factors (weighted):**
- **Shared interest tags** between requester and activity tags (weight: 40%)
- **Proximity** — distance between requester's location and activity location (weight: 30%)
- **User rating** — requester's average rating from past activities (weight: 20%)
- **Activity history** — number of completed activities (reliability signal) (weight: 10%)

**Output:** A normalized score from 0–100 for each join request, used to rank requests for the host.

**Edge cases to handle:**
- New user with no rating or history (default/neutral score)
- User with no matching interest tags (minimum score, not zero)
- Activity with no join requests (empty state)
- User requesting to join their own activity (should be rejected)
- Activity that is already full (request should be blocked)
- Activity whose date has passed (should not appear in feed)

### 6. Ratings
- After an activity's date passes, participants can rate each other (1–5 stars)
- Ratings contribute to a user's overall rating displayed on their profile
- Ratings are anonymous

## Data Models

### User
- id, name, email, avatar, bio, interests (string[]), location, rating (float), activityCount (int), createdAt

### Activity
- id, hostId (FK → User), title, description, tags (string[]), dateTime, location, locationLat, locationLng, maxSpots, status (open/full/completed/cancelled), createdAt

### JoinRequest
- id, activityId (FK → Activity), userId (FK → User), status (pending/approved/declined), compatibilityScore (float), createdAt

### Rating
- id, raterId (FK → User), rateeId (FK → User), activityId (FK → Activity), score (int 1-5), createdAt

## Out of Scope for MVP
- Real-time chat/messaging between users
- Push notifications (email only if at all)
- Image uploads for activities
- Payment or ticketing
- Mobile native app (web only)
- Social graph / friend lists
- Report/block system (important for production, but not MVP)

## Success Metrics (Conceptual)
- Number of activities posted per week
- Join request → approval rate
- User return rate after first activity
- Average rating per user
