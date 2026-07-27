# Check Aikido Studios

Run this in the browser console to see what Aikido studios exist in your database:

```javascript
(async function checkAikidoStudios() {
  const { generateClient } = await import('aws-amplify/data');
  const client = generateClient();
  
  try {
    console.log('🔍 Searching for Aikido studios...');
    
    // Search for Aikido studios
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
    
    if (!studiosResult.data || studiosResult.data.length === 0) {
      console.log('❌ No Aikido studios found in database');
      console.log('');
      console.log('💡 When you run setupBradAsInstructor(), it will create:');
      console.log('   📍 Austin Aikido Center');
      console.log('   🏠 123 Harmony Way, Austin, TX 78701');
      console.log('   🥋 Traditional Aikikai-style Aikido');
      return { found: false, studios: [] };
    }
    
    console.log(`✅ Found ${studiosResult.data.length} Aikido studio(s):`);
    console.log('');
    
    studiosResult.data.forEach((studio, index) => {
      console.log(`${index + 1}. ${studio.name}`);
      console.log(`   ID: ${studio.id}`);
      console.log(`   Location: ${studio.city}, ${studio.state}`);
      console.log(`   Address: ${studio.address}`);
      console.log(`   Primary Art: ${studio.primaryArt || 'Not specified'}`);
      console.log(`   Owner ID: ${studio.ownerId || 'None'}`);
      console.log(`   Head Instructor: ${studio.headInstructorId || 'None'}`);
      console.log(`   Members: ${studio.memberCount || 0}`);
      console.log(`   Instructors: ${studio.instructorCount || 0}`);
      console.log('');
    });
    
    console.log('💡 When you run setupBradAsInstructor(), Brad will become:');
    console.log(`   - Owner/Instructor at: ${studiosResult.data[0].name}`);
    console.log(`   - Studio ID: ${studiosResult.data[0].id}`);
    
    return { 
      found: true, 
      studios: studiosResult.data.map(s => ({
        id: s.id,
        name: s.name,
        city: s.city,
        state: s.state
      }))
    };
    
  } catch (error) {
    console.error('❌ Error checking studios:', error);
    return { found: false, error };
  }
})();
```

## Quick Check

Just copy the code above, paste it in your browser console (F12), and press Enter.

It will show you:
- How many Aikido studios exist
- Their names, locations, and IDs
- Which one Brad will be added to

Then you can run `setupBradAsInstructor()` to actually make Brad an instructor.
