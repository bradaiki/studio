import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Art: a
    .model({
      name: a.string().required(),
      type: a.string().required(),
      description: a.string().required(),
      shortDescription: a.string().required(),
      image: a.string(),
      category: a.string().required(),
      origin: a.string(),
      philosophy: a.string(),
      benefits: a.string().array(),
      techniques: a.string().array(),
      equipment: a.string().array(),
      difficulty: a.string().required(),
      physicalDemands: a.string().required(),
      mentalAspects: a.string().array(),
      relatedArts: a.string().array(),
      organizations: a.string().array(),
      studios: a.string().array(),
      ownerIds: a.string().array(), // Changed from ownerId to ownerIds (array)
      isUserCreated: a.boolean().default(false),
      isPublic: a.boolean().default(true),
      isUserPracticing: a.boolean().default(false),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
  
  UserArt: a
    .model({
      userId: a.string().required(),
      artId: a.string().required(),
      artName: a.string().required(),
      startedAt: a.datetime().required(),
      level: a.string(),
      notes: a.string(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
  
  Favorite: a
    .model({
      userId: a.string().required(),
      itemId: a.string().required(),
      itemType: a.string().required(),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'delete']),
    ]),

  Studio: a
    .model({
      name: a.string().required(),
      description: a.string().required(),
      address: a.string().required(),
      city: a.string().required(),
      state: a.string().required(),
      zipCode: a.string().required(),
      country: a.string().required(),
      phone: a.string(),
      email: a.string(),
      website: a.string(),
      primaryArt: a.string(),
      instructorCount: a.integer().default(0),
      memberCount: a.integer().default(0),
      establishedYear: a.integer(),
      facilities: a.string().array(),
      amenities: a.string().array(),
      isVerified: a.boolean().default(false),
      // Legacy fields for backwards compatibility
      location: a.string(),
      tagline: a.string(),
      heroImage: a.string(),
      verified: a.boolean().default(false),
      established: a.string(),
      headInstructorId: a.string(),
      studioChiefId: a.string(),
      instructors: a.json(),
      schedule: a.json(),
      pricing: a.json(),
      benefits: a.json(),
      isMember: a.boolean().default(false),
      isInstructor: a.boolean().default(false),
      isStudioChief: a.boolean().default(false),
      ownerId: a.string(),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Chat: a
    .model({
      name: a.string().required(),
      description: a.string(),
      type: a.enum(['studio', 'private', 'group']),
      studioId: a.string(),
      participantIds: a.string().array().required(),
      createdBy: a.string().required(),
      lastMessageId: a.string(),
      lastMessageAt: a.datetime(),
      isActive: a.boolean().default(true),
      deletedAt: a.datetime(),
      deletedBy: a.string(),
      settings: a.json(),
      accessLevel: a.enum(['public', 'private', 'restricted']),
      invitationRequired: a.boolean().default(false),
      studioMembershipRequired: a.boolean().default(false),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  ChatMessage: a
    .model({
      chatId: a.string().required(),
      senderId: a.string().required(),
      senderName: a.string().required(),
      senderAvatar: a.string(),
      message: a.string().required(),
      messageType: a.enum(['text', 'image', 'file', 'system']),
      replyToId: a.string(),
      isRead: a.boolean().default(false),
      editedAt: a.datetime(),
      deletedAt: a.datetime(),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  ChatParticipant: a
    .model({
      chatId: a.string().required(),
      userId: a.string().required(),
      userName: a.string().required(),
      userAvatar: a.string(),
      role: a.enum(['admin', 'moderator', 'member']),
      joinedAt: a.datetime().required(),
      lastReadAt: a.datetime(),
      isMuted: a.boolean().default(false),
      isActive: a.boolean().default(true),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  ChatUnreadCount: a
    .model({
      chatId: a.string().required(),
      userId: a.string().required(),
      unreadCount: a.integer().default(0),
      lastReadMessageId: a.string(),
      lastReadAt: a.datetime(),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  ChatInvitation: a
    .model({
      chatId: a.string().required(),
      invitedUserId: a.string().required(),
      invitedBy: a.string().required(),
      invitedAt: a.datetime().required(),
      status: a.enum(['pending', 'accepted', 'declined', 'revoked']),
      expiresAt: a.datetime(),
      message: a.string(),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  StudioMembership: a
    .model({
      studioId: a.string().required(),
      userId: a.string().required(),
      membershipType: a.enum(['member', 'instructor', 'admin']),
      joinedAt: a.datetime().required(),
      isActive: a.boolean().default(true),
      hideFromStudentList: a.boolean().default(false), // Privacy setting to hide from this studio's student list
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  StudioJoinRequest: a
    .model({
      studioId: a.string().required(),
      userId: a.string().required(),
      userName: a.string().required(),
      userEmail: a.string().required(),
      requestedAt: a.datetime().required(),
      status: a.enum(['pending', 'approved', 'rejected', 'cancelled']),
      message: a.string(),
      reviewedBy: a.string(),
      reviewedAt: a.datetime(),
      reviewMessage: a.string(),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  StudioInvitation: a
    .model({
      studioId: a.string().required(),
      studioName: a.string().required(),
      invitedUserId: a.string().required(),
      invitedUserEmail: a.string().required(),
      invitedBy: a.string().required(),
      invitedByName: a.string().required(),
      invitedAt: a.datetime().required(),
      status: a.enum(['pending', 'accepted', 'declined', 'expired']),
      message: a.string(),
      expiresAt: a.datetime(),
      acceptedAt: a.datetime(),
      declinedAt: a.datetime(),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  RequestAuditLog: a
    .model({
      requestId: a.string().required(),
      action: a.enum(['created', 'approved', 'rejected', 'cancelled']),
      performedBy: a.string().required(),
      performedByName: a.string().required(),
      performedAt: a.datetime().required(),
      details: a.string(),
      previousStatus: a.string(),
      newStatus: a.string(),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create']),
    ]),

  Person: a
    .model({
      handle: a.string().required(),
      displayName: a.string().required(),
      bio: a.string(),
      location: a.string(),
      website: a.string(),
      profileImage: a.string(),
      isInstructor: a.boolean().default(false),
      isVerified: a.boolean().default(false),
      isAdmin: a.boolean().default(false),
      joinedDate: a.datetime(),
      // Legacy fields for backwards compatibility
      userId: a.string(),
      name: a.string(),
      username: a.string(),
      avatar: a.string(),
      rank: a.string(),
      experience: a.string(),
      specialties: a.string().array(),
      studioAffiliations: a.string().array(),
      followers: a.integer().default(0),
      following: a.integer().default(0),
      postsCount: a.integer().default(0),
      tags: a.string().array(),
      achievements: a.json(),
      socialMedia: a.json(),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Organization: a
    .model({
      name: a.string().required(),
      description: a.string().required(),
      type: a.string().required(),
      foundedYear: a.integer(),
      headquarters: a.string(),
      memberCount: a.integer().default(0),
      website: a.string(),
      contactEmail: a.string(),
      isVerified: a.boolean().default(false),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Post: a
    .model({
      content: a.string().required(),
      authorId: a.string().required(),
      authorName: a.string().required(),
      authorHandle: a.string().required(),
      authorImage: a.string(),
      likes: a.integer().default(0),
      comments: a.integer().default(0),
      shares: a.integer().default(0),
      images: a.string().array(),
      tags: a.string().array(),
      isPublic: a.boolean().default(true),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Event: a
    .model({
      title: a.string().required(),
      description: a.string().required(),
      startDate: a.datetime().required(),
      endDate: a.datetime().required(),
      location: a.string().required(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      organizerId: a.string().required(),
      organizerName: a.string().required(),
      maxAttendees: a.integer(),
      currentAttendees: a.integer().default(0),
      price: a.float().default(0),
      isVirtual: a.boolean().default(false),
      isFree: a.boolean().default(false),
      tags: a.string().array(),
      image: a.string(),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  PushToken: a
    .model({
      userId: a.string().required(),
      token: a.string().required(),
      platform: a.enum([/*'ios', 'android',*/ 'web']),
      deviceId: a.string(),
      endpoint: a.string(), // For web push
      isActive: a.boolean().default(true),
    })
    .authorization((allow: any) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
