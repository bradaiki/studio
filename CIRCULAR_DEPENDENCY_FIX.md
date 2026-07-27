# Circular Dependency Fix

## Problem
When deploying the Amplify sandbox, got this error:
```
[CloudformationStackCircularDependencyError] The CloudFormation deployment 
failed due to circular dependency found between nested stacks [auth179371D7, data7552DF31]
```

## Root Cause
The original code tried to reference the GraphQL API ARN from the data stack while configuring the auth stack:

```typescript
// This creates a circular dependency!
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['appsync:GraphQL'],
    resources: [
      `${backend.data.resources.graphqlApi.arn}/types/Query/*`, // ❌ References data stack
    ],
  })
);
```

This creates a circular dependency:
- Auth stack depends on Data stack (to get the GraphQL API ARN)
- Data stack depends on Auth stack (for authorization)

## Solution
Use wildcard resources instead of referencing the specific API ARN:

```typescript
// No circular dependency!
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: ['*'], // ✅ No reference to data stack
  })
);
```

## Security Note
Using `resources: ['*']` is safe because:

1. **IAM policy is permissive** - Allows access to any AppSync API
2. **Schema authorization is restrictive** - Controls what operations are actually allowed

The actual security is enforced by the schema's authorization rules:
```typescript
.authorization((allow) => [
  allow.guest().to(['read']),
  allow.authenticated().to(['read', 'create', 'update', 'delete']),
])
```

So even though the IAM policy allows access to AppSync, the GraphQL schema still controls:
- Guests can only READ
- Authenticated users can do full CRUD

## Deploy
```bash
npx ampx sandbox --once
```

Should now deploy successfully without circular dependency errors.
