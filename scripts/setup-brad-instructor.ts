/**
 * Script to make brad@aikicode.com an owner and instructor at an Aikido studio
 * Run this from the browser console after logging in as brad@aikicode.com
 */

import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';

async function setupBradAsInstructor() {
  const client = generateClient<Schema>();
  
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
      
      console.log('✅ Created Austin Aikido Center:', newStudioResult.data.id);
      
      // Create membership for Brad as instructor
      const membershipResult = await client.models.StudioMembership.create({
        studioId: newStudioResult.data.id,
        userId: bradUserId,
        membershipType: 'instructor',
        joinedAt: new Date().toISOString(),
        isActive: true
      });
      
      if (membershipResult.errors) {
        console.error('❌ Failed to create membership:', membershipResult.errors);
        return;
      }
      
      console.log('✅ Created instructor membership for Brad');
      
      // Update Person record to mark as instructor
      const personResult = await client.models.Person.list({
        filter: {
          userId: { eq: bradUserId }
        }
      });
      
      if (personResult.data && personResult.data.length > 0) {
        const person = personResult.data[0];
        await client.models.Person.update({
          id: person.id,
          isInstructor: true,
          isVerified: true,
          studioAffiliations: ['Austin Aikido Center']
        });
        console.log('✅ Updated Person record - marked as instructor');
      }
      
      console.log('');
      console.log('🎉 SUCCESS! Brad is now:');
      console.log('   - Owner of Austin Aikido Center');
      console.log('   - Head Instructor');
      console.log('   - Studio Chief');
      console.log('   - Has instructor membership in database');
      console.log('');
      console.log('Studio ID:', newStudioResult.data.id);
      console.log('Navigate to: /tabs/studio/' + newStudioResult.data.id);
      
      return {
        success: true,
        studioId: newStudioResult.data.id,
        studioName: newStudioResult.data.name
      };
      
    } else {
      // Use existing Aikido studio
      const studio = studiosResult.data[0];
      console.log('Using existing studio:', studio.name, studio.id);
      
      // Check if membership already exists
      const existingMembership = await client.models.StudioMembership.list({
        filter: {
          studioId: { eq: studio.id },
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
          studioId: studio.id,
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
      
      // Update studio to set Brad as owner/chief
      await client.models.Studio.update({
        id: studio.id,
        ownerId: bradUserId,
        headInstructorId: bradUserId,
        studioChiefId: bradUserId,
        instructorCount: (studio.instructorCount || 0) + 1
      });
      console.log('✅ Updated studio ownership');
      
      // Update Person record
      const personResult = await client.models.Person.list({
        filter: {
          userId: { eq: bradUserId }
        }
      });
      
      if (personResult.data && personResult.data.length > 0) {
        const person = personResult.data[0];
        const affiliations = person.studioAffiliations || [];
        if (!affiliations.includes(studio.name)) {
          affiliations.push(studio.name);
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
      console.log('   - Owner of', studio.name);
      console.log('   - Head Instructor');
      console.log('   - Studio Chief');
      console.log('   - Has instructor membership in database');
      console.log('');
      console.log('Studio ID:', studio.id);
      console.log('Navigate to: /tabs/studio/' + studio.id);
      
      return {
        success: true,
        studioId: studio.id,
        studioName: studio.name
      };
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error
    };
  }
}

// Export for use in browser console
(window as any).setupBradAsInstructor = setupBradAsInstructor;

console.log('');
console.log('📋 To set up Brad as instructor, run:');
console.log('   setupBradAsInstructor()');
console.log('');
