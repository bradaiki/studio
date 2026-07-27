import type { Handler } from 'aws-lambda';

interface PushNotificationRequest {
  chatId: string;
  senderId: string;
  senderName: string;
  message: string;
  participantIds: string[];
}

interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
}

export const handler: Handler = async (event) => {
  console.log('Send push notification handler triggered:', JSON.stringify(event));

  try {
    const request: PushNotificationRequest = JSON.parse(event.body || '{}');
    const { chatId, senderId, senderName, message, participantIds } = request;

    if (!chatId || !senderId || !message || !participantIds) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get push tokens for all participants (except sender)
    const recipientIds = participantIds.filter(id => id !== senderId);
    const tokens = await getPushTokensForUsers(recipientIds);

    console.log(`Found ${tokens.length} push tokens for ${recipientIds.length} recipients`);

    // Send notifications to each platform
    const results = await Promise.allSettled([
      sendToAndroid(tokens.filter(t => t.platform === 'android'), {
        title: senderName,
        body: message,
        chatId
      }),
      sendToIOS(tokens.filter(t => t.platform === 'ios'), {
        title: senderName,
        body: message,
        chatId
      }),
      sendToWeb(tokens.filter(t => t.platform === 'web'), {
        title: senderName,
        body: message,
        chatId
      })
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Push notifications sent: ${successCount}/${results.length} platforms succeeded`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        sent: successCount,
        total: tokens.length
      })
    };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send push notifications' })
    };
  }
};

/**
 * Get push tokens for users from DynamoDB
 */
async function getPushTokensForUsers(userIds: string[]): Promise<PushToken[]> {
  // TODO: Query your DynamoDB table for push tokens
  // This is a placeholder - implement based on your data model
  
  // Example using AWS SDK v3:
  /*
  import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
  const client = new DynamoDBClient({});
  
  const tokens: PushToken[] = [];
  for (const userId of userIds) {
    const command = new QueryCommand({
      TableName: process.env.PUSH_TOKEN_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId }
      }
    });
    const result = await client.send(command);
    // Parse and add tokens
  }
  return tokens;
  */
  
  console.log('Getting push tokens for users:', userIds);
  return [];
}

/**
 * Send push notification to Android devices via FCM
 */
async function sendToAndroid(
  tokens: PushToken[],
  notification: { title: string; body: string; chatId: string }
): Promise<void> {
  if (tokens.length === 0) return;

  const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
  if (!FCM_SERVER_KEY) {
    console.warn('FCM_SERVER_KEY not configured');
    return;
  }

  console.log(`Sending to ${tokens.length} Android devices`);

  // Send to FCM
  const fcmPayload = {
    registration_ids: tokens.map(t => t.token),
    notification: {
      title: notification.title,
      body: notification.body,
      sound: 'default',
      badge: '1'
    },
    data: {
      chatId: notification.chatId,
      route: `/tabs/chat/${notification.chatId}`
    },
    priority: 'high'
  };

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify(fcmPayload)
    });

    const result = await response.json();
    console.log('FCM response:', result);
  } catch (error) {
    console.error('Failed to send FCM notification:', error);
    throw error;
  }
}

/**
 * Send push notification to iOS devices via APNs
 */
async function sendToIOS(
  tokens: PushToken[],
  notification: { title: string; body: string; chatId: string }
): Promise<void> {
  if (tokens.length === 0) return;

  const APNS_KEY_ID = process.env.APNS_KEY_ID;
  const APNS_TEAM_ID = process.env.APNS_TEAM_ID;

  if (!APNS_KEY_ID || !APNS_TEAM_ID) {
    console.warn('APNs credentials not configured');
    return;
  }

  console.log(`Sending to ${tokens.length} iOS devices`);

  // TODO: Implement APNs using node-apn or similar library
  // This requires APNs authentication key and proper setup
  
  /*
  import apn from 'apn';
  
  const provider = new apn.Provider({
    token: {
      key: process.env.APNS_KEY,
      keyId: APNS_KEY_ID,
      teamId: APNS_TEAM_ID
    },
    production: true
  });

  const apnNotification = new apn.Notification({
    alert: {
      title: notification.title,
      body: notification.body
    },
    sound: 'default',
    badge: 1,
    payload: {
      chatId: notification.chatId,
      route: `/tabs/chat/${notification.chatId}`
    }
  });

  for (const token of tokens) {
    await provider.send(apnNotification, token.token);
  }
  */

  console.log('APNs notification would be sent here');
}

/**
 * Send push notification to web clients via Web Push API
 */
async function sendToWeb(
  tokens: PushToken[],
  notification: { title: string; body: string; chatId: string }
): Promise<void> {
  if (tokens.length === 0) return;

  console.log(`Sending to ${tokens.length} web clients`);

  // TODO: Implement Web Push using web-push library
  /*
  import webpush from 'web-push';
  
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: '/assets/icon/icon.png',
    data: {
      chatId: notification.chatId,
      route: `/tabs/chat/${notification.chatId}`
    }
  });

  for (const token of tokens) {
    if (token.endpoint) {
      await webpush.sendNotification(
        { endpoint: token.endpoint },
        payload
      );
    }
  }
  */

  console.log('Web push notification would be sent here');
}
