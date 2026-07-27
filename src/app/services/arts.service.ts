import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { type Schema } from '../../../amplify/data/resource';
import { DataSourceService } from './data-source.service';
import { MockDataService } from './mock-data.service';


export interface Art {
  id: string;
  name: string;
  type: 'aikido' | 'karate' | 'taekwondo' | 'jujitsu' | 'yoga' | 'pilates' | 'kickboxing' | 'judo' | 'pottery' | 'woodworking' | 'jewelry' | 'painting' | 'sculpture' | 'crafts';
  description: string;
  shortDescription: string;
  image: string;
  category: 'martial-arts' | 'wellness' | 'crafts';
  isUserPracticing?: boolean; // For "My Arts" category
  origin?: string;
  philosophy?: string;
  benefits: string[];
  techniques?: string[];
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  physicalDemands: 'low' | 'moderate' | 'high';
  mentalAspects: string[];
  relatedArts: string[];
  organizations: string[]; // Organization IDs
  studios: string[]; // Studio IDs
  // Ownership and metadata
  ownerId?: string; // Deprecated: kept for backwards compatibility
  ownerIds?: string[]; // Array of owner user IDs (supports multiple owners)
  isUserCreated?: boolean; // True if created by current user
  createdAt?: string; // Creation timestamp
  updatedAt?: string; // Last update timestamp
  isPublic?: boolean; // Whether the art is publicly visible
}

@Injectable({
  providedIn: 'root'
})
export class ArtsService {
  private artsSubject = new BehaviorSubject<Art[]>([]);
  public arts$ = this.artsSubject.asObservable();

  private allArts: Art[] = [];

  private client = generateClient<Schema>({
    authMode: 'userPool'
  })

  private currentUserId: string = 'current_user'; // Cached user ID

