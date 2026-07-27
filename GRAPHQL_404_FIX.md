# GraphQL 404 Fix for AWS Deployment

## Problem
GraphQL API calls were returning 404 errors when the app was deployed to AWS Amplify, but worked fine locally.

## Root Cause
The issue was caused by a mismatch in authorization configuration:

1. **Default Auth Mode**: The GraphQL API was configured with `defaultAuthorizationMode: 'userPool'` (Cognito User Pools)
2. **Schema Authorization**: The schema used `allow.guest()` which requires IAM authentication
3. **Unauthenticated Access**: When unauthenticated users tried to access the API, the auth mode mismatch caused 404 errors

## Solution Applied

### 1. Changed Default Authorization Mode
**File**: `amplify/data/resource.ts`

Changed from:
```typescript
authorizationModes: {
  defaultAuthorizationMode: 'userPool',
  apiKeyAuthorizationMode: {
    expiresInDays: 30,
  },
}
```

To:
```typescript
authorizationModes: {
  defaultAuthorizationMode: 'iam',
  apiKeyAuthorizationMode: {
    expiresInDays: 30,
  },
}
```

This ensures that unauthenticated requests use IAM credentials from the Cognito Identity Pool, which is compatible with `allow.guest()` in the schema.

### 2. Added amplify_outputs.json to Build Assets
**File**: `angular.json`

Added the configuration file to the assets array so it's available in the deployed app:
```json
{
  "glob": "amplify_outputs.json",
  "input": ".",
  "output": "/"
}
```

## How It Works

1. **Unauthenticated Users**: Use IAM credentials from the Cognito Identity Pool (with `unauthenticated_identities_enabled: true`)
2. **Authenticated Users**: Can use either IAM or Cognito User Pools authentication
3. **Guest Access**: The `allow.guest()` authorization rule now works correctly with IAM as the default mode

## Authorization Flow

```
Unauthenticated Request
  ↓
Cognito Identity Pool provides temporary IAM credentials
  ↓
GraphQL API accepts request with IAM auth
  ↓
Schema allows access via allow.guest()
  ↓
Success!
```

## Deployment Steps

1. **Commit the changes**:
   ```bash
   git add amplify/data/resource.ts angular.json
   git commit -m "Fix GraphQL 404 errors: Change default auth mode to IAM"
   git push
   ```

2. **Deploy the backend** (if not auto-deployed):
   ```bash
   npx ampx sandbox
   # or
   npx ampx pipeline-deploy --branch main
   ```

3. **AWS Amplify will automatically rebuild and redeploy the frontend**

## Testing

After deployment, test these scenarios:

1. **Unauthenticated Access**:
   - Open the app without logging in
   - Navigate to Studios, Arts, Organizations pages
   - Data should load from GraphQL API without 404 errors

2. **Authenticated Access**:
   - Log in with a user account
   - All GraphQL operations should work
   - Create, update, delete operations should succeed

3. **Check Browser Console**:
   - No 404 errors for GraphQL endpoint
   - API calls should show 200 status codes
   - Look for successful GraphQL responses

## Verification

Check the browser Network tab:
- GraphQL endpoint: `https://[your-api-id].appsync-api.us-east-1.amazonaws.com/graphql`
- Status: `200 OK`
- Response: Valid GraphQL data (not 404 error)

## Additional Notes

- The `unauthenticated_identities_enabled: true` setting in the Cognito Identity Pool is required for guest access
- IAM credentials are automatically managed by Amplify
- No code changes needed in services - they continue using `generateClient()` as before
- The fix maintains backward compatibility with authenticated users

## Rollback

If you need to rollback:
```bash
git revert HEAD
git push
```

Then redeploy the backend with the previous configuration.
