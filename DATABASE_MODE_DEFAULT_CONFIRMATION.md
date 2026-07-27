# Database Mode Default Configuration

## Status: ✅ Already Configured

Database mode is already the default throughout the application.

## Configuration Points

### 1. DataSourceService (Primary Default)
**File:** `src/app/services/data-source.service.ts`
**Line:** 11

```typescript
private dataSourceSubject = new BehaviorSubject<DataSource>('database');
```

This is the primary source of truth. When the service initializes:
1. It starts with 'database' as the default
2. It checks localStorage for a saved preference
3. If a saved preference exists, it uses that instead
4. Otherwise, it stays with 'database'

### 2. Profile Page
**File:** `src/app/profile/profile.page.ts`
**Line:** 216

```typescript
dataSource: DataSource = 'database'; // Will be updated from service in ngOnInit
```

The profile page initializes with 'database' and then syncs with the service in `ngOnInit()`.

### 3. Tabs Page
**File:** `src/app/tabs/tabs.page.ts`
**Line:** 46

```typescript
dataSource: DataSource = 'database';
```

The tabs page (which shows the mock mode indicator) initializes with 'database' and syncs with the service.

### 4. Arts Page
**File:** `src/app/arts/arts.page.ts`
**Line:** 93

```typescript
dataSource: DataSource = 'database';
```

The arts page initializes with 'database' and syncs with the service.

## How It Works

### First Time User (No localStorage)
1. User opens app for the first time
2. DataSourceService initializes with 'database'
3. No saved preference in localStorage
4. App uses database mode
5. All pages show database data (or empty if not seeded)
6. Title bar does NOT show "MOCK MODE" badge

### Returning User (With localStorage)
1. User opens app
2. DataSourceService initializes with 'database'
3. Checks localStorage for saved preference
4. If user previously switched to mock mode, uses 'mock'
5. If user was in database mode, uses 'database'
6. App respects user's last choice

### After Toggle
1. User clicks toggle button
2. DataSourceService updates to new mode
3. Saves preference to localStorage
4. All services reload data from new source
5. All pages re-render with new data
6. Title bar updates badge accordingly

## Verification

To verify database mode is the default:

1. **Clear localStorage:**
   ```javascript
   localStorage.removeItem('app_data_source');
   ```

2. **Refresh the app**

3. **Check console:**
   ```
   [ArtsService] Initializing with data source: database
   [StudiosService] Initializing with data source: database
   [EventsService] Initializing with data source: database
   [OrganizationsService] Initializing with data source: database
   [PostsService] Initializing with data source: database
   [PeopleService] Initializing with data source: database
   ```

4. **Check title bar:**
   - Should NOT show "MOCK MODE" badge

5. **Check data:**
   - Should show database data (or empty if not seeded)
   - Should NOT show mock data

## localStorage Key

The data source preference is stored in localStorage with the key:
```
app_data_source
```

Possible values:
- `'database'` - Database mode
- `'mock'` - Mock mode

## Default Behavior Summary

| Scenario | Default Mode | Badge Visible | Data Source |
|----------|-------------|---------------|-------------|
| First time user | Database | No | Database/Empty |
| After clearing localStorage | Database | No | Database/Empty |
| After switching to mock | Mock | Yes | Mock data |
| After switching back to database | Database | No | Database |
| After app restart (mock was last) | Mock | Yes | Mock data |
| After app restart (database was last) | Database | No | Database |

## Why Database is the Default

1. **Production Ready**: App is ready for real use immediately
2. **Data Persistence**: User data is saved and synced
3. **Multi-Device**: Data accessible across devices
4. **Professional**: Matches production environment
5. **Testing Optional**: Mock mode is opt-in for testing

## Switching to Mock Mode

Users can switch to mock mode at any time:

1. Navigate to Profile → Settings tab
2. Scroll to "Developer Settings" card
3. Click "Switch to Mock" button
4. App switches to mock mode
5. "MOCK MODE" badge appears in title bar
6. All data reloads from mock source
7. Preference saved to localStorage

## Switching Back to Database Mode

1. Navigate to Profile → Settings tab
2. Scroll to "Developer Settings" card
3. Click "Switch to Database" button
4. App switches to database mode
5. "MOCK MODE" badge disappears
6. All data reloads from database
7. Preference saved to localStorage

## Build Status

✅ Database mode is the default
✅ All components initialize with 'database'
✅ DataSourceService defaults to 'database'
✅ localStorage preserves user preference
✅ Mock mode is opt-in only
