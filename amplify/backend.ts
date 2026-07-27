import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendPushNotification } from './functions/send-push-notification/resource';

/**
 * @see https://docs.amplify.aws/gen2/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  sendPushNotification,
});

// Grant unauthenticated users access to query the GraphQL API
// Use wildcard for resources to avoid circular dependency
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: ['*'],
  })
);

// Also grant authenticated users full access
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: ['*'],
  })
);

// Grant authenticated users permission to invoke the push notification Lambda
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['lambda:InvokeFunction'],
    resources: [backend.sendPushNotification.resources.lambda.functionArn],
  })
);

// Export configuration for GraphQL API with DynamoDB
backend.addOutput({
  custom: {
    apiMode: 'graphql',
    environment: 'production',
    dataStorage: 'dynamodb',
    pushNotificationFunctionName: backend.sendPushNotification.resources.lambda.functionName,
  },
});