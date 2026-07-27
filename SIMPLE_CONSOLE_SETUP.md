# Simple Console Setup - WORKING SOLUTION

## Method 1: localStorage Override (EASIEST & WORKS)

This is the simplest method that definitely works:

1. **Navigate to**: `/studio/studio_1` (Denver Aikido Dojo page)
2. **Open browser console**
3. **Copy and paste this code**:
   ```javascript
   // Enable instructor test mode
   localStorage.setItem('instructor-test-mode', 'true');
   localStorage.setItem('instructor-studio-id', 'studio_1');
   console.log('✅ Instructor test mode enabled for Denver Aikido Dojo');
   alert('✅ Instructor test mode enabled!\\n\\nRefresh the page to see the "Review Join Requests" button.');
   ```
4. **Refresh the page**
5. **You should now see the "Review Join Requests" button**

### To disable test mode later:
```javascript
localStorage.removeItem('instructor-test-mode');
localStorage.removeItem('instructor-studio-id');
console.log('✅ Test mode disabled');
alert('Test mode disabled. Refresh to return to normal.');
```

## Method 2: Use Built-in Functions (If available)

The studio page has setup functions available, but they might not be loaded yet:

1. **Navigate to**: `/studio/studio_1` (Denver Aikido Dojo page)
2. **Wait for page to fully load**
3. **Open browser console**
4. **Try this**:
   ```javascript
   // Check if functions are available
   if (typeof setupInstructorTestData === 'function') {
     setupInstructorTestData();
   } else {
     console.log('Setup function not available. Use Method 1 instead.');
   }
   ```

## Method 3: Create Sample Data (Optional)

The easiest way is to add the data directly through the AWS Amplify Admin UI or AWS Console:

## Method 3: Get Your User ID First

Before adding data manually, you need your actual user ID. Run this in console:

```javascript
// Get your current user ID
(async function() {
  try {
    // Try to get user from Amplify Auth
    if (window.Amplify && window.Amplify.Auth) {
      const user = await window.Amplify.Auth.getCurrentUser();
      console.log('✅ Your User ID:', user.attributes.sub);
      console.log('📧 Your Email:', user.attributes.email);
      return user.attributes.sub;
    }
  } catch (error) {
    console.log('Amplify Auth not available, trying other methods...');
  }
  
  // Try to find in localStorage/sessionStorage
  const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
  const authKeys = keys.filter(key => 
    key.includes('cognito') || 
    key.includes('amplify') || 
    key.includes('auth') ||
    key.includes('user')
  );
  
  console.log('🔍 Found auth-related storage keys:', authKeys);
  
  authKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value && (value.includes('sub') || value.includes('userId'))) {
        console.log(`📋 ${key}:`, JSON.parse(value));
      }
    } catch (e) {
      // Not JSON, skip
    }
  });
})();
```

## Method 4: Direct Database Setup (AWS Console)

The easiest way is to add the data directly through the AWS Amplify Admin UI or AWS Console:

### Step 1: Add Studio Membership
1. **Open AWS Amplify Console** or **DynamoDB Console**
3. **Add a new item** with these values:
   ```json
   {
     "id": "membership-brad-instructor",
     "studioId": "studio_1",
     "userId": "[your-actual-user-id]",
     "membershipType": "instructor", 
     "joinedAt": "2024-01-09T12:00:00.000Z",
     "isActive": true
   }
   ```

### Step 2: Add Sample Join Requests

Add these records to the **StudioJoinRequest table**:

```json
{
  "id": "sample-request-1",
  "studioId": "studio_1",
  "userId": "sample-user-1",
  "userName": "Alice Johnson",
  "userEmail": "alice.johnson@example.com",
  "requestedAt": "2024-01-07T12:00:00.000Z",
  "status": "pending",
  "message": "I have been practicing Aikido for 3 years and would love to join your dojo."
}
```

```json
{
  "id": "sample-request-2", 
  "studioId": "studio_1",
  "userId": "sample-user-2",
  "userName": "Michael Chen",
  "userEmail": "michael.chen@example.com",
  "requestedAt": "2024-01-08T12:00:00.000Z",
  "status": "pending",
  "message": "New to Aikido but very interested in learning."
}
```

