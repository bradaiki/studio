// Add this to your amplify/data/resource.ts schema

/*
  PushToken: a
    .model({
      userId: a.string().required(),
      token: a.string().required(),
      platform: a.enum(['ios', 'android', 'web']),
      deviceId: a.string(),
      endpoint: a.string(), // For web push
      isActive: a.boolean().default(true),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
*/

export const pushTokenSchema = `
  PushToken: a
    .model({
      userId: a.string().required(),
      token: a.string().required(),
      platform: a.enum(['ios', 'android', 'web']),
      deviceId: a.string(),
      endpoint: a.string(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
`;
