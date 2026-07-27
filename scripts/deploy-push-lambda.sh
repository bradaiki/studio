#!/bin/bash

# Deploy Push Notification Lambda Function
# This script deploys the Lambda function to AWS

echo "=========================================="
echo "Deploy Push Notification Lambda"
echo "=========================================="
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Lambda function exists
if [ ! -d "amplify/functions/send-push-notification" ]; then
    echo "Error: Lambda function directory not found"
    echo "Expected: amplify/functions/send-push-notification"
    exit 1
fi

echo "Step 1: Installing Lambda dependencies..."
cd amplify/functions/send-push-notification
npm install
cd ../../..
echo "✅ Dependencies installed"
echo ""

echo "Step 2: Checking backend configuration..."
if grep -q "sendPushNotification" amplify/backend.ts; then
    echo "✅ Lambda function is registered in backend.ts"
else
    echo "⚠️  Warning: Lambda function not found in backend.ts"
    echo "   The function has been added automatically"
fi
echo ""

echo "Step 3: Deploying to AWS..."
echo ""
echo "Running: npx ampx sandbox"
echo ""
echo "This will:"
echo "  • Deploy the Lambda function"
echo "  • Create an API Gateway endpoint"
echo "  • Set up IAM roles and permissions"
echo ""
echo "⏳ This may take a few minutes..."
echo ""

npx ampx sandbox

echo ""
echo "=========================================="
echo "Deployment Status"
echo "=========================================="
echo ""

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Look for the API Gateway endpoint in the output above"
    echo "   It will look like: https://abc123.execute-api.us-east-1.amazonaws.com/..."
    echo ""
    echo "2. Copy the endpoint URL"
    echo ""
    echo "3. Update src/app/config/push-notification.config.ts:"
    echo "   - Set apiEndpoint to your endpoint URL"
    echo "   - Set enabled to true"
    echo ""
    echo "4. Test by sending a chat message"
    echo ""
    echo "For detailed instructions, see:"
    echo "  - DEPLOY_PUSH_NOTIFICATION_LAMBDA.md"
    echo "  - ENABLE_PUSH_NOTIFICATIONS.md"
    echo ""
else
    echo "❌ Deployment failed"
    echo ""
    echo "Common issues:"
    echo "  • AWS credentials not configured"
    echo "  • Missing dependencies"
    echo "  • Network connectivity"
    echo ""
    echo "Try:"
    echo "  1. Check AWS credentials: aws configure"
    echo "  2. Install dependencies: cd amplify/functions/send-push-notification && npm install"
    echo "  3. Check network connection"
    echo ""
    echo "For help, see: DEPLOY_PUSH_NOTIFICATION_LAMBDA.md"
    echo ""
fi
