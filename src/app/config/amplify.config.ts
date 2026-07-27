// Amplify Configuration
// Simple config file that loads amplify_outputs.json

// Load the Amplify configuration using ES6 import
// This works for local development and AWS deployment
import amplifyConfig from '../../../amplify_outputs.json';

// Export configuration values for easy access
export const config = {
  // Environment info
  environment: amplifyConfig.custom?.environment || 'production',
  apiMode: amplifyConfig.custom?.apiMode || 'graphql',
  dataStorage: amplifyConfig.custom?.dataStorage || 'dynamodb',
  
  // AWS Region
  region: amplifyConfig.auth?.aws_region || amplifyConfig.data?.aws_region || 'us-east-1',
  
  // Auth configuration
  auth: {
    userPoolId: amplifyConfig.auth?.user_pool_id,
    userPoolClientId: amplifyConfig.auth?.user_pool_client_id,
    identityPoolId: amplifyConfig.auth?.identity_pool_id,
    region: amplifyConfig.auth?.aws_region,
    passwordPolicy: amplifyConfig.auth?.password_policy,
    unauthenticatedIdentitiesEnabled: amplifyConfig.auth?.unauthenticated_identities_enabled,
  },
  
  // GraphQL API configuration
  data: {
    url: amplifyConfig.data?.url,
    region: amplifyConfig.data?.aws_region,
    defaultAuthorizationType: amplifyConfig.data?.default_authorization_type,
    authorizationTypes: amplifyConfig.data?.authorization_types || [],
  },
  
  // Custom configuration (includes Lambda function names, etc.)
  custom: amplifyConfig.custom || {},
  
  // Utility functions
  isDevelopment: () => config.environment === 'development',
  isProduction: () => config.environment === 'production',
  usesGraphQL: () => config.apiMode === 'graphql',
  
  // Get the full raw configuration
  getRawConfig: () => amplifyConfig,
  
  // Log configuration (useful for debugging)
  logConfig: () => {
    console.log('Amplify Configuration:', {
      environment: config.environment,
      apiMode: config.apiMode,
      region: config.region,
      dataStorage: config.dataStorage,
      graphqlUrl: config.data.url,
      isDevelopment: config.isDevelopment(),
      usesGraphQL: config.usesGraphQL(),
      custom: config.custom,
    });
  }
};

// Export the raw Amplify configuration for Amplify.configure()
export const amplifyConfiguration = amplifyConfig;

// Export individual pieces for convenience
export const { auth, data } = config;
export const { environment, region, apiMode, dataStorage } = config;