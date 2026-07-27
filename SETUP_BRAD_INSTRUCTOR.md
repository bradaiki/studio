# Setup Brad as Instructor

This guide will make brad@aikicode.com an owner and instructor at an Aikido studio.

## Method 1: Browser Console (Recommended)

1. Log in to the app as `brad@aikicode.com`
2. Open browser console (F12)
3. Copy and paste this code:

```javascript
(async function setupBradAsInstructor() {
  const { generateClient } = await import('aws-amplify/data');
  const { getCurrentUser } = await import('aws-amplify/auth');
  
  const client = generateClient();
  
  try {
    console.log('🚀 Setting up Brad as instructor...');
    
    // Get current user
    const currentUser = await getCurrentUser();
    console.log('Current user:', currentUser.userId, currentUser.signInDetails?.loginId);
    
    if (currentUser.signInDetails?.loginId !== 'brad@aikicode.com') {
      console.error('❌ Please log in as brad@aikicode.com first');
      return;
    }
    
    const bradUserId = currentUser.userId;
    
    // Find Aikido studios
    const studiosResult = await client.models.Studio.list({
      filter: {
        or: [
          { name: { contains: 'Aikido' } },
          { name: { contains: 'aikido' } },
          { primaryArt: { contains: 'Aikido' } },
          { primaryArt: { contains: 'aikido' } }
        ]
      }
    });
    
    console.log('Found studios:', studiosResult.data?.length || 0);
    
    let studioId, studioName;
    
    if (!studiosResult.data || studiosResult.data.length === 0) {
      console.log('No Aikido studios found, creating one...');
      
      // Create an Aikido studio
      const newStudioResult = await client.models.Studio.create({
        name: 'Austin Aikido Center',
        description: 'Traditional Aikido training in the heart of Austin. We practice Aikikai-style Aikido with emphasis on harmony, technique, and personal development.',
        address: '123 Harmony Way, Austin, TX 78701',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        country: 'USA',
        phone: '(512) 555-AIKI',
        email: 'info@austinaiki.com',
        website: 'https://austinaiki.com',
        primaryArt: 'Aikido',
        instructorCount: 1,
        memberCount: 0,
        establishedYear: 2010,
        facilities: ['Main Dojo', 'Weapons Training Area', 'Changing Rooms', 'Viewing Area'],
        amenities: ['Free Parking', 'Showers', 'Equipment Storage', 'Tea Room'],
        isVerified: true,
        location: 'Austin, TX',
        tagline: 'The Way of Harmony',
        heroImage: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200',
        verified: true,
        established: '2010',
        ownerId: bradUserId,
        headInstructorId: bradUserId,
        studioChiefId: bradUserId
      });
      
      if (newStudioResult.errors || !newStudioResult.data) {
        console.error('❌ Failed to create studio:', newStudioResult.errors);
        return;
      }
      
      studioId = newStudioResult.data.id;
      studioName = newStudioResult.data.name;
      console.log('✅ Created Austin Aikido Center:', studioId);
      
    } else {
      // Use existing Aikido studio
      const studio = studiosResult.data[0];
      studioId = studio.id;
      studioName = studio.name;
      console.log('Using existing studio:', studioName, studioId);
      
      // Update studio to set Brad as owner/chief
      await client.models.Studio.update({
        id: studioId,
        ownerId: bradUserId,
        headInstructorId: bradUserId,
        studioChiefId: bradUserId
      });
      console.log('✅ Updated studio ownership');
    }
    
    // Check if membership already exists
    const existingMembership = await client.models.StudioMembership.list({
      filter: {
        studioId: { eq: studioId },
        userId: { eq: bradUserId }
      }
    });
    
    if (existingMembership.data && existingMembership.data.length > 0) {
      console.log('⚠️  Membership already exists, updating to instructor...');
      await client.models.StudioMembership.update({
        id: existingMembership.data[0].id,
        membershipType: 'instructor',
        isActive: true
      });
    } else {
      // Create new membership
      const membershipResult = await client.models.StudioMembership.create({
        studioId: studioId,
        userId: bradUserId,
        membershipType: 'instructor',
        joinedAt: new Date().toISOString(),
        isActive: true
      });
      
      if (membershipResult.errors) {
        console.error('❌ Failed to create membership:', membershipResult.errors);
        return;
      }
      console.log('✅ Created instructor membership');
    }
    
    // Update Person record
    const personResult = await client.models.Person.list({
      filter: {
        userId: { eq: bradUserId }
      }
    });
    
    if (personResult.data && personResult.data.length > 0) {
      const person = personResult.data[0];
      const affiliations = person.studioAffiliations || [];
      if (!affiliations.includes(studioName)) {
        affiliations.push(studioName);
      }
      
      await client.models.Person.update({
        id: person.id,
        isInstructor: true,
        isVerified: true,
        studioAffiliations: affiliations
      });
      console.log('✅ Updated Person record');
    }
    
    console.log('');
    console.log('🎉 SUCCESS! Brad is now:');
    console.log('   - Owner of', studioName);
    console.log('   - Head Instructor');
    console.log('   - Studio Chief');
    console.log('   - Has instructor membership in database');
    console.log('');
    console.log('Studio ID:', studioId);
    console.log('Navigate to: /tabs/studio/' + studioId);
    console.log('');
    console.log('Refresh the page to see changes!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

4. Press Enter to run
5. Refresh the page

## Method 2: Add to Global Setup

The script has also been added to `src/utils/global-setup.ts` so it's available as:

```javascript
window.setupBradAsInstructor()
```

## What This Does

1. **Finds or Creates Aikido Studio**
   - Searches for existing Aikido studios
   - If none found, creates "Austin Aikido Center"

2. **Sets Brad as Owner**
   - Updates Studio record with Brad's userId as:
     - `ownerId`
     - `headInstructorId`
     - `studioChiefId`

3. **Creates Instructor Membership**
   - Creates `StudioMembership` record with:
     - `membershipType: 'instructor'`
     - `isActive: true`

4. **Updates Person Record**
   - Marks Brad as instructor
   - Adds studio to affiliations
   - Marks as verified

## Verification

After running, you should be able to:
- See "Review Requests" button on the studio page
- Approve/reject join requests
- Access instructor-only features
- See the studio in your profile affiliations

## Database Records Created

- `Studio` (if new): Austin Aikido Center
- `StudioMembership`: Brad as instructor
- `Person`: Updated with instructor status
