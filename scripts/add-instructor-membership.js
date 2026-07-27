#!/usr/bin/env node

/**
 * Script to add brad@aikicode.org as an instructor at Denver Aikido Dojo
 * 
 * This script adds a StudioMembership record to make the user an instructor
 * so they can test the instructor join review functionality.
 */

const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');

// Load Amplify configuration
const amplifyConfig = require('../amplify_outputs.json');

async function addInstructorMembership() {
  try {
    console.log('🚀 Initializing Amplify...');
    
    // Configure Amplify
    Amplify.configure(amplifyConfig);
    
    // Generate client
    const client = generateClient();
    
    console.log('📝 Adding instructor membership...');
    
    // The user ID for brad@aikicode.org - this would typically come from Cognito
    // For now, we'll use a placeholder that matches the expected format
    const userId = 'brad-aikicode-org-user-id';
    const studioId = 'studio_1'; // Denver Aikido Dojo
    
    // Create the membership record
    const membershipData = {
      studioId: studioId,
      userId: userId,
      membershipType: 'instructor',
      joinedAt: new Date().toISOString(),
      isActive: true
    };
    
    console.log('Creating membership with data:', membershipData);
    
    const result = await client.models.StudioMembership.create(membershipData);
    
    if (result.errors && result.errors.length > 0) {
      console.error('❌ Error creating membership:', result.errors);
      process.exit(1);
    }
    
    console.log('✅ Successfully added instructor membership!');
    console.log('📋 Membership details:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Studio: Denver Aikido Dojo (${studioId})`);
    console.log(`   Role: instructor`);
    console.log(`   Joined: ${new Date().toISOString()}`);
    
    console.log('\n🎉 brad@aikicode.org is now an instructor at Denver Aikido Dojo!');
    console.log('   They can now access the instructor join review functionality.');
    
  } catch (error) {
    console.error('❌ Failed to add instructor membership:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  addInstructorMembership();
}

module.exports = { addInstructorMembership };