/**
 * Global setup utilities that can be accessed from anywhere in the application
 * These functions are attached to the window object for easy console access
 */

import { setupInstructorTestEnvironment, checkInstructorStatus } from './setup-instructor-data';

// Attach setup functions to window object for global access
declare global {
  interface Window {
    setupInstructorTestData: () => Promise<void>;
    checkInstructorStatus: () => Promise<any>;
    setupBradAsInstructor: () => Promise<any>;
    setUserAdmin: (handle: string, isAdmin: boolean) => Promise<any>;
    diagAuth: () => Promise<void>;
  }
}

/**
 * Global setup function for instructor test data
 */
async function globalSetupInstructorTestData(): Promise<void> {
  try {
    console.log('🚀 Setting up instructor test environment...');
    
    const result = await setupInstructorTestEnvironment();
    
    if (result.success) {
      console.log('✅ ' + result.message);
      console.log('📋 Details:', result.details);
      
      alert('✅ Instructor test environment setup complete!\n\nYou should now see the "Review Join Requests" button on the Denver Aikido Dojo studio page.');
    } else {
      console.error('❌ ' + result.message);
      console.error('Details:', result.details);
      alert('❌ Setup failed: ' + result.message);
    }
    
  } catch (error) {
    console.error('❌ Error setting up instructor test data:', error);
    alert('❌ Error setting up instructor test data. Check console for details.');
  }
}

/**
 * Global function to check instructor status
 */
async function globalCheckInstructorStatus(): Promise<any> {
  try {
    const status = await checkInstructorStatus();
    console.log('👤 Current instructor status:', status);
    
    if (status.isInstructor) {
      console.log('✅ You are an instructor at Denver Aikido Dojo');
      console.log('📋 Membership details:', status.membership);
    } else {
      console.log('❌ You are not an instructor at Denver Aikido Dojo');
      console.log('💡 Run setupInstructorTestData() to become an instructor');
    }
    
    return status;
  } catch (error) {
    console.error('❌ Error checking instructor status:', error);
    throw error;
  }
}

/**
 * Setup Brad as instructor at Aikido studio
 */
