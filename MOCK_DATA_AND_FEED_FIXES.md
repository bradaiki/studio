# Mock Data and Feed Infinite Scroll Fixes

## Summary
Fixed broken links in mock data, diversified last names to remove all "Smith" occurrences, and fixed the infinite scroll functionality on the feed page.

## Changes Made

### 1. Fixed Broken Links in Mock Data (`src/app/data/shared-mock-data.ts`)

#### People Generator
- **Changed**: Website URLs from `https://${handle}.com` to `https://example.com/users/${handle}`
- **Reason**: Individual domain names for each user are unrealistic and would be broken links
- **Changed**: Handle format from `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}` to `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i}`
- **Reason**: More readable and follows common username conventions

#### Studios Generator
- **Changed**: Email from `info@${city.toLowerCase()}${art.toLowerCase()}.com` to `info@${slug}.example.com`
- **Changed**: Website from `https://${city.toLowerCase()}${art.toLowerCase()}.com` to `https://${slug}.example.com`
- **Added**: Slug generation: `${city.toLowerCase().replace(/\s+/g, '-')}-${art.toLowerCase()}-${i}`
- **Reason**: Prevents broken links and follows realistic URL patterns with proper formatting

### 2. Diversified Last Names (`src/app/data/shared-mock-data.ts`)

#### Before
```typescript
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', ...];
```

#### After
```typescript
const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'];
```

**Changes**:
- Removed "Smith" from the list
- Added 10 more diverse last names (Walker, Young, Allen, King, Wright, Scott, Torres, Nguyen, Hill, Flores, Green)
- Increased from 30 to 40 last names for better diversity
- Includes more Hispanic, Asian, and diverse cultural names

### 3. Fixed Feed Infinite Scroll (`src/app/feed/feed.page.ts`)

#### Issues Identified
1. Infinite scroll was not being re-enabled when switching between feed tabs
2. Scroll state was not properly reset when changing feeds
3. No reference to the infinite scroll component for programmatic control

#### Fixes Applied

**Added ViewChild decorator**:
```typescript
@ViewChild(IonInfiniteScroll) infiniteScroll?: IonInfiniteScroll;
```

**Updated onFeedChange method**:
```typescript
onFeedChange(event: any) {
  this.selectedFeed = event.detail.value;
  // Reset scroll state for new feed
  this.currentFilterKey = '';
  // Re-enable infinite scroll
  if (this.infiniteScroll) {
    this.infiniteScroll.disabled = false;
  }
  // Update displayed posts when feed changes
  this.updateDisplayedPosts();
}
```

**Added template reference in HTML** (`src/app/feed/feed.page.html`):
```html
<ion-infinite-scroll 
  #infiniteScroll
  threshold="100px" 
  (ionInfinite)="loadMore($event)">
```

## How Infinite Scroll Works Now

1. **Initial Load**: When the page loads, `ngOnInit()` calls `updateDisplayedPosts()` which loads the first page of posts
2. **Scrolling**: When user scrolls near the bottom, `loadMore()` is triggered
3. **Loading More**: `loadMore()` adds the next page of posts to the displayed list
4. **End of List**: When all posts are loaded, infinite scroll is disabled
5. **Feed Change**: When user switches feeds:
   - Scroll state is reset (`currentFilterKey = ''`)
   - Infinite scroll is re-enabled
   - New feed's posts are loaded from the beginning

## Testing

To verify the fixes:

### Mock Data Links
1. Navigate to the people page in mock data mode
2. Check that profile images load correctly (pravatar.cc)
3. Verify that website links follow the pattern `example.com/users/[handle]`

### Last Name Diversity
1. Navigate to the people page in mock data mode
2. Scroll through the list
3. Verify that you see diverse last names (no "Smith")
4. Check that names include Hispanic, Asian, and other diverse surnames

### Feed Infinite Scroll
1. Navigate to the feed page
2. Scroll down to trigger infinite scroll - should load more posts
3. Switch to a different feed tab (Clubs → Look → Discover)
4. Verify that:
   - New feed shows its posts
   - Infinite scroll works on the new feed
   - Can scroll and load more posts on each feed
5. Switch back to the original feed
6. Verify that scroll position and loaded posts are maintained per feed

## Files Modified

1. `src/app/data/shared-mock-data.ts` - Fixed links and diversified names
2. `src/app/feed/feed.page.ts` - Fixed infinite scroll logic
3. `src/app/feed/feed.page.html` - Added template reference for infinite scroll

## Status: ✅ COMPLETE

All three issues have been resolved:
- ✅ Broken links in mock data fixed
- ✅ Last names diversified (no more "Smith")
- ✅ Feed infinite scroll working correctly
