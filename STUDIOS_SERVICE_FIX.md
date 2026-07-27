# Studios Service Fix

## Problems Fixed

### 1. Incorrect Response Parsing
**Issue:** The service was trying to access `result.data` but the Amplify Gen2 client returns data directly in `result.data` as an array, not `result.data.items`.

**Fix:** Changed to use `result.data || []` directly.

### 2. JSON Field Parsing
**Issue:** The `schedule` and `benefits` fields are stored as JSON strings in DynamoDB but weren't being parsed correctly.

**Fix:** Added proper JSON parsing with error handling:
```typescript
let schedule: ClassSchedule[] = [];
try {
  if (apiStudio.schedule) {
    schedule = typeof apiStudio.schedule === 'string' 
      ? JSON.parse(apiStudio.schedule) 
      : apiStudio.schedule;
  }
} catch (e) {
  console.warn('Failed to parse schedule', e);
}
```

### 3. Better Error Logging
**Issue:** Errors weren't providing enough detail for debugging.

**Fix:** Added:
- Sample data logging: `console.log('First studio sample:', apiStudios[0])`
- Detailed error messages with stack traces
- Specific warnings for JSON parsing failures

## Changes Made

### src/app/services/studios.service.ts

1. **Response parsing:**
   - Changed from assuming nested structure to direct array access
   - Added sample data logging for debugging

2. **JSON field handling:**
   - Added type checking for schedule and benefits
   - Parse JSON strings if needed
   - Graceful fallback to empty arrays on parse errors

3. **Error handling:**
   - Changed from `console.error` to `console.warn` for API failures
   - Added stack trace logging
   - Better error messages

## Testing

Run the app and check console for:

✅ **Success indicators:**
- `[Studios Service] Auth session obtained: Yes`
- `[Studios Service] API response received: {...}`
- `[Studios Service] API studios count: X`
- `[Studios Service] First studio sample: {...}`
- `[Studios Service] Successfully loaded X studios from API`

❌ **Error indicators:**
- `[Studios Service] Failed to parse schedule for studio: ...`
- `[Studios Service] Failed to parse benefits for studio: ...`
- `[Studios Service] Failed to load studios from API: ...`

## What to Check

1. **Network Tab:**
   - GraphQL request should return 200 (not 401 or 404)
   - Response should contain studios data

2. **Console Logs:**
   - Look for the "First studio sample" log to see actual data structure
   - Check if schedule/benefits are strings or objects
   - Verify no parsing errors

3. **App Behavior:**
   - Studios should load from API (not just local data)
   - Schedule and benefits should display correctly
   - No crashes or errors

## Common Issues

### If you see "API studios count: 0"
- No studios in database yet
- Create a studio using the app or AWS Console

### If you see JSON parse errors
- Check DynamoDB to see how schedule/benefits are stored
- Verify they're valid JSON strings

### If you still get 401 errors
- Check that identity pool ID is correct in amplify_outputs.json
- Verify IAM permissions are deployed
- Try: `fetchAuthSession()` manually in console
