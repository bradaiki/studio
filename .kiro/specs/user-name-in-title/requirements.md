# User Name in Title Bar - Requirements

## Overview
Display the logged-in user's name in the title bar after "Kai" to provide personalized context and improve user experience.

## User Stories

### 1. As a logged-in user
**I want to** see my name displayed in the title bar  
**So that** I can confirm which account I'm using and feel a personalized experience

**Acceptance Criteria:**
- 1.1 When logged in, the title bar displays "Kai - [User's Name]"
- 1.2 The user's name is retrieved from the authenticated user's profile
- 1.3 The display updates immediately after login
- 1.4 The display format is consistent across all tabs

### 2. As a non-logged-in user
**I want to** see a default name in the title bar  
**So that** the interface remains consistent even when not authenticated

**Acceptance Criteria:**
- 2.1 When not logged in, the title bar displays "Kai - Any Mous"
- 2.2 The default name "Any Mous" is used as a placeholder
- 2.3 The display transitions smoothly from "Any Mous" to the user's name upon login

### 3. As a user logging out
**I want to** see the title bar revert to the default  
**So that** I know I've successfully logged out

**Acceptance Criteria:**
- 3.1 After logout, the title bar displays "Kai - Any Mous"
- 3.2 The transition happens immediately after logout completes
- 3.3 No user information persists in the UI after logout

## Technical Requirements

### Data Source
- Use `AuthStateService.currentUser$` observable to get user information
- Extract the user's name from the user object (likely `user.username` or `user.attributes.name`)
- Handle cases where user name might not be available

### Display Format
- Format: "Kai - [Name]"
- Default: "Kai - Any Mous"
- Use translation service for "Kai" to support i18n

### Implementation Location
- Modify `src/app/tabs/tabs.page.html` to display the user name
- Update `src/app/tabs/tabs.page.ts` to subscribe to auth state and extract user name
- Ensure proper cleanup of subscriptions to prevent memory leaks

## Non-Functional Requirements

### Performance
- User name should load within 100ms of page render
- No visible flicker when transitioning between states

### Accessibility
- Title should be readable by screen readers
- Maintain proper semantic HTML structure

### Internationalization
- Support translation of "Kai" text
- Handle names with special characters and various lengths
- Consider RTL language support

## Edge Cases

1. **User object missing name**: Display username or email as fallback
2. **Very long names**: Truncate with ellipsis if needed (e.g., "Kai - Very Long Name...")
3. **Special characters in name**: Properly escape and display
4. **Rapid login/logout**: Handle state changes gracefully without UI glitches
5. **Initial page load**: Show loading state or default until auth state is determined

## Dependencies
- AuthStateService (existing)
- TranslationService (existing)
- Ionic components (existing)

## Out of Scope
- Editing user name from title bar
- Displaying additional user information (avatar, role, etc.)
- Click interactions on the user name