```json
{
  "id": "sample-request-3",
  "studioId": "studio_1", 
  "userId": "sample-user-3",
  "userName": "Sarah Williams",
  "userEmail": "sarah.williams@example.com",
  "requestedAt": "2024-01-09T06:00:00.000Z",
  "status": "pending",
  "message": "I am relocating to Denver and looking for a new dojo."
}
```

## Method 5: Temporary Override (Quick Test)

If you just want to test the UI quickly, temporarily modify the permission check:

1. **Open browser console** on the Denver Aikido Dojo page
2. **Run this** to override the permission check:
   ```javascript
   // Temporary override - makes everyone an instructor for testing
   (function() {
     const elements = document.querySelectorAll('app-studio-page');
     if (elements.length > 0) {
       const component = ng.getComponent(elements[0]);
       if (component) {
         // Override the permission check
         component.canReviewRequests = true;
         component.pendingRequestCount = 3;
         
         // Trigger change detection
         const injector = ng.getInjector(elements[0]);
         const cdr = injector.get(ng.core.ChangeDetectorRef);
         cdr.detectChanges();
         
         console.log('✅ Temporarily enabled instructor permissions');
         console.log('🔄 Refresh the page to see the "Review Join Requests" button');
       }
     }
   })();
   ```

3. **Refresh the page** to see the button appear

**Note**: This is temporary and will reset when you refresh the page.

To get your actual user ID, run this in the console:

```javascript
// Check if you're logged in and get your user ID
(function() {
  // Try to find the user ID from the application state
  const authState = window.localStorage.getItem('amplify-authenticator-authState');
  if (authState) {
    console.log('Auth state found:', authState);
  }
  
  // Try to find user info in session storage
  const keys = Object.keys(window.sessionStorage);
  const cognitoKeys = keys.filter(key => key.includes('cognito') || key.includes('amplify'));
  console.log('Cognito/Amplify keys in session storage:', cognitoKeys);
  
  // Try to find user info in local storage
  const localKeys = Object.keys(window.localStorage);
  const authKeys = localKeys.filter(key => key.includes('cognito') || key.includes('amplify') || key.includes('auth'));
  console.log('Auth keys in local storage:', authKeys);
  
  // Look for any user-related data
  authKeys.forEach(key => {
    const value = window.localStorage.getItem(key);
    if (value && value.includes('userId')) {
      console.log(`Found user data in ${key}:`, value);
    }
  });
})();
```

## Method 3: Temporary Workaround

If you can't access the AWS console, you can temporarily modify the instructor permission service to always return true for your user:

1. **Open** `src/app/services/instructor-permission.service.ts`
2. **Find** the `isInstructor` method
3. **Temporarily add** this at the beginning:
   ```typescript
   // Temporary override for testing
   if (studioId === 'studio_1') {
     return true;
   }
   ```

This will make the "Review Join Requests" button appear for everyone at Denver Aikido Dojo.

## Method 4: Check Current State

Run this to see what's currently in your application:

```javascript
// Check current page and available services
console.log('Current page:', window.location.pathname);
console.log('Angular app available:', !!window.ng);

// Try to access Angular services (if available)
if (window.ng) {
  console.log('Angular debugging available');
  // You might be able to access services through ng.getComponent() or similar
}
```

## After Setup

Once you've added the membership record:

1. **Navigate to**: `/studio/studio_1` (Denver Aikido Dojo)
2. **Refresh the page**
3. **Look for**: "Review Join Requests" button
4. **If you don't see it**: Check the browser console for any errors

The button should appear with a badge showing the number of pending requests.

## Verification

To verify the setup worked:

1. **Check the button appears** on the Denver Aikido Dojo page
2. **Click the button** to open the modal
3. **Verify sample requests** are visible
4. **Test approve/reject** functionality

If you're still having issues, the instructor permission service might need the membership data to be properly formatted in the database.