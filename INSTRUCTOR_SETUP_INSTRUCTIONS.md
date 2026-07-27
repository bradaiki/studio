# Instructor Setup Instructions

To test the instructor join review functionality, you need to set up the user `brad@aikicode.org` as an instructor at the Denver Aikido Dojo.

## Quick Setup (Recommended)

1. **Start the application**:
   ```bash
   npm start
   ```

2. **Log in** as `brad@aikicode.org` (or create this account if it doesn't exist)

3. **Navigate** to the Denver Aikido Dojo studio page:
   - Go to the Studios page
   - Click on "Denver Aikido Dojo"
   - Or navigate directly to: `http://localhost:8100/studio/studio_1`

4. **Open the browser console** (F12 → Console tab)

5. **Run the setup command**:
   ```javascript
   setupInstructorTestData()
   ```

6. **Wait for confirmation** - you should see:
   ```
   ✅ Instructor test environment setup complete!
   ```

7. **Refresh the page** to see the "Review Join Requests" button

## What the Setup Does

The `setupInstructorTestData()` function:

1. **Creates/Updates Instructor Membership**: Adds a `StudioMembership` record with `membershipType: 'instructor'` for your user at Denver Aikido Dojo

2. **Creates Sample Join Requests**: Adds 3 sample pending join requests:
   - Alice Johnson (experienced practitioner)
   - Michael Chen (beginner)
   - Sarah Williams (relocating practitioner)

3. **Refreshes Permissions**: Updates the UI to show the instructor functionality

## Testing the Feature

After setup, you should see:

- ✅ **"Review Join Requests" button** on the Denver Aikido Dojo studio page
- ✅ **Badge with pending request count** (should show "3")
- ✅ **Modal opens** when you click the button
- ✅ **Sample requests** available for testing

## Troubleshooting

### No "Review Join Requests" Button?

1. **Check instructor status**:
   ```javascript
   checkInstructorStatus()
   ```

2. **Verify you're logged in** as the correct user

3. **Refresh the page** after running setup

4. **Check the console** for any error messages

### Setup Command Not Available?

- Make sure you're on the Denver Aikido Dojo studio page (`/studio/studio_1`)
- The commands are only available on this specific studio page

### Authentication Errors?

- Make sure you're logged in to the application
- The setup requires an authenticated user session

## Manual Setup (Alternative)

If the automatic setup doesn't work, you can manually add the data using the AWS Amplify Admin UI or DynamoDB console:

### 1. Add Studio Membership

Create a record in the `StudioMembership` table:
```json
{
  "studioId": "studio_1",
  "userId": "[your-cognito-user-id]",
  "membershipType": "instructor",
  "joinedAt": "2024-01-09T12:00:00.000Z",
  "isActive": true
}
```

### 2. Add Sample Join Requests

Create records in the `StudioJoinRequest` table:
```json
{
  "studioId": "studio_1",
  "userId": "sample-user-1",
  "userName": "Alice Johnson",
  "userEmail": "alice.johnson@example.com",
  "requestedAt": "2024-01-07T12:00:00.000Z",
  "status": "pending",
  "message": "I have been practicing Aikido for 3 years and would love to join your dojo."
}
```

## Feature Testing Checklist

Once set up, test these features:

- [ ] **View Requests**: Modal opens and shows pending requests
- [ ] **Individual Actions**: Approve/reject single requests
- [ ] **Bulk Actions**: Select multiple requests and approve/reject in bulk
- [ ] **Search**: Search requests by name or email
- [ ] **Sorting**: Sort by date, name, or email
- [ ] **Pagination**: Navigate through multiple pages (if you have many requests)
- [ ] **Real-time Updates**: Open modal in two browser tabs and see updates
- [ ] **Error Handling**: Test with network disconnected
- [ ] **Accessibility**: Test with keyboard navigation and screen reader

## Need Help?

If you encounter issues:

1. **Check the browser console** for error messages
2. **Verify your AWS Amplify configuration** is correct
3. **Ensure you have proper permissions** in your AWS account
4. **Try the manual setup** as an alternative

The instructor join review feature is now ready for testing! 🎉