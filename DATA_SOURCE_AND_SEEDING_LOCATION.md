# Data Source Toggle & Database Seeding - Location Guide

## ✅ All Features Are Still Present

The data source toggle and database seeding functionality are **fully intact** and working after the upgrade. Here's where to find them:

---

## 📍 Location in the App

### 1. Data Source Toggle

**Where to find it:**
- Navigate to: **Profile/Settings Page** (click the settings icon in the top right)
- Scroll down to: **"Developer Settings"** card
- Look for: **"Data Source"** section

**What it does:**
- Toggles between **Mock Mode** (local data) and **Database Mode** (AWS DynamoDB)
- Shows current mode with icon:
  - 📱 Phone icon = Mock Mode (local)
  - ☁️ Cloud icon = Database Mode (cloud)
- Button to switch between modes

**Visual indicator:**
- When in Mock Mode, a **yellow "MOCK MODE"** badge appears in the app header (top of screen)

### 2. Database Seeding

**Where to find it:**
- Same location: **Profile/Settings Page** → **"Developer Settings"** card
- Look for: **"Seed Database"** section (below Data Source toggle)

**What it does:**
- Populates the database with sample data:
  - 5 Arts
  - 11 Organizations
  - 107 Studios
  - 154 People
  - 153 Posts
  - 23 Events
- Shows confirmation dialog before seeding
- Displays progress indicator while seeding
- Shows success/error message when complete

---

## 🗂️ File Locations

### Services

1. **Data Source Service**
   - File: `src/app/services/data-source.service.ts`
   - Purpose: Manages switching between mock and database modes
   - Methods:
     - `getCurrentSource()` - Get current mode
     - `setDataSource(source)` - Set mode
     - `toggleDataSource()` - Switch modes
     - `isUsingMockData()` - Check if in mock mode
     - `isUsingDatabase()` - Check if in database mode

2. **Data Seeding Service**
   - File: `src/app/services/data-seeding.service.ts`
   - Purpose: Seeds database with sample data
   - Main method: `seedDatabase()` - Populates all data

3. **Mock Data Service**
   - File: `src/app/services/mock-data.service.ts`
   - Purpose: Provides local mock data when in mock mode

4. **Shared Mock Data**
   - File: `src/app/data/shared-mock-data.ts`
   - Purpose: Contains all mock data definitions used by both mock service and seeding service

### UI Components

1. **Profile Page (Settings)**
   - Template: `src/app/profile/profile.page.html` (lines 704-748)
   - Component: `src/app/profile/profile.page.ts`
   - Methods:
     - `onToggleDataSource()` - Handles toggle button click
     - `onSeedDatabase()` - Handles seed button click

2. **Tabs Page (Mock Mode Badge)**
   - Template: `src/app/tabs/tabs.page.html` (line 5-8)
   - Component: `src/app/tabs/tabs.page.ts`
   - Shows yellow badge when in mock mode

---

## 🎯 How to Use

### Switching Data Modes

1. **Open Settings:**
   - Click the ⚙️ settings icon in the top right corner
   - Or navigate to Profile page

2. **Find Developer Settings:**
   - Scroll down to the "Developer Settings" card
   - Look for "Data Source" section

3. **Toggle Mode:**
   - Click the "Switch to Database" or "Switch to Mock" button
   - The app will reload data from the new source
   - Badge will appear/disappear in header

### Seeding the Database

1. **Ensure Database Mode:**
   - Make sure you're in Database Mode (not Mock Mode)
   - The seed button works in both modes, but you want to seed the actual database

2. **Click Seed Button:**
   - In the same Developer Settings card
   - Click "Seed Now" button

3. **Confirm:**
   - A dialog will ask for confirmation
   - Click "Seed Database" to proceed

4. **Wait:**
   - Progress indicator shows while seeding
   - Takes 10-30 seconds depending on connection

5. **Verify:**
   - Success message shows counts of created items
   - Navigate to different tabs to see the seeded data

---

## 🔍 Services That Use Data Source

The following services automatically respect the data source setting:

1. **PeopleService** (`src/app/services/people.service.ts`)
   - Loads from mock data or database based on mode
   - CRUD operations work in both modes

2. **PostsService** (`src/app/services/posts.service.ts`)
   - Loads from mock data or database based on mode
   - CRUD operations work in both modes

3. **StudiosService** (`src/app/services/studios.service.ts`)
   - Loads from mock data or database based on mode
   - CRUD operations work in both modes

4. **ArtsService** (`src/app/services/arts.service.ts`)
   - Loads from mock data or database based on mode
   - CRUD operations work in both modes

5. **EventsService** (`src/app/services/events.service.ts`)
   - Loads from mock data or database based on mode
   - CRUD operations work in both modes

6. **OrganizationsService** (`src/app/services/organizations.service.ts`)
   - Loads from mock data or database based on mode
   - CRUD operations work in both modes

---

## 📊 Data Flow

### Mock Mode Flow
```
User Action → Service → MockDataService → Local Array → UI Update
                                ↓
                        localStorage (persistence)
```

### Database Mode Flow
```
User Action → Service → AWS Amplify Client → DynamoDB → UI Update
                                ↓
                        Real-time sync
```

---

## 🧪 Testing Workflow

### Recommended Testing Approach

1. **Start in Mock Mode:**
   - Test features without database connection
   - Fast iteration and testing
   - No AWS costs

2. **Switch to Database Mode:**
   - Test real database operations
   - Verify data persistence
   - Test real-time sync

3. **Seed Database:**
   - Populate with realistic data
   - Test with full dataset
   - Verify performance

4. **Switch Back to Mock:**
   - Continue development without affecting database
   - Test edge cases with controlled data

---

## 🎨 Visual Indicators

### Mock Mode
- **Header Badge**: Yellow "MOCK MODE" badge with phone icon
- **Settings Icon**: Phone icon (📱) in orange/warning color
- **Button**: "Switch to Database" button

### Database Mode
- **No Badge**: Clean header without badge
- **Settings Icon**: Cloud icon (☁️) in tertiary color
- **Button**: "Switch to Mock" button

---

## 💡 Tips

1. **Development**: Use Mock Mode for fast iteration
2. **Testing**: Use Database Mode to test real scenarios
3. **Seeding**: Seed database once, then use for all testing
4. **Switching**: Data doesn't transfer between modes (they're independent)
5. **Persistence**: Mock data persists in localStorage, database data in DynamoDB

---

## 🔧 Troubleshooting

### Toggle Not Working?
- Check browser console for errors
- Verify DataSourceService is injected in component
- Check localStorage for saved preference

### Seed Button Not Working?
- Ensure you're authenticated
- Check AWS credentials are configured
- Verify Amplify backend is deployed
- Check browser console for errors

### Mock Mode Badge Not Showing?
- Verify you're in mock mode (check settings)
- Check tabs.page.html has the badge code
- Verify DataSourceService is injected in TabsPage

---

## 📝 Summary

✅ **Data Source Toggle**: Located in Profile/Settings → Developer Settings
✅ **Database Seeding**: Same location, below data source toggle
✅ **Mock Mode Badge**: Visible in app header when in mock mode
✅ **All Services**: Automatically respect the data source setting
✅ **Fully Functional**: No changes from the upgrade

**Everything is working as designed!** The upgrade to Angular 20, Ionic 8, and Capacitor 8 did not affect these features.
