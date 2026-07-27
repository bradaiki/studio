# Deploy Push Notification Lambda - Updated Guide

## ✅ What Changed

I've updated the implementation to use **direct Lambda invocation** instead of API Gateway. This is simpler and doesn't require an API endpoint!

## 🚀 Deploy in 2 Steps

### Step 1: Install Lambda Dependencies

```bash
cd amplify/functions/send-push-notification
npm install
cd ../../..
```

### Step 2: Deploy to AWS

```bash
npx ampx sandbox
```

That's it! No need to copy API endpoints anymore.

---

## 📝 What Happens During Deployment

```
⏳ Deploying...
   ├─ Creating Lambda function
   ├─ Setting up IAM permissions
   ├─ Connecting to your backend
   └─ Exporting function name to app

✅ Deployment complete!
   Lambda Function: send-push-notification-[sandbox-id]
```

---

## 🔧 After Deployment

### Enable Push Notifications

Edit `src/app/config/push-notification.config.ts`:

```typescript
export const pushNotificationConfig = {
  enabled: true,  // Change this to true
  debug: true
};
```

That's all you need to do! The app will automatically find and invoke the Lambda function.

---

## 🧪 Test It

1. **Make sure deployment is complete**
   ```bash
   npx ampx sandbox
   # Wait for "Deployed" message
   ```

2. **Enable push notifications**
   - Set `enabled: true` in `push-notification.config.ts`

3. **Send a chat message**
   - Open your app
   - Send a message in any chat

4. **Check the console**
   - You should see: `[Push Notifications] Lambda invoked successfully`

---

## 🔍 How It Works

### Old Way (API Gateway)
```
App → API Gateway → Lambda
     (needed endpoint URL)
```

### New Way (Direct Invocation)
```
App → AWS SDK → Lambda
     (automatic!)
```

**Benefits:**
- ✅ No API endpoint to configure
- ✅ Simpler setup
- ✅ Better security (uses AWS credentials)
- ✅ Automatic function discovery

---

## 🐛 Troubleshooting

### "Lambda function name not found"

**Cause:** Backend not deployed or outputs not loaded

**Fix:**
```bash
# Redeploy
npx ampx sandbox

# Rebuild app
npm run build
ionic serve
```

### "No AWS credentials available"

**Cause:** User not logged in

**Fix:** Make sure you're logged into your app before sending messages

### Lambda invokes but doesn't send notifications

**Cause:** FCM/APNs credentials not configured

**Fix:** This is normal! The Lambda will log what it would send. To actually send notifications, add your Firebase credentials (see `WEB_PUSH_QUICK_START.md`)

---

## 📊 Verify Deployment

### Check if Lambda exists:

```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `send-push-notification`)].FunctionName'
```

### View Lambda logs:

```bash
# Find your function name
aws lambda list-functions --query 'Functions[?contains(FunctionName, `send-push-notification`)].FunctionName' --output text

# View logs (replace with your function name)
aws logs tail /aws/lambda/send-push-notification-[your-id] --follow
```

### Test Lambda directly:

```bash
aws lambda invoke \
  --function-name send-push-notification-[your-id] \
  --payload '{"body":"{\"chatId\":\"test\",\"senderId\":\"test\",\"senderName\":\"Test\",\"message\":\"Test\",\"participantIds\":[\"user1\"]}"}' \
  response.json

cat response.json
```

---

## 💰 Cost

Same as before:
- **Free Tier**: 1M Lambda requests/month
- **After Free Tier**: $0.20 per 1M requests
- **Typical Cost**: $0-1/month

---

## 🎉 Success Checklist

- [ ] Lambda dependencies installed
- [ ] Deployed with `npx ampx sandbox`
- [ ] Deployment completed successfully
- [ ] Updated `push-notification.config.ts` (set `enabled: true`)
- [ ] Tested sending a message
- [ ] Saw success in console

---

## 📚 What's Next?

### To Actually Send Notifications

1. **Set up Firebase** (for web/Android)
   - See `WEB_PUSH_QUICK_START.md`
   - Get FCM Server Key

2. **Add credentials to Lambda**
   - Update `amplify/functions/send-push-notification/resource.ts`
   - Add FCM_SERVER_KEY to environment variables
   - Redeploy

3. **Test on devices**
   - Web: `ionic serve`
   - iOS: `npx cap run ios`
   - Android: `npx cap run android`

---

## 🆘 Need Help?

- **ENABLE_PUSH_NOTIFICATIONS.md** - Enable in your app
- **WEB_PUSH_QUICK_START.md** - Firebase setup
- **PUSH_NOTIFICATIONS_SETUP.md** - Complete guide

---

## Summary

✅ **Simpler**: No API endpoint needed
✅ **Automatic**: Function discovery built-in
✅ **Secure**: Uses AWS credentials
✅ **Ready**: Just deploy and enable!
