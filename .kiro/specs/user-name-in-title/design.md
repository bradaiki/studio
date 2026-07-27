# User Name in Title Bar - Design

## Architecture Overview

This feature adds dynamic user name display to the application title bar by subscribing to authentication state changes and rendering the appropriate name based on login status.

## Component Design

### Modified Component: TabsPage

**File**: `src/app/tabs/tabs.page.ts`

**New Properties**:
```typescript
userName: string = 'Any Mous';  // Default value
private userSubscription?: Subscription;
```

**New Methods**:
```typescript
ngOnInit() {
  this.subscribeToAuthState();
}

ngOnDestroy() {
  this.userSubscription?.unsubscribe();
}

private subscribeToAuthState() {
  this.userSubscription = this.authStateService.currentUser$.subscribe(user => {
    this.userName = this.extractUserName(user);
  });
}

private extractUserName(user: any): string {
  if (!user) return 'Any Mous';
  
  // Try multiple sources for the name
  return user.attributes?.name || 
         user.attributes?.preferred_username ||
         user.username || 
         user.attributes?.email?.split('@')[0] ||
         'Any Mous';
}
```

### Template Changes

**File**: `src/app/tabs/tabs.page.html`

**Current**:
```html
<ion-title>{{ 'app.title' | translate }}</ion-title>
```

**New**:
```html
<ion-title>{{ 'app.title' | translate }} - {{ userName }}</ion-title>
```

## Data Flow

```
┌─────────────────┐
│  AmplifyService │
│  (Auth State)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AuthStateService│
│  currentUser$   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   TabsPage      │
│  .subscribe()   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  extractUserName│
│   (userName)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Template      │
│  Display Name   │
└─────────────────┘
```

## State Management

### States

1. **Initial State**: `userName = 'Any Mous'`
2. **Loading State**: Keep showing 'Any Mous' until user data arrives
3. **Authenticated State**: `userName = [extracted name]`
4. **Logged Out State**: `userName = 'Any Mous'`

### State Transitions

```
[Initial: Any Mous]
        │
        ├─→ User Login → [Authenticated: User Name]
        │                        │
        │                        └─→ User Logout → [Any Mous]
        │
        └─→ No Auth → [Any Mous]
```

## Implementation Details

### 1. Import Required Modules

```typescript
import { Component, EnvironmentInjector, inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
```

### 2. Implement Lifecycle Hooks

```typescript
export class TabsPage implements OnInit, OnDestroy {
  // ... existing code
  
  ngOnInit() {
    this.subscribeToAuthState();
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }
}
```

### 3. User Name Extraction Logic

Priority order for extracting user name:
1. `user.attributes.name` - Full name if available
2. `user.attributes.preferred_username` - Preferred username
3. `user.username` - Username
4. `user.attributes.email.split('@')[0]` - Email prefix as fallback
5. `'Any Mous'` - Default if nothing available

### 4. Handle Edge Cases

**Long Names**:
```typescript
private extractUserName(user: any): string {
  if (!user) return 'Any Mous';
  
  let name = user.attributes?.name || 
             user.attributes?.preferred_username ||
             user.username || 
             user.attributes?.email?.split('@')[0] ||
             'Any Mous';
  
  // Truncate if too long
  if (name.length > 20) {
    name = name.substring(0, 17) + '...';
  }
  
  return name;
}
```

**Special Characters**:
- Angular's template binding automatically escapes HTML
- No additional sanitization needed for display

## Testing Strategy

### Unit Tests

**File**: `src/app/tabs/tabs.page.spec.ts`

Test cases:
1. Should display 'Any Mous' when user is null
2. Should display user.attributes.name when available
3. Should fall back to username when name not available
4. Should fall back to email prefix when username not available
5. Should truncate names longer than 20 characters
6. Should unsubscribe on component destroy
7. Should update name when user logs in
8. Should revert to 'Any Mous' when user logs out

### Integration Tests

1. Login flow: Verify name appears after successful login
2. Logout flow: Verify name reverts to 'Any Mous' after logout
3. Page refresh: Verify name persists across page reloads
4. Multiple tabs: Verify name is consistent across all tabs

## Internationalization

### Translation Keys

Add to `src/assets/i18n/*.json`:

```json
{
  "app": {
    "title": "Kai",
    "defaultUser": "Any Mous"
  }
}
```

### Updated Template

```html
<ion-title>
  {{ 'app.title' | translate }} - {{ userName || ('app.defaultUser' | translate) }}
</ion-title>
```

## Performance Considerations

### Memory Management
- Unsubscribe from observables in `ngOnDestroy`
- Use single subscription for auth state
- Avoid creating new subscriptions on each change

### Rendering Performance
- User name is a simple string binding (fast)
- No complex computations in template
- Change detection triggered only on auth state changes

## Accessibility

### Screen Reader Support
```html
<ion-title aria-label="Application title: Kai, User: {{ userName }}">
  {{ 'app.title' | translate }} - {{ userName }}
</ion-title>
```

### Semantic HTML
- Maintain proper heading hierarchy
- Use appropriate ARIA labels
- Ensure contrast ratios meet WCAG standards

## Security Considerations

1. **No Sensitive Data**: Only display public user name, not email or ID
2. **XSS Prevention**: Angular's template binding provides automatic escaping
3. **Data Validation**: Validate user object structure before accessing properties
4. **Logout Cleanup**: Ensure user name is cleared on logout

## Rollback Plan

If issues arise:
1. Remove user name display from template
2. Revert to original `{{ 'app.title' | translate }}` only
3. Keep code changes in place but commented out for future use

## Future Enhancements

1. **User Avatar**: Add small avatar icon next to name
2. **Click to Profile**: Make name clickable to navigate to profile
3. **Status Indicator**: Show online/offline status
4. **Role Badge**: Display user role (instructor, student, etc.)
5. **Customization**: Allow users to choose display format
