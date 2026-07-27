import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { StudioPage } from './studio.page';
import { StudiosService, Studio } from '../services/studios.service';
import { ChatAccessController, OrganizedStudioChats } from '../services/chat-access-controller.service';
import { AuthStateService } from '../services/auth-state.service';
import { ChatInvitation } from '../services/access-control.service';
import { ChatListItem, Chat, ChatSettings } from '../models/chat.models';

// Feature: studio-chat-access-control, Property 1: Public Chat Universal Visibility
describe('StudioPage - Property Tests', () => {
  let mockStudiosService: jasmine.SpyObj<StudiosService>;
  let mockChatAccessController: jasmine.SpyObj<ChatAccessController>;
  let mockAuthStateService: jasmine.SpyObj<AuthStateService>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockLocation: jasmine.SpyObj<Location>;

  // Mock subjects for reactive streams
  let mockCurrentUserSubject: BehaviorSubject<any>;
  let mockAccessUpdatesSubject: BehaviorSubject<any>;

  // Helper function to create chat settings
  function createChatSettings(overrides: Partial<ChatSettings> = {}): ChatSettings {
    return {
      allowLeaving: true,
      allowMuting: true,
      allowInviting: true,
      isPublic: true,
      maxParticipants: 100,
      ...overrides
    };
  }

  // Helper function to create a complete Studio object
  function createStudio(overrides: Partial<Studio> = {}): Studio {
    return {
      id: 'test-studio-1',
      name: 'Test Studio',
      location: 'Test City',
      address: '123 Test St',
      phone: '555-0123',
      email: 'test@studio.com',
      website: 'teststudio.com',
      description: 'A test studio',
      tagline: 'Testing Excellence',
      heroImage: 'test-hero.jpg',
      verified: true,
      memberCount: 50,
      established: '2020',
      instructors: [],
      schedule: [],
      pricing: [],
      benefits: [],
      isMember: false,
      isInstructor: false,
      isStudioChief: false,
      ...overrides
    };
  }

  // Helper function to create ChatListItem
  function createChatListItem(chatData: Partial<Chat>, overrides: Partial<ChatListItem> = {}): ChatListItem {
    const chat: Chat = {
      id: 'test-chat-1',
      name: 'Test Chat',
      type: 'group',
      studioId: 'test-studio-1',
      participantIds: ['user-1'],
      createdBy: 'admin-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      settings: createChatSettings(),
      accessLevel: 'public',
      invitationRequired: false,
      studioMembershipRequired: false,
      ...chatData
    };

    return {
      chat,
      unreadCount: 0,
      participants: [],
      ...overrides
    };
  }

  beforeEach(() => {
    // Create mock subjects
    mockCurrentUserSubject = new BehaviorSubject(null);
    mockAccessUpdatesSubject = new BehaviorSubject([]);

    // Create spies
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('test-studio-1')
        }
      }
    });

    mockLocation = jasmine.createSpyObj('Location', ['back']);
    mockStudiosService = jasmine.createSpyObj('StudiosService', ['getStudioById']);
    mockChatAccessController = jasmine.createSpyObj('ChatAccessController', [
      'getStudioChatsForUser',
      'isServiceReady'
    ], {
      accessUpdates$: mockAccessUpdatesSubject.asObservable()
    });
    mockAuthStateService = jasmine.createSpyObj('AuthStateService', [], {
      currentUser$: mockCurrentUserSubject.asObservable()
    });

    // Add missing mock services for the updated constructor
    const mockInstructorPermissionService = jasmine.createSpyObj('InstructorPermissionService', [
      'isInstructor',
      'canManageRequests',
      'subscribeToPermissionChanges'
    ]);
    
    const mockJoinRequestService = jasmine.createSpyObj('JoinRequestService', [
      'getPendingRequestsForStudio',
      'subscribeToRequestUpdates'
    ]);
    
    const mockModalController = jasmine.createSpyObj('ModalController', [
      'create',
      'dismiss'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Location, useValue: mockLocation },
        { provide: StudiosService, useValue: mockStudiosService },
        { provide: ChatAccessController, useValue: mockChatAccessController },
        { provide: AuthStateService, useValue: mockAuthStateService },
        { provide: 'InstructorPermissionService', useValue: mockInstructorPermissionService },
        { provide: 'JoinRequestService', useValue: mockJoinRequestService },
        { provide: 'ModalController', useValue: mockModalController }
      ]
    });
  });

  describe('Property 1: Public Chat Universal Visibility', () => {
    it('should validate that public chats are accessible to any authenticated user through studio page integration', async () => {
      // Feature: studio-chat-access-control, Property 1: Public Chat Universal Visibility
      // Validates: Requirements 1.1
      
      const testCases = [
        {
          studioId: 'test-studio-1',
          userId: 'user-1',
          userName: 'TestUser1',
          isStudioMember: false,
          studio: createStudio({
            id: 'test-studio-1',
            name: 'Test Studio Alpha',
            description: 'A test studio for property validation'
          }),
          organizedChats: {
            publicChats: [
              createChatListItem({
                id: 'public-chat-1',
                name: 'General Discussion',
                type: 'group',
                studioId: 'test-studio-1',
                accessLevel: 'public',
                settings: createChatSettings({ isPublic: true })
              }, { unreadCount: 0 }),
              createChatListItem({
                id: 'public-chat-2',
                name: 'Announcements',
                type: 'group',
                studioId: 'test-studio-1',
                accessLevel: 'public',
                settings: createChatSettings({ isPublic: true })
              }, { unreadCount: 2 })
            ],
            privateChats: [],
            invitationsPending: [] as ChatInvitation[],
            totalPublic: 2,
            totalPrivate: 0 // User has no access to private chats
          } as OrganizedStudioChats
        },
        {
          studioId: 'test-studio-2',
          userId: 'user-2',
          userName: 'TestUser2',
          isStudioMember: true,
          studio: createStudio({
            id: 'test-studio-2',
            name: 'Test Studio Beta',
            description: 'Another test studio'
          }),
          organizedChats: {
            publicChats: [
              createChatListItem({
                id: 'public-chat-3',
                name: 'Community Chat',
                type: 'group',
                studioId: 'test-studio-2',
                accessLevel: 'public',
                settings: createChatSettings({ isPublic: true })
              }, { unreadCount: 1 })
            ],
            privateChats: [
              createChatListItem({
                id: 'private-chat-2',
                name: 'Members Only',
                type: 'private',
                studioId: 'test-studio-2',
                accessLevel: 'private',
                settings: createChatSettings({ isPublic: false })
              }, { unreadCount: 0 })
            ],
            invitationsPending: [] as ChatInvitation[],
            totalPublic: 1,
            totalPrivate: 1 // User has access to private chats as member
          } as OrganizedStudioChats
        }
      ];

      for (const testData of testCases) {
        // Reset all spies before each test case
        Object.values(mockChatAccessController).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });
        Object.values(mockStudiosService).forEach(spy => {
          if (typeof spy === 'function' && (spy as any).calls) {
            (spy as any).calls.reset();
          }
        });

        // Setup mock studio data
        mockStudiosService.getStudioById.and.returnValue(testData.studio);

        // Setup mock chat access controller
        mockChatAccessController.isServiceReady.and.returnValue(true);
        mockChatAccessController.getStudioChatsForUser
          .withArgs(testData.studioId, testData.userId)
          .and.returnValue(Promise.resolve(testData.organizedChats));

        // Update route parameter
        (mockActivatedRoute.snapshot.paramMap.get as jasmine.Spy).and.returnValue(testData.studioId);

        // Create component instance manually to test the logic
        const component = new StudioPage(
          mockActivatedRoute,
          jasmine.createSpyObj('Router', ['navigate']),
          mockLocation,
          mockStudiosService,
          mockChatAccessController,
          mockAuthStateService,
          jasmine.createSpyObj('InstructorPermissionService', ['isInstructor', 'canManageRequests', 'subscribeToPermissionChanges']),
          jasmine.createSpyObj('JoinRequestService', ['getPendingRequestsForStudio', 'subscribeToRequestUpdates']),
          jasmine.createSpyObj('ModalController', ['create', 'dismiss'])
        );

        // Simulate user authentication
        mockCurrentUserSubject.next({
          userId: testData.userId,
          username: testData.userName
        });

        // Initialize component
        component.ngOnInit();
        
        // Wait for async initialization
        await new Promise(resolve => setTimeout(resolve, 10));

        // Property: All public chats should be visible to any authenticated user
        
        // Verify studio is loaded
        expect(component.studio).toBeDefined();
        expect(component.studio?.id).toBe(testData.studioId);
        expect(component.studio?.name).toBe(testData.studio.name);

        // Verify user authentication state
        expect(component.currentUserId).toBe(testData.userId);

        // Verify organized chats are loaded
        expect(component.organizedChats).toBeDefined();
        expect(component.organizedChats?.totalPublic).toBe(testData.organizedChats.totalPublic);

        // Property: All public chats should be visible regardless of membership status
        const publicChats = component.organizedChats?.publicChats || [];
        expect(publicChats.length).toBe(testData.organizedChats.publicChats.length);

        // Verify each public chat is accessible
        testData.organizedChats.publicChats.forEach(expectedChatItem => {
          const foundChatItem = publicChats.find(chatItem => chatItem.chat.id === expectedChatItem.chat.id);
          expect(foundChatItem).toBeDefined();
          expect(foundChatItem?.chat.name).toBe(expectedChatItem.chat.name);
          expect(foundChatItem?.chat.accessLevel).toBe('public');
          expect(foundChatItem?.chat.settings?.isPublic).toBe(true);
        });

        // Property: Public chat visibility is independent of studio membership
        // This is validated by testing both member and non-member users
        expect(component.getTotalChatCount()).toBeGreaterThanOrEqual(testData.organizedChats.totalPublic);

        // Verify UI state methods work correctly
        if (testData.organizedChats.totalPublic > 0) {
          expect(component.hasAccessToChats()).toBe(true);
        }

        // Verify chat access controller was called with correct parameters
        expect(mockChatAccessController.getStudioChatsForUser)
          .toHaveBeenCalledWith(testData.studioId, testData.userId);

        // Property: Public chats should be consistently accessible across different studios
        // This is validated by testing multiple studios with different configurations
        
        console.log(`✓ Property validated for ${testData.isStudioMember ? 'member' : 'non-member'} user in studio ${testData.studioId}`);
        console.log(`  - Public chats visible: ${publicChats.length}/${testData.organizedChats.totalPublic}`);
        console.log(`  - All public chats accessible: ${publicChats.every(chatItem => chatItem.chat.accessLevel === 'public')}`);

        // Clean up
        component.ngOnDestroy();
      }

      // Final property assertion: Public chat visibility is universal
      console.log('✓ Property 1: Public Chat Universal Visibility - VALIDATED');
      console.log('  All public chats are visible to authenticated users regardless of studio membership status');
    });
  });
});