async function globalSetupBradAsInstructor(): Promise<any> {
  const { generateClient } = await import('aws-amplify/data');
  const { getCurrentUser } = await import('aws-amplify/auth');
  
  const client = generateClient();
  
  try {
    console.log('🚀 Setting up Brad as instructor...');
    
    const currentUser = await getCurrentUser();
    console.log('Current user:', currentUser.userId, currentUser.signInDetails?.loginId);
    
    if (currentUser.signInDetails?.loginId !== 'brad@aikicode.com') {
      console.error('❌ Please log in as brad@aikicode.com first');
      return { success: false, error: 'Wrong user' };
    }
    
    const bradUserId = currentUser.userId;
    
    // Find Aikido studios
    const studiosResult = await (client.models as any).Studio.list({
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
      
      const newStudioResult = await (client.models as any).Studio.create({
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
        return { success: false, error: newStudioResult.errors };
      }
      
      studioId = newStudioResult.data.id;
      studioName = newStudioResult.data.name;
      console.log('✅ Created Austin Aikido Center:', studioId);
      
    } else {
      const studio = studiosResult.data[0];
      studioId = studio.id;
      studioName = studio.name;
      console.log('Using existing studio:', studioName, studioId);
      
      await (client.models as any).Studio.update({
        id: studioId,
        ownerId: bradUserId,
        headInstructorId: bradUserId,
        studioChiefId: bradUserId
      });
      console.log('✅ Updated studio ownership');
    }
    
    // Check if membership already exists
    const existingMembership = await (client.models as any).StudioMembership.list({
      filter: {
        studioId: { eq: studioId },
        userId: { eq: bradUserId }
      }
    });
    
    if (existingMembership.data && existingMembership.data.length > 0) {
      console.log('⚠️  Membership already exists, updating to instructor...');
      await (client.models as any).StudioMembership.update({
        id: existingMembership.data[0].id,
        membershipType: 'instructor',
        isActive: true
      });
    } else {
      const membershipResult = await (client.models as any).StudioMembership.create({
        studioId: studioId,
        userId: bradUserId,
        membershipType: 'instructor',
        joinedAt: new Date().toISOString(),
        isActive: true
      });
      
      if (membershipResult.errors) {
        console.error('❌ Failed to create membership:', membershipResult.errors);
        return { success: false, error: membershipResult.errors };
      }
      console.log('✅ Created instructor membership');
    }
    
    // Update Person record
    const personResult = await (client.models as any).Person.list({
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
      
      await (client.models as any).Person.update({
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
    
    return {
      success: true,
      studioId,
      studioName,
      message: 'Brad is now an instructor!'
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

/**
 * Set isAdmin flag on a Person record by handle
 */
async function globalSetUserAdmin(handle: string, isAdmin: boolean): Promise<any> {
  const { generateClient } = await import('aws-amplify/data');

  const client = generateClient();

  try {
    console.log(`🔧 Setting isAdmin=${isAdmin} for handle: ${handle}`);

    const result = await (client.models as any).Person.list({
      filter: { handle: { eq: handle } }
    });

    if (!result.data || result.data.length === 0) {
      // Try with @ prefix if not provided
      const altHandle = handle.startsWith('@') ? handle : `@${handle}`;
      const altResult = await (client.models as any).Person.list({
        filter: { handle: { eq: altHandle } }
      });
      if (!altResult.data || altResult.data.length === 0) {
        console.error(`❌ No person found with handle "${handle}" or "${altHandle}"`);
        return { success: false, error: 'Person not found' };
      }
      result.data = altResult.data;
    }

    const person = result.data[0];
    await (client.models as any).Person.update({
      id: person.id,
      isAdmin: isAdmin
    });

    console.log(`✅ ${person.handle} (${person.displayName || person.name}) isAdmin is now ${isAdmin}`);
    return { success: true, handle: person.handle, isAdmin };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

/**
 * Initialize global setup functions
 */
export function initializeGlobalSetup(): void {
  // Attach functions to window object
  window.setupInstructorTestData = globalSetupInstructorTestData;
  window.checkInstructorStatus = globalCheckInstructorStatus;
  window.setupBradAsInstructor = globalSetupBradAsInstructor;
  window.setUserAdmin = globalSetUserAdmin;
  window.diagAuth = globalDiagAuth;
  
  console.log('🧪 Global development helpers loaded:');
  console.log('   diagAuth() - Diagnose auth + person lookup');
  console.log('   setUserAdmin(handle, isAdmin) - Set admin flag on a person by handle');
}

/**
 * Diagnostic: check current auth state and person lookup
 */
async function globalDiagAuth(): Promise<void> {
  const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth');
  const { generateClient } = await import('aws-amplify/data');

  console.log('--- Auth Diagnostic ---');

  // Step 1: check session
  try {
    const session = await fetchAuthSession();
    console.log('1. fetchAuthSession:', session.tokens ? 'HAS TOKENS' : 'NO TOKENS');
    if (session.tokens?.idToken) {
      const payload: any = session.tokens.idToken.payload;
      console.log('   sub:', payload.sub);
      console.log('   email:', payload['email']);
      console.log('   cognito:username:', payload['cognito:username']);
    }
  } catch (e) {
    console.log('1. fetchAuthSession FAILED:', e);
  }

  // Step 2: getCurrentUser
  try {
    const user = await getCurrentUser();
    console.log('2. getCurrentUser:', user.userId, user.username);
  } catch (e) {
    console.log('2. getCurrentUser FAILED:', e);
    console.log('--- End (not authenticated) ---');
    return;
  }

  // Step 3: query Person by userId
  const user = await getCurrentUser();
  const client: any = generateClient();
  try {
    const result = await client.models.Person.list({
      filter: { userId: { eq: user.userId } },
      authMode: 'userPool'
    });
    console.log('3. Person query (userPool):', result.data?.length || 0, 'results');
    if (result.data?.[0]) {
      const p = result.data[0];
      console.log('   handle:', p.handle, 'name:', p.name, 'userId:', p.userId);
    }
    if (result.errors) {
      console.log('   errors:', result.errors);
    }
  } catch (e) {
    console.log('3. Person query (userPool) FAILED:', e);
    // Try iam fallback
    try {
      const result = await client.models.Person.list({
        filter: { userId: { eq: user.userId } },
        authMode: 'iam'
      });
      console.log('3b. Person query (iam):', result.data?.length || 0, 'results');
      if (result.data?.[0]) {
        const p = result.data[0];
        console.log('    handle:', p.handle, 'name:', p.name, 'userId:', p.userId);
      }
    } catch (e2) {
      console.log('3b. Person query (iam) also FAILED:', e2);
    }
  }

  console.log('--- End ---');
}