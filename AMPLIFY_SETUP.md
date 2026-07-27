# AWS Amplify Gen 2 GraphQL + DynamoDB Setup

This Ionic Angular application has been configured with AWS Amplify Gen 2 for full-stack development with GraphQL API and DynamoDB storage.

## Features

### Authentication
- Email-based authentication with AWS Cognito
- Sign up with email confirmation
- Sign in and sign out functionality
- Protected routes with authentication guards
- User profile management
- Works on both web and mobile platforms

### GraphQL API + DynamoDB
- **GraphQL API** with AWS AppSync for real-time data operations
- **DynamoDB** for persistent cloud storage
- **Auto-generated resolvers** for CRUD operations
- **Type-safe** GraphQL client with TypeScript
- **Real-time subscriptions** support
- **Offline-first** capabilities with DataStore
- **Multi-authorization** modes (Cognito User Pools, API Key, IAM)

## Getting Started

1. **Start the local development environment**:
   ```bash
   npx ampx sandbox
   ```
   This will create a local development backend and generate the configuration files.

2. **Deploy to AWS** (when ready):
   ```bash
   npx ampx pipeline-deploy --branch main
   ```

## Project Structure

The Amplify Gen 2 configuration is located in:
- `amplify/backend.ts` - Main backend definition (auth + data)
- `amplify/auth/resource.ts` - Authentication configuration
- `amplify/data/resource.ts` - GraphQL schema and DynamoDB models
- `amplify_outputs.json` - Generated configuration (auto-created)
- `src/main.ts` - Amplify configuration loading
- `src/app/services/amplify.service.ts` - Authentication service
- `src/app/services/auth-state.service.ts` - Authentication state management
- `src/app/services/arts.service.ts` - GraphQL-based arts service
- `src/app/services/studios.service.ts` - GraphQL-based studios service
- `src/app/services/api.service.ts` - GraphQL client wrapper
- `src/app/guards/auth.guard.ts` - Route protection
- `src/app/auth/login.page.*` - Login/signup page
- `src/app/profile/profile.page.*` - User profile page

## Application Architecture

```
Frontend (Angular/Ionic)
    ↓ GraphQL Queries/Mutations
AWS AppSync (GraphQL API)
    ↓ Auto-generated resolvers
Amazon DynamoDB (Persistent Storage)
```

### Authentication Flow
1. **Unauthenticated users** are redirected to `/login`
2. **Sign Up**: Users can create account with email/password
3. **Email Confirmation**: Users receive confirmation code via email
4. **Sign In**: Users can sign in after email confirmation
5. **Protected Routes**: All main app routes require authentication
6. **Profile**: Users can view profile and sign out

### Data Flow
1. **Guest Access**: Public read access for browsing data
2. **Authenticated Access**: Full CRUD operations for logged-in users
3. **Real-time Updates**: GraphQL subscriptions for live data
4. **Offline Support**: Local caching with sync when online

## Usage

### Authentication Service
```typescript
import { AmplifyService } from '../services/amplify.service';

constructor(private amplifyService: AmplifyService) {}

// Sign up
async signUp() {
  try {
    const result = await this.amplifyService.signUp(username, password, email);
    console.log('Sign up result:', result);
  } catch (error) {
    console.error('Sign up error:', error);
  }
}

// Sign in
async signIn() {
  try {
    const result = await this.amplifyService.signIn(username, password);
    console.log('Sign in result:', result);
  } catch (error) {
    console.error('Sign in error:', error);
  }
}
```

### Authentication State
```typescript
import { AuthStateService } from '../services/auth-state.service';

constructor(private authStateService: AuthStateService) {}

ngOnInit() {
  // Listen to authentication state changes
  this.authStateService.isAuthenticated$.subscribe(isAuth => {
    console.log('Is authenticated:', isAuth);
  });

  this.authStateService.currentUser$.subscribe(user => {
    console.log('Current user:', user);
  });
}
```

## Mobile Deployment

This setup works for both web and mobile platforms:

### iOS
1. Build for iOS: `ionic capacitor build ios`
2. Open in Xcode: `ionic capacitor open ios`
3. Deploy to device or simulator

### Android
1. Build for Android: `ionic capacitor build android`
2. Open in Android Studio: `ionic capacitor open android`
3. Deploy to device or emulator

## Development Workflow

1. **Local Development**: Run `npx ampx sandbox` to start local backend
2. **Test Authentication**: Use the login page to test sign up/sign in
3. **Make Changes**: Edit files in the `amplify/` directory for backend changes
4. **Deploy**: Use `npx ampx pipeline-deploy` when ready to deploy to AWS

## Available Commands

- `npx ampx sandbox` - Start local development environment
- `npx ampx generate outputs` - Generate configuration files
- `npx ampx pipeline-deploy` - Deploy to AWS
- `npx ampx help` - Show all available commands

## Next Steps

1. Run `npx ampx sandbox` to start your local backend
2. Test the authentication flow in your app
3. The app will redirect to login if not authenticated
4. Users can sign up, confirm email, sign in, and access protected routes
5. Deploy to AWS when ready for production

Make sure the dist folder and the www folder are proplery set for amplify