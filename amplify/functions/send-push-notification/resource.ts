import { defineFunction } from '@aws-amplify/backend';

export const sendPushNotification = defineFunction({
  name: 'send-push-notification',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    //FCM_SERVER_KEY: process.env.FCM_SERVER_KEY || '',
    //APNS_KEY_ID: process.env.APNS_KEY_ID || '',
    //APNS_TEAM_ID: process.env.APNS_TEAM_ID || '',
    //APNS_KEY: process.env.APNS_KEY || '', // Base64 encoded .p8 file
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  }
});