import { TestBed } from '@angular/core/testing';
import { LoadingController } from '@ionic/angular';
import { ChatLoadingStateService } from './chat-loading-state.service';

describe('ChatLoadingStateService', () => {
  let service: ChatLoadingStateService;
  let loadingController: jasmine.SpyObj<LoadingController>;

  beforeEach(() => {
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);

    TestBed.configureTestingModule({
      providers: [
        ChatLoadingStateService,
        { provide: LoadingController, useValue: loadingSpy }
      ]
    });

    service = TestBed.inject(ChatLoadingStateService);
    loadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start and stop loading states', async () => {
    const operationKey = 'test-operation';
    const operation = 'Testing';

    await service.startLoading(operationKey, operation);
    expect(service.isLoading(operationKey)).toBe(true);

    const loadingState = service.getLoadingState(operationKey);
    expect(loadingState).toBeTruthy();
    expect(loadingState?.operation).toBe(operation);

    await service.stopLoading(operationKey);
    expect(service.isLoading(operationKey)).toBe(false);
  });

  it('should update loading progress', async () => {
    const operationKey = 'test-operation';
    
    await service.startLoading(operationKey, 'Testing');
    service.updateLoadingProgress(operationKey, 50, 'Half way done');

    const loadingState = service.getLoadingState(operationKey);
    expect(loadingState?.progress).toBe(50);
    expect(loadingState?.message).toBe('Half way done');
  });

  it('should cache and retrieve access permissions', () => {
    const chatId = 'chat123';
    const userId = 'user456';
    const permissions = {
      canView: true,
      canRead: true,
      canWrite: false,
      canInvite: false,
      canManage: false,
      accessReason: 'public'
    };

    service.cacheAccessPermissions(chatId, userId, permissions);
    const cached = service.getCachedAccessPermissions(chatId, userId);

    expect(cached).toBeTruthy();
    expect(cached?.canView).toBe(true);
    expect(cached?.canWrite).toBe(false);
    expect(cached?.accessReason).toBe('public');
  });

  it('should return null for expired cache', () => {
    const chatId = 'chat123';
    const userId = 'user456';
    const permissions = {
      canView: true,
      canRead: true,
      canWrite: false,
      canInvite: false,
      canManage: false,
      accessReason: 'public'
    };

    // Cache with immediate expiration
    service.cacheAccessPermissions(chatId, userId, permissions);
    
    // Manually expire the cache by setting past date
    const cacheKey = `${chatId}_${userId}`;
    const cached = service['accessPermissionsCache'].get(cacheKey);
    if (cached) {
      cached.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      service['accessPermissionsCache'].set(cacheKey, cached);
    }

    const result = service.getCachedAccessPermissions(chatId, userId);
    expect(result).toBeNull();
  });

  it('should clear cached permissions', () => {
    const chatId = 'chat123';
    const userId = 'user456';
    const permissions = {
      canView: true,
      canRead: true,
      canWrite: false,
      canInvite: false,
      canManage: false,
      accessReason: 'public'
    };

    service.cacheAccessPermissions(chatId, userId, permissions);
    expect(service.getCachedAccessPermissions(chatId, userId)).toBeTruthy();

    service.clearCachedAccessPermissions(chatId, userId);
    expect(service.getCachedAccessPermissions(chatId, userId)).toBeNull();
  });

  it('should provide cache statistics', () => {
    const permissions = {
      canView: true,
      canRead: true,
      canWrite: false,
      canInvite: false,
      canManage: false,
      accessReason: 'public'
    };

    service.cacheAccessPermissions('chat1', 'user1', permissions);
    service.cacheAccessPermissions('chat2', 'user2', permissions);

    const stats = service.getCacheStats();
    expect(stats.totalCached).toBe(2);
    expect(stats.validCached).toBe(2);
    expect(stats.expiredCached).toBe(0);
  });

  it('should detect network status', () => {
    expect(service.isNetworkOnline()).toBe(navigator.onLine);
  });

  it('should provide service status', () => {
    const status = service.getServiceStatus();
    expect(status).toBeTruthy();
    expect(status.isOnline).toBe(navigator.onLine);
    expect(status.networkStatus).toBe(navigator.onLine ? 'online' : 'offline');
  });
});