# Schema Updates for Database Seeding

## Overview
Added missing models to the Amplify schema to support full database seeding with Organizations, Posts, and Events.

## New Models Added

### 1. Organization Model
**Purpose**: Represents martial arts, wellness, and crafts organizations

**Fields**:
- `name` (string, required): Organization name
- `description` (string, required): Organization description
- `type` (string, required): Organization type (martial-arts, wellness, crafts)
- `foundedYear` (integer): Year founded
- `headquarters` (string): Headquarters location
- `memberCount` (integer, default: 0): Number of members
- `website` (string): Organization website
- `contactEmail` (string): Contact email
- `isVerified` (boolean, default: false): Verification status

**Authorization**:
- Guests: Read
- Authenticated: Read, Create, Update, Delete

### 2. Post Model
**Purpose**: Represents user-generated feed posts

**Fields**:
- `content` (string, required): Post content
- `authorId` (string, required): Author's user ID
- `authorName` (string, required): Author's display name
- `authorHandle` (string, required): Author's handle
- `authorImage` (string): Author's profile image
- `likes` (integer, default: 0): Number of likes
- `comments` (integer, default: 0): Number of comments
- `shares` (integer, default: 0): Number of shares
- `images` (string array): Post images
- `tags` (string array): Post tags
- `isPublic` (boolean, default: true): Public visibility

**Authorization**:
- Guests: Read
- Authenticated: Read, Create, Update, Delete

### 3. Event Model
**Purpose**: Represents workshops, seminars, competitions, and other events

**Fields**:
- `title` (string, required): Event title
- `description` (string, required): Event description
- `startDate` (datetime, required): Event start date/time
- `endDate` (datetime, required): Event end date/time
- `location` (string, required): Event location name
- `address` (string): Street address
- `city` (string): City
- `state` (string): State
- `zipCode` (string): ZIP code
- `organizerId` (string, required): Organizer's ID
- `organizerName` (string, required): Organizer's name
- `maxAttendees` (integer): Maximum attendees
- `currentAttendees` (integer, default: 0): Current attendees
- `price` (float, default: 0): Event price
- `isVirtual` (boolean, default: false): Virtual event flag
- `isFree` (boolean, default: false): Free event flag
- `tags` (string array): Event tags
- `image` (string): Event image

**Authorization**:
- Guests: Read
- Authenticated: Read, Create, Update, Delete

## Updated Models

### Studio Model
**Changes**: Added new required fields to match seeding data structure

**New Fields**:
- `city` (string, required): City name
- `state` (string, required): State
- `zipCode` (string, required): ZIP code
- `country` (string, required): Country
- `primaryArt` (string): Primary art taught
- `instructorCount` (integer, default: 0): Number of instructors
- `establishedYear` (integer): Year established
- `facilities` (string array): List of facilities
- `amenities` (string array): List of amenities
- `isVerified` (boolean, default: false): Verification status

**Legacy Fields Retained**:
- All existing fields kept for backwards compatibility
- `location` field now optional (replaced by city/state/country)
- `verified` kept alongside `isVerified`

### Person Model
**Changes**: Restructured to match seeding data structure

**New Primary Fields**:
- `handle` (string, required): Unique handle (was optional)
- `displayName` (string, required): Display name
- `profileImage` (string): Profile image URL
- `isInstructor` (boolean, default: false): Instructor flag
- `joinedDate` (datetime): Join date

**Legacy Fields Retained**:
- All existing fields kept for backwards compatibility
- `userId`, `name`, `username` now optional
- `location` now optional

## Seeding Data Quantities

After schema update, the seeding service can now create:
- ✅ 5 Arts
- ✅ 11 Organizations (NEW)
- ✅ 107 Studios
- ✅ 154 People
- ✅ 153 Posts (NEW)
- ✅ 23 Events (NEW)

## Migration Notes

### Backwards Compatibility
All model updates maintain backwards compatibility:
- Legacy fields retained as optional
- New fields added alongside old ones
- Existing data continues to work

### Data Structure Changes

**Studio**:
```typescript
// Old structure (still works)
{ name, location, address, description, ... }

// New structure (preferred)
{ name, address, city, state, zipCode, country, description, ... }
```

**Person**:
```typescript
// Old structure (still works)
{ userId, name, username, handle, location, ... }

// New structure (preferred)
{ handle, displayName, bio, location, profileImage, ... }
```

## Authorization

All new models follow the same authorization pattern:
- **Guests**: Can read (public access)
- **Authenticated Users**: Full CRUD access

This allows:
- Public browsing without authentication
- User-generated content when authenticated
- Proper data ownership and management

## Database Operations

### Creating Records
```typescript
// Organization
await client.models.Organization.create({
  name: 'International Aikido Federation',
  description: 'Premier global Aikido organization',
  type: 'martial-arts',
  foundedYear: 1976,
  isVerified: true
});

// Post
await client.models.Post.create({
  content: 'Just completed an amazing training session!',
  authorId: 'user-123',
  authorName: 'John Doe',
  authorHandle: 'johndoe',
  likes: 0
});

// Event
await client.models.Event.create({
  title: 'Beginner Workshop',
  description: 'Introduction to Aikido',
  startDate: '2026-02-15T10:00:00Z',
  endDate: '2026-02-15T13:00:00Z',
  location: 'Harmony Aikido Dojo',
  organizerId: 'studio-123',
  organizerName: 'Harmony Aikido Dojo',
  price: 50
});
```

### Querying Records
```typescript
// List all organizations
const orgs = await client.models.Organization.list();

// List posts by author
const posts = await client.models.Post.list({
  filter: { authorId: { eq: 'user-123' } }
});

// List upcoming events
const events = await client.models.Event.list({
  filter: { startDate: { gt: new Date().toISOString() } }
});
```

## Deployment

### Steps to Deploy Schema Changes
1. Save the updated `amplify/data/resource.ts` file
2. Run `npx ampx sandbox` to deploy to sandbox
3. Schema changes will be applied automatically
4. New tables created in DynamoDB
5. GraphQL API updated with new types

### Verification
After deployment, verify:
```bash
# Check if models are available
npx ampx sandbox list

# Test creating a record
# Use the seed button in the app
```

## Testing

### Seed Database
1. Sign in to the application
2. Navigate to Arts page
3. Click the cloud-upload icon (seed button)
4. Confirm seeding action
5. Wait for completion
6. Verify counts in success message

### Expected Results
```
Database seeded successfully!
Added: 5 arts, 11 orgs, 107 studios, 154 people, 153 posts, 23 events
```

## Files Modified

1. `amplify/data/resource.ts` - Added Organization, Post, Event models; Updated Studio and Person models
2. `src/app/services/data-seeding.service.ts` - Restored full seeding functionality
3. `SCHEMA_UPDATES_FOR_SEEDING.md` - This documentation

## Next Steps

1. **Deploy Schema**: Run `npx ampx sandbox` to deploy changes
2. **Test Seeding**: Use seed button to populate database
3. **Verify Data**: Check that all models are created successfully
4. **Update Services**: Create services for Organizations, Posts, Events if needed
5. **Add UI**: Create pages to display Organizations, Posts, Events

## Status: ✅ Complete

Schema has been updated with all necessary models for full database seeding. Ready to deploy and test.
