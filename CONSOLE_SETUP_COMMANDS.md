# Console Setup Commands

If the global setup functions aren't working, you can copy and paste these commands directly into the browser console.

## Method 1: Direct Console Commands

Copy and paste this entire block into the browser console:

```javascript
// Import the setup functions and run them
(async function() {
  try {
    console.log('🚀 Setting up instructor test environment...');
    
    // Import Amplify and setup functions
    const { generateClient } = await import('aws-amplify/data');
    const { getCurrentUser } = await import('aws-amplify/auth');
    
    const client = generateClient();
    
    // Get current authenticated user
    const user = await getCurrentUser();
    if (!user || !user.userId) {
      alert('❌ No authenticated user found. Please log in first.');
      return;
    }
    
    const userId = user.userId;
    const studioId = 'studio_1'; // Denver Aikido Dojo
    
    console.log(`Setting up user ${userId} as instructor at studio ${studioId}`);
    
    // Step 1: Set up instructor membership
    console.log('1️⃣ Creating instructor membership...');
    
    // Check if membership already exists
    const existingMembership = await client.models.StudioMembership.list({
      filter: {
        studioId: { eq: studioId },
        userId: { eq: userId }
      }
    });
    
    if (existingMembership.data && existingMembership.data.length > 0) {
      // Update existing membership to instructor
      const membership = existingMembership.data[0];
      const updateResult = await client.models.StudioMembership.update({
        id: membership.id,
        membershipType: 'instructor',
        isActive: true
      });
      
      if (updateResult.errors && updateResult.errors.length > 0) {
        console.error('❌ Error updating membership:', updateResult.errors);
        return;
      }
      
      console.log('✅ Updated existing membership to instructor role');
    } else {
      // Create new instructor membership
      const membershipData = {
        studioId: studioId,
        userId: userId,
        membershipType: 'instructor',
        joinedAt: new Date().toISOString(),
        isActive: true
      };
      
      const result = await client.models.StudioMembership.create(membershipData);
      
      if (result.errors && result.errors.length > 0) {
        console.error('❌ Error creating membership:', result.errors);
        return;
      }
      
      console.log('✅ Created new instructor membership');
    }
    
    // Step 2: Create sample join requests
    console.log('2️⃣ Creating sample join requests...');
    
    const sampleRequests = [
      {
        studioId: studioId,
        userId: 'sample-user-1',
        userName: 'Alice Johnson',
        userEmail: 'alice.johnson@example.com',
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        message: 'I have been practicing Aikido for 3 years and would love to join your dojo. I am particularly interested in traditional techniques and weapons training.'
      },
      {
        studioId: studioId,
        userId: 'sample-user-2',
        userName: 'Michael Chen',
        userEmail: 'michael.chen@example.com',
        requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        message: 'New to Aikido but very interested in learning. I have experience in other martial arts and am looking for a traditional dojo to begin my Aikido journey.'
      },
      {
        studioId: studioId,
        userId: 'sample-user-3',
        userName: 'Sarah Williams',
        userEmail: 'sarah.williams@example.com',
        requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        message: 'I am relocating to Denver and looking for a new dojo. I have been practicing Aikido for 5 years and hold a 2nd kyu rank.'
      }
    ];
    
    let created = 0;
    let skipped = 0;
    
    for (const requestData of sampleRequests) {
      try {
        // Check if request already exists
        const existingRequest = await client.models.StudioJoinRequest.list({
          filter: {
            studioId: { eq: requestData.studioId },
            userId: { eq: requestData.userId }
          }
        });
        
        if (existingRequest.data && existingRequest.data.length > 0) {
          console.log(`⚠️ Request from ${requestData.userName} already exists, skipping...`);
          skipped++;
          continue;
        }
        
        const result = await client.models.StudioJoinRequest.create(requestData);
        
        if (result.errors && result.errors.length > 0) {
          console.warn(`⚠️ Warning creating request from ${requestData.userName}:`, result.errors);
        } else {
          console.log(`✅ Created sample request from ${requestData.userName}`);
          created++;
        }
      } catch (error) {
        console.warn(`⚠️ Warning creating request from ${requestData.userName}:`, error);
      }
    }
    
    console.log(`📊 Sample requests: ${created} created, ${skipped} skipped`);
    
    console.log('🎉 Setup complete!');
    console.log('📋 Summary:');
    console.log(`   ✅ You are now an instructor at Denver Aikido Dojo`);
    console.log(`   ✅ Created ${created} sample join requests for testing`);
    console.log('');
    console.log('🧪 Next steps:');
    console.log('   1. Navigate to the Denver Aikido Dojo studio page');
    console.log('   2. Look for the "Review Join Requests" button');
    console.log('   3. Click it to test the instructor functionality');
    
    alert('✅ Instructor test environment setup complete!\n\nNavigate to the Denver Aikido Dojo studio page to see the "Review Join Requests" button.');
    
  } catch (error) {
    console.error('❌ Error setting up instructor test data:', error);
    alert('❌ Error: ' + error.message + '\n\nCheck console for details.');
  }
})();
```

## Method 2: Step by Step

If the above doesn't work, try these individual commands:

### 1. Check if you're logged in:
```javascript
import('aws-amplify/auth').then(auth => auth.getCurrentUser()).then(user => console.log('Current user:', user)).catch(err => console.log('Not logged in:', err.message));
```

### 2. Check current instructor status:
```javascript
(async function() {
  const { generateClient } = await import('aws-amplify/data');
  const { getCurrentUser } = await import('aws-amplify/auth');
  const client = generateClient();
  const user = await getCurrentUser();
  const membership = await client.models.StudioMembership.list({
    filter: { studioId: { eq: 'studio_1' }, userId: { eq: user.userId } }
  });
  console.log('Current membership:', membership.data?.[0]);
})();
```

### 3. Make yourself an instructor:
```javascript
(async function() {
  const { generateClient } = await import('aws-amplify/data');
  const { getCurrentUser } = await import('aws-amplify/auth');
  const client = generateClient();
  const user = await getCurrentUser();
  const result = await client.models.StudioMembership.create({
    studioId: 'studio_1',
    userId: user.userId,
    membershipType: 'instructor',
    joinedAt: new Date().toISOString(),
    isActive: true
  });
  console.log('Membership created:', result);
})();
```

## Troubleshooting

- **"getCurrentUser is not a function"**: Make sure you're logged in to the application
- **"generateClient is not a function"**: The Amplify client might not be configured properly
- **"No authenticated user"**: Log in to the application first
- **Network errors**: Check your internet connection and AWS configuration

## After Setup

Once the setup is complete:

1. **Navigate to**: `/studio/studio_1` (Denver Aikido Dojo)
2. **Look for**: "Review Join Requests" button
3. **Click it**: To open the instructor modal
4. **Test**: Approve/reject the sample requests

The button should appear with a badge showing the number of pending requests (3 after setup).