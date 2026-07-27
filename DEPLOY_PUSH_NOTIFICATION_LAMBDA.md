# Deploy Push Notification Lambda Function

## Quick Deploy (3 Steps)

### Step 1: Add Lambda to Backend Configuration

Update `amplify/backend.ts` to include the Lambda function:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendPushNotification } from './functions/send-push-notification/resource';

const backend = defineBackend({
  auth,
  data,
  sendPushNotification  // Add this line
});

// ... rest of your existing code
```

### Step 2: Install Lambda Dependencies

```bash
cd amplify/functions/send-push-notification
npm install
cd ../../..
```

### Step 3: Deploy

```bash
npx ampx sandbox
```

That's it! Your Lambda function will be deployed.

---

## Detailed Steps

### 1. Update Backend Configuration

I'll update the file for you, or you can manually edit `amplify/backend.ts`:

**Add this import at the top:**
```typescript
import { sendPushNotification } from './functions/send-push-notification/resource';
```

**Add to defineBackend:**
```typescript
const backend = defineBackend({
  auth,
  data,
  sendPushNotification  // Add this
});
```

### 2. Set Environment Variables (Optional)

If you have Firebase/APNs credentials ready, create `.env` file:

```bash
# Firebase Cloud Messaging (for Android & Web)
FCM_SERVER_KEY=your_fcm_server_key

# Apple Push Notification Service (for iOS)
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id
APNS_KEY=your_base64_encoded_p8_key

# Web Push VAPID keys
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

**Note:** You can deploy without these - the Lambda will deploy but won't send notifications until configured.

### 3. Deploy to Sandbox

```bash
npx ampx sandbox
```

This will:
- Deploy your Lambda function
- Create an API Gateway endpoint
- Set up IAM roles and permissions
- Connect to your existing backend

### 4. Get the API Endpoint

After deployment, you'll see output like:

```
✅ Deployed: sendPushNotification
   Function ARN: arn:aws:lambda:us-east-1:123456789:function:sendPushNotification
   API Endpoint: https://abc123.execute-api.us-east-1.amazonaws.com/prod/push
```

**Copy the API Endpoint URL!**

### 5. Update Your App Configuration

Edit `src/app/config/push-notification.config.ts`:

```typescript
export const pushNotificationConfig = {
  apiEndpoint: 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/push',
  enabled: true,
  debug: true
};
```

---

## Alternative: Deploy to Production

For production deployment:

```bash
# Commit your changes
git add .
git commit -m "Add push notification Lambda"
git push

# Deploy via Amplify Console
# The function will be deployed automatically with your app
```

---

## Troubleshooting

### "Module not found" error

Install dependencies:
```bash
cd amplify/functions/send-push-notification
npm install
cd ../../..
```

### "Cannot find module './functions/send-push-notification/resource'"

Make sure the import path is correct in `backend.ts`:
```typescript
import { sendPushNotification } from './functions/send-push-notification/resource';
```

### Deployment fails

Check that all files exist:
- `amplify/functions/send-push-notification/handler.ts`
- `amplify/functions/send-push-notification/resource.ts`
- `amplify/functions/send-push-notification/package.json`

### Lambda deploys but doesn't send notifications

This is normal if you haven't configured FCM/APNs keys yet. The Lambda will:
- Accept requests successfully
- Log what it would send
- Return success (but not actually send notifications)

To fix: Add your FCM_SERVER_KEY and other credentials to environment variables.

---

## Verification

After deployment, test it:

1. **Send a chat message** in your app
2. **Check browser console** - should see:
   ```
   Push notifications sent successfully
   ```
3. **Check Lambda logs** in AWS CloudWatch:
   ```bash
   # View logs
   aws logs tail /aws/lambda/sendPushNotification --follow
   ```

---

## What Gets Deployed

- **Lambda Function**: Handles push notification sending
- **API Gateway**: REST endpoint to invoke the Lambda
- **IAM Roles**: Permissions for Lambda to access DynamoDB
- **CloudWatch Logs**: For debugging and monitoring

---

## Cost

- **Lambda**: Free tier includes 1M requests/month
- **API Gateway**: Free tier includes 1M requests/month
- **Typical cost**: $0-1/month for small apps

---

## Next Steps

After deployment:

1. ✅ Get API endpoint URL
2. ✅ Update `push-notification.config.ts`
3. ✅ Test sending a message
4. 🔧 Configure FCM/APNs keys (optional, for actual notifications)
5. 📱 Test on devices

---

## Quick Commands Reference

```bash
# Install Lambda dependencies
cd amplify/functions/send-push-notification && npm install && cd ../../..

# Deploy to sandbox
npx ampx sandbox

# Deploy to production
git push

# View Lambda logs
aws logs tail /aws/lambda/sendPushNotification --follow

# Delete sandbox (cleanup)
npx ampx sandbox delete
```
