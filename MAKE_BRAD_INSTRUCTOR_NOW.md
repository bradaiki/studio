# Make Brad an Instructor - Quick Script

## Instructions

1. Log in as `brad@aikicode.com`
2. Open browser console (F12)
3. Copy and paste this entire script:

```javascript
(async function makeBradInstructor() {
  const { generateClient } = await import('aws-amplify/data');
  const { getCurrentUser } = await import('aws-amplify/auth');
  
  const client = generateClient();
  
  try {
    console.log('🚀 Making Brad an instructor...');
    
    // Get current user
    const currentUser = await getCurrentUser();
    const bradUserId = currentUser.userId;
    const userEmail = currentUser.signInDetails?.loginId;
    
    console.log('User ID:', bradUserId);
    console.log('Email:', userEmail);
    
    if (userEmail !== 'brad@aikicode.com') {
      console.error('❌ Please log in as brad@aikicode.com first');
      console.error('Current user:', userEmail);
      return;
    }
    
    // Find ANY studio (preferably Aikido)
    console.log('🔍 Looking for studios...');
    const allStudiosResult = await client.models.Studio.list({
      authMode: 'userPool'
    });
    
    if (!allStudiosResult.data || allStudiosResult.data.length === 0) {
      console.error('❌ No studios found in database');
      console.log('💡 Create a studio first, then run this script');
      return;
    }
    
    // Prefer Aikido studios, but use any studio if none found
    let targetStudio = allStudiosResult.data.find(s => 
      s.name?.toLowerCase().includes('aikido') || 
      s.primaryArt?.toLowerCase().includes('aikido')
    );
    
    if (!targetStudio) {
      targetStudio = allStudiosResult.data[0];
      console.log('⚠️  No Aikido studio found, using:', targetStudio.name);
    } else {
      console.log('✅ Found Aikido studio:', targetStudio.name);
    }
    
    const studioId = targetStudio.id;
    const studioName = targetStudio.name;
    
    // Check if membership already exists
    console.log('🔍 Checking existing membership...');
    const existingMembership = await client.models.StudioMembership.list({
      filter: {
        studioId: { eq: studioId },
        userId: { eq: bradUserId }
      },
      authMode: 'userPool'
    });
    
    if (existingMembership.data && existingMembership.data.length > 0) {
      console.log('⚠️  Membership exists, updating to instructor...');
      await client.models.StudioMembership.update({
        id: existingMembership.data[0].id,
        membershipType: 'instructor',
        isActive: true
      }, {
        authMode: 'userPool'
      });
      console.log('✅ Updated existing membership to instructor');
    } else {
      console.log('📝 Creating new instructor membership...');
      const membershipResult = await client.models.StudioMembership.create({
        studioId: studioId,
        userId: bradUserId,
        membershipType: 'instructor',
        joinedAt: new Date().toISOString(),
        isActive: true
      }, {
        authMode: 'userPool'
      });
      
      if (membershipResult.errors) {
        console.error('❌ Failed to create membership:', membershipResult.errors);
        return;
      }
      console.log('✅ Created instructor membership');
    }
    
    // Update studio to set Brad as owner/chief
    console.log('📝 Updating studio ownership...');
    await client.models.Studio.update({
      id: studioId,
      ownerId: bradUserId,
      headInstructorId: bradUserId,
      studioChiefId: bradUserId
    }, {
      authMode: 'userPool'
    });
    console.log('✅ Updated studio ownership');
    
    // Update Person record
    console.log('📝 Updating Person record...');
    const personResult = await client.models.Person.list({
      filter: {
        userId: { eq: bradUserId }
      },
      authMode: 'userPool'
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
      }, {
        authMode: 'userPool'
      });
      console.log('✅ Updated Person record');
    }
    
    console.log('');
    console.log('🎉 SUCCESS!');
    console.log('');
    console.log('Brad is now:');
    console.log('  ✓ Instructor at:', studioName);
    console.log('  ✓ Owner/Head Instructor/Studio Chief');
    console.log('  ✓ Has StudioMembership record (type: instructor)');
    console.log('');
    console.log('Studio ID:', studioId);
    console.log('');
    console.log('🔄 REFRESH THE PAGE to see changes!');
    console.log('');
    console.log('Then check:');
    console.log('  • Studios page → "My Studios" tab');
    console.log('  • Studio detail page → "Review Requests" button');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

4. Press Enter
5. **Refresh the page** to see changes

## What This Does

1. Gets Brad's user ID
2. Finds a studio (prefers Aikido, but uses any studio)
3. Creates or updates `StudioMembership` record with `membershipType: 'instructor'`
4. Updates Studio record with Brad as owner/chief
5. Updates Person record to mark as instructor

## After Running

Refresh the page and check:
- **Studios page** → "My Studios" tab should show the studio
- **Studio detail page** → Should see "Review Requests" button
- Can approve/reject join requests

## Troubleshooting

If you see errors:
- Make sure you're logged in as `brad@aikicode.com`
- Make sure at least one studio exists in the database
- Check console for specific error messages
