# Data Toggle and Seed Database Moved to Settings

## Changes Made

### 1. Removed FAB Buttons from Arts Page ✅

**Removed:**
- Data source toggle FAB button (phone/cloud icon)
- Seed database FAB button (cloud-upload icon)

**Kept:**
- Create new art FAB button (plus icon)

**File:** `src/app/arts/arts.page.html`

---

### 2. Added Developer Settings to Profile Page ✅

**Location:** Profile Page → Settings Tab (third segment)

**New Section:** "Developer Settings" card added after Language Settings

**Features:**
1. **Data Source Toggle**
   - Shows current mode (Mock Data or Database)
   - Button to switch between modes
   - Visual indicators (phone icon for mock, cloud icon for database)
   - Color-coded (warning for mock, tertiary for database)

2. **Seed Database**
   - Button to populate database with sample data
   - Confirmation dialog before seeding
   - Loading spinner during seeding
   - Success/error toast with counts
   - Shows: 5 arts, 11 orgs, 107 studios, 154 people, 153 posts, 23 events

3. **Information**
   - Explains what Mock Mode and Database Mode are
   - Helps users understand the difference

**Files Modified:**
- `src/app/profile/profile.page.html` - Added Developer Settings card
- `src/app/profile/profile.page.ts` - Added methods and properties

---

## How to Access

### Web App
1. Navigate to Profile page (click profile icon in tab bar)
2. Click on "Settings" segment (third tab)
3. Scroll down to see "Developer Settings" card
4. Use the buttons to toggle data source or seed database

### Android App
1. Open the app
2. Navigate to Profile page
3. Tap "Settings" tab
4. Scroll to "Developer Settings"
5. Use the buttons

---

## Features

### Data Source Toggle

**Mock Mode:**
- Uses local data stored in the app
- No database connection required
- Fast and works offline
- Good for testing and development

**Database Mode:**
- Uses AWS DynamoDB
- Requires authentication
- Persistent storage
- Shared across devices

**Toggle Button:**
- Shows current mode
- Click to switch modes
- Toast notification confirms the switch
- All pages automatically update

### Seed Database

**What it does:**
- Populates the database with sample data
- Creates realistic test data for all entities
- Useful for testing and demonstration

**Process:**
1. Click "Seed Now" button
2. Confirm in the dialog
3. Wait for loading spinner
4. See success message with counts

**Data Created:**
- 5 arts (Aikido, Yoga, Pottery, BJJ, Woodworking)
- 11 organizations (martial arts, wellness, crafts)
- 107 studios (with membership flags)
- 154 people (with profiles)
- 153 posts (social feed content)
- 23 events (seminars, workshops, tournaments, meetups)

---

## Benefits

### For Users
- ✅ Cleaner UI - No FAB buttons cluttering other pages
- ✅ Organized - Settings are in one logical place
- ✅ Discoverable - Easy to find in Settings tab
- ✅ Consistent - Follows standard app patterns

### For Developers
- ✅ Accessible - Easy to switch modes for testing
- ✅ Powerful - Can seed database with one click
- ✅ Informative - Clear feedback on what's happening
- ✅ Safe - Confirmation dialog prevents accidents

---

## Technical Details

### Properties Added
```typescript
dataSource: DataSource = 'mock';
isAuthenticated: boolean = false;
```

### Methods Added
```typescript
async onToggleDataSource()
async onSeedDatabase()
```

### Services Used
- `DataSourceService` - Manages data source state
- `DataSeedingService` - Handles database seeding
- `LoadingController` - Shows loading spinner
- `ToastController` - Shows notifications
- `AlertController` - Shows confirmation dialog

### Initialization
- Data source state loaded from `DataSourceService`
- Authentication state from `AuthStateService`
- Both subscribe to observables for automatic updates

---

## Files Modified

1. ✅ `src/app/arts/arts.page.html` - Removed FAB buttons
2. ✅ `src/app/profile/profile.page.html` - Added Developer Settings card
3. ✅ `src/app/profile/profile.page.ts` - Added properties, methods, and imports

---

## Testing Checklist

### Web App
- [ ] Navigate to Profile → Settings
- [ ] See Developer Settings card
- [ ] Toggle data source - see toast notification
- [ ] Verify pages update with new data source
- [ ] Click Seed Database
- [ ] Confirm in dialog
- [ ] See loading spinner
- [ ] See success toast with counts
- [ ] Verify data appears in pages

### Android App
- [ ] Open Profile → Settings
- [ ] See Developer Settings card
- [ ] Toggle data source
- [ ] Verify no FAB buttons on other pages
- [ ] Seed database
- [ ] Verify data loads correctly

---

## Status

✅ FAB buttons removed from arts page
✅ Developer Settings added to profile page
✅ Data source toggle working
✅ Seed database working
✅ No compilation errors
✅ Build successful
✅ Ready for testing
