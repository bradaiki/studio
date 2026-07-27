# Lambda Deployment - Quick Start

## 🚀 Deploy in 3 Commands

```bash
# 1. Install Lambda dependencies
cd amplify/functions/send-push-notification && npm install && cd ../../..

# 2. Deploy to AWS
npx ampx sandbox

# 3. Copy the API endpoint from the output and update your config
```

---

## ✅ What I Already Did For You

I've already updated your `amplify/backend.ts` file to include the Lambda function. You're ready to deploy!

---

## 📋 Prerequisites

Before deploying, make sure you have:

- ✅ AWS account
- ✅ AWS CLI configured (`aws configure`)
- ✅ Amplify CLI installed (already have this)
- ✅ Internet connection

---

## 🎯 Step-by-Step Deployment

### Option 1: Use the Deployment Script (Easiest)

```bash
./scripts/deploy-push-lambda.sh
```

This script will:
1. Install Lambda dependencies
2. Verify configuration
3. Deploy to AWS
4. Show you next steps

### Option 2: Manual Deployment

```bash
# Step 1: Install dependencies
cd amplify/functions/send-push-notification
npm install
cd ../../..

# Step 2: Deploy
npx ampx sandbox
```

---

## 📝 What Happens During Deployment

```
⏳ Deploying...
   ├─ Creating Lambda function
   ├─ Setting up API Gateway
   ├─ Configuring IAM roles
   └─ Connecting to your backend

✅ Deployment complete!
   API Endpoint: https://abc123.execute-api.us-east-1.amazonaws.com/prod/push
```

**Copy that API endpoint URL!** You'll need it in the next step.

---

## 🔧 After Deployment

### Update Your App Configuration

Edit `src/app/config/push-notification.config.ts`:

```typescript
export const pushNotificationConfig = {
  // Paste your API endpoint here
  apiEndpoint: 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/push',
  
  // Enable push notifications
  enabled: true,
  
  // Keep debug on to see logs
  debug: true
};
```

### Test It

1. Send a chat message in your app
2. Check browser console - should see "Push notifications sent successfully"
3. Check AWS CloudWatch logs to see the Lambda execution

---

## 🧪 Verify Deployment

### Check if Lambda is deployed:

```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `sendPushNotification`)].FunctionName'
```

### View Lambda logs:

```bash
aws logs tail /aws/lambda/sendPushNotification --follow
```

### Test the endpoint:

```bash
curl -X POST https://your-api-endpoint.amazonaws.com/prod/push \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test",
    "senderId": "test",
    "senderName": "Test User",
    "message": "Test message",
    "participantIds": ["user1", "user2"]
  }'
```

---

## 🔍 Troubleshooting

### "AWS credentials not configured"

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
```

### "Module not found" error

```bash
cd amplify/functions/send-push-notification
npm install
cd ../../..
```

### Deployment takes too long

This is normal for first deployment (5-10 minutes). Subsequent deployments are faster.

### Can't find API endpoint

Look for this in the deployment output:
```
✅ Deployed: sendPushNotification
   API Endpoint: https://...
```

Or check AWS Console:
1. Go to API Gateway
2. Find your API
3. Copy the invoke URL

---

## 💰 Cost

- **Free Tier**: 1M Lambda requests/month
- **After Free Tier**: $0.20 per 1M requests
- **Typical Cost**: $0-1/month for small apps

---

## 🎉 Success Checklist

- [ ] Lambda dependencies installed
- [ ] Deployed with `npx ampx sandbox`
- [ ] Got API endpoint URL
- [ ] Updated `push-notification.config.ts`
- [ ] Set `enabled: true`
- [ ] Tested sending a message
- [ ] Saw success in console

---

## 📚 Next Steps

1. **Configure Firebase** (for actual notifications)
   - See `WEB_PUSH_QUICK_START.md`

2. **Add FCM/APNs credentials** (optional)
   - See `PUSH_NOTIFICATIONS_SETUP.md`

3. **Test on devices**
   - iOS: `npx cap run ios`
   - Android: `npx cap run android`

---

## 🆘 Need Help?

See detailed guides:
- **DEPLOY_PUSH_NOTIFICATION_LAMBDA.md** - Complete deployment guide
- **ENABLE_PUSH_NOTIFICATIONS.md** - Enable notifications in your app
- **PUSH_NOTIFICATIONS_SETUP.md** - Full setup for all platforms