  constructor(
    private dataSourceService: DataSourceService,
    private mockDataService: MockDataService
  ) {
    // Start with empty array, load from API
    console.log('[ArtsService] Initializing with data source:', this.dataSourceService.getCurrentSource());
    this.loadArtsFromAPI();
    // Initialize current user ID
    this.initializeUserId();
    
    // Subscribe to data source changes (skip initial emission since we already loaded)
    let isFirstEmission = true;
    this.dataSourceService.dataSource$.subscribe(() => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return; // Skip first emission to avoid double-loading
      }
      console.log('[ArtsService] Data source changed, reloading arts');
      this.loadArtsFromAPI();
    });
  }

  // Initialize current user ID
  private async initializeUserId() {
    try {
      const session = await fetchAuthSession();
      this.currentUserId = session.identityId || 'current_user';
    } catch {
      this.currentUserId = 'current_user';
    }
  }

  // Get current user ID (this would normally come from auth service)
  private async getCurrentUserId(): Promise<string> {
    try {
      const session = await fetchAuthSession();
      return session.identityId || 'current_user';
    } catch {
      return 'current_user';
    }
  }

  // Get current user ID synchronously (uses cached value)
  private getCurrentUserIdSync(): string {
    return this.currentUserId;
  }

  // Check if art should be visible to current user
  private async shouldShowArt(art: Art): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    
    // ALWAYS show arts owned by current user (regardless of visibility)
    const isOwner = art.ownerIds?.includes(currentUserId) || art.ownerId === currentUserId;
    if (isOwner) return true;
    
    // ALWAYS show arts the user is practicing
    if (art.isUserPracticing) return true;
    
    // For non-owned, non-practiced arts: show only if public
    return art.isPublic !== false;
  }

  // Filter arts by visibility
  private async filterByVisibility(arts: Art[]): Promise<Art[]> {
    const visibleArts: Art[] = [];
    for (const art of arts) {
      if (await this.shouldShowArt(art)) {
        visibleArts.push(art);
      }
    }
    return visibleArts;
  }

  // Get all arts (filtered by visibility)
  async getAllArtsAsync(): Promise<Art[]> {
    return await this.filterByVisibility(this.allArts);
  }

  // Get all arts (synchronous - for backwards compatibility, shows all)
  getAllArts(): Art[] {
    return this.allArts;
  }

  // Get art by ID
  getArtById(id: string): Art | undefined {
    return this.allArts.find(art => art.id === id);
  }

  // Get arts by category (filtered by visibility)
  async getArtsByCategoryAsync(category: string): Promise<Art[]> {
    let filtered: Art[];
    
    if (category === 'all') {
      filtered = this.allArts;
    } else if (category === 'my-arts') {
      // For "my-arts", don't apply additional visibility filtering
      // User is already practicing these arts, so they should always see them
      return this.allArts.filter(art => art.isUserPracticing === true);
    } else if (category === 'martial-arts') {
      filtered = this.allArts.filter(art => art.category === 'martial-arts');
    } else if (category === 'wellness') {
      filtered = this.allArts.filter(art => art.category === 'wellness');
    } else if (category === 'crafts') {
      filtered = this.allArts.filter(art => art.category === 'crafts');
    } else {
      filtered = this.allArts.filter(art => art.type === category);
    }
    
    return await this.filterByVisibility(filtered);
  }

  // Get arts by category (synchronous - for backwards compatibility)
  getArtsByCategory(category: string): Art[] {
    if (category === 'all') return this.allArts;
    
    if (category === 'my-arts') {
      return this.allArts.filter(art => art.isUserPracticing === true);
    } else if (category === 'martial-arts') {
      return this.allArts.filter(art => art.category === 'martial-arts');
    } else if (category === 'wellness') {
      return this.allArts.filter(art => art.category === 'wellness');
    } else if (category === 'crafts') {
      return this.allArts.filter(art => art.category === 'crafts');
    } else {
      return this.allArts.filter(art => art.type === category);
    }
  }

  // Search arts (filtered by visibility)
  async searchArtsAsync(query: string): Promise<Art[]> {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return await this.filterByVisibility(this.allArts);

    const results = this.allArts.filter(art => 
      art.name.toLowerCase().includes(searchTerm) ||
      art.description.toLowerCase().includes(searchTerm) ||
      art.shortDescription.toLowerCase().includes(searchTerm) ||
      art.benefits.some(benefit => benefit.toLowerCase().includes(searchTerm)) ||
      art.techniques?.some(technique => technique.toLowerCase().includes(searchTerm)) ||
      art.mentalAspects.some(aspect => aspect.toLowerCase().includes(searchTerm))
    );
    
    return await this.filterByVisibility(results);
  }

  // Search arts (synchronous - for backwards compatibility)
  searchArts(query: string): Art[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.allArts;

    return this.allArts.filter(art => 
      art.name.toLowerCase().includes(searchTerm) ||
      art.description.toLowerCase().includes(searchTerm) ||
      art.shortDescription.toLowerCase().includes(searchTerm) ||
      art.benefits.some(benefit => benefit.toLowerCase().includes(searchTerm)) ||
      art.techniques?.some(technique => technique.toLowerCase().includes(searchTerm)) ||
      art.mentalAspects.some(aspect => aspect.toLowerCase().includes(searchTerm))
    );
  }

  // Get related arts
  getRelatedArts(artId: string): Art[] {
    const art = this.getArtById(artId);
    if (!art) return [];

    return this.allArts.filter(a => 
      a.id !== artId && (
        art.relatedArts.includes(a.id) ||
        a.relatedArts.includes(artId) ||
        a.category === art.category
      )
    );
  }

  // Get organizations for an art
  getArtOrganizations(artId: string): string[] {
    const art = this.getArtById(artId);
    return art ? art.organizations : [];
  }

  // Get studios for an art
  getArtStudios(artId: string): string[] {
    const art = this.getArtById(artId);
    return art ? art.studios : [];
  }

  // Get user's practiced arts
  getUserPracticedArts(): Art[] {
    return this.allArts.filter(art => art.isUserPracticing === true);
  }

  // Toggle user practicing status for an art
  async toggleUserPracticing(artId: string): Promise<boolean> {
    const art = this.getArtById(artId);
    if (!art) return false;

    const newPracticingStatus = !art.isUserPracticing;

    try {
      // Update local storage immediately for responsive UI
      art.isUserPracticing = newPracticingStatus;
      this.artsSubject.next(this.allArts);
      
      // Check data source mode
      if (this.dataSourceService.isUsingMockData()) {
        console.log('[ArtsService] MOCK MODE: Toggling practicing status locally only');
        // Only update local storage in mock mode
        console.log('Art practicing status updated in local mock data:', newPracticingStatus);
        return newPracticingStatus;
      }
      
      // DATABASE MODE: Update in database
      console.log('[ArtsService] DATABASE MODE: Updating practicing status in database');
      
      // Check if user is authenticated
      const session = await fetchAuthSession();
      if (!session.tokens) {
        throw new Error('You must be signed in to update art. Please sign in and try again.');
      }

      const userId = session.identityId || 'current_user';
      if (newPracticingStatus) {
        // User wants to start practicing - create UserArt record
        const result = await (this.client.models as any)['UserArt'].create({
          userId: userId,
          artId: artId,
          artName: art.name,
          startedAt: new Date().toISOString(),
          isActive: true
        }, {
          authMode: 'userPool'
        });

        if (result.errors) {
          throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
        }

        console.log('User started practicing art:', result.data);
      } else {
        // User wants to stop practicing - find and delete UserArt record
        const listResult = await (this.client.models as any)['UserArt'].list({
          filter: {
            userId: { eq: userId },
            artId: { eq: artId }
          },
          authMode: 'userPool'
        });

        if (listResult.errors) {
          throw new Error(`GraphQL errors: ${listResult.errors.map((e: any) => e.message).join(', ')}`);
        }

        if (listResult.data && listResult.data.length > 0) {
          const userArt = listResult.data[0];
          const deleteResult = await (this.client.models as any)['UserArt'].delete({
            id: userArt.id
          }, {
            authMode: 'userPool'
          });

          if (deleteResult.errors) {
            throw new Error(`GraphQL errors: ${deleteResult.errors.map((e: any) => e.message).join(', ')}`);
          }

          console.log('User stopped practicing art:', deleteResult.data);
        }
      }
      
      // Update local storage
      art.isUserPracticing = newPracticingStatus;
      this.artsSubject.next(this.allArts);
      return newPracticingStatus;
    } catch (error) {
      console.error('Failed to update art practicing status in DynamoDB:', error);
      
      // Fallback: still update local storage even if API call fails
      art.isUserPracticing = newPracticingStatus;
      this.artsSubject.next(this.allArts);
      
      // Re-throw the error so the calling component can handle it
      throw new Error(`Failed to update practicing status in backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // CRUD Operations

  // Create a new art
  async createArt(artData: Partial<Art>): Promise<Art> {
    try {
      const currentUserId = this.getCurrentUserIdSync();
      
      // Generate new art object
      const newArt: Art = {
        id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: artData.name || 'New Art',
        type: artData.type || 'crafts',
        description: artData.description || '',
        shortDescription: artData.shortDescription || '',
        image: artData.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
        category: artData.category || 'crafts',
        origin: artData.origin || '',
        philosophy: artData.philosophy || '',
        benefits: artData.benefits || [],
        techniques: artData.techniques || [],
        equipment: artData.equipment || [],
        difficulty: artData.difficulty || 'beginner',
        physicalDemands: artData.physicalDemands || 'low',
        mentalAspects: artData.mentalAspects || [],
        relatedArts: artData.relatedArts || [],
        organizations: artData.organizations || [],
        studios: artData.studios || [],
        ownerIds: [currentUserId],
        ownerId: currentUserId,
        isUserCreated: true,
        isPublic: artData.isPublic !== undefined ? artData.isPublic : false,
        isUserPracticing: artData.isUserPracticing || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Check data source mode
      if (this.dataSourceService.isUsingMockData()) {
        console.log('[ArtsService] MOCK MODE: Creating art locally only');
        // Only update local storage in mock mode
        this.allArts.push(newArt);
        this.artsSubject.next(this.allArts);
        console.log('Art created in local mock data:', newArt);
        return newArt;
      }
      
      // DATABASE MODE: Create in database
      console.log('[ArtsService] DATABASE MODE: Creating art in database');
      
      // Check if user is authenticated
      const session = await fetchAuthSession();
      if (!session.tokens) {
        throw new Error('You must be signed in to create art. Please sign in and try again.');
      }

      const result = await (this.client.models as any)['Art'].create({
        name: newArt.name,
        type: newArt.type,
        description: newArt.description,
        shortDescription: newArt.shortDescription,
        image: newArt.image,
        category: newArt.category,
        origin: newArt.origin,
        philosophy: newArt.philosophy,
        benefits: newArt.benefits,
        techniques: newArt.techniques,
        equipment: newArt.equipment,
        difficulty: newArt.difficulty,
        physicalDemands: newArt.physicalDemands,
        mentalAspects: newArt.mentalAspects,
        relatedArts: newArt.relatedArts,
        organizations: newArt.organizations,
        studios: newArt.studios,
        ownerIds: newArt.ownerIds,
        isUserCreated: newArt.isUserCreated,
        isPublic: newArt.isPublic,
        isUserPracticing: newArt.isUserPracticing
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const createdArt = result.data;
        // Use database-generated ID
        newArt.id = createdArt.id;
        newArt.createdAt = createdArt.createdAt;
        newArt.updatedAt = createdArt.updatedAt;

        // Update local storage
        this.allArts.push(newArt);
        this.artsSubject.next(this.allArts);
        
        console.log('Art successfully created in database:', newArt);
        return newArt;
      }

      throw new Error('Failed to create art - no data returned');
    } catch (error) {
      console.error('Failed to create art:', error);
      throw new Error(`Failed to create art: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update an existing art
  async updateArt(artId: string, updates: Partial<Art>): Promise<Art | null> {
    const artIndex = this.allArts.findIndex(art => art.id === artId);
    if (artIndex === -1) return null;

    const art = this.allArts[artIndex];
    
    // Check if user owns this art
    if (!this.canUserEditArt(art)) {
      throw new Error('You do not have permission to edit this art');
    }

    try {
      // Update with timestamp
      const updatedArt = { 
        ...art, 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Check data source mode
      if (this.dataSourceService.isUsingMockData()) {
        console.log('[ArtsService] MOCK MODE: Updating art locally only');
        // Only update local storage in mock mode
        this.allArts[artIndex] = updatedArt;
        this.artsSubject.next(this.allArts);
        console.log('Art updated in local mock data:', updatedArt);
        return updatedArt;
      }
      
      // DATABASE MODE: Update in database
      console.log('[ArtsService] DATABASE MODE: Updating art in database');
      
      const result = await (this.client.models as any)['Art'].update({
        id: artId,
        ...updates
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const dbArt = result.data;
        // Convert GraphQL response to local Art interface
        const responseArt: Art = {
          id: dbArt.id,
          name: dbArt.name,
          type: dbArt.type as any,
          description: dbArt.description,
          shortDescription: dbArt.shortDescription,
          image: dbArt.image || '',
          category: dbArt.category as any,
          origin: dbArt.origin || '',
          philosophy: dbArt.philosophy || '',
          benefits: dbArt.benefits || [],
          techniques: dbArt.techniques || [],
          equipment: dbArt.equipment || [],
          difficulty: dbArt.difficulty as any,
          physicalDemands: dbArt.physicalDemands as any,
          mentalAspects: dbArt.mentalAspects || [],
          relatedArts: dbArt.relatedArts || [],
          organizations: dbArt.organizations || [],
          studios: dbArt.studios || [],
          ownerIds: (dbArt.ownerIds || []).filter((id: any): id is string => id !== null),
          ownerId: dbArt.ownerId || '',
          isUserCreated: dbArt.isUserCreated || false,
          isPublic: dbArt.isPublic !== undefined ? dbArt.isPublic : true,
          isUserPracticing: dbArt.isUserPracticing || false,
          createdAt: dbArt.createdAt,
          updatedAt: dbArt.updatedAt
        };

        console.log('Art successfully updated in database:', responseArt);
        
        // Update local storage
        this.allArts[artIndex] = responseArt;
        this.artsSubject.next(this.allArts);
        return responseArt;
      }

      return null;
    } catch (error) {
      console.error('Failed to update art in DynamoDB:', error);
      throw new Error(`Failed to update art in backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete an art
  async deleteArt(artId: string): Promise<boolean> {
    const artIndex = this.allArts.findIndex(art => art.id === artId);
    if (artIndex === -1) return false;

    const art = this.allArts[artIndex];
    
    // Check if user owns this art
    if (!this.canUserEditArt(art)) {
      throw new Error('You do not have permission to delete this art');
    }

    try {
      // Check data source mode
      if (this.dataSourceService.isUsingMockData()) {
        console.log('[ArtsService] MOCK MODE: Deleting art locally only');
        // Only remove from local storage in mock mode
        this.allArts.splice(artIndex, 1);
        this.artsSubject.next(this.allArts);
        console.log('Art deleted from local mock data');
        return true;
      }
      
      // DATABASE MODE: Delete from database
      console.log('[ArtsService] DATABASE MODE: Deleting art from database');
      
      // Check if user is authenticated
      const session = await fetchAuthSession();
      if (!session.tokens) {
        throw new Error('You must be signed in to delete art. Please sign in and try again.');
      }

      // Delete art using GraphQL API with userPool auth mode
      const result = await (this.client.models as any)['Art'].delete({
        id: artId
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      console.log('Art successfully deleted from DynamoDB');
      
      // Remove from local storage
      this.allArts.splice(artIndex, 1);
      this.artsSubject.next(this.allArts);
      return true;
    } catch (error) {
      console.error('Failed to delete art from DynamoDB:', error);
      
      // Fallback: still remove from local storage even if API call fails
      this.allArts.splice(artIndex, 1);
      this.artsSubject.next(this.allArts);
      
      // Re-throw the error so the calling component can handle it
      throw new Error(`Failed to delete art from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if current user can edit/delete an art
  canUserEditArt(art: Art): boolean {
    const currentUserId = this.getCurrentUserIdSync();
    // Check if user is in ownerIds array or is the legacy ownerId
    return art.ownerIds?.includes(currentUserId) || art.ownerId === currentUserId || art.isUserCreated === true;
  }

  // Get arts created by current user
  getUserCreatedArts(): Art[] {
    return this.allArts.filter(art => art.isUserCreated === true);
  }

  // Load arts from GraphQL API or mock data
  private async loadArtsFromAPI(): Promise<void> {
    try {
      // Clear existing data first to force refresh
      console.log('[ArtsService] Clearing cached arts data');
      this.allArts = [];
      this.artsSubject.next(this.allArts);
      
      // Check if using mock data
      if (this.dataSourceService.isUsingMockData()) {
        console.log('Loading arts from mock data');
        this.allArts = this.mockDataService.getMockArts();
        this.artsSubject.next(this.allArts);
        console.log('Loaded', this.allArts.length, 'mock arts');
        return;
      }

      // Load from database
      console.log('Loading arts from database');
      
      // Get user ID if authenticated
      let userId: string | null = null;
      try {
        const session = await fetchAuthSession();
        if (session.tokens && session.identityId) {
          userId = session.identityId;
        }
      } catch (e) {
        // User not authenticated
      }
      
      const result = await (this.client.models as any)['Art'].list({
        authMode: 'userPool'
      });
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const apiArts = result.data;

      if (apiArts && Array.isArray(apiArts)) {
        // Convert GraphQL response to local Art interface
        const convertedArts: Art[] = apiArts.map((apiArt: any) => ({
          id: apiArt.id,
          name: apiArt.name,
          type: apiArt.type,
          description: apiArt.description,
          shortDescription: apiArt.shortDescription,
          image: apiArt.image || '',
          category: apiArt.category,
          origin: apiArt.origin || '',
          philosophy: apiArt.philosophy || '',
          benefits: apiArt.benefits || [],
          techniques: apiArt.techniques || [],
          equipment: apiArt.equipment || [],
          difficulty: apiArt.difficulty,
          physicalDemands: apiArt.physicalDemands,
          mentalAspects: apiArt.mentalAspects || [],
          relatedArts: apiArt.relatedArts || [],
          organizations: apiArt.organizations || [],
          studios: apiArt.studios || [],
          ownerIds: (apiArt.ownerIds || []).filter((id: any): id is string => id !== null),
          ownerId: apiArt.ownerId || '', // Keep for backwards compatibility
          isUserCreated: apiArt.isUserCreated || false,
          isPublic: apiArt.isPublic !== undefined ? apiArt.isPublic : false,
          isUserPracticing: false, // Will be set below based on UserArt records
          createdAt: apiArt.createdAt,
          updatedAt: apiArt.updatedAt
        }));

        // If user is authenticated, load their practiced arts
        if (userId) {
          try {
            const userArtsResult = await (this.client.models as any)['UserArt'].list({
              filter: {
                userId: { eq: userId },
                isActive: { eq: true }
              },
              authMode: 'userPool'
            });

            if (!userArtsResult.errors && userArtsResult.data) {
              const practicedArtIds = new Set(
                userArtsResult.data.map((ua: any) => ua.artId)
              );

              // Mark arts as practicing
              convertedArts.forEach(art => {
                art.isUserPracticing = practicedArtIds.has(art.id);
              });

              console.log('Loaded user practiced arts:', practicedArtIds.size);
            }
          } catch (userArtsError) {
            console.warn('Failed to load user practiced arts:', userArtsError);
            // Continue without marking practiced arts
          }
        }

        // Use only API data, no merging with mock data
        this.allArts = convertedArts;
        this.artsSubject.next(this.allArts);
        console.log('Successfully loaded arts from DynamoDB via GraphQL:', convertedArts.length, 'arts');
      } else {
        // No arts in database
        this.allArts = [];
        this.artsSubject.next(this.allArts);
        console.log('No arts found in database');
      }
    } catch (error) {
      console.warn('Failed to load arts from DynamoDB:', error);
      // Set empty array if API fails
      this.allArts = [];
      this.artsSubject.next(this.allArts);
    }
  }

  // Refresh arts from API
  async refreshArtsFromAPI(): Promise<void> {
    await this.loadArtsFromAPI();
  }


}