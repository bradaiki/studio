# Testing User Arts Persistence Feature

## Quick Test Guide

### Prerequisites
- ✅ Amplify sandbox is running (`npx ampx sandbox`)
- ✅ User is signed in to the app
- ✅ At least one art exists in the database

### Test 1: Add Art to Practice (Happy Path)
**Steps:**
1. Navigate to Arts page (`/tabs/arts`)
2. Click on any art card
3. On the art detail page, click "Add to My Arts" button

**Expected Results:**
- ✅ Button changes to "Practicing" with green color and checkmark icon
- ✅ Green toast appears: "Added [Art Name] to your practice!"
- ✅ Toast disappears after 2 seconds

**Verify in Database:**
```bash
# Check DynamoDB for UserArt record
# Should see a new record with your userId and artId
```

### Test 2: View in "My Arts" Filter
**Steps:**
1. Navigate back to Arts page
2. Select "My Arts" segment/filter

**Expected Results:**
- ✅ The art you just added appears in the list
- ✅ Art card shows green "Practicing" chip

### Test 3: Remove Art from Practice
**Steps:**
1. Navigate to the art detail page (same art from Test 1)
2. Click "Practicing" button

**Expected Results:**
- ✅ Button changes to "Add to My Arts" with outline style
- ✅ Gray toast appears: "Removed [Art Name] from your practice"
- ✅ Toast disappears after 2 seconds

**Verify in Database:**
```bash
# Check DynamoDB for UserArt record
# Record should be deleted
```

### Test 4: Verify Removal in List
**Steps:**
1. Navigate back to Arts page
2. Select "My Arts" filter

**Expected Results:**
- ✅ The art you removed does NOT appear in "My Arts"
- ✅ If no arts are practicing, shows empty state message

### Test 5: Persistence Across Sessions
**Steps:**
1. Add an art to practice (Test 1)
2. Refresh the browser page (F5 or Cmd+R)
3. Navigate to the art detail page

**Expected Results:**
- ✅ Button still shows "Practicing" (green)
- ✅ Art still appears in "My Arts" filter

### Test 6: Error Handling (Optional)
**Steps:**
1. Open browser DevTools Network tab
2. Set network to "Offline"
3. Try to toggle practicing status

**Expected Results:**
- ✅ Red toast appears with error message
- ✅ Button state may update locally but won't persist

## Console Commands for Verification

### Check UserArt Records in DynamoDB
```bash
# List all UserArt records (requires AWS CLI configured)
aws dynamodb scan --table-name UserArt-[your-table-suffix]
```

### Check Application Logs
Open browser DevTools Console and look for:
- "User started practicing art:" (when adding)
- "User stopped practicing art:" (when removing)
- "Loaded user practiced arts: X" (on page load)

## Common Issues & Solutions

### Issue: Button doesn't change state
**Solution:** Check browser console for errors. Verify user is authenticated.

### Issue: "My Arts" filter is empty
**Solution:** 
1. Check if UserArt records exist in database
2. Verify `loadArtsFromAPI()` is loading UserArt records
3. Check console for "Loaded user practiced arts: X" message

### Issue: Toast doesn't appear
**Solution:** Check that ToastController is imported and injected correctly

### Issue: Changes don't persist
**Solution:**
1. Verify sandbox is running
2. Check network tab for GraphQL errors
3. Verify user authentication token is valid

## Success Criteria
✅ All 5 tests pass
✅ UserArt records created/deleted in DynamoDB
✅ "My Arts" filter works correctly
✅ Toast notifications appear
✅ Changes persist across page refreshes

## Next Steps After Testing
1. Test with multiple users to verify isolation
2. Consider adding practice statistics
3. Consider adding skill level tracking
4. Consider adding practice notes/journal
