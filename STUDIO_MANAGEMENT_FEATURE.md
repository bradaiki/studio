# Studio Management Feature

## Overview
Added a new studio management page that allows senseis (instructors) to manage their studios. This feature is accessible from the studio detail page for users who have instructor privileges.

## Features

### 1. Access Control
- Only users with `isInstructor: true` for a studio can access the management page
- Unauthorized users are redirected back to the studio detail page with an error message

### 2. Studio Management Dashboard
The management page includes three main sections:

#### Instructors Management
- View all instructors associated with the studio
- See instructor details including:
  - Name, rank, and role (Head Instructor, Studio Chief, etc.)
  - Contact information (email, phone)
  - Active/inactive status
  - Specialties and certifications
- Actions available:
  - Add new instructors (placeholder)
  - Edit instructor details (placeholder)
  - Toggle instructor active/inactive status
  - Remove instructors (with confirmation dialog)

#### Schedule Management
- View current class schedule
- Display class details including:
  - Class title and level
  - Time and location
  - Instructor assigned
  - Description
- Add new classes (placeholder)

#### Studio Overview
- Studio statistics (member count, instructor count, class count)
- Quick action buttons for common tasks
- Studio information summary

### 3. Navigation
- Accessible via "Manage Studio" button on studio detail page
- Only visible to users with instructor privileges
- Back navigation returns to studio detail page

## Technical Implementation

### Files Created
- `src/app/studio-management/studio-management.page.ts` - Main component
- `src/app/studio-management/studio-management.page.html` - Template
- `src/app/studio-management/studio-management.page.scss` - Styles

### Files Modified
- `src/app/tabs/tabs.routes.ts` - Added route for studio management
- `src/app/studio-detail/studio.page.html` - Added management button
- `src/app/studio-detail/studio.page.ts` - Added required imports
- `src/app/studio-detail/studio.page.scss` - Added styles for management section

### Route Configuration
```typescript
{
  path: 'studio/:id/manage',
  loadComponent: () =>
    import('../studio-management/studio-management.page').then((m) => m.StudioManagementPage),
}
```

### Access Pattern
1. User navigates to studio detail page (`/dash/studio/:id`)
2. If user has instructor privileges, "Manage Studio" button appears
3. Clicking the button navigates to management page (`/dash/studio/:id/manage`)
4. Management page verifies user permissions and loads studio data

## Security Considerations
- Client-side permission checking based on `studio.isInstructor` property
- Unauthorized access attempts redirect to studio detail page
- All management actions show placeholder messages (ready for backend integration)

## Future Enhancements
- Implement actual instructor CRUD operations
- Add schedule management functionality
- Integrate with backend APIs for data persistence
- Add role-based permissions (different access levels for different instructor roles)
- Add studio settings management
- Implement real-time updates for collaborative management

## Usage
1. Navigate to any studio detail page where you have instructor privileges
2. Look for the "Studio Management" card at the bottom of the page
3. Click "Manage Studio" to access the management dashboard
4. Use the segment buttons to switch between different management sections

## Dependencies
- Ionic Angular components
- Angular Router for navigation
- FormsModule for form controls
- Ionicons for UI icons