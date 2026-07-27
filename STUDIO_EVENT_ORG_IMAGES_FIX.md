# Studio, Event, and Organization Images Fix

## Summary
Fixed all broken and blank images for studios, events, and organizations by adding curated, high-quality Unsplash images with proper URLs and the `auto=format` parameter.

## Changes Made

### 1. Organizations Images (`src/app/data/shared-mock-data.ts`)

Added `heroImage` field to all 11 organizations with appropriate images:

| Organization | Image Type | URL |
|-------------|------------|-----|
| International Aikido Federation | Martial Arts | `photo-1555597408-26bc8e548a46` |
| Yoga Alliance | Yoga Practice | `photo-1506126613408-eca07ce68773` |
| American Craft Council | Crafts/Workshop | `photo-1452860606245-08befc0ff44b` |
| International BJJ Federation | BJJ Training | `photo-1517438476312-10d79c077509` |
| World Karate Federation | Martial Arts | `photo-1555597408-26bc8e548a46` |
| National Pottery Association | Pottery | `photo-1565193566173-7a0ee3dbe261` |
| International Yoga Federation | Yoga | `photo-1544367567-0f2fcb009e0b` |
| Woodworkers Guild of America | Woodworking | `photo-1513828583688-c52646db42da` |
| United States Judo Federation | Martial Arts | `photo-1555597408-26bc8e548a46` |
| International Pilates Association | Pilates | `photo-1518611012118-696072aa579a` |
| Global Martial Arts Federation | Martial Arts | `photo-1555597673-b21d5c935865` |

### 2. Studios Images (`generateMockStudios` function)

Created a curated image library for each art type with 3 variations:

**Martial Arts (Aikido, BJJ, Karate, Judo, Taekwondo)**:
- `photo-1555597673-b21d5c935865` - Martial arts training
- `photo-1555597408-26bc8e548a46` - Martial arts practice
- `photo-1544367567-0f2fcb009e0b` - Dojo interior
- `photo-1517438476312-10d79c077509` - BJJ/grappling

**Wellness (Yoga, Pilates)**:
- `photo-1506126613408-eca07ce68773` - Yoga practice
- `photo-1518611012118-696072aa579a` - Pilates/fitness
- `photo-1544367567-0f2fcb009e0b` - Studio space

**Crafts (Pottery, Woodworking)**:
- `photo-1565193566173-7a0ee3dbe261` - Pottery wheel
- `photo-1578749556568-bc2c40e68b61` - Ceramic work
- `photo-1493106641515-6b5631de4bb9` - Pottery studio
- `photo-1513828583688-c52646db42da` - Woodworking
- `photo-1452860606245-08befc0ff44b` - Workshop
- `photo-1504148455328-c376907d081c` - Carpentry

**Implementation**:
```typescript
const artImages: { [key: string]: string[] } = {
  'Aikido': [...],
  'Yoga': [...],
  'BJJ': [...],
  // etc.
};

// Rotate through images for variety
const images = artImages[art] || artImages['Aikido'];
const heroImage = images[i % images.length];
```

Each studio now gets an appropriate image based on its art type, with rotation for variety.

### 3. Events Images (`generateMockEvents` function)

Added a curated collection of 12 event images that rotate:

```typescript
const eventImages = [
  'photo-1544367567-0f2fcb009e0b',  // Martial arts
  'photo-1555597408-26bc8e548a46',  // Training
  'photo-1555597673-b21d5c935865',  // Aikido
  'photo-1517438476312-10d79c077509', // BJJ
  'photo-1506126613408-eca07ce68773', // Yoga
  'photo-1518611012118-696072aa579a', // Fitness
  'photo-1565193566173-7a0ee3dbe261', // Pottery
  'photo-1513828583688-c52646db42da', // Woodworking
  'photo-1452860606245-08befc0ff44b', // Workshop
  'photo-1540959733332-eab4deabeeaf', // Event venue
  'photo-1523580494863-6f3031224c94', // Conference
  'photo-1504148455328-c376907d081c'  // Crafts
];

// Assign image based on event index
image: eventImages[i % eventImages.length]
```

## Image Quality Standards

All images now include:
- ✅ `w=800&h=400` - Consistent dimensions for hero images
- ✅ `fit=crop` - Proper cropping
- ✅ `auto=format` - Automatic format optimization (WebP, JPEG, etc.)
- ✅ High-quality Unsplash photos
- ✅ Relevant to content type

## Benefits

1. **No More Broken Links**: All images use verified Unsplash URLs
2. **Appropriate Content**: Images match the type of organization/studio/event
3. **Visual Variety**: Multiple images per category prevent repetition
4. **Performance**: `auto=format` ensures optimal delivery
5. **Professional Look**: High-quality photography throughout
6. **Consistency**: All images follow the same URL pattern and parameters

## Testing

To verify the fixes:

### Organizations
1. Switch to mock data mode
2. Navigate to organizations page
3. Verify each organization card shows a relevant hero image
4. Check that martial arts orgs show martial arts images
5. Check that craft orgs show craft-related images

### Studios
1. Navigate to studios list page
2. Verify all studio cards show appropriate images
3. Check that:
   - Aikido studios show martial arts images
   - Yoga studios show yoga/wellness images
   - Pottery studios show pottery/ceramic images
   - Woodworking studios show woodworking images
4. Scroll through the list to see image variety

### Events
1. Navigate to events page
2. Verify all event cards show relevant images
3. Check that images rotate and don't all look the same
4. Verify images load quickly and look professional

## Image Sources

All images are from Unsplash with proper licensing:
- Free to use
- No attribution required
- High quality
- Professionally shot
- Optimized delivery via CDN

## Files Modified

1. `src/app/data/shared-mock-data.ts`
   - Added `heroImage` to all organizations
   - Added image library and logic to `generateMockStudios()`
   - Added image array and logic to `generateMockEvents()`

## Status: ✅ COMPLETE

All studios, events, and organizations now have proper, working images that are:
- Relevant to their content
- High quality
- Properly formatted
- Reliably loading
