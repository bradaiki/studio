# Amplify Configuration

This directory contains the Amplify configuration setup.

## Files

- `amplify.config.ts` - Main configuration file that loads and exports Amplify settings using ES6 imports

## Usage

### Import the configuration:

```typescript
import { config, amplifyConfiguration, auth, data } from './config/amplify.config';
```

### Available exports:

- `amplifyConfiguration` - Raw config for `Amplify.configure()`
- `config` - Structured configuration object with utility methods
- `auth` - Authentication configuration
- `data` - GraphQL API configuration

### Examples:

```typescript
// Check environment
if (config.isDevelopment()) {
  console.log('Running in development mode');
}

// Get GraphQL API URL
const apiUrl = config.data.url;

// Get auth settings
const userPoolId = config.auth.userPoolId;

// Log full configuration
config.logConfig();

// Get raw configuration
const rawConfig = config.getRawConfig();
```

### Configuration Properties:

- `config.environment` - Current environment (development/production)
- `config.apiMode` - API mode (graphql)
- `config.dataStorage` - Data storage type (dynamodb)
- `config.region` - AWS region
- `config.auth.*` - Authentication settings
- `config.data.*` - GraphQL API settings

### Utility Methods:

- `config.isDevelopment()` - Check if in development mode
- `config.isProduction()` - Check if in production mode
- `config.usesGraphQL()` - Check if using GraphQL API
- `config.logConfig()` - Log configuration summary
- `config.getRawConfig()` - Get the raw amplify_outputs.json data