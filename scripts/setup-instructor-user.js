#!/usr/bin/env node

/**
 * Script to set up brad@aikicode.org as an instructor at Denver Aikido Dojo
 * 
 * This script:
 * 1. Finds the user by email in Cognito
 * 2. Adds a StudioMembership record to make them an instructor
 * 3. Optionally creates some sample join requests for testing
 */

const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');

// Load Amplify configuration
const amplifyConfig = require('../amplify_outputs.json');

async function setupInstructorUser() {
  try {
    console.log('🚀 Setting up instructor user for testing...');
    
    // Configure Amplify
    Amplify.configure(amplifyConfig);
    
    // Generate client
    const client = generateClient();
    
    const userEmail = 'brad@aikicode.org';
    const studioId = 'studio_1'; // Denver Aikido Dojo
    
    console.log(`📧 Setting up user: ${userEmail}`);
    console.log(`🏢 Studio: Denver Aikido Dojo (${studioId})`);
    
    // For testing purposes, we'll use a predictable user ID
    // In a real scenario, this would come from Cognito user pool
    const userId = 'brad-instructor-user-id';
    
    console.log('\n1️⃣ Creating instructor membership...');
    
    // Check if membership already exists
    const existingMembership = await client.models.StudioMembership.list({
      filter: {
        studioId: { eq: studioId },
        userId: { eq: userId }
      }
    });
    
    if (existingMembership.data && existingMembership.data.length > 0) {
      console.log('⚠️  Membership already exists, updating to instructor role...');
      
      const membership = existingMembership.data[0];
      const updateResult = await client.models.StudioMembership.update({
        id: membership.id,
        membershipType: 'instructor',
        isActive: true
      });
      
      if (updateResult.errors && updateResult.errors.length > 0) {
        console.error('❌ Error updating membership:', updateResult.errors);
        process.exit(1);
      }
      
      console.log('✅ Updated existing membership to instructor role');
    } else {
      // Create new membership
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
        process.exit(1);
      }
      
      console.log('✅ Created new instructor membership');
    }
    
    console.log('\n2️⃣ Creating sample join requests for testing...');
    
    // Create a few sample join requests that the instructor can review
    const sampleRequests = [
      {
        studioId: studioId,
        userId: 'sample-user-1',
        userName: 'Alice Johnson',
        userEmail: 'alice.johnson@example.com',
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'pending',
        message: 'I have been practicing Aikido for 3 years and would love to join your dojo. I am particularly interested in traditional techniques and weapons training.'
      },
      {
        studioId: studioId,
        userId: 'sample-user-2',
        userName: 'Michael Chen',
        userEmail: 'michael.chen@example.com',
        requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        status: 'pending',
        message: 'New to Aikido but very interested in learning. I have experience in other martial arts and am looking for a traditional dojo to begin my Aikido journey.'
      },
      {
        studioId: studioId,
        userId: 'sample-user-3',
        userName: 'Sarah Williams',
        userEmail: 'sarah.williams@example.com',
        requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        status: 'pending',
        message: 'I am relocating to Denver and looking for a new dojo. I have been practicing Aikido for 5 years and hold a 2nd kyu rank.'
      }
    ];
    
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
          console.log(`⚠️  Request from ${requestData.userName} already exists, skipping...`);
          continue;
        }
        
        const result = await client.models.StudioJoinRequest.create(requestData);
        
        if (result.errors && result.errors.length > 0) {
          console.warn(`⚠️  Warning creating request from ${requestData.userName}:`, result.errors);
        } else {
          console.log(`✅ Created sample request from ${requestData.userName}`);
        }
      } catch (error) {
        console.warn(`⚠️  Warning creating request from ${requestData.userName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('📋 Summary:');
    console.log(`   ✅ ${userEmail} is now an instructor at Denver Aikido Dojo`);
    console.log(`   ✅ Created sample join requests for testing`);
    console.log('\n🧪 Testing Instructions:');
    console.log('   1. Log in as brad@aikicode.org');
    console.log('   2. Navigate to the Denver Aikido Dojo studio page');
    console.log('   3. You should see a "Review Join Requests" button');
    console.log('   4. Click it to open the instructor join review modal');
    console.log('   5. Test approving/rejecting the sample requests');
    
  } catch (error) {
    console.error('❌ Failed to set up instructor user:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  setupInstructorUser();
}

module.exports = { setupInstructorUser };