# Chat Invitation System - Testing Guide

## Quick Start Testing

### Prerequisites
1. Have at least 2 user accounts (or use 2 different browsers/devices)
2. Both users should have Person profiles with handles set up
3. App should be running: `npm start` or `ionic serve`

## Test Scenarios

### 1. **Create a Private Chat with Invitations**

#### Steps:
1. **Login as User A**
2. Navigate to any page with chat (Studios, Events, etc.)
3. Click the **"+"** button in the chat tabs area
4. Fill in the create chat form:
   - **Chat Name**: "Test Private Chat"
   - **Description**: "Testing invitations"
   - **Access Level**: Select "Private Chat"
   - **Chat Type**: "Group Chat"

5. **Add members by handle**:
   - Type User B's handle in the search bar (e.g., "@johndoe")
   - Click on User B from the search results
   - OR type "@johndoe" directly and press Enter
   - You should see User B appear as a chip with their avatar

6. Click **"Create Private Chat"**
7. You should see a success message: "Private chat created and invitations sent to: @johndoe"

#### Expected Results:
- ✅ Chat is created
- ✅ You (User A) are automatically in the chat
- ✅ User B receives an invitation (not automatically added)
- ✅ Success toast shows the invited handles

---

### 2. **Receive and Accept an Invitation**

#### Steps:
1. **Login as User B** (in a different browser/incognito window)
2. Navigate to the same page where the chat exists
3. You should see an **invitation card** with:
   - "You've been invited to join this private chat"
   - Inviter's name (User A)
   - Personal message (if any)
   - Invitation date
   - Expiration date

4. Click **"Accept Invitation"** button

#### Expected Results:
- ✅ Invitation card disappears
- ✅ You now have access to the chat
- ✅ You can see messages and send messages
- ✅ Success toast: "Chat invitation accepted successfully"
- ✅ User A receives a notification that their invitation was accepted

---

### 3. **Decline an Invitation**

#### Steps:
1. **Login as User B**
2. See the invitation card
3. Click **"Decline"** button

#### Expected Results:
- ✅ Invitation card disappears
- ✅ You do NOT have access to the chat
- ✅ Success toast: "Chat invitation declined"
- ✅ User A receives a notification that their invitation was declined

---

### 4. **Invite Users to Existing Chat**

#### Steps:
1. **Login as User A** (chat owner)
2. Open the chat
3. Click the **menu button** (three dots) in the chat header
4. Click **"Chat Info"**
5. In the Participants section, click **"Invite"** button
6. The invitation manager modal opens
7. **Search for User C**:
   - Type "@userC" or their name in the search bar
   - Click on User C from results
   - OR type "@userC" directly

8. Optionally add a personal message: "Join our discussion!"
9. Set expiration days (default is 7)
10. Click **"Send Invitation"**

#### Expected Results:
- ✅ Success toast: "Invitation sent successfully"
- ✅ User C appears in the "Pending Invitations" list
- ✅ User C receives an in-app notification
- ✅ User C can see the invitation when they visit the chat

---

### 5. **Revoke an Invitation**

#### Steps:
1. **Login as User A** (chat owner)
2. Open chat info → Click "Invite"
3. In the "Pending Invitations" section, you'll see User C
4. Click the **red X button** next to User C's invitation

#### Expected Results:
- ✅ Invitation is removed from the list
- ✅ Success toast: "Invitation revoked"
- ✅ User C receives a notification that the invitation was revoked
- ✅ User C can no longer accept the invitation

---

### 6. **Test Handle Display**

#### Steps:
1. Navigate to **People** page
2. Look at the person cards

#### Expected Results:
- ✅ Each person shows their **@handle** (not username)
- ✅ Format: "@johndoe" below the person's name

3. Click on a person to view their profile

#### Expected Results:
- ✅ Profile shows "Handle: @johndoe" (not "Username: johndoe123")
- ✅ Handle is displayed with @ symbol

4. Click on your own profile → Click "Edit"

#### Expected Results:
- ✅ Edit form has "Handle" field (not "Username")
- ✅ Field has @ icon
- ✅ Placeholder says "@yourhandle"

---

### 7. **Test Cross-Device Invitations**

#### Steps:
1. **On Computer**: Login as User A, send invitation to User B
2. **On Phone/Tablet**: Login as User B
3. Navigate to the chat area

#### Expected Results:
- ✅ Invitation appears on mobile device
- ✅ Can accept/decline from mobile
- ✅ After accepting on mobile, access is granted on computer too

---

### 8. **Test Invitation Expiration**

#### Steps:
1. **Login as User A**
2. Send invitation to User B with **1 day** expiration
3. Wait 1 day (or manually change the expiration date in the database)
4. **Login as User B**
5. Try to view the invitation

