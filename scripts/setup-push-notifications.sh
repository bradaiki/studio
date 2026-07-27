#!/bin/bash

# Push Notifications Setup Script
# This script helps set up push notifications for your Ionic app

echo "=========================================="
echo "Push Notifications Setup"
echo "=========================================="
echo ""

# Check if running in project root
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Installing required packages..."
echo ""

# Install Capacitor Push Notifications
npm install @capacitor/push-notifications

# Optional: Install Local Notifications
read -p "Install Local Notifications plugin? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install @capacitor/local-notifications
fi

echo ""
echo "Step 2: Syncing Capacitor..."
npx cap sync

echo ""
echo "Step 3: Installing Lambda dependencies..."
cd amplify/functions/send-push-notification
npm install
cd ../../..

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure Firebase Cloud Messaging (FCM) for Android:"
echo "   - Go to https://console.firebase.google.com/"
echo "   - Create/select project"
echo "   - Add Android app"
echo "   - Download google-services.json to android/app/"
echo "   - Get Server Key from Project Settings > Cloud Messaging"
echo ""
echo "2. Configure Apple Push Notification Service (APNs) for iOS:"
echo "   - Go to https://developer.apple.com/"
echo "   - Create APNs Key"
echo "   - Download .p8 key file"
echo "   - Note Key ID and Team ID"
echo ""
echo "3. Generate VAPID keys for Web Push:"
echo "   npx web-push generate-vapid-keys"
echo ""
echo "4. Set environment variables in .env file:"
echo "   FCM_SERVER_KEY=your_key"
echo "   APNS_KEY_ID=your_key_id"
echo "   APNS_TEAM_ID=your_team_id"
echo "   APNS_KEY=base64_encoded_p8"
echo "   VAPID_PUBLIC_KEY=your_public_key"
echo "   VAPID_PRIVATE_KEY=your_private_key"
echo ""
echo "5. Add PushToken model to amplify/data/resource.ts"
echo "   (See amplify/data/push-token-schema.ts for reference)"
echo ""
echo "6. Deploy backend:"
echo "   npx ampx sandbox"
echo ""
echo "7. Integrate with chat service:"
echo "   (See src/app/services/chat.service.push-integration.example.ts)"
echo ""
echo "For detailed instructions, see PUSH_NOTIFICATIONS_SETUP.md"
echo ""
