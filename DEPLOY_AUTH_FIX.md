# Deploy Authorization Fix for GraphQL API

## What Was Fixed

Added IAM permissions for unauthenticated (guest) users to access the GraphQL API.

## Changes Made

### amplify/backend.ts
Added IAM policy statements to grant both authenticated and unauthenticated users permission to access AppSync:

```typescript
// Grant unauthenticated users access
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: ['*'],
  })
);

// Grant authenticated users access
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: ['*'],
  })
);
```

**Note:** Uses wildcard `resources: ['*']` to avoid circular dependency between auth and data stacks. The actual authorization is controlled by the schema's `allow.guest()` and `allow.authenticated()` rules.

## Deploy Steps

### 1. Deploy to Sandbox (for testing)
```bash
cd amplify
npx ampx sandbox
```

Wait for deployment to complete. This will:
- Update the IAM role policies
- Apply the new permissions
- Generate updated `amplify_outputs.json`

### 2. Test Locally
```bash
# In a new terminal
cd ..
ionic serve
```

Open browser console and check for:
- `[Studios Service] Auth session obtained: Yes`
- `[Studios Service] Successfully loaded X studios from API`
- No 401 errors in Network tab

### 3. Deploy to Production
```bash
# Stop sandbox (Ctrl+C)
git add .
git commit -m "Add IAM permissions for guest access to GraphQL API"
git push
```

AWS Amplify will automatically deploy the changes.

## What This Does

**Before:**
- Unauthenticated IAM role had NO policies
- Guest users got 401 Unauthorized errors
- App fell back to local data only

**After:**
- Unauthenticated IAM role can execute GraphQL queries
- Guest users can list studios from the API
- App loads real data from DynamoDB

## Verification

### Check IAM Role Policy
```bash
aws iam list-role-policies --role-name amplify-studio-brad-sandb-amplifyAuthunauthenticate-dyb7Eg3VXNoh
```

Should show at least one policy attached.

### Check Policy Content
```bash
aws iam get-role-policy --role-name amplify-studio-brad-sandb-amplifyAuthunauthenticate-dyb7Eg3VXNoh --policy-name <policy-name>
```

Should include `appsync:GraphQL` action.

## Troubleshooting

### Still getting 401 errors?
1. Verify sandbox deployed successfully
2. Check that `amplify_outputs.json` was regenerated
3. Restart your dev server (`ionic serve`)
4. Clear browser cache and reload

### Policy not showing up?
1. Wait a few minutes for IAM propagation
2. Check CloudFormation stack in AWS Console
3. Look for any deployment errors in sandbox output

## Security Note

This configuration allows **unauthenticated users** to:
- ✅ Read (list/get) studios
- ❌ Create, update, or delete studios (requires authentication)

This is controlled by the schema authorization rules:
```typescript
.authorization((allow) => [
  allow.guest().to(['read']),
  allow.authenticated().to(['read', 'create', 'update', 'delete']),
])
```