#### Expected Results:
- ✅ Invitation shows as "Expired"
- ✅ Accept button is disabled or hidden
- ✅ Expired chip is displayed

---

## Testing Checklist

### Chat Creation
- [ ] Can create public chat
- [ ] Can create private chat
- [ ] Search for users by @handle works
- [ ] Search for users by name works
- [ ] Can add multiple users
- [ ] Can remove added users before creating
- [ ] Create button disabled until at least 1 member added (for private chats)
- [ ] Success message shows invited handles

### Invitations
- [ ] Invitation card displays correctly
- [ ] Can accept invitation
- [ ] Can decline invitation
- [ ] Can ignore invitation (dismiss for now)
- [ ] Invitation shows inviter's name
- [ ] Invitation shows personal message (if provided)
- [ ] Invitation shows dates (invited, expires)
- [ ] Expired invitations are marked correctly

### Chat Info & Management
- [ ] "Invite" button appears for chat owners
- [ ] "Invite" button appears for users with invite permission
- [ ] Invitation manager modal opens
- [ ] Can search for users in invitation manager
- [ ] Can send invitations with personal message
- [ ] Can set expiration period
- [ ] Pending invitations list shows handles
- [ ] Can revoke pending invitations

### Handle Display
- [ ] People list shows @handles
- [ ] Person cards show @handles
- [ ] Profile page shows "Handle: @handle"
- [ ] Edit profile has "Handle" field
- [ ] Handle field has @ icon
- [ ] My profile card shows @handle

### Notifications
- [ ] Invited user receives notification
- [ ] Inviter receives notification when invitation accepted
- [ ] Inviter receives notification when invitation declined
- [ ] Invited user receives notification when invitation revoked

### Cross-Device
- [ ] Invitations sync across devices
- [ ] Can accept on one device, access granted on all
- [ ] Can decline on one device, reflected on all

---

## Common Issues & Solutions

### Issue: "User not found"
**Solution**: Make sure the user has a Person profile with a handle set up in the database.

### Issue: "Can't see invitation"
**Solution**: 
1. Check that the chat is actually private (accessLevel = 'private')
2. Verify the invitation exists in the database
3. Check that the invitation status is 'pending'
4. Ensure you're logged in as the invited user

### Issue: "Can't send invitation"
**Solution**:
1. Verify you're the chat owner or have invite permissions
2. Check that the handle exists in the Person model
3. Ensure the user isn't already a member of the chat

### Issue: "Invitation doesn't show handle"
**Solution**: The Person record needs both `userId` and `handle` fields populated.

---

## Database Verification

### Check Invitations in Database
```javascript
// In browser console or AWS Amplify console
const invitations = await client.models.ChatInvitation.list();
console.log(invitations.data);
```

### Check Person Handles
```javascript
const people = await client.models.Person.list();
console.log(people.data.map(p => ({ id: p.id, handle: p.handle })));
```

---

## Quick Test Script

For rapid testing, follow this sequence:

1. **Setup** (2 minutes)
   - Open 2 browser windows (one normal, one incognito)
   - Login as different users in each

2. **Create & Invite** (1 minute)
   - Window 1: Create private chat, invite Window 2's user
   - Verify success message

3. **Accept** (30 seconds)
   - Window 2: See invitation, click Accept
   - Verify access granted

4. **Chat** (30 seconds)
   - Both windows: Send messages back and forth
   - Verify both can see messages

5. **Invite More** (1 minute)
   - Window 1: Open chat info, invite another user
   - Verify invitation sent

6. **Revoke** (30 seconds)
   - Window 1: Revoke the invitation
   - Verify it's removed

**Total Time: ~5 minutes**

---

## Advanced Testing

### Test with Multiple Users
1. Create a private chat
2. Invite 5 different users
3. Have 3 accept, 2 decline
4. Verify chat has exactly 4 members (creator + 3 accepted)

### Test Expiration Edge Cases
1. Send invitation with 1 day expiration
2. Accept after 23 hours (should work)
3. Send another with 1 day expiration
4. Try to accept after 25 hours (should fail)

### Test Permission Boundaries
1. Create private chat as User A
2. User B accepts invitation
3. User B tries to invite User C (should fail - no invite permission)
4. User A invites User C (should work - is owner)

---

## Success Criteria

✅ **All features working** if:
- Can create private chats with initial members
- Invitations are sent and received correctly
- Can accept/decline/ignore invitations
- Handles display correctly everywhere
- Notifications work for all invitation events
- Cross-device sync works
- Expired invitations are handled properly
- Only authorized users can send invitations

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify database records (ChatInvitation, Person, Chat)
3. Ensure AWS Amplify is properly configured
4. Check that both users have Person profiles with handles
5. Verify authentication is working correctly
