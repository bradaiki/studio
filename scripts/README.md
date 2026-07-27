# Setup Scripts

This directory contains scripts to help set up test data for the instructor join review functionality.

## Setup Instructor User

The `setup-instructor-user.js` script sets up the user `brad@aikicode.org` as an instructor at the Denver Aikido Dojo and creates sample join requests for testing.

### Usage

```bash
# Run the setup script
npm run setup-instructor

# Or run directly with node
node scripts/setup-instructor-user.js
```

### What it does

1. **Creates/Updates Instructor Membership**: Adds a `StudioMembership` record for the user with `membershipType: 'instructor'` at Denver Aikido Dojo (`studio_1`)

2. **Creates Sample Join Requests**: Adds 3 sample pending join requests that the instructor can review:
   - Alice Johnson (3 years experience)
   - Michael Chen (new to Aikido)
   - Sarah Williams (5 years experience, relocating)

### Testing the Feature

After running the setup script:

1. **Log in** as `brad@aikicode.org` in the application
2. **Navigate** to the Denver Aikido Dojo studio page
3. **Look for** the "Review Join Requests" button (should be visible to instructors)
4. **Click** the button to open the instructor join review modal
5. **Test** the functionality:
   - View pending requests
   - Approve/reject individual requests
   - Test bulk operations
   - Test search and filtering
   - Test real-time updates

### Notes

- The script uses predictable user IDs for testing purposes
- In a production environment, user IDs would come from AWS Cognito
- The script is idempotent - it can be run multiple times safely
- Existing memberships will be updated to instructor role
- Duplicate join requests will be skipped

### Troubleshooting

If the script fails:

1. **Check Amplify Configuration**: Ensure `amplify_outputs.json` exists and is valid
2. **Check AWS Credentials**: Ensure you have proper AWS credentials configured
3. **Check Network**: Ensure you can connect to the Amplify backend
4. **Check Permissions**: Ensure your AWS user has permissions to create/update DynamoDB records

### Manual Setup

If you prefer to set up the data manually, you can:

1. **Add Studio Membership**:
   ```javascript
   // In the AWS DynamoDB console or via Amplify Admin UI
   {
     studioId: "studio_1",
     userId: "brad-instructor-user-id", 
     membershipType: "instructor",
     joinedAt: "2024-01-09T12:00:00.000Z",
     isActive: true
   }
   ```

2. **Add Sample Join Requests**:
   ```javascript
   // Create records in the StudioJoinRequest table
   {
     studioId: "studio_1",
     userId: "sample-user-1",
     userName: "Alice Johnson",
     userEmail: "alice.johnson@example.com",
     requestedAt: "2024-01-07T12:00:00.000Z",
     status: "pending",
     message: "I have been practicing Aikido for 3 years..."
   }
   ```