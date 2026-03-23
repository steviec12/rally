# Rally — Product Requirements Document

## Overview

Rally is a location-based, activity-first social platform where users post real-world activities and others request to join. Unlike dating-style friend apps (Bumble BFF) or structured event platforms (Meetup), Rally focuses on spontaneous, casual meetups driven by what people want to do — not who they want to be friends with.

**Core concept:** A user posts an "activity card" (e.g., "Pickup basketball at Venice Beach, Saturday 10am, 4 spots"). Others browse nearby activities, request to join, and the host approves based on compatibility scores the system provides.

## Problem Statement

People currently reach for the same clunky workarounds when they want to do something and need others to join:

- **Group chats:** Blast "anyone down for a hike Sunday?" to a general group, get ignored or maybe a response from one person, often too late to plan anything.
- **Instagram stories:** Post a poll or "anyone?" story. Reach is limited to existing followers, response is passive, and there's no way to vet who you'd actually be going with.
- **Meetup:** Works for highly structured, recurring events (book clubs, hiking clubs) but is friction-heavy for one-off spontaneous plans — you have to create an organization, manage RSVPs, and the UX is built for organizers, not participants.
- **Facebook Events:** Requires a social graph. You can only reach people you're already connected to, and the format assumes a large, formal invite list.
- **Just canceling the plan:** The most common outcome. If your usual group can't make it, the activity doesn't happen.

The failure mode in all these cases is the same: **the tools are built around existing relationships, not around the activity itself.** A person who wants to do something specific — not necessarily with friends, just with someone decent — has no good way to find that person quickly.

Rally solves this by making the activity the atomic unit: post what you want to do, let compatible strangers discover it, and let the host decide who joins based on a compatibility score — not a social connection.

## Customer Segment

A good customer segment is a who-where pair (per The Mom Test, Chapter 7): a specific person in a specific, findable context.

**Primary segment:** College students (ages 18–24) at mid-to-large universities who want activity partners outside their immediate friend group — especially for physical activities (pickup sports, gym sessions, outdoor runs, intramural-style games) that require a minimum headcount or a partner to be worth doing.

- **Who:** A sophomore or junior who plays pickup basketball, runs, or rock climbs. They have a small but close friend group that doesn't always overlap with their specific interests or availability.
- **Where:** On campus or near campus — recreation centers, sport courts, trails, gyms, and student-adjacent neighborhoods. This population is geographically dense and activity-infrastructure-rich, making proximity matching highly valuable.
- **Why they struggle today:** Their go-to move is texting a group chat or posting a story. This works inconsistently — it only reaches people they already know, response rate is low, and it's impossible to vet a stranger through those channels even if someone does respond.

**Secondary segment:** People who recently moved to a new city (ages 22–35) and are rebuilding their activity social circle. They know what they like to do; they just don't have the people yet. They're highly motivated to find activity partners but have no existing local social graph to broadcast to.

- **Where to find them:** "New to [city]" subreddits, Facebook groups for newcomers, Bumble BFF, Meetup event attendees.

## Assumptions to Validate

These are the load-bearing assumptions the product is built on. Each one is a hypothesis until we have real evidence.

| Assumption | Why it matters | How to test it |
|---|---|---|
| People actually fail to find activity partners on short notice | The whole premise. If people's existing friend groups reliably work out, Rally has no opening. | Talk to 10–15 people in the primary segment. Ask: "Tell me about the last time you wanted to do [activity] and couldn't find anyone to go with. What did you do?" Don't ask "does this happen to you?" — ask about the last specific time. |
| The workarounds (group chats, stories) feel broken enough to motivate switching | Even if the problem exists, the workarounds might be "good enough." Switching to a new app is high friction. | In the same conversations: "How'd that work out? Was it good enough, or did it feel like a failure?" Look for frustration, not just acknowledgment. |
| Hosts are comfortable letting strangers join their activities | If hosts only want to meet people through existing mutual connections, compatibility scoring is irrelevant — they'll never approve an unknown. | Ask hosts: "Have you ever let someone you didn't know join an activity? How did you decide? What made you trust them?" |
| A compatibility score is a sufficient trust signal for approval | Hosts may want more context (photos, mutual friends, a message) before approving a stranger. The score alone might not be enough. | Show wireframes or a paper prototype to 5 potential hosts. Ask them to react to a scored join request. "Would you approve this? What else would you want to know?" |
| New users will post an activity before they have an established rating or history | Cold start problem: the value of the feed depends on activities being posted, but new users get low compatibility scores until they've done activities. | Ask potential users: "If you signed up today and had no history, would you post an activity knowing people would see a low compatibility score on your profile?" |
| Geographic density is sufficient in the target segment | Proximity matching only works if there are enough nearby users. In low-density areas, the pool is too small. | Define "enough": at least 5–10 activities posted per week within 5 miles. Pilot in a geographically dense segment (a large university campus) before expanding. |

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